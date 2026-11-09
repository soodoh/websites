import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const sites = ["carolyn", "sarabeth", "paul", "diloreto"];
const workspaces = [
	...sites.map((site) => `apps/${site}`),
	"packages/playwright-support",
];
const read = (path: string) => readFileSync(join(root, path), "utf8");
const goodSource = "export const value = 1;\n";
const badSource = "export const   value=1\n";

// Exercise the actual root policy and CLI from each caller's working directory.
// An unrelated ignore pattern ensures generated-file tests exercise Biome's
// exclusions, not a coincidental entry in a developer's Git ignore configuration.
function lint(cwd: string, files: Record<string, string>) {
	const scratch = mkdtempSync(join(tmpdir(), "websites-lint-"));
	try {
		writeFileSync(join(scratch, "biome.json"), read("biome.json"));
		writeFileSync(join(scratch, ".gitignore"), "unused-test-pattern/\n");
		for (const workspace of workspaces)
			mkdirSync(join(scratch, workspace), { recursive: true });
		for (const [path, source] of Object.entries(files)) {
			mkdirSync(dirname(join(scratch, path)), { recursive: true });
			writeFileSync(join(scratch, path), source);
		}
		return spawnSync(join(root, "node_modules/.bin/biome"), ["check", "."], {
			cwd: join(scratch, cwd),
			encoding: "utf8",
		});
	} finally {
		rmSync(scratch, { recursive: true, force: true });
	}
}

const generatedFiles = Object.fromEntries([
	...sites.flatMap((site) => [
		[`apps/${site}/src/routeTree.gen.ts`, "this is not valid TypeScript !!!"],
		[
			`apps/${site}/infra/contentful/.terraform/providers/example/README.md`,
			"| A|B|\n|---|---|\n|a|b|\n",
		],
		...[
			".amplify-hosting",
			".output",
			".nitro",
			".tanstack",
			"dist",
			"build",
			"coverage",
			"playwright-report",
			"test-results",
			".lighthouseci",
		].map((directory) => [
			`apps/${site}/${directory}/generated.ts`,
			"this is not valid TypeScript !!!",
		]),
	]),
	[
		"infra/account-foundation/.terraform/providers/example/generated.ts",
		"this is not valid TypeScript !!!",
	],
	[
		"apps/carolyn/src/lib/generated-release/generated.ts",
		"this is not valid TypeScript !!!",
	],
	[
		"apps/diloreto/src/content/genealogy/generated.json",
		"invalid generated JSON !!!",
	],
	["apps/carolyn/tests/fixtures/contentful.json", '{"unformatted":true}'],
]);

describe.each([".", ...workspaces])("%s root Biome policy", (cwd) => {
	const sourcePath =
		cwd === "." ? "scripts/example.ts" : `${cwd}/src/example.ts`;

	test("inherits the root configuration and ignores generated output", () => {
		const result = lint(cwd, { ...generatedFiles, [sourcePath]: goodSource });
		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
	});

	test("still rejects malformed authored source", () => {
		const result = lint(cwd, { ...generatedFiles, [sourcePath]: badSource });
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("example.ts format");
		expect(result.stderr).not.toContain("README.md format");
		expect(result.stderr).not.toContain("parse");
	});

	test("enforces the same React import rule", () => {
		const result = lint(cwd, {
			[sourcePath]:
				'import React from "react";\n\nexport const value = React;\n',
		});
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("noRestrictedImports");
	});
});

test.each(workspaces)(
	"%s remains scoped when root or sibling files are invalid",
	(workspace) => {
		const result = lint(workspace, {
			[`${workspace}/src/example.ts`]: goodSource,
			"scripts/broken.ts": badSource,
			"unrelated/sibling.ts": badSource,
		});
		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
	},
);

test.each(sites)(
	"%s parses Tailwind without a CSS Modules override",
	(site) => {
		const result = lint(`apps/${site}`, {
			[`apps/${site}/src/globals.css`]:
				'@import "tailwindcss";\n\n@theme {\n\t--color-brand: #123456;\n}\n\n.title {\n\t@apply text-red-500;\n}\n',
		});
		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
	},
);

test("root lint covers app, shared-package, and root scripts together", () => {
	for (const workspace of workspaces) {
		const result = lint(".", { [`${workspace}/src/example.ts`]: badSource });
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("example.ts format");
	}
	const result = lint(".", { "scripts/example.ts": badSource });
	expect(result.status).toBe(1);
	expect(result.stderr).toContain("example.ts format");
});

test("keeps one configuration and includes it in root CI and browser images", () => {
	const config = JSON.parse(read("biome.json"));
	expect(config.root).toBe(true);
	expect(config.css.parser).toEqual({ tailwindDirectives: true });
	const manifest = JSON.parse(read("package.json"));
	expect(manifest.scripts.lint).toBe("biome check .");
	expect(manifest.scripts["lint:fix"]).toBe("biome check --write .");
	expect(read("scripts/ci/lint.sh")).toContain("\nbun run lint\n");
	for (const workspace of workspaces) {
		expect(existsSync(join(root, workspace, "biome.json"))).toBe(false);
		expect(
			JSON.parse(read(`${workspace}/package.json`)).devDependencies[
				"@biomejs/biome"
			],
		).toBe(manifest.devDependencies["@biomejs/biome"]);
	}
	for (const site of sites) {
		expect(read(`apps/${site}/Dockerfile.playwright`)).toContain(
			"COPY biome.json tsconfig.base.json .gitignore ./",
		);
	}
});
