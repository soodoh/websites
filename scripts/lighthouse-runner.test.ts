import { spawnSync } from "node:child_process";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const bun = spawnSync("bash", ["-c", "command -v bun"], {
	encoding: "utf8",
}).stdout.trim();
const stages = ["healthcheck", "collect", "assert", "upload"];

// Exercise the actual TS entry point, generated JSON, and pinned LHCI autorun.
// Only builds and LHCI's child commands are replaced; no browser is launched.
function withRunner(verify: (runner: ReturnType<typeof fixture>) => void) {
	const scratch = mkdtempSync(join(tmpdir(), "lighthouse runner "));
	try {
		verify(fixture(scratch));
	} finally {
		rmSync(scratch, { recursive: true, force: true });
	}
}
function fixture(scratch: string) {
	const bin = join(scratch, "bin");
	const log = join(scratch, "commands.log");
	const output = join(scratch, ".lighthouseci/paul");
	mkdirSync(bin);
	mkdirSync(join(scratch, "scripts/lighthouse"), { recursive: true });
	mkdirSync(join(scratch, "apps/paul"), { recursive: true });
	mkdirSync(output, { recursive: true });
	writeFileSync(join(output, "stale.json"), "previous run");
	writeFileSync(join(scratch, "browser"), "unused fixture browser");
	writeFileSync(join(scratch, "package.json"), '{"private":true}');
	symlinkSync(join(root, "node_modules"), join(scratch, "node_modules"), "dir");
	copyFileSync(
		join(root, "scripts/lighthouse/run.ts"),
		join(scratch, "scripts/lighthouse/run.ts"),
	);
	copyFileSync(
		join(root, "apps/paul/lighthouse.json"),
		join(scratch, "apps/paul/lighthouse.json"),
	);
	// Port zero isolates probes from services on the developer's machine. Policy
	// contracts separately test the real, fixed site ports and generated URLs.
	writeFileSync(
		join(scratch, "scripts/lighthouse/policy.ts"),
		readFileSync(join(root, "scripts/lighthouse/policy.ts"), "utf8").replace(
			/port: \d+/g,
			"port: 0",
		),
	);
	const preload = join(scratch, "preload.cjs");
	writeFileSync(
		preload,
		`
const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const profile = path.basename(process.cwd());
const config = JSON.parse(fs.readFileSync(process.argv.find(arg => arg.startsWith('--config=')).slice('--config='.length), 'utf8'));
childProcess.spawnSync = (_command, args) => {
  const stage = args[1];
  fs.appendFileSync(process.env.COMMAND_LOG, profile + ':' + stage + '\\n');
  const fault = profile === process.env.FAULT_PROFILE && stage === process.env.FAULT_STAGE;
  if (fault && process.env.FAULT_KIND === 'signal') return {status: null, signal: 'SIGKILL'};
  if (stage === 'assert') {
    fs.mkdirSync('.lighthouseci', {recursive: true});
    const results = fault || config.ci.assert.includePassedAssertions ? [{passed: !fault, level: 'error'}] : [];
    fs.writeFileSync('.lighthouseci/assertion-results.json', JSON.stringify(results));
  }
  if (fault) return {status: 23};
  if (stage === 'upload') {
    fs.mkdirSync('reports', {recursive: true});
    let count = config.ci.collect.numberOfRuns * config.ci.collect.url.length;
    if (profile === process.env.FAULT_PROFILE && process.env.FAULT_STAGE === 'collect') count--;
    fs.writeFileSync('reports/manifest.json', JSON.stringify(Array.from({length: count}, () => ({url: config.ci.collect.url[0]}))));
  }
  return {status: 0};
};
`,
	);
	writeFileSync(
		join(bin, "node"),
		`#!/usr/bin/env bash\nexec "${process.execPath}" --require "${preload}" "$@"\n`,
		{ mode: 0o755 },
	);
	writeFileSync(
		join(bin, "bun"),
		'#!/usr/bin/env bash\nprintf "build\\n" >> "$COMMAND_LOG"\nexit "$BUILD_STATUS"\n',
		{ mode: 0o755 },
	);
	return {
		output,
		run(flags = ["--prebuilt"], env: Record<string, string> = {}) {
			return spawnSync(
				bun,
				[join(scratch, "scripts/lighthouse/run.ts"), "paul", ...flags],
				{
					cwd: scratch,
					encoding: "utf8",
					env: {
						...process.env,
						PATH: `${bin}:${process.env.PATH}`,
						CHROME_PATH: join(scratch, "browser"),
						COMMAND_LOG: log,
						BUILD_STATUS: "0",
						...env,
					},
				},
			);
		},
		commands: () =>
			existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : [],
		config: (profile: string) =>
			JSON.parse(
				readFileSync(join(output, profile, "lighthouserc.json"), "utf8"),
			),
	};
}

test("runs native autorun for both profiles from generated JSON and clears stale evidence", () => {
	withRunner((runner) => {
		const result = runner.run();
		expect(result.status, result.stderr).toBe(0);
		expect(runner.commands()).toEqual([
			...stages.map((stage) => `mobile:${stage}`),
			...stages.map((stage) => `desktop:${stage}`),
		]);
		expect(existsSync(join(runner.output, "stale.json"))).toBe(false);
		for (const profile of ["mobile", "desktop"]) {
			const { ci } = runner.config(profile);
			expect(ci.collect.numberOfRuns).toBe(3);
			expect(ci.assert.includePassedAssertions).toBe(true);
			expect(ci.assert.assertions["categories:performance"][1]).toEqual({
				minScore: 0.9,
				aggregationMethod: "median",
			});
			expect(ci.upload).toEqual({ target: "filesystem", outputDir: "reports" });
		}
	});
});

test.each(stages)(
	"%s failure remains fatal without suppressing the desktop profile",
	(stage) => {
		withRunner((runner) => {
			const result = runner.run(["--prebuilt"], {
				FAULT_PROFILE: "mobile",
				FAULT_STAGE: stage,
			});
			expect(result.status).toBe(1);
			expect(runner.commands()).toContain("desktop:upload");
			if (stage === "assert") {
				expect(runner.commands()).toContain("mobile:upload");
				expect(
					existsSync(join(runner.output, "mobile/reports/manifest.json")),
				).toBe(true);
			}
			if (stage === "collect")
				expect(runner.commands()).not.toContain("mobile:upload");
		});
	},
);

test.each(["collect", "assert", "upload"])(
	"does not accept incomplete evidence when LHCI swallows a signaled %s child",
	(stage) => {
		withRunner((runner) => {
			const result = runner.run(["--prebuilt"], {
				FAULT_PROFILE: "mobile",
				FAULT_STAGE: stage,
				FAULT_KIND: "signal",
			});
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Incomplete Lighthouse evidence");
			expect(runner.commands()).toContain("desktop:upload");
		});
	},
);

test("collect-only omits assertions but still exports reports", () => {
	withRunner((runner) => {
		const result = runner.run(["--prebuilt", "--collect-only"], {
			FAULT_PROFILE: "mobile",
			FAULT_STAGE: "assert",
		});
		expect(result.status, result.stderr).toBe(0);
		expect(runner.commands()).not.toContain("mobile:assert");
		expect(runner.commands()).not.toContain("desktop:assert");
		expect(runner.config("mobile").ci.assert).toBeUndefined();
		expect(runner.commands()).toContain("desktop:upload");
	});
});

test("builds once unless prebuilt and propagates build failures before collection", () => {
	withRunner((runner) => {
		const result = runner.run([]);
		expect(result.status, result.stderr).toBe(0);
		expect(runner.commands()[0]).toBe("build");
		expect(
			runner.commands().filter((command) => command === "build"),
		).toHaveLength(1);
	});
	withRunner((runner) => {
		expect(runner.run([], { BUILD_STATUS: "23" }).status).toBe(23);
		expect(runner.commands()).toEqual(["build"]);
		expect(existsSync(join(runner.output, "stale.json"))).toBe(false);
	});
});
