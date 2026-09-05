import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveReleaseCommit } from "@/scripts/release-commit";

const commit = "0123456789abcdef0123456789abcdef01234567";

test("explicit release commit works without Git metadata", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "release-commit-"));
	try {
		expect(await resolveReleaseCommit({ RELEASE_COMMIT: commit }, cwd)).toBe(
			commit,
		);
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
});

for (const value of [
	"",
	"local",
	`${commit}\n`,
	`${commit};echo bad`,
	commit.slice(1),
]) {
	test(`invalid explicit release commit fails instead of falling back: ${JSON.stringify(value)}`, async () => {
		await expect(
			resolveReleaseCommit({ RELEASE_COMMIT: value }),
		).rejects.toThrow(
			"Release commit must be exactly 40 hexadecimal characters.",
		);
	});
}

test("unset release commit retains Git HEAD fallback", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "release-commit-git-"));
	try {
		execFileSync("git", ["init", "--quiet", cwd]);
		execFileSync(
			"git",
			[
				"-c",
				"core.hooksPath=/dev/null",
				"-c",
				"user.name=Fixture",
				"-c",
				"user.email=fixture@example.invalid",
				"commit",
				"--quiet",
				"--no-gpg-sign",
				"--allow-empty",
				"-m",
				"fixture",
			],
			{ cwd },
		);
		const head = execFileSync("git", ["rev-parse", "HEAD"], {
			cwd,
			encoding: "utf8",
		}).trim();
		expect(await resolveReleaseCommit({}, cwd)).toBe(head);
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
});
