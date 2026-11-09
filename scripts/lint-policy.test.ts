import { spawnSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));

describe.each(["carolyn", "sarabeth"])(
	"%s generated-provider lint policy",
	(site) => {
		function lint(source: string) {
			const scratch = mkdtempSync(join(tmpdir(), "websites-lint-"));
			try {
				writeFileSync(
					join(scratch, "biome.json"),
					readFileSync(join(root, "apps", site, "biome.json")),
				);
				writeFileSync(
					join(scratch, ".gitignore"),
					readFileSync(join(root, "apps", site, ".gitignore")),
				);
				const provider = join(
					scratch,
					"infra/contentful/.terraform/providers/example",
				);
				mkdirSync(provider, { recursive: true });
				writeFileSync(
					join(provider, "README.md"),
					"| A|B|\n|---|---|\n|a|b|\n",
				);
				mkdirSync(join(scratch, "src"));
				writeFileSync(join(scratch, "src/index.ts"), source);
				return spawnSync(
					join(root, "apps", site, "node_modules/.bin/biome"),
					["check", "."],
					{ cwd: scratch, encoding: "utf8" },
				);
			} finally {
				rmSync(scratch, { recursive: true, force: true });
			}
		}

		test("ignores downloaded provider documents", () => {
			const result = lint("export const value = 1;\n");
			expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
		});

		test("still rejects malformed application source", () => {
			const result = lint("export const   value=1\n");
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("src/index.ts");
			expect(result.stderr).not.toContain("README.md format");
		});
	},
);
