import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("shared production release marker", () => {
	test("uses one marker path and exact-commit verifier in every workflow", () => {
		for (const site of ["paul", "diloreto"]) {
			const workflow = read(`.github/workflows/deploy-${site}.yml`);
			expect(workflow).toContain(`apps/${site}/dist/client/__deployment.json`);
			expect(workflow).toContain("runId: $runId, runAttempt: $runAttempt");
			expect(workflow).not.toContain("release.json");
		}
		for (const site of ["carolyn", "sarabeth"]) {
			const workflow = read(`.github/workflows/deploy-${site}.yml`);
			expect(workflow).toContain("scripts/deploy/verify-release.sh");
			expect(workflow).toContain(
				'"$GITHUB_SHA" "$GITHUB_RUN_ID" "$GITHUB_RUN_ATTEMPT"',
			);
		}
		expect(read("scripts/deploy/amplify-release.sh")).toContain(
			"RELEASE_RUN_ID: $runId, RELEASE_RUN_ATTEMPT: $runAttempt",
		);
	});

	test("emits and serves the marker from every hosting profile", () => {
		for (const path of [
			"apps/paul/scripts/hosting-smoke.mjs",
			"apps/diloreto/scripts/hosting-smoke.mjs",
			"apps/sarabeth/scripts/prepare-amplify-bundle.ts",
			"apps/carolyn/src/lib/amplify-artifact.ts",
		]) {
			expect(read(path)).toContain("__deployment.json");
		}
		expect(read("scripts/deploy/verify-release.sh")).toContain(
			".commit == $commit",
		);
	});

	test("verifies the marker payload and no-store response", async () => {
		const commit = "a".repeat(40);
		const server = createServer((_request, response) => {
			response.writeHead(200, {
				"Cache-Control": "no-cache, no-store",
				"Content-Type": "application/json",
			});
			response.end(JSON.stringify({ commit, runAttempt: "2", runId: "1234" }));
		});
		await new Promise<void>((resolve, reject) => {
			server.once("error", reject);
			server.listen(0, "127.0.0.1", resolve);
		});
		try {
			const address = server.address();
			if (!address || typeof address === "string") {
				throw new Error("Node did not assign a release-marker test port.");
			}
			const { stdout } = await execFileAsync(
				"bash",
				[
					"scripts/deploy/verify-release.sh",
					`http://127.0.0.1:${address.port}`,
					commit,
					"1234",
					"2",
				],
				{ cwd: root },
			);
			expect(stdout).toContain(`Verified deployed commit ${commit}`);
		} finally {
			await new Promise<void>((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
			});
		}
	});
});
