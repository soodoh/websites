import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const packageNames: Record<string, string> = {
 sarabeth: "sarabeth-studio",
 paul: "portfolio-website",
 carolyn: "carolyn-portfolio",
 diloreto: "diloreto-website",
};
const apps = Object.keys(packageNames);

describe("phase 1 workspace contract", () => {
	test("has one root lock, unique workspaces, and one hook owner", () => {
		const manifest = json("package.json");
		expect(manifest.private).toBe(true);
		expect(manifest.workspaces).toEqual(["apps/*"]);
		expect(manifest.packageManager).toBe("bun@1.4.0");
		expect(Bun.JSONC.parse(read("bun.lock")).workspaces).toHaveProperty("");
		for (const app of apps) {
			const local = json(`apps/${app}/package.json`);
			expect(local.name).toBe(packageNames[app]);
			expect(local.scripts.prepare).toBeUndefined();
			expect(json("package.json").scripts[`verify:${app}`]).toBe(`turbo run ci:verify --filter=${packageNames[app]} --concurrency=1`);
			expect(Bun.JSONC.parse(read("bun.lock")).workspaces[`apps/${app}`].name).toBe(packageNames[app]);
			expect(existsSync(resolve(root, `apps/${packageNames[app]}`))).toBe(false);
			expect(local.packageManager).toBeUndefined();
			expect(existsSync(resolve(root, `apps/${app}/bun.lock`))).toBe(false);
		}
		expect(existsSync(resolve(root, "apps/carolyn/infra/package.json"))).toBe(false);
		expect(existsSync(resolve(root, ".github/workflows/ci.yml"))).toBe(true);
	});

	test("retains original direct resolutions including folded infra tools", () => {
		const before = json("docs/migration/dependency-resolutions-before.json");
		for (const app of apps) {
			const manifest = json(`apps/${app}/package.json`);
			for (const [name, version] of Object.entries({
				...manifest.dependencies,
				...manifest.devDependencies,
			})) {
				const old = before[`apps/${packageNames[app]}`][name] ?? before["apps/carolyn-portfolio/infra"][name];
				expect(`${name}@${version}`).toBe(old);
				const installed = json(`apps/${app}/node_modules/${name}/package.json`);
				expect(installed.version).toBe(version);
			}
		}
	});

	test("uses strict uncached tasks and serial complete verification", () => {
		const turbo = json("turbo.json");
		for (const task of Object.values(turbo.tasks) as { cache: boolean }[]) {
			expect(task.cache).toBe(false);
		}
		expect(turbo.tasks["dev:workspace"].persistent).toBe(true);
		expect(json("package.json").scripts["ci:verify"]).toContain("--concurrency=1");
		expect(read("package.json")).not.toContain("--env-mode=loose");
		for (const app of apps) {
			expect(json(`apps/${app}/package.json`).scripts["ci:verify"]).toContain("&&");
		}
	});

	test("installs Docker workspaces from the root frozen lock without host dependencies", () => {
		for (const app of apps) {
			const dockerfile = read(`apps/${app}/Dockerfile.playwright`);
			expect(dockerfile).toContain("COPY package.json bun.lock bunfig.toml ./");
			expect(dockerfile).toContain("bun install --frozen-lockfile --ignore-scripts");
			expect(dockerfile).toContain("playwright:v1.62.1-noble");
			for (const workspace of apps) {
				expect(dockerfile).toContain(`COPY apps/${workspace}/package.json`);
			}
		}
		expect(read("apps/sarabeth/Dockerfile.playwright")).toContain("COPY renovate.json ./");
		expect(read(".dockerignore")).toContain("**/.env.*");
		expect(read(".dockerignore")).toContain("**/node_modules");
	});
});
