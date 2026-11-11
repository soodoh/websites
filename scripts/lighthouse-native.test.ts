import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { verifyLighthouse } from "./lighthouse/verification";

let scratch: string;
beforeEach(() => {
	scratch = mkdtempSync(join(tmpdir(), "lighthouse native "));
	vi.spyOn(console, "log").mockImplementation(() => {});
	vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
	rmSync(scratch, { recursive: true, force: true });
});

// Retain the pinned LHCI behavior checks. Only its child commands are replaced;
// verification, generated JSON, native autorun, and report files are real.
async function nativeRun({
	stage = "",
	signal = false,
	collectOnly = false,
} = {}) {
	const preload = join(scratch, "preload.cjs");
	const log = join(scratch, "commands.log");
	const browser = join(scratch, "browser");
	writeFileSync(browser, "unused fixture browser");
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
  const fault = profile === 'mobile' && stage === process.env.FAULT_STAGE;
  if (fault && process.env.FAULT_SIGNAL === 'true') return {status: null, signal: 'SIGKILL'};
  if (stage === 'assert') {
    fs.mkdirSync('.lighthouseci', {recursive: true});
    const results = fault || config.ci.assert.includePassedAssertions ? [{passed: !fault, level: 'error'}] : [];
    fs.writeFileSync('.lighthouseci/assertion-results.json', JSON.stringify(results));
  }
  if (fault) return {status: 23};
  if (stage === 'upload') {
    fs.mkdirSync('reports', {recursive: true});
    let count = config.ci.collect.numberOfRuns * config.ci.collect.url.length;
    // A killed collect child cannot supply every required report to upload.
    if (profile === 'mobile' && process.env.FAULT_STAGE === 'collect') count--;
    fs.writeFileSync('reports/manifest.json', JSON.stringify(Array.from({length: count}, () => ({url: config.ci.collect.url[0]}))));
  }
  return {status: 0};
};
`,
	);
	const status = await verifyLighthouse(
		"paul",
		{ prebuilt: true, collectOnly },
		{
			directory: scratch,
			environment: {
				...process.env,
				CHROME_PATH: browser,
				COMMAND_LOG: log,
				FAULT_STAGE: stage,
				FAULT_SIGNAL: String(signal),
			},
			assertPortAvailable: async () => {},
			run: ({ command, args, cwd, env }) => {
				expect(command).toBe("node");
				const result = spawnSync(
					process.execPath,
					["--require", preload, ...args],
					{ cwd, env, encoding: "utf8" },
				);
				if (result.error) throw result.error;
				return result.status ?? 1;
			},
		},
	);
	return {
		status,
		commands: readFileSync(log, "utf8").trim().split("\n"),
		reportsExist: existsSync(
			join(scratch, "paul/mobile/reports/manifest.json"),
		),
	};
}

test("native autorun collects, asserts, and exports both profiles from generated JSON", async () => {
	const result = await nativeRun();
	expect(result.status).toBe(0);
	expect(result.commands).toEqual(
		["mobile", "desktop"].flatMap((profile) =>
			["healthcheck", "collect", "assert", "upload"].map(
				(stage) => `${profile}:${stage}`,
			),
		),
	);
	expect(result.reportsExist).toBe(true);
});

test("native assertion failure still exports reports and runs desktop", async () => {
	const result = await nativeRun({ stage: "assert" });
	expect(result.status).toBe(1);
	expect(result.commands).toContain("desktop:upload");
	expect(result.commands).toContain("mobile:upload");
	expect(result.reportsExist).toBe(true);
});

test.each(["collect", "assert", "upload"])(
	"verification rejects missing evidence when native LHCI swallows a signaled %s child",
	async (stage) => {
		const result = await nativeRun({ stage, signal: true });
		expect(result.status).toBe(1);
		expect(result.commands).toContain("desktop:upload");
		expect(console.error).toHaveBeenCalledWith(
			"Incomplete Lighthouse evidence for paul/mobile:",
			expect.any(Error),
		);
	},
);

test("native collect-only skips assertions but still exports both profiles", async () => {
	const result = await nativeRun({ stage: "assert", collectOnly: true });
	expect(result.status).toBe(0);
	expect(result.commands).not.toContain("mobile:assert");
	expect(result.commands).not.toContain("desktop:assert");
	expect(result.commands).toContain("desktop:upload");
	expect(result.reportsExist).toBe(true);
});
