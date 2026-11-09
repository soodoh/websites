import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const json = (path: string) =>
	JSON.parse(readFileSync(join(root, path), "utf8"));
const projects = [
	{
		workspace: "apps/carolyn",
		target: "es2023",
		lib: ["dom", "dom.iterable", "es2023"],
		types: ["vite/client"],
		paths: {
			"@/*": ["./src/*"],
			"@scripts/*": ["./scripts/*"],
			"@tests/*": ["./tests/*"],
		},
		include: ["**/*.ts", "**/*.tsx"],
		exclude: ["node_modules", ".output", "infra"],
	},
	{
		workspace: "apps/diloreto",
		target: "es2022",
		lib: undefined,
		types: undefined,
		paths: { "@/*": ["./src/*"] },
		include: [
			"src/**/*.ts",
			"src/**/*.tsx",
			"infra/**/*.ts",
			"scripts/**/*.ts",
			"tests/**/*.ts",
			"playwright.config.ts",
			"vite.config.ts",
		],
		exclude: ["node_modules", ".output", "dist"],
	},
	{
		workspace: "apps/paul",
		target: "es2022",
		lib: undefined,
		types: undefined,
		paths: { "@/*": ["./src/*"] },
		include: ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"],
		exclude: undefined,
	},
	{
		workspace: "apps/sarabeth",
		target: "es2023",
		lib: ["es2023", "dom", "dom.iterable"],
		types: undefined,
		paths: {
			"@/*": ["./src/*"],
			"@scripts/*": ["./scripts/*"],
			"@tests/*": ["./tests/*"],
		},
		include: ["**/*.ts", "**/*.tsx"],
		exclude: ["node_modules", ".output"],
	},
	{
		workspace: "packages/playwright-support",
		target: "es2024",
		lib: ["dom", "es2024"],
		types: ["node"],
		paths: undefined,
		include: ["src/**/*.ts"],
		exclude: undefined,
	},
];

function resolvedConfig(workspace: string, project = "tsconfig.json") {
	const result = spawnSync(
		join(root, workspace, "node_modules/.bin/tsc"),
		["--showConfig", "-p", project],
		{
			cwd: join(root, workspace),
			encoding: "utf8",
		},
	);
	expect(result.error).toBeUndefined();
	expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
	return JSON.parse(result.stdout);
}

test("shares compiler policy without moving runtime or path assumptions into the root", () => {
	expect(json("tsconfig.base.json")).toEqual({
		compilerOptions: {
			module: "ESNext",
			moduleResolution: "Bundler",
			noEmit: true,
			strict: true,
		},
	});
});

describe.each(projects)("$workspace TypeScript configuration", (project) => {
	test("inherits the shared policy instead of duplicating it", () => {
		const config = json(`${project.workspace}/tsconfig.json`);
		expect(config.extends).toBe("../../tsconfig.base.json");
		for (const key of Object.keys(json("tsconfig.base.json").compilerOptions)) {
			expect(config.compilerOptions).not.toHaveProperty(key);
		}
	});

	test("resolves aliases locally and preserves its runtime and file coverage", () => {
		const config = resolvedConfig(project.workspace);
		expect(config.compilerOptions).toMatchObject({
			module: "esnext",
			moduleResolution: "bundler",
			noEmit: true,
			strict: true,
			target: project.target,
		});
		expect(config.compilerOptions.paths).toEqual(project.paths);
		expect(config.compilerOptions.lib).toEqual(project.lib);
		expect(config.compilerOptions.types).toEqual(project.types);
		expect(config.include).toEqual(project.include);
		expect(config.exclude).toEqual(project.exclude);
	});
});

test("Paul's tooling project still inherits the app policy and checks JavaScript", () => {
	const config = resolvedConfig("apps/paul", "tsconfig.tools.json");
	expect(config.compilerOptions).toMatchObject({
		allowJs: true,
		checkJs: true,
		noEmit: true,
		strict: true,
		target: "es2022",
		types: ["node"],
		paths: { "@/*": ["./src/*"] },
	});
	expect(config.include).toEqual([
		"commitlint.config.ts",
		"tests/**/*.ts",
		"playwright.config.ts",
		"scripts/*.mjs",
	]);
});
