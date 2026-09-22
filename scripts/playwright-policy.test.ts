import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const apps = ["sarabeth", "paul", "carolyn", "diloreto"] as const;
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

function filesBelow(directory: string): string[] {
	return readdirSync(directory).flatMap((entry) => {
		const path = resolve(directory, entry);
		return statSync(path).isDirectory() ? filesBelow(path) : [path];
	});
}

describe("Playwright policy", () => {
	test("uses the shared configuration and standard browser commands", () => {
		for (const app of apps) {
			const manifest = json(`apps/${app}/package.json`);
			expect(manifest.devDependencies["@websites/playwright-support"]).toBe(
				"workspace:*",
			);
			for (const script of [
				"test:browser",
				"test:browser:local",
				"test:browser:update",
			]) {
				expect(manifest.scripts[script], `${app} ${script}`).toEqual(
					expect.any(String),
				);
			}
			expect(manifest.scripts["test:browser:update"]).toContain(
				"update",
			);
			expect(read(`apps/${app}/playwright.config.ts`)).toContain(
				"defineWebsitePlaywrightConfig",
			);
		}
	});

	test("keeps screenshots in explicitly named visual specs", () => {
		for (const app of apps) {
			const testsRoot = resolve(root, "apps", app, "tests");
			const specs = filesBelow(testsRoot).filter((path) =>
				path.endsWith(".spec.ts"),
			);
			for (const path of specs) {
				const workspacePath = relative(root, path);
				const source = read(workspacePath);
				if (source.includes("toHaveScreenshot(")) {
					expect(workspacePath).toContain("/tests/visual/");
					expect(workspacePath).toMatch(/\.visual\.spec\.ts$/);
				}
			}
		}
	});

	test("routes specs through each app fixture", () => {
		const allowedRawSpecs = new Set([
			"apps/carolyn/tests/candidate-policy.spec.ts",
		]);
		for (const app of apps) {
			const testsRoot = resolve(root, "apps", app, "tests");
			for (const path of filesBelow(testsRoot).filter((file) =>
				file.endsWith(".spec.ts"),
			)) {
				const workspacePath = relative(root, path);
				if (allowedRawSpecs.has(workspacePath)) continue;
				expect(read(workspacePath), workspacePath).not.toContain(
					'from "@playwright/test"',
				);
			}
		}
	});
});
