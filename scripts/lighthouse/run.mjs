import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import policy from "./policy.cjs";
import { assertPortsAvailable } from "./server-ports.mjs";

const { root, formFactors, sitePolicy } = policy;
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
const config = resolve(root, "scripts/lighthouse/lighthouserc.cjs");
const chromePath = process.env.CHROME_PATH ?? chromium.executablePath();
if (!existsSync(chromePath)) {
	throw new Error(
		"Lighthouse browser missing. Run bun run lighthouse:install first.",
	);
}

function run(command, args, cwd, env = process.env) {
	const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
	if (result.error) throw result.error;
	return result.status ?? 1;
}

// Clear the whole site's previous evidence, including build/startup failures.
rmSync(resolve(root, ".lighthouseci", site), { recursive: true, force: true });
await assertPortsAvailable([port, ...additionalPorts]);

if (!flags.includes("--prebuilt")) {
	const status = run("bun", ["--no-env-file", "run", build], appRoot);
	if (status !== 0) process.exit(status);
}

let failed = false;
for (const formFactor of formFactors) {
	console.log(`\nLighthouse: ${site} / ${formFactor}`);
	const cwd = resolve(root, ".lighthouseci", site, formFactor);
	mkdirSync(cwd, { recursive: true });
	const env = {
		...process.env,
		CHROME_PATH: chromePath,
		LHCI_SITE: site,
		LHCI_FORM_FACTOR: formFactor,
	};
	const lhci = (command) =>
		run("node", [cli, command, `--config=${config}`], cwd, env);
	if (lhci("collect") !== 0) {
		failed = true;
		continue;
	}
	// Upload locally even when assertions fail; CI retains the diagnostic reports.
	if (!flags.includes("--collect-only") && lhci("assert") !== 0) failed = true;
	if (lhci("upload") !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
