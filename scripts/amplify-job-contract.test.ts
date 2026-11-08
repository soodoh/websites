import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const commit = "a".repeat(40);

function waitForJob(status: string, selectedCommit = commit) {
	const scratch = mkdtempSync(join(tmpdir(), "websites-amplify-job-"));
	try {
		writeFileSync(
			join(scratch, "aws"),
			'#!/bin/sh\nprintf "%s\\n" "$MOCK_JOB"\n',
			{ mode: 0o755 },
		);
		writeFileSync(
			join(scratch, "sleep"),
			'#!/bin/sh\necho "Unexpected sleep" >&2\nexit 99\n',
			{ mode: 0o755 },
		);
		return spawnSync(
			"bash",
			[
				"scripts/deploy/wait-for-amplify-job.sh",
				"test-app",
				"release/main",
				"42",
				commit,
				"0",
			],
			{
				cwd: root,
				encoding: "utf8",
				env: {
					...process.env,
					PATH: `${scratch}:${process.env.PATH}`,
					MOCK_JOB: JSON.stringify({
						job: {
							summary: {
								status,
								commitId: selectedCommit,
								jobArn:
									"arn:aws:amplify:us-west-2:123456789012:apps/test-app/branches/release%2Fmain/jobs/0000000042",
							},
							steps: [
								{
									stepName: "BUILD",
									status: status === "FAILED" ? "FAILED" : status,
									logUrl: "https://example.invalid/log?signature=DO_NOT_PRINT",
									artifactsUrl:
										"https://example.invalid/artifact?signature=DO_NOT_PRINT",
								},
								{ stepName: "DEPLOY", status: "CANCELLED" },
							],
						},
					}),
				},
			},
		);
	} finally {
		rmSync(scratch, { recursive: true, force: true });
	}
}

test("accepts a successful Amplify job for the expected commit", () => {
	const result = waitForJob("SUCCEED");
	expect(result.status, result.stderr).toBe(0);
	expect(result.stdout).toContain("Amplify job 42 succeeded.");
});

test.each(["FAILED", "CANCELLED"])(
	"reports %s steps and a safe console link",
	(status) => {
		const result = waitForJob(status);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(`Amplify job 42 ended with ${status}.`);
		expect(result.stderr).toContain(`Amplify step BUILD: ${status}`);
		expect(result.stderr).toContain("Amplify step DEPLOY: CANCELLED");
		expect(result.stderr).toContain(
			"https://us-west-2.console.aws.amazon.com/amplify/apps/test-app/branches/release%2Fmain/deployments/42",
		);
		expect(result.stderr).not.toContain("DO_NOT_PRINT");
	},
);

test("reports diagnostics when a job times out without sleeping", () => {
	const result = waitForJob("RUNNING");
	expect(result.status).toBe(1);
	expect(result.stderr).toContain(
		"Timed out waiting for Amplify job 42; last status: RUNNING.",
	);
	expect(result.stderr).toContain("/deployments/42");
	expect(result.stderr).not.toContain("Unexpected sleep");
	expect(result.stderr).not.toContain("DO_NOT_PRINT");
});

test("rejects a job for a different commit even if it succeeded", () => {
	const result = waitForJob("SUCCEED", "b".repeat(40));
	expect(result.status).toBe(1);
	expect(result.stderr).toContain(`expected ${commit}`);
});
