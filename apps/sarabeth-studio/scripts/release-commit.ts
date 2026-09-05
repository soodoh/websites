import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export async function resolveReleaseCommit(
	environment: Record<string, string | undefined> = process.env,
	cwd = process.cwd(),
): Promise<string> {
	// Gitless test containers receive provenance at runtime, never in image layers.
	const commit =
		environment.RELEASE_COMMIT !== undefined
			? environment.RELEASE_COMMIT
			: (await run("git", ["rev-parse", "HEAD"], { cwd })).stdout.trim();
	if (commit.length !== 40 || !/^[a-f0-9]{40}$/i.test(commit)) {
		throw new Error(
			"Release commit must be exactly 40 hexadecimal characters.",
		);
	}
	return commit;
}
