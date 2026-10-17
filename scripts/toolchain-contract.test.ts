import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path: string) => readFileSync(join(root, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const pins = {
	bun: read(".bun-version").trim(),
	node: read(".nvmrc").trim(),
};
const future = { bun: "9.8.7", node: "98.7.6" };

type Versions = typeof pins;

// Execute the real setup commands without installing tools or contacting services.
function runSetup(script: string, files: Versions, installed = files) {
	const scratch = mkdtempSync(join(tmpdir(), "websites-toolchain-"));
	try {
		writeFileSync(join(scratch, ".bun-version"), `${files.bun}\n`);
		writeFileSync(join(scratch, ".nvmrc"), `${files.node}\n`);
		return spawnSync(
			"bash",
			[
				"-euc",
				`
 bun() {
   if [[ "$*" == --version ]]; then printf '%s\\n' "$INSTALLED_BUN";
   else printf 'bun %s\\n' "$*"; fi
 }
 node() { printf 'v%s\\n' "$INSTALLED_NODE"; }
 nvm() { printf 'nvm %s\\n' "$*"; }
 npm() { printf 'npm %s\\n' "$*"; }
 python() { :; }
 shellcheck() { printf 'version: 0.11.0\\n'; }
 ${script}
`,
			],
			{
				cwd: scratch,
				encoding: "utf8",
				env: {
					PATH: process.env.PATH,
					HOME: scratch,
					INSTALLED_BUN: installed.bun,
					INSTALLED_NODE: installed.node,
				},
			},
		);
	} finally {
		rmSync(scratch, { recursive: true, force: true });
	}
}

function ciSetup() {
	const block = read(".github/actions/ci-tools/action.yml").match(
		/ {6}run: \|\n([\s\S]*)$/,
	);
	if (!block) throw new Error("Missing CI tools run block");
	return block[1].replace(/^ {8}/gm, "");
}

function amplifySetup(site: string) {
	const application = read("amplify.yml")
		.split("  - appRoot: ")
		.find((block) => block.startsWith(`apps/${site}\n`));
	const block = application?.match(
		/ {8}preBuild:\n {10}commands:\n([\s\S]*?) {8}build:/,
	);
	if (!block) throw new Error(`Missing ${site} Amplify preBuild commands`);
	return block[1].trimEnd().replace(/^ {12}- /gm, "");
}

test("manifest and browser images agree with the root toolchain pins", () => {
	const manifest = json("package.json");
	expect(manifest.engines).toMatchObject(pins);
	expect(manifest.packageManager).toBe(`bun@${pins.bun}`);
	for (const site of ["sarabeth", "carolyn", "paul", "diloreto"]) {
		const dockerfile = read(`apps/${site}/Dockerfile.playwright`);
		expect(dockerfile).toContain(`FROM oven/bun:${pins.bun}@sha256:`);
		expect(dockerfile).toContain(
			`FROM node:${pins.node}-bookworm-slim@sha256:`,
		);
		const playwright = json(`apps/${site}/package.json`).devDependencies[
			"@playwright/test"
		];
		expect(dockerfile).toContain(
			`FROM mcr.microsoft.com/playwright:v${playwright}-noble@sha256:`,
		);
	}
});

test("CI installs Node and Bun from the root version files", () => {
	const action = read(".github/actions/ci-tools/action.yml");
	expect(action).toContain("node-version-file: .nvmrc");
	expect(action).toContain("bun-version-file: .bun-version");
	expect(action).not.toMatch(/^\s+bun-version:/m);
});

describe.each([
	["current", pins],
	["future", future],
] as const)("%s toolchain pins", (_label, versions) => {
	test("CI accepts matching tools and reaches the frozen install", () => {
		const result = runSetup(ciSetup(), versions);
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain("bun install --frozen-lockfile\n");
	});

	test.each(["bun", "node"] as const)(
		"CI rejects an incorrect %s before installing dependencies",
		(tool) => {
			const result = runSetup(ciSetup(), versions, {
				...versions,
				[tool]: "0.0.1",
			});
			expect(result.status).toBe(1);
			expect(result.stdout).not.toContain("bun install");
		},
	);

	test.each(["carolyn", "sarabeth"])(
		"%s Amplify installs tools from the same root version files",
		(site) => {
			const result = runSetup(amplifySetup(site), versions);
			expect(result.status, result.stderr).toBe(0);
			expect(result.stdout.trim().split("\n")).toEqual([
				`nvm install ${versions.node}`,
				`nvm use ${versions.node}`,
				`npm install --global bun@${versions.bun}`,
				"bun install --frozen-lockfile --ignore-scripts",
			]);
		},
	);
});
