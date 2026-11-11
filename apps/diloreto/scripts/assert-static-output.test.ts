import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const script = fileURLToPath(
	new URL("./assert-static-output.ts", import.meta.url),
);
const page = '<picture><source srcset="/assets/image.webp 400w"/></picture>';

function verify(omit?: string, overrides: Record<string, string> = {}) {
	const root = mkdtempSync(join(tmpdir(), "diloreto-output-"));
	try {
		for (const [path, body] of Object.entries({
			"index.html": page,
			"areyou/index.html": page,
			"areyou.html": page,
			"familytree/index.html": "Family tree",
			"familytree.html": "Family tree",
			"404.html": "404: Page Not Found<script></script>",
			"robots.txt": "",
			"favicon.png": "",
			"apple-touch-icon.png": "",
			...overrides,
		})) {
			if (path === omit) continue;
			const file = join(root, "dist/client", path);
			mkdirSync(join(file, ".."), { recursive: true });
			writeFileSync(file, body);
		}
		return spawnSync("bun", [script], { cwd: root, encoding: "utf8" });
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

test("checks explicit artifacts without requiring or interpreting route source files", () => {
	const result = verify();
	expect(result.status, result.stderr).toBe(0);
});

test.each([
	"familytree/index.html",
	"familytree.html",
	"areyou/index.html",
	"areyou.html",
	"404.html",
])("rejects a missing %s", (path) => {
	const result = verify(path);
	expect(result.status).not.toBe(0);
	expect(result.stderr).toContain(path);
});

test("retains alias equality and forbidden hosting-reference checks", () => {
	expect(verify(undefined, { "areyou.html": "different" }).stderr).toContain(
		"alias differs",
	);
	expect(verify(undefined, { "asset.js": "netlify" }).stderr).toContain(
		"Forbidden deployment reference",
	);
});
