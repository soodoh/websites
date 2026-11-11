import { verifyLighthouse } from "./verification.ts";

const [site, ...flags] = process.argv.slice(2);
if (
	!site ||
	flags.some((flag) => !["--prebuilt", "--collect-only"].includes(flag))
) {
	throw new Error(
		"Usage: bun run lighthouse <site> [--prebuilt] [--collect-only]",
	);
}

process.exitCode = await verifyLighthouse(site, {
	prebuilt: flags.includes("--prebuilt"),
	collectOnly: flags.includes("--collect-only"),
});
