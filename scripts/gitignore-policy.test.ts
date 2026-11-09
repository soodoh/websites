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
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const sites = ["carolyn", "diloreto", "paul", "sarabeth"];
const fixture = mkdtempSync(join(tmpdir(), "websites-gitignore-"));
const commonArtifacts = [
	"node_modules/package/index.js",
	".turbo/cache.json",
	".env",
	".env.local",
	".env.production",
	"config.local",
	".amplify-hosting/manifest.json",
	".output/server.js",
	".nitro/config.json",
	".tanstack/cache.json",
	"dist/index.html",
	"build/index.html",
	"cdk.out/manifest.json",
	".terraform/providers/provider",
	"terraform.tfstate",
	"terraform.tfstate.backup",
	"contentful.tfplan",
	"local.tfbackend",
	"production.tfvars",
	"coverage/index.html",
	"playwright-report/index.html",
	"test-results/results.json",
	".lighthouseci/report.json",
	".playwright-output/result.json",
	"compiler.tsbuildinfo",
	"site.zip",
	"logs/request.json",
	"application.log",
	"npm-debug.log.1",
	"bun-debug.log.1",
	"private.pem",
	"private.key",
	"core",
	"crash.core",
	".pi/session.json",
	".pi-subagents/run.json",
	".playwright-mcp/session.json",
	".DS_Store",
	"__pycache__/module.pyc",
	".vinxi/cache.json",
	".vercel/project.json",
	".netlify/state.json",
	".oxlintcache",
];

beforeAll(() => {
	const initialized = spawnSync(
		"git",
		["init", "--quiet", "--template=", fixture],
		{ encoding: "utf8" },
	);
	expect(initialized.status, initialized.stderr).toBe(0);
	for (const path of [
		".gitignore",
		...sites.map((site) => `apps/${site}/.gitignore`),
	]) {
		if (!existsSync(join(root, path))) continue;
		mkdirSync(dirname(join(fixture, path)), { recursive: true });
		writeFileSync(join(fixture, path), readFileSync(join(root, path)));
	}
});
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

function rules(paths: string[]) {
	const result = spawnSync(
		"git",
		[
			"-c",
			"core.excludesFile=/dev/null",
			"check-ignore",
			"--no-index",
			"--verbose",
			"--non-matching",
			"--stdin",
			"-z",
		],
		{
			cwd: fixture,
			encoding: "utf8",
			input: `${paths.join("\0")}\0`,
		},
	);
	expect([0, 1], result.stderr).toContain(result.status);
	const fields = result.stdout.split("\0");
	const matches = new Map<
		string,
		{ source: string; pattern: string; ignored: boolean }
	>();
	for (let index = 0; index + 3 < fields.length; index += 4) {
		const [source, , pattern, path] = fields.slice(index, index + 4);
		matches.set(path, {
			source,
			pattern,
			ignored: Boolean(pattern) && !pattern.startsWith("!"),
		});
	}
	expect(matches.size).toBe(paths.length);
	return matches;
}

describe.each([
	"",
	...sites.map((site) => `apps/${site}/`),
	"packages/playwright-support/",
])("%s shared ignore policy", (prefix) => {
	test("keeps generated output and local secrets ignored by the root rules", () => {
		const paths = commonArtifacts.map((path) => `${prefix}${path}`);
		for (const [path, rule] of rules(paths)) {
			expect(rule.ignored, path).toBe(true);
			expect(rule.source, path).toBe(".gitignore");
		}
	});

	test("keeps authored files, example configuration, and provider locks trackable", () => {
		const paths = [
			"src/index.ts",
			"src/styles/globals.css",
			"tests/example.spec.ts",
			"tests/__screenshots__/example.png",
			"package.json",
			"tsconfig.json",
			".env.example",
			"infra/terraform.tfvars.example",
			"infra/.terraform.lock.hcl",
		].map((path) => `${prefix}${path}`);
		for (const [path, rule] of rules(paths))
			expect(rule.ignored, path).toBe(false);
	});
});

test("Carolyn retains its local generated-content and transaction-recovery exclusions", () => {
	const paths = [
		"src/routeTree.gen.ts",
		"src/lib/generated-release/public-release-content.json",
		"src/lib/generated-release/protected-project-content.server.json",
		"src/lib/project-auth-manifest.json",
		"public/.test-assets-staging/image.webp",
		"public/.test-assets-backup/image.webp",
		"tests/fixtures/contentful.json.tmp",
		"tests/fixtures/contentful.json.backup",
		"tests/fixtures/.contentful-fixture-commit",
		"tests/fixtures/.contentful-fixture.lock",
	].map((path) => `apps/carolyn/${path}`);
	for (const [path, rule] of rules(paths)) {
		expect(rule.ignored, path).toBe(true);
		expect(rule.source, path).toBe("apps/carolyn/.gitignore");
	}
});

test("DiLoreto retains its local deployment-recovery exclusions", () => {
	const path = "apps/diloreto/.aws-migration/recovery.json";
	expect(rules([path]).get(path)).toMatchObject({
		ignored: true,
		source: "apps/diloreto/.gitignore",
	});
});

test("intentionally tracked generated files and fixtures remain trackable", () => {
	const paths = [
		"apps/diloreto/src/routeTree.gen.ts",
		"apps/paul/src/routeTree.gen.ts",
		"apps/sarabeth/src/routeTree.gen.ts",
		"apps/diloreto/src/content/genealogy/generated.json",
		"apps/carolyn/tests/fixtures/contentful.json",
	];
	for (const [path, rule] of rules(paths))
		expect(rule.ignored, path).toBe(false);
});

test("workspaces without app-specific exceptions do not duplicate the root ignore file", () => {
	for (const site of ["paul", "sarabeth"])
		expect(existsSync(join(root, "apps", site, ".gitignore"))).toBe(false);
});
