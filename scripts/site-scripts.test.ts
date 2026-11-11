import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const sites = ["paul", "diloreto", "carolyn", "sarabeth"];
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

test("repository-owned code has no remaining JavaScript modules", () => {
	const result = spawnSync(
		"git",
		[
			"ls-files",
			"-co",
			"--exclude-standard",
			"--",
			"*.js",
			"*.mjs",
			"*.cjs",
			"*.jsx",
		],
		{ cwd: root, encoding: "utf8" },
	);
	expect(result.status, result.stderr).toBe(0);
	// An unstaged migration still lists deleted paths in the index.
	const files = result.stdout
		.trim()
		.split("\n")
		.filter((path) => path && existsSync(resolve(root, path)));
	expect(files).toEqual([]);
});

test("site scripts use TypeScript for JavaScript programs, retaining shell and data files", () => {
	for (const site of sites) {
		const files = readdirSync(resolve(root, "apps", site, "scripts"), {
			recursive: true,
		});
		expect(
			files.filter((path) => /\.(?:mjs|cjs|js)$/.test(String(path))),
			site,
		).toEqual([]);
	}
});

test.each(["paul", "diloreto"])(
	"%s deploys with pinned native TypeScript and an exact run identity",
	(site) => {
		const workflow = read(`.github/workflows/deploy-${site}.yml`).split(
			"  deploy:",
		)[1];
		expect(workflow).toContain("uses: actions/setup-node@");
		expect(workflow).toContain("node-version-file: .nvmrc");
		expect(workflow).toContain(
			`run: node apps/${site}/scripts/hosting-smoke.ts`,
		);
		expect(workflow).toMatch(
			/HOSTING_EXPECT_RUN_ID: \$\{\{ github.run_id \}\}/,
		);
		expect(workflow).toMatch(
			/HOSTING_EXPECT_RUN_ATTEMPT: \$\{\{ github.run_attempt \}\}/,
		);
	},
);

test("browser containers include shared release helpers and runners retain shared lifecycle calls", () => {
	for (const site of sites) {
		expect(read(`apps/${site}/Dockerfile.playwright`)).toContain(
			"COPY scripts/deploy scripts/deploy",
		);
		const file =
			site === "diloreto"
				? "test-playwright-docker.sh"
				: "playwright-docker.sh";
		const runner = read(`apps/${site}/scripts/${file}`);
		expect(runner).toContain("/scripts/playwright/docker-runner.sh");
		expect(runner).toContain("playwright_docker_finish");
	}
});

test("Carolyn uses Vite directly without bypassing the production guard", () => {
	const manifest = JSON.parse(read("apps/carolyn/package.json"));
	expect(manifest.scripts.build).toBe(
		"vite build && bun run scripts/clean-production-artifact.ts",
	);
	expect(manifest.scripts.prebuild).toBe("bun run scripts/prepare-release.ts");
	const config = read("apps/carolyn/vite.config.ts");
	expect(
		config.indexOf("assertSafeProductionBuildEnvironment(process.env)"),
	).toBeGreaterThan(config.indexOf("Object.assign(process.env, loadEnv("));
});
