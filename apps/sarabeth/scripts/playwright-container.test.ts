import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const entrypoint = fileURLToPath(
	new URL("./playwright-container.sh", import.meta.url),
);
const steps = [
	"run build:amplify:fixture",
	"run prepare:amplify",
	"run validate:amplify",
	"run build:playwright:unchecked",
	"run test:ci:prebuilt",
	"run test:static:prebuilt",
];

function runContainer(failStep = "") {
	const scratch = mkdtempSync(join(tmpdir(), "sarabeth-container-"));
	try {
		const log = join(scratch, "commands.log");
		writeFileSync(
			join(scratch, "bun"),
			`#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$COMMAND_LOG"
if [[ "$*" == "$FAIL_STEP" ]]; then exit 23; fi
`,
			{ mode: 0o755 },
		);
		const result = spawnSync(
			"bash",
			[entrypoint, "bun", "run", "test:ci:prebuilt"],
			{
				cwd: scratch,
				encoding: "utf8",
				env: {
					PATH: `${scratch}:${process.env.PATH}`,
					COMMAND_LOG: log,
					FAIL_STEP: failStep,
				},
			},
		);
		return {
			status: result.status,
			commands: readFileSync(log, "utf8").trim().split("\n"),
		};
	} finally {
		rmSync(scratch, { recursive: true, force: true });
	}
}

test("the CI browser container gates success on both SSR and packaged-static tests", () => {
	expect(runContainer()).toEqual({ status: 0, commands: steps });
});

test.each(steps)(
	"propagates a failure in %s without running later steps",
	(step) => {
		expect(runContainer(step)).toEqual({
			status: 23,
			commands: steps.slice(0, steps.indexOf(step) + 1),
		});
	},
);
