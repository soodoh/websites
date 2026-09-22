import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
for (const scope of scopes) {
	test(`commit policy accepts required scope ${scope}`, () => {
		expect(lint(`chore(${scope}): verify the policy`)).toBe(0);
	});
}
for (const subject of [
	"chore: missing scope",
	"chore(unknown): invalid scope",
]) {
	test(`commit policy rejects ${subject}`, () => {
		expect(lint(subject)).toBe(1);
	});
}
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

test("Renovate enables protected native automerge", () => {
	const config = JSON.parse(
		readFileSync(resolve(root, "renovate.json"), "utf8"),
	);
	expect(config).toMatchObject({
		automerge: true,
		automergeType: "pr",
		automergeStrategy: "squash",
		platformAutomerge: true,
		rebaseWhen: "behind-base-branch",
	});
});
