import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const scopes = [
	"carolyn",
	"paul",
	"diloreto",
	"sarabeth",
	"repo",
	"ci",
	"deps",
];
function lint(subject: string) {
	return spawnSync("bun", ["x", "--no-install", "commitlint"], {
		cwd: root,
		input: `${subject}\n`,
	}).status;
}
test("commit policy accepts approved scopes and rejects missing or unknown scopes", () => {
	for (const scope of scopes) {
		expect(lint(`chore(${scope}): verify the policy`), scope).toBe(0);
	}
	for (const subject of [
		"chore: missing scope",
		"chore(unknown): invalid scope",
	]) {
		expect(lint(subject), subject).toBe(1);
	}
});
test("commit policy is declarative JSON with the same scopes", () => {
	const config = JSON.parse(
		readFileSync(resolve(root, ".commitlintrc.json"), "utf8"),
	);
	expect(config.extends).toEqual(["@commitlint/config-conventional"]);
	expect(config.rules["scope-empty"]).toEqual([2, "never"]);
	expect(config.rules["scope-enum"]).toEqual([2, "always", scopes]);
	expect(existsSync(resolve(root, "commitlint.config.cjs"))).toBe(false);
});

test("Renovate uses the approved dependency scope", () => {
	const config = JSON.parse(
		readFileSync(resolve(root, "renovate.json"), "utf8"),
	);
	expect(config.semanticCommits).toBe("enabled");
	expect(config.semanticCommitScope).toBe("deps");
	expect(
		lint(`chore(${config.semanticCommitScope}): update dependencies`),
	).toBe(0);
});
