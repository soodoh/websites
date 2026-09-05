import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";

// Install the workspace first. This checks EVERY main ancestor, without merge/revert ignores.
// Usage: bun docs/migration/scripts/lint-history.mjs [checkout] [output-json]
const root = resolve(process.argv[2] ?? process.cwd());
const rootRequire = createRequire(`${root}/package.json`);
const cliRequire = createRequire(rootRequire.resolve("@commitlint/cli"));
const { default: lint } = await import(cliRequire.resolve("@commitlint/lint"));
const { default: load } = await import(cliRequire.resolve("@commitlint/load"));
const config = await load({}, { cwd: root });
const git = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
const head = git("rev-parse", "HEAD").trim();
const commits = git("rev-list", head).trim().split("\n");
const failures = [];
const warnings = [];
for (const sha of commits) {
	const raw = git("cat-file", "commit", sha);
	const message = raw.slice(raw.indexOf("\n\n") + 2);
	const result = await lint(message, config.rules, {
		parserOpts: config.parserPreset?.parserOpts,
		plugins: config.plugins,
		ignores: [],
		defaultIgnores: false,
	});
	if (!result.valid) failures.push({ sha, errors: result.errors });
	if (result.warnings.length) warnings.push({ sha, warnings: result.warnings });
}
const report = { head, checked: commits.length, defaultIgnores: false, failures, warnings };
if (process.argv[3]) writeFileSync(process.argv[3], `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ head, checked: commits.length, failures: failures.length, warnings: warnings.length }));
process.exitCode = failures.length ? 1 : 0;
