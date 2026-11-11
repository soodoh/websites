import { execFile } from "node:child_process";
import { createServer, type Server } from "node:http";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { expect, test } from "vitest";
import { readAmplifyArtifactMode } from "@/lib/amplify-artifact";

const execFileAsync = promisify(execFile);
const appRoot = fileURLToPath(new URL("../..", import.meta.url));

async function listen(server: Server, port: number): Promise<number> {
	await new Promise<void>((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, "127.0.0.1", resolve);
	});
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("No TCP port assigned");
	return address.port;
}
async function close(server: Server) {
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
}

// A separate artifact project: this regression requires a previously built bundle.
test("an occupied compute port fails startup without opening the artifact port", async () => {
	const artifactMode = await readAmplifyArtifactMode(
		`${appRoot}/.amplify-hosting`,
	);
	const probe = createServer();
	const artifactPort = await listen(probe, 0);
	await close(probe);
	const unrelated = createServer((_request, response) =>
		response.end("UNRELATED-PORT-3000"),
	);
	await listen(unrelated, 3000);
	try {
		await expect(
			execFileAsync("bun", ["run", "scripts/serve-amplify-artifact.ts"], {
				cwd: appRoot,
				timeout: 5_000,
				env: {
					...process.env,
					ARTIFACT_PORT: String(artifactPort),
					CONTENTFUL_ACCESS_TOKEN: "occupied-port-contentful-token",
					CONTENTFUL_SPACE_ID: "occupied-port-space",
					EXPECTED_ARTIFACT_MODE: artifactMode,
					PLAYWRIGHT_TEST: "true",
					PROJECT_AUTH_SECRET: "playwright-secret",
				},
			}),
		).rejects.toMatchObject({
			code: 1,
			stderr: expect.stringContaining("compute port 3000 is already in use"),
		});
		await expect(
			fetch(`http://127.0.0.1:${artifactPort}/`, {
				signal: AbortSignal.timeout(500),
			}),
		).rejects.toThrow();
		const stillUnrelated = await fetch("http://127.0.0.1:3000/", {
			signal: AbortSignal.timeout(500),
		});
		expect(await stillUnrelated.text()).toBe("UNRELATED-PORT-3000");
	} finally {
		await close(unrelated);
	}
});
