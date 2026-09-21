import { assertSafeProductionBuildEnvironment } from "@/lib/build-environment";

assertSafeProductionBuildEnvironment(process.env);

const build = Bun.spawn(["bunx", "vite", "build"], {
	env: process.env,
	stderr: "inherit",
	stdout: "inherit",
});
const exitCode = await build.exited;
if (exitCode !== 0) {
	throw new Error(`Vite build exited with code ${exitCode}.`);
}
