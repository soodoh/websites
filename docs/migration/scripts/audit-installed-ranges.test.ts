import { expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const roots = [".", "apps/sarabeth", "apps/paul", "apps/carolyn", "apps/diloreto", "apps/carolyn/infra"];

function audit(missingRoot?: string, missingType = "dependencies", historicalPaths = false) {
	const historical = [".", "apps/sarabeth-studio", "apps/portfolio-website", "apps/carolyn-portfolio", "apps/diloreto-website", "apps/carolyn-portfolio/infra"];
	const base = mkdtempSync(join(tmpdir(), "websites-range-audit-"));
	try {
		for (const root of historicalPaths ? historical : roots) {
			const path = join(base, root);
			mkdirSync(path, { recursive: true });
			const dep = "websites-audit-fixture-dependency";
			writeFileSync(join(path, "package.json"), JSON.stringify({
				name: root,
				dependencies: { [dep]: "1.0.0" },
			}));
			if (root !== missingRoot) {
				mkdirSync(join(path, "node_modules", dep), { recursive: true });
				writeFileSync(join(path, "node_modules", dep, "package.json"), JSON.stringify({ name: dep, version: "1.0.0" }));
			} else {
				// Unique missing name prevents resolution from an ancestor fixture.
				writeFileSync(join(path, "package.json"), JSON.stringify({ name: root, [missingType]: { "websites-audit-missing-direct": "1.0.0" } }));
			}
		}
		const output = join(base, "evidence.json");
		const result = Bun.spawnSync([process.execPath, join(import.meta.dir, "audit-installed-ranges.ts"), base, output, ...(historicalPaths ? ["--historical-paths"] : [])]);
		return { exitCode: result.exitCode, evidence: JSON.parse(readFileSync(output, "utf8")) };
	} finally {
		rmSync(base, { recursive: true, force: true });
	}
}

test("explicit checkout includes root and passes when required direct packages exist", () => {
	const result = audit();
	expect(result.exitCode).toBe(0);
	expect(Object.keys(result.evidence)).toEqual(roots);
	expect(result.evidence["."].peerAndDirectEdges).toHaveLength(1);
});

test("historical baseline paths require explicit selection and remain distinct", () => {
	const result = audit(undefined, "dependencies", true);
	expect(result.exitCode).toBe(0);
	expect(result.evidence).toHaveProperty("apps/carolyn-portfolio/infra");
	expect(result.evidence["apps/carolyn/infra"]).toBeUndefined();
});

for (const type of ["dependencies", "devDependencies"]) {
	test(`absent app direct ${type} is reported and fails`, () => {
		const result = audit("apps/sarabeth", type);
		expect(result.exitCode).toBe(1);
		expect(result.evidence["apps/sarabeth"].missing).toEqual([
			{ parent: "apps/sarabeth", type: "direct", dep: "websites-audit-missing-direct", range: "1.0.0" },
		]);
	});

	test(`explicit checkout cannot omit root-only missing ${type}`, () => {
		const result = audit(".", type);
		expect(result.exitCode).toBe(1);
		expect(result.evidence["."].missing).toHaveLength(1);
		expect(result.evidence["."].missing[0].dep).toBe("websites-audit-missing-direct");
	});
}
