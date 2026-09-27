import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const apps = ["sarabeth", "paul", "carolyn", "diloreto"] as const;

test("workspaces use the root lock and serial, uncached verification", () => {
	const manifest = json("package.json");
	expect(manifest.workspaces).toEqual(["apps/*", "packages/*"]);
	expect(existsSync(resolve(root, "bun.lock"))).toBe(true);
	for (const app of apps) {
		expect(existsSync(resolve(root, `apps/${app}/bun.lock`))).toBe(false);
	}
	expect(manifest.scripts["ci:verify"]).toContain("--concurrency=1");
	for (const task of Object.values(json("turbo.json").tasks) as {
		cache: boolean;
	}[]) {
		expect(task.cache).toBe(false);
	}
});

test("browser containers install from the frozen root lock without host dependencies", () => {
	for (const app of apps) {
		const dockerfile = read(`apps/${app}/Dockerfile.playwright`);
		const baseImages = dockerfile
			.split("\n")
			.filter((line) => line.startsWith("FROM "));
		expect(baseImages).not.toHaveLength(0);
		for (const image of baseImages) {
			expect(image).toMatch(/^FROM \S+@sha256:[a-f0-9]{64}(?: AS \w+)?$/);
		}
		expect(dockerfile).toContain("COPY package.json bun.lock bunfig.toml ./");
		expect(dockerfile).toContain(
			"bun install --frozen-lockfile --ignore-scripts",
		);
		for (const workspace of apps) {
			expect(dockerfile).toContain(`COPY apps/${workspace}/package.json`);
		}
		expect(dockerfile).toContain(
			"COPY packages/playwright-support/package.json",
		);
		expect(dockerfile).toContain(
			"COPY packages/playwright-support packages/playwright-support",
		);
	}
	expect(read(".dockerignore")).toContain("**/.env.*");
	expect(read(".dockerignore")).toContain("**/node_modules");
});
