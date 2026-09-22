import { describe, expect, test, vi } from "vitest";
import { buildFamilyTreeGraph } from "@/components/family-tree-graph";
import type {
	GenealogyData,
	GenealogyEvent,
	GenealogyFamily,
	GenealogyPerson,
} from "@/content/genealogy";

const genealogyEvent = (
	id: string,
	type: string,
	date: string,
): GenealogyEvent => ({
	id,
	type,
	date,
	phones: [],
	notes: [],
	citations: [],
});

const person = (
	id: string,
	options: {
		asChild?: string[];
		asPartner?: string[];
		events?: GenealogyEvent[];
		isLiving?: boolean;
	} = {},
): GenealogyPerson => ({
	id,
	isLiving: options.isLiving ?? false,
	name: { display: id },
	alternateNames: [],
	events: options.events ?? [],
	citations: [],
	media: [],
	notes: [],
	familyAsChildIds: options.asChild ?? [],
	familyAsPartnerIds: options.asPartner ?? [],
});

const family = (
	id: string,
	partnerIds: string[],
	children: string[],
): GenealogyFamily => ({
	id,
	partnerIds,
	children: children.map((personId) => ({ personId })),
	events: [],
	notes: [],
	citations: [],
});

const genealogy = (
	people: GenealogyPerson[],
	families: GenealogyFamily[],
	defaultPersonId: string,
): GenealogyData => ({
	schemaVersion: 1,
	source: { format: "test" },
	privacy: {
		livingPersonRule: "test fixture",
		livingPersonLabel: "Living person",
	},
	defaultPersonId,
	people: Object.fromEntries(people.map((entry) => [entry.id, entry])),
	families: Object.fromEntries(families.map((entry) => [entry.id, entry])),
	sources: {},
	repositories: {},
	stats: {
		people: people.length,
		families: families.length,
		livingPeopleRedacted: people.filter((entry) => entry.isLiving).length,
		deceasedPeople: people.filter((entry) => !entry.isLiving).length,
	},
});

function personNode(
	graph: ReturnType<typeof buildFamilyTreeGraph>,
	personId: string,
) {
	const node = graph.nodes.find(
		(candidate) => candidate.type === "person" && candidate.id === personId,
	);
	if (node?.type !== "person") {
		throw new Error(`Missing person node: ${personId}`);
	}
	return node;
}

describe("family tree graph", () => {
	test("classifies the selected family branch across two generations", () => {
		const data = genealogy(
			[
				person("Grandparent", { asPartner: ["grandparents"] }),
				person("Parent", {
					asChild: ["grandparents"],
					asPartner: ["parents"],
				}),
				person("Other parent", { asPartner: ["parents"] }),
				person("Selected", {
					asChild: ["parents"],
					asPartner: ["selected-family"],
					events: [
						genealogyEvent("selected-birth", "Birth", "1 JAN 1900"),
						genealogyEvent("selected-death", "Death", "2 FEB 1980"),
					],
				}),
				person("Sibling", { asChild: ["parents"] }),
				person("Spouse", { asPartner: ["selected-family"] }),
				person("Child", {
					asChild: ["selected-family"],
					asPartner: ["child-family"],
				}),
				person("Child spouse", { asPartner: ["child-family"] }),
				person("Grandchild", { asChild: ["child-family"] }),
				person("Private", {
					isLiving: true,
					events: [genealogyEvent("private-birth", "Birth", "1 JAN 2000")],
				}),
			],
			[
				family("grandparents", ["Grandparent"], ["Parent"]),
				family("parents", ["Parent", "Other parent"], ["Selected", "Sibling"]),
				family("selected-family", ["Selected", "Spouse"], ["Child"]),
				family("child-family", ["Child", "Child spouse"], ["Grandchild"]),
			],
			"Selected",
		);

		const graph = buildFamilyTreeGraph(data, "Selected", vi.fn());

		expect(personNode(graph, "Selected").data).toMatchObject({
			relationship: "selected",
			lifespan: "1900–1980",
			isInFocusBranch: true,
		});
		expect(personNode(graph, "Parent").data.relationship).toBe("parent");
		expect(personNode(graph, "Other parent").data.relationship).toBe("parent");
		expect(personNode(graph, "Grandparent").data.relationship).toBe(
			"grandparent",
		);
		expect(personNode(graph, "Sibling").data.relationship).toBe("sibling");
		expect(personNode(graph, "Spouse").data.relationship).toBe(
			"spouse-partner",
		);
		expect(personNode(graph, "Child").data.relationship).toBe("child");
		expect(personNode(graph, "Grandchild").data.relationship).toBe(
			"grandchild",
		);
		expect(personNode(graph, "Private").data).toMatchObject({
			relationship: "other",
			isInFocusBranch: false,
			isLiving: true,
		});
		expect(personNode(graph, "Private").data.lifespan).toBeUndefined();

		const generationLabels = graph.nodes.flatMap((node) =>
			node.type === "generation" ? [node.data.label] : [],
		);
		expect(generationLabels).toEqual(
			expect.arrayContaining([
				"Two generations earlier",
				"Previous generation",
				"Selected generation",
				"Next generation",
				"Two generations later",
			]),
		);
		expect(
			graph.edges.some((edge) =>
				String(edge.className).includes("family-tree-edge-focus"),
			),
		).toBe(true);
		expect(
			graph.edges.some((edge) =>
				String(edge.className).includes("family-tree-edge-muted"),
			),
		).toBe(false);
	});

	test("places two partners on opposite sides of the selected person", () => {
		const data = genealogy(
			[
				person("Selected", { asPartner: ["family"] }),
				person("First partner", { asPartner: ["family"] }),
				person("Second partner", { asPartner: ["family"] }),
			],
			[family("family", ["Selected", "First partner", "Second partner"], [])],
			"Selected",
		);

		const graph = buildFamilyTreeGraph(data, "Selected", vi.fn());
		const selectedX = personNode(graph, "Selected").position.x;
		const partnerXs = [
			personNode(graph, "First partner").position.x,
			personNode(graph, "Second partner").position.x,
		];

		expect(Math.min(...partnerXs)).toBeLessThan(selectedX);
		expect(Math.max(...partnerXs)).toBeGreaterThan(selectedX);
		expect(
			graph.edges.filter((edge) =>
				String(edge.className).includes("family-tree-partner-edge"),
			),
		).toHaveLength(2);
	});
});
