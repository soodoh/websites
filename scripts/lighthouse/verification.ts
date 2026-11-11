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

export type LighthouseCommand = {
	command: string;
	args: string[];
	cwd: string;
	env: NodeJS.ProcessEnv;
};

type Execution = {
	directory?: string;
	environment?: NodeJS.ProcessEnv;
	run?: (command: LighthouseCommand) => number;
	assertPortAvailable?: typeof assertTcpPortAvailable;
};

function runCommand({ command, args, cwd, env }: LighthouseCommand): number {
	const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
	if (result.error) throw result.error;
	return result.status ?? 1;
}

/** Owns local verification; native LHCI retains collect/assert/upload sequencing. */
export async function verifyLighthouse(
	site: string,
	options: { prebuilt?: boolean; collectOnly?: boolean } = {},
	{
		directory = resolve(root, ".lighthouseci"),
		environment = process.env,
		run = runCommand,
		assertPortAvailable = assertTcpPortAvailable,
	}: Execution = {},
): Promise<number> {
	const { appRoot, build, port, additionalPorts = [] } = sitePolicy(site);
	const require = createRequire(import.meta.url);
	const cli = require.resolve("@lhci/cli/src/cli.js");
	const chromePath = environment.CHROME_PATH ?? chromium.executablePath();
	if (!existsSync(chromePath)) {
		throw new Error(
			"Lighthouse browser missing. Run bun run lighthouse:install first.",
		);
	}

	const siteDirectory = resolve(directory, site);
	// Clear stale evidence even when preflight or the build subsequently fails.
	rmSync(siteDirectory, { recursive: true, force: true });
	for (const requiredPort of [port, ...additionalPorts]) {
		await assertPortAvailable(requiredPort, "Lighthouse requires free port");
	}

	if (!options.prebuilt) {
		const status = run({
			command: "bun",
			args: ["--no-env-file", "run", build],
			cwd: appRoot,
			env: environment,
		});
		if (status !== 0) return status;
	}

	let failed = false;
	for (const formFactor of formFactors) {
		console.log(`\nLighthouse: ${site} / ${formFactor}`);
		const cwd = resolve(siteDirectory, formFactor);
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
						...(!options.collectOnly ? { assert: assertions } : {}),
						upload,
					},
				},
				null,
				2,
			)}\n`,
		);
		// Upload failures are warnings in LHCI unless explicitly made fatal.
		const status = run({
			command: "node",
			args: [cli, "autorun", `--config=${config}`, "--failOnUploadFailure"],
			cwd,
			env: { ...environment, CHROME_PATH: chromePath },
		});
		if (status !== 0) {
			failed = true;
			continue;
		}
		try {
			// LHCI 0.16 can report success when a child is killed by a signal.
			const manifest: unknown = JSON.parse(
				readFileSync(resolve(cwd, "reports/manifest.json"), "utf8"),
			);
			assert(
				Array.isArray(manifest) &&
					manifest.length === collect.numberOfRuns * collect.url.length,
				"Lighthouse did not export every required run",
			);
			if (!options.collectOnly) {
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
	return failed ? 1 : 0;
}
