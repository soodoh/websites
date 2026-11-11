import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const root = resolve(import.meta.dirname, "../..");
export const categories = [
	"performance",
	"accessibility",
	"best-practices",
	"seo",
] as const;
export const formFactors = ["mobile", "desktop"] as const;
type Category = (typeof categories)[number];
type FormFactor = (typeof formFactors)[number];
export type Budgets = { routes: string[] } & Record<
	FormFactor,
	Record<Category, number>
>;
type SiteDefinition = {
	build: string;
	server: string;
	ready: string;
	port: number;
	additionalPorts?: number[];
	runner: string;
};
export const sites = {
	paul: {
		build: "build",
		server: "bun run start",
		ready: "Serving .* at",
		port: 3000,
		runner: "ubuntu-26.04",
	},
	diloreto: {
		build: "build",
		server: "bun run start",
		ready: "Accepting connections",
		port: 4173,
		runner: "ubuntu-26.04",
	},
	carolyn: {
		build: "build:production:test",
		server:
			"PLAYWRIGHT_TEST=true PROJECT_AUTH_SECRET=hermetic-project-secret EXPECTED_ARTIFACT_MODE=production ARTIFACT_PORT=4100 bun run scripts/serve-amplify-artifact.ts",
		ready: "Amplify artifact smoke server listening",
		port: 4100,
		additionalPorts: [3000],
		runner: "ubuntu-26.04-arm",
	},
	sarabeth: {
		build: "build:playwright:unchecked",
		server:
			"PLAYWRIGHT_SKIP_BUILD=1 bun --no-env-file scripts/playwright-server.ts 3000",
		ready: "Listening on",
		port: 3000,
		runner: "ubuntu-26.04-arm",
	},
} satisfies Record<string, SiteDefinition>;

export function sitePolicy(
	site: string,
): SiteDefinition & { appRoot: string; budgets: Budgets } {
	if (!Object.hasOwn(sites, site)) {
		throw new Error(`Unknown Lighthouse site: ${site}`);
	}
	const appRoot = resolve(root, "apps", site);
	const budgets: unknown = JSON.parse(
		readFileSync(resolve(appRoot, "lighthouse.json"), "utf8"),
	);
	validateBudgets(site, budgets);
	return { ...sites[site as keyof typeof sites], appRoot, budgets };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateBudgets(
	site: string,
	budgets: unknown,
): asserts budgets is Budgets {
	if (
		!isRecord(budgets) ||
		!Array.isArray(budgets.routes) ||
		budgets.routes.length === 0 ||
		new Set(budgets.routes).size !== budgets.routes.length ||
		budgets.routes.some(
			(route) =>
				typeof route !== "string" ||
				!/^\/(?!\/)[^?#\\]*$/.test(route) ||
				new URL(route, "http://127.0.0.1").origin !== "http://127.0.0.1",
		)
	) {
		throw new Error(`${site}: Lighthouse routes must be unique local paths`);
	}
	for (const formFactor of formFactors) {
		const baseline = budgets[formFactor];
		if (
			!isRecord(baseline) ||
			Object.keys(baseline).sort().join() !== [...categories].sort().join() ||
			categories.some(
				(category) =>
					typeof baseline[category] !== "number" ||
					!Number.isFinite(baseline[category]) ||
					baseline[category] <= 0 ||
					baseline[category] > 1,
			)
		) {
			throw new Error(`${site}: invalid ${formFactor} Lighthouse baselines`);
		}
	}
}

export function lighthouseConfig(site: string, formFactor: string) {
	const policy = sitePolicy(site);
	const selectedFormFactor = formFactors.find((value) => value === formFactor);
	if (!selectedFormFactor) {
		throw new Error(`Unknown Lighthouse form factor: ${formFactor}`);
	}
	return {
		ci: {
			collect: {
				numberOfRuns: 3,
				url: policy.budgets.routes.map(
					(route) => `http://127.0.0.1:${policy.port}${route}`,
				),
				startServerCommand: `cd "${policy.appRoot}" && ${policy.server}`,
				startServerReadyPattern: policy.ready,
				startServerReadyTimeout: 120_000,
				settings: {
					...(formFactor === "desktop" ? { preset: "desktop" } : {}),
					onlyCategories: categories,
					chromeFlags: "--headless --no-sandbox --disable-dev-shm-usage",
				},
			},
			assert: {
				includePassedAssertions: true,
				assertions: Object.fromEntries(
					categories.map((category) => [
						`categories:${category}`,
						[
							"error",
							{
								minScore: policy.budgets[selectedFormFactor][category],
								aggregationMethod: "median",
							},
						],
					]),
				),
			},
			upload: { target: "filesystem", outputDir: "reports" },
		},
	};
}
