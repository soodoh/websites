import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertTcpPortAvailable } from "@websites/static-site/ports";
import { describe, expect, test } from "vitest";
import {
	categories,
	formFactors,
	lighthouseConfig,
	sitePolicy,
	sites,
	validateBudgets,
} from "./lighthouse/policy";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

describe.each(Object.keys(sites))("%s shared Lighthouse policy", (site) => {
	test.each(formFactors)(
		"audits %s with shared settings and site baselines",
		(formFactor) => {
			const { ci } = lighthouseConfig(site, formFactor);
			const { budgets, appRoot, port } = sitePolicy(site);
			expect(ci.collect.numberOfRuns).toBe(3);
			expect(ci.collect.settings.onlyCategories).toEqual(categories);
			expect(ci.collect.settings.preset).toBe(
				formFactor === "desktop" ? "desktop" : undefined,
			);
			expect(ci.collect.url).toEqual(
				budgets.routes.map(
					(route: string) => `http://127.0.0.1:${port}${route}`,
				),
			);
			expect(ci.collect.startServerCommand).toContain(appRoot);
			expect(ci.collect.startServerReadyTimeout).toBe(120_000);
			for (const category of categories) {
				expect(ci.assert.assertions[`categories:${category}`]).toEqual([
					"error",
					{
						minScore: budgets[formFactor][category],
						aggregationMethod: "median",
					},
				]);
			}
			expect(ci.upload).toEqual({ target: "filesystem", outputDir: "reports" });
		},
	);

	test("complete verification invokes shared Lighthouse on the already-built output", () => {
		const manifest = json(`apps/${site}/package.json`);
		expect(manifest.scripts.lighthouse).toBe(
			`bun ../../scripts/lighthouse/run.ts ${site}`,
		);
		expect(manifest.scripts["ci:verify"]).toMatch(
			/&& bun run lighthouse --prebuilt$/,
		);
		expect(manifest.devDependencies["@lhci/cli"]).toBeUndefined();
		expect(existsSync(resolve(root, `apps/${site}/lighthouserc.cjs`))).toBe(
			false,
		);
	});
});

test("rejects unknown sites and form factors instead of silently auditing a default", () => {
	expect(() => lighthouseConfig("unknown", "mobile")).toThrow(
		"Unknown Lighthouse site",
	);
	expect(() => lighthouseConfig("__proto__", "mobile")).toThrow(
		"Unknown Lighthouse site",
	);
	expect(() => lighthouseConfig("paul", "tablet")).toThrow(
		"Unknown Lighthouse form factor",
	);
});

test.each([
	0,
	-0.1,
	1.1,
	"0.9",
	null,
	undefined,
	Number.NaN,
	Number.POSITIVE_INFINITY,
])("rejects invalid score %s", (score) => {
	const previous = sitePolicy("paul").budgets;
	const budgets = {
		...previous,
		mobile: { ...previous.mobile, performance: score },
	};
	expect(() => validateBudgets("paul", budgets)).toThrow(
		"invalid mobile Lighthouse baselines",
	);
});

test("requires exactly the four audited categories in both profiles", () => {
	const budgets = structuredClone(sitePolicy("paul").budgets);
	const desktop: Record<string, unknown> = { ...budgets.desktop };
	delete desktop.seo;
	expect(() => validateBudgets("paul", { ...budgets, desktop })).toThrow(
		"invalid desktop Lighthouse baselines",
	);
	desktop.seo = 1;
	desktop.typo = 0.9;
	expect(() => validateBudgets("paul", { ...budgets, desktop })).toThrow(
		"invalid desktop Lighthouse baselines",
	);
});

test.each([
	[],
	["/", "/"],
	["https://example.com"],
	["//example.com"],
	["/\\example.com"],
	["/?preview=true"],
	["/#content"],
	[42],
])("rejects empty, duplicate, or non-local routes: %j", (...routes) => {
	const budgets = { ...sitePolicy("paul").budgets, routes };
	expect(() => validateBudgets("paul", budgets)).toThrow(
		"Lighthouse routes must be unique local paths",
	);
});

test("refuses occupied local ports instead of auditing an unrelated server", async () => {
	const server = createServer();
	await new Promise<void>((accept) => server.listen(0, "127.0.0.1", accept));
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("Missing test port");
	try {
		await expect(
			assertTcpPortAvailable(address.port, "Lighthouse requires free port"),
		).rejects.toThrow(`Lighthouse requires free port ${address.port}`);
	} finally {
		await new Promise<void>((accept) => server.close(() => accept()));
	}
	await expect(
		assertTcpPortAvailable(address.port, "Lighthouse requires free port"),
	).resolves.toBeUndefined();
});

test("native LHCI retains positive assertion evidence for successful runs", () => {
	const require = createRequire(import.meta.url);
	const cliRequire = createRequire(require.resolve("@lhci/cli/package.json"));
	const { getAllAssertionResults } = cliRequire(
		"@lhci/utils/src/assertions.js",
	);
	const { ci } = lighthouseConfig("paul", "mobile");
	const report = {
		finalUrl: ci.collect.url[0],
		audits: {},
		categories: Object.fromEntries(
			categories.map((category) => [category, { score: 1 }]),
		),
	};
	const results = getAllAssertionResults(ci.assert, [report]);
	expect(results).toHaveLength(categories.length);
	expect(results.every((result: { passed: boolean }) => result.passed)).toBe(
		true,
	);
});

test("root owns the exact Lighthouse and browser versions used across every site", () => {
	const manifest = json("package.json");
	expect(manifest.devDependencies["@lhci/cli"]).toBe("0.16.0");
	for (const site of Object.keys(sites)) {
		expect(manifest.devDependencies["playwright-core"]).toBe(
			json(`apps/${site}/package.json`).devDependencies["@playwright/test"],
		);
	}
	expect(manifest.scripts["lighthouse:install"]).toBe(
		"playwright-core install --with-deps chromium",
	);
});

test("one reusable workflow verifies every site and optionally packages static output", () => {
	const workflow = read(".github/workflows/_site-ci.yml");
	expect(workflow).toContain('run: bun run "verify:$SITE"');
	expect(workflow).toContain("run: bun run lighthouse:install");
	expect(workflow).toContain("permissions:\n  contents: read\n");
	expect(workflow).not.toContain("id-token: write");
	// biome-ignore lint/suspicious/noTemplateCurlyInString: Assert the literal GitHub expression.
	expect(workflow).toContain("path: .lighthouseci/${{ inputs.site }}/");
	expect(workflow).toContain("include-hidden-files: true");
	expect(workflow).toMatch(
		/Retain Lighthouse reports[^\n]*\n {8}if: always\(\)/,
	);
	for (const [site, config] of Object.entries(sites) as [
		string,
		{ runner: string },
	][]) {
		expect(workflow).toContain(`"${site}":"${config.runner}"`);
		expect(existsSync(resolve(root, `.github/workflows/_${site}-ci.yml`))).toBe(
			false,
		);
		const deploy = read(`.github/workflows/deploy-${site}.yml`);
		expect(deploy).toContain(
			`  verify:\n    uses: ./.github/workflows/_site-ci.yml\n    with:\n      site: ${site}\n`,
		);
		expect(deploy).toContain("    needs: verify\n");
		expect(deploy.includes("      package-static: true")).toBe(
			site === "paul" || site === "diloreto",
		);
		if (site === "paul" || site === "diloreto") {
			expect(deploy).toContain(`name: ${site}-`);
			expect(deploy).not.toContain("Package static site");
		}
	}
	const ci = read(".github/workflows/ci.yml");
	expect(ci).toContain("needs: [root, sarabeth, carolyn, paul, diloreto]");
	expect(ci).toContain("name: CI gate");
});
