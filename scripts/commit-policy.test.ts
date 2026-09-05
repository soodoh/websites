import { expect, test } from "bun:test";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const scopes = ["carolyn", "paul", "diloreto", "sarabeth", "repo", "ci", "deps"];
function lint(subject: string) {
	return Bun.spawnSync([process.execPath, "x", "--no-install", "commitlint"], {
		cwd: root,
		stdin: Buffer.from(`${subject}\n`),
	}).exitCode;
}
for (const scope of scopes) {
	test(`commit policy accepts required scope ${scope}`, () => {
		expect(lint(`chore(${scope}): verify the policy`)).toBe(0);
	});
}
for (const subject of ["chore: missing scope", "chore(unknown): invalid scope"]) {
	test(`commit policy rejects ${subject}`, () => {
		expect(lint(subject)).toBe(1);
	});
}
test("Renovate uses the approved dependency scope", async () => {
	const config = await Bun.file(resolve(root, "renovate.json")).json();
	expect(config.semanticCommits).toBe("enabled");
	expect(config.semanticCommitScope).toBe("deps");
	expect(lint(`chore(${config.semanticCommitScope}): update dependencies`)).toBe(0);
});
