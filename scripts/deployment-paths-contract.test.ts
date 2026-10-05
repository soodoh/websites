import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const sites = ["sarabeth", "paul", "carolyn", "diloreto"] as const;
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

// Inspect the native filter configuration rather than maintaining a second
// implementation of GitHub's changed-file or glob-matching logic.
function deploymentPaths(site: (typeof sites)[number]): string[] {
	const source = read(`.github/workflows/deploy-${site}.yml`);
	const block = source.match(/ {4}paths:\n([\s\S]*?) {2}workflow_dispatch:/);
	if (!block) throw new Error(`Missing native deployment filters for ${site}`);
	return block[1]
		.split("\n")
		.filter((line) => line.startsWith("      - "))
		.map((line) => line.slice(8).replace(/^'(.*)'$/, "$1"));
}

describe.each(sites)("%s deployment selection", (site) => {
	test("selects app files and excludes only explicit non-website paths", () => {
		const paths = deploymentPaths(site);
		const appPaths = paths.filter(
			(path) => path.startsWith("apps/") || path.startsWith("!apps/"),
		);
		// Keep the positive pattern first: later native negations exclude files.
		// In particular, Markdown under src/ or public/ remains deployable.
		expect(appPaths).toEqual([
			`apps/${site}/**`,
			`!apps/${site}/docs/**`,
			`!apps/${site}/infra/**`,
			`!apps/${site}/tests/**`,
			`!apps/${site}/*.md`,
			`!apps/${site}/**/*.test.ts`,
			`!apps/${site}/**/*.test.tsx`,
			`!apps/${site}/**/*.spec.ts`,
			`!apps/${site}/**/*.spec.tsx`,
			`!apps/${site}/Dockerfile.playwright`,
			`!apps/${site}/compose.playwright.yaml`,
			`!apps/${site}/playwright*.config.ts`,
			`!apps/${site}/lighthouserc.cjs`,
		]);
	});

	test("retains conservative shared dependency and toolchain triggers", () => {
		expect(deploymentPaths(site)).toEqual(
			expect.arrayContaining([
				"package.json",
				"bun.lock",
				"bunfig.toml",
				"turbo.json",
				".nvmrc",
				".bun-version",
				".github/actions/ci-tools/**",
				`.github/workflows/deploy-${site}.yml`,
			]),
		);
	});

	test("selects only the deployment scripts used by its hosting mechanism", () => {
		const connected = site === "carolyn" || site === "sarabeth";
		const paths = deploymentPaths(site);
		expect(paths.filter((path) => path.startsWith("scripts/deploy/"))).toEqual(
			connected
				? [
						"scripts/deploy/amplify-release.sh",
						"scripts/deploy/verify-release.sh",
						"scripts/deploy/wait-for-amplify-job.sh",
					]
				: [
						"scripts/deploy/amplify-static.sh",
						"scripts/deploy/wait-for-amplify-job.sh",
					],
		);
		expect(paths.includes("amplify.yml")).toBe(connected);
	});
});

test("PR CI still verifies every app regardless of changed paths", () => {
	const source = read(".github/workflows/ci.yml");
	expect(source).toContain("  pull_request:\n    branches: [main]\n");
	expect(source).not.toMatch(/\bpaths(?:-ignore)?:/);
	for (const site of sites) {
		expect(source).toContain(
			`  ${site}:\n    uses: ./.github/workflows/_${site}-ci.yml`,
		);
	}
});
