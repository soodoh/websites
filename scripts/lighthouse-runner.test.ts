import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { lighthouseConfig, root } from "./lighthouse/policy";
import {
	type LighthouseCommand,
	verifyLighthouse,
} from "./lighthouse/verification";

let scratch: string;
beforeEach(() => {
	scratch = mkdtempSync(join(tmpdir(), "lighthouse verification "));
	writeFileSync(join(scratch, "browser"), "unused fixture browser");
	vi.spyOn(console, "log").mockImplementation(() => {});
	vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
	rmSync(scratch, { recursive: true, force: true });
});

function config(cwd: string): ReturnType<typeof lighthouseConfig> {
	return JSON.parse(readFileSync(join(cwd, "lighthouserc.json"), "utf8"));
}

function writeEvidence({ cwd }: LighthouseCommand) {
	const { ci } = config(cwd);
	mkdirSync(join(cwd, "reports"), { recursive: true });
	writeFileSync(
		join(cwd, "reports/manifest.json"),
		JSON.stringify(
			Array.from(
				{ length: ci.collect.numberOfRuns * ci.collect.url.length },
				() => ({ url: ci.collect.url[0] }),
			),
		),
	);
	if (ci.assert) {
		mkdirSync(join(cwd, ".lighthouseci"), { recursive: true });
		writeFileSync(
			join(cwd, ".lighthouseci/assertion-results.json"),
			JSON.stringify([{ passed: true }]),
		);
	}
}

function fixture(site = "paul") {
	const output = join(scratch, site);
	mkdirSync(output);
	writeFileSync(join(output, "stale.json"), "previous run");
	const environment = { ...process.env, CHROME_PATH: join(scratch, "browser") };
	const assertPortAvailable = vi.fn(async () => {});
	const run = vi.fn((command: LighthouseCommand) => {
		if (command.command === "node") writeEvidence(command);
		return 0;
	});
	return {
		output,
		run,
		environment,
		assertPortAvailable,
		verify: (options = { prebuilt: true, collectOnly: false }) =>
			verifyLighthouse(site, options, {
				directory: scratch,
				environment,
				run,
				assertPortAvailable,
			}),
	};
}

test("runs both profiles using generated JSON and removes only the site's stale evidence", async () => {
	const runner = fixture();
	mkdirSync(join(scratch, "other-site"));
	await expect(runner.verify()).resolves.toBe(0);
	expect(existsSync(join(runner.output, "stale.json"))).toBe(false);
	expect(existsSync(join(scratch, "other-site"))).toBe(true);
	expect(
		runner.run.mock.calls.map(([command]) => basename(command.cwd)),
	).toEqual(["mobile", "desktop"]);
	for (const [command] of runner.run.mock.calls) {
		expect(command.command).toBe("node");
		expect(command.args).toEqual([
			expect.stringContaining("@lhci/cli/src/cli.js"),
			"autorun",
			`--config=${join(command.cwd, "lighthouserc.json")}`,
			"--failOnUploadFailure",
		]);
		expect(command.env.CHROME_PATH).toBe(runner.environment.CHROME_PATH);
		expect(config(command.cwd)).toEqual(
			lighthouseConfig("paul", basename(command.cwd)),
		);
	}
});

test("builds once before both profiles unless prebuilt", async () => {
	const runner = fixture();
	await expect(
		runner.verify({ prebuilt: false, collectOnly: false }),
	).resolves.toBe(0);
	expect(runner.run.mock.calls.map(([command]) => command.command)).toEqual([
		"bun",
		"node",
		"node",
	]);
	expect(runner.run.mock.calls[0]?.[0]).toEqual({
		command: "bun",
		args: ["--no-env-file", "run", "build"],
		cwd: resolve(root, "apps/paul"),
		env: runner.environment,
	});
});

test("a failed build returns its status, clears stale evidence, and skips collection", async () => {
	const runner = fixture();
	runner.run.mockReturnValue(23);
	await expect(
		runner.verify({ prebuilt: false, collectOnly: false }),
	).resolves.toBe(23);
	expect(runner.run).toHaveBeenCalledTimes(1);
	expect(existsSync(runner.output)).toBe(false);
});

test.each(["mobile", "desktop"])(
	"a nonzero %s profile fails verification without skipping either profile",
	async (profile) => {
		const runner = fixture();
		runner.run.mockImplementation((command) => {
			writeEvidence(command);
			return basename(command.cwd) === profile ? 23 : 0;
		});
		await expect(runner.verify()).resolves.toBe(1);
		expect(runner.run).toHaveBeenCalledTimes(2);
	},
);

test.each([undefined, "not json", "{}", "[]", '[{"url":"/"}]'])(
	"rejects absent, malformed, or incomplete report manifests: %s",
	async (manifest) => {
		const runner = fixture();
		runner.run.mockImplementation((command) => {
			writeEvidence(command);
			if (basename(command.cwd) === "mobile") {
				const path = join(command.cwd, "reports/manifest.json");
				if (manifest === undefined) rmSync(path);
				else writeFileSync(path, manifest);
			}
			return 0;
		});
		await expect(runner.verify()).resolves.toBe(1);
		expect(runner.run).toHaveBeenCalledTimes(2);
		expect(console.error).toHaveBeenCalledWith(
			"Incomplete Lighthouse evidence for paul/mobile:",
			expect.any(Error),
		);
	},
);

test.each([
	undefined,
	"not json",
	"{}",
	"[]",
	'[{"passed":false}]',
	'[{"passed":true},{}]',
])("rejects missing or nonpassing assertion evidence: %s", async (results) => {
	const runner = fixture();
	runner.run.mockImplementation((command) => {
		writeEvidence(command);
		if (basename(command.cwd) === "mobile") {
			const path = join(command.cwd, ".lighthouseci/assertion-results.json");
			if (results === undefined) rmSync(path);
			else writeFileSync(path, results);
		}
		return 0;
	});
	await expect(runner.verify()).resolves.toBe(1);
	expect(runner.run).toHaveBeenCalledTimes(2);
});

test("collect-only omits assertion configuration and accepts complete reports without assertions", async () => {
	const runner = fixture();
	await expect(
		runner.verify({ prebuilt: true, collectOnly: true }),
	).resolves.toBe(0);
	for (const [command] of runner.run.mock.calls) {
		expect(config(command.cwd).ci.assert).toBeUndefined();
		expect(
			existsSync(join(command.cwd, ".lighthouseci/assertion-results.json")),
		).toBe(false);
	}
});

test("collect-only still requires complete report evidence", async () => {
	const runner = fixture();
	runner.run.mockReturnValue(0);
	await expect(
		runner.verify({ prebuilt: true, collectOnly: true }),
	).resolves.toBe(1);
});

test("preflights every required port, including Carolyn compute", async () => {
	const runner = fixture("carolyn");
	await expect(runner.verify()).resolves.toBe(0);
	expect(runner.assertPortAvailable.mock.calls).toEqual([
		[4100, "Lighthouse requires free port"],
		[3000, "Lighthouse requires free port"],
	]);
});

test("an occupied port clears stale evidence and prevents any process execution", async () => {
	const runner = fixture();
	runner.assertPortAvailable.mockRejectedValue(new Error("occupied"));
	await expect(runner.verify()).rejects.toThrow("occupied");
	expect(runner.run).not.toHaveBeenCalled();
	expect(existsSync(runner.output)).toBe(false);
});

test("a missing browser fails before altering evidence or probing ports", async () => {
	const runner = fixture();
	runner.environment.CHROME_PATH = join(scratch, "missing");
	await expect(runner.verify()).rejects.toThrow("Lighthouse browser missing");
	expect(runner.assertPortAvailable).not.toHaveBeenCalled();
	expect(runner.run).not.toHaveBeenCalled();
	expect(existsSync(join(runner.output, "stale.json"))).toBe(true);
});

test("a process launch error remains fatal", async () => {
	const runner = fixture();
	runner.run.mockImplementation(() => {
		throw new Error("spawn failed");
	});
	await expect(runner.verify()).rejects.toThrow("spawn failed");
});

test.each([
	{ args: [], error: "Usage: bun run lighthouse" },
	{ args: ["paul", "--unknown"], error: "Usage: bun run lighthouse" },
	{ args: ["unknown"], error: "Unknown Lighthouse site" },
])("the actual CLI rejects invalid input: $args", ({ args, error }) => {
	const result = spawnSync(
		"bun",
		[resolve(root, "scripts/lighthouse/run.ts"), ...args],
		{
			cwd: scratch,
			encoding: "utf8",
		},
	);
	expect(result.status).not.toBe(0);
	expect(result.stderr).toContain(error);
});
