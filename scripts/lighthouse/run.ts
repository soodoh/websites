import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { assertTcpPortAvailable } from "@websites/static-site/ports";
import { chromium } from "playwright-core";
import { formFactors, lighthouseConfig, root, sitePolicy } from "./policy.ts";

const [site, ...flags] = process.argv.slice(2);
if (
	!site ||
	flags.some((flag) => !["--prebuilt", "--collect-only"].includes(flag))
) {
	throw new Error(
		"Usage: bun run lighthouse <site> [--prebuilt] [--collect-only]",
	);
}
const { appRoot, build, port, additionalPorts = [] } = sitePolicy(site);
const require = createRequire(import.meta.url);
const cli = require.resolve("@lhci/cli/src/cli.js");
const chromePath = process.env.CHROME_PATH ?? chromium.executablePath();
if (!existsSync(chromePath)) {
	throw new Error(
		"Lighthouse browser missing. Run bun run lighthouse:install first.",
	);
}

function run(
	command: string,
	args: string[],
	cwd: string,
	env: NodeJS.ProcessEnv = process.env,
): number {
	const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
	if (result.error) throw result.error;
	return result.status ?? 1;
}

// Clear the whole site's previous evidence, including build/startup failures.
rmSync(resolve(root, ".lighthouseci", site), { recursive: true, force: true });
for (const requiredPort of [port, ...additionalPorts]) {
	await assertTcpPortAvailable(requiredPort, "Lighthouse requires free port");
}

if (!flags.includes("--prebuilt")) {
	const status = run("bun", ["--no-env-file", "run", build], appRoot);
	if (status !== 0) process.exit(status);
}

let failed = false;
for (const formFactor of formFactors) {
	console.log(`\nLighthouse: ${site} / ${formFactor}`);
	const cwd = resolve(root, ".lighthouseci", site, formFactor);
	mkdirSync(cwd, { recursive: true });
	const config = resolve(cwd, "lighthouserc.json");
	const {
		collect,
		assert: assertions,
		upload,
	} = lighthouseConfig(site, formFactor).ci;
	writeFileSync(
		config,
		`${JSON.stringify(
			{
				ci: {
					collect,
					...(!flags.includes("--collect-only") ? { assert: assertions } : {}),
					upload,
				},
			},
			null,
			2,
		)}\n`,
	);
	// LHCI owns sequencing and exports reports even when assertions fail.
	// Its upload failures are warnings unless explicitly made fatal.
	const status = run(
		"node",
		[cli, "autorun", `--config=${config}`, "--failOnUploadFailure"],
		cwd,
		{
			...process.env,
			CHROME_PATH: chromePath,
		},
	);
	if (status !== 0) {
		failed = true;
		continue;
	}
	try {
		// LHCI 0.16 autorun can report success when a child is killed by a signal.
		// Require fresh, complete evidence rather than trusting that status alone.
		const manifest: unknown = JSON.parse(
			readFileSync(resolve(cwd, "reports/manifest.json"), "utf8"),
		);
		assert(
			Array.isArray(manifest) &&
				manifest.length === collect.numberOfRuns * collect.url.length,
			"Lighthouse did not export every required run",
		);
		if (!flags.includes("--collect-only")) {
			const results: unknown = JSON.parse(
				readFileSync(
					resolve(cwd, ".lighthouseci/assertion-results.json"),
					"utf8",
				),
			);
			assert(
				Array.isArray(results) &&
					results.length > 0 &&
					results.every((result) => result?.passed === true),
				"Lighthouse did not produce passing assertions",
			);
		}
	} catch (error) {
		console.error(
			`Incomplete Lighthouse evidence for ${site}/${formFactor}:`,
			error,
		);
		failed = true;
	}
}
process.exitCode = failed ? 1 : 0;
