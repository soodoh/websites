import { contentfulFixture } from "@tests/fixtures/contentful";
import { describe, expect, test } from "vitest";
import type { ContentfulFixture } from "@/lib/contentful-fixture-types";
import {
	captureReleaseContent,
	generateReleaseContent,
} from "@/lib/release-content-model";

const loadFixture = async (content: ContentfulFixture = contentfulFixture) => ({
	kind: "fixture" as const,
	content,
});

describe("release content", () => {
	test("captures one coherent project, authorization, and album inventory", async () => {
		let loads = 0;
		const snapshot = await captureReleaseContent(() => {
			loads += 1;
			return loadFixture();
		});
		expect(loads).toBe(1);
		expect(snapshot.projects).toHaveLength(8);
		expect(snapshot.projects.map(({ summary }) => summary.slug)).toEqual(
			contentfulFixture.projects.map(({ slug }) => slug),
		);
		expect(
			snapshot.albums.map(({ name, photos }) => [name, photos.length]),
		).toEqual([
			["Dance", 12],
			["Portraits", 12],
			["Spaces", 12],
		]);
	});

	test("rejects duplicate project slugs during release capture", async () => {
		const project = contentfulFixture.projects[0];
		await expect(
			captureReleaseContent(() =>
				loadFixture({
					...contentfulFixture,
					projects: [project, { ...project, id: "duplicate-project" }],
				}),
			),
		).rejects.toThrow(`Duplicate released project slug: ${project.slug}`);
	});

	test("rejects empty, malformed, and duplicate album inventories", async () => {
		const album = contentfulFixture.albums[0];
		for (const [albums, error] of [
			[[], "No photography albums"],
			[[{ ...album, name: "" }], "Album name is malformed"],
			[[{ ...album, name: " Dance" }], "Album name is malformed"],
			[[album, album], "Duplicate photography album name: Dance"],
		] as const) {
			await expect(
				captureReleaseContent(() =>
					loadFixture({ ...contentfulFixture, albums: [...albums] }),
				),
			).rejects.toThrow(error);
		}
	});

	test("rejects mismatched summary and detail inventories", async () => {
		const projectInfo = { ...contentfulFixture.projectInfo };
		delete projectInfo[contentfulFixture.projects[0].slug];
		await expect(
			captureReleaseContent(() =>
				loadFixture({ ...contentfulFixture, projectInfo }),
			),
		).rejects.toThrow();
	});

	test("removes plaintext passwords and separates protected details", async () => {
		const snapshot = await captureReleaseContent(loadFixture);
		const generated = await generateReleaseContent(
			snapshot,
			async (password) => `hash:${password.length}`,
			async (slug, password) => `version:${slug}:${password.length}`,
		);
		const serialized = JSON.stringify(generated);
		expect(serialized).not.toContain("playwright-password");
		expect(generated.projectRoutes["magnolia-app"]).toBe("protected");
		expect(generated.publicContent.publicProjectDetails).not.toHaveProperty(
			"magnolia-app",
		);
		expect(generated.protectedProjectDetails).toHaveProperty("magnolia-app");
		expect(generated.protectedProjectDetails).not.toHaveProperty(
			"the-voice-app-agt-app",
		);
		expect(generated.publicContent.photography.albumNames).toEqual([
			"Dance",
			"Portraits",
			"Spaces",
		]);
		expect(generated.publicContent.photography.initialAlbum).toBe(
			snapshot.albums[0],
		);
		expect(Object.keys(generated.albumFiles)).toHaveLength(3);
		for (const source of Object.values(
			generated.publicContent.photography.albumSources,
		)) {
			expect(source).toMatch(/^\/__release\/albums\/[a-f0-9]{64}\.json$/);
		}
	});
});
