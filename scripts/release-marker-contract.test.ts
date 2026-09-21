import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
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
		const server = Bun.serve({
			port: 0,
			fetch: () =>
				Response.json(
					{ commit, runAttempt: "2", runId: "1234" },
					{ headers: { "Cache-Control": "no-cache, no-store" } },
				),
		});
		try {
			const verification = Bun.spawn(
				[
					"bash",
					"scripts/deploy/verify-release.sh",
					`http://127.0.0.1:${server.port}`,
					commit,
					"1234",
					"2",
				],
				{ cwd: root, stderr: "pipe", stdout: "pipe" },
			);
			expect(await verification.exited).toBe(0);
			expect(await new Response(verification.stdout).text()).toContain(
				`Verified deployed commit ${commit}`,
			);
		} finally {
			server.stop(true);
		}
	});
});
