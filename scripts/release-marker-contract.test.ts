import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const commit = "a".repeat(40);
const validPayload = { commit, runAttempt: "2", runId: "1234" };

async function verifyLocalMarker(
	payload: unknown,
	cacheControl = "no-cache, no-store",
) {
	const server = createServer((_request, response) => {
		response.writeHead(200, {
			"Cache-Control": cacheControl,
			"Content-Type": "application/json",
		});
		response.end(JSON.stringify(payload));
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
		return await execFileAsync(
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
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => (error ? reject(error) : resolve()));
		});
	}
}

test("accepts the exact release identity with a no-store response", async () => {
	const { stdout } = await verifyLocalMarker(validPayload);
	expect(stdout).toContain(`Verified deployed commit ${commit}`);
});

test.each([
	["wrong commit", { ...validPayload, commit: "b".repeat(40) }, "no-store"],
	["wrong run ID", { ...validPayload, runId: "5678" }, "no-store"],
	["missing run identity", { commit }, "no-store"],
	["missing no-store", validPayload, "no-cache"],
])("rejects %s", async (_name, payload, cacheControl) => {
	await expect(verifyLocalMarker(payload, cacheControl)).rejects.toThrow();
});
