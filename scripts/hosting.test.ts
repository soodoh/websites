import { execFile } from "node:child_process";
import { createServer, type Server } from "node:http";
import { promisify } from "node:util";
import { afterEach, expect, test } from "vitest";
import {
	assertCacheDirectives,
	assertSecurityHeaders,
	request,
	verifyReleaseMarker,
} from "./deploy/hosting.ts";
import {
	assertDeployedRelease,
	createReleaseIdentity,
} from "./deploy/release.ts";

const servers: Server[] = [];
const commit = "a".repeat(40);
const identity = { commit, runId: "1234", runAttempt: "2" };
async function fixture(payload: unknown = identity) {
	const server = createServer((req, res) => {
		if (req.url === "/slow") {
			res.writeHead(200);
			res.write("unfinished");
			return;
		}
		if (req.url === "/redirect") {
			res.writeHead(301, { Location: "/" }).end();
			return;
		}
		res.writeHead(200, {
			"Cache-Control": "no-store, must-revalidate",
			"X-Test": "yes",
		});
		res.end(JSON.stringify(payload));
	});
	servers.push(server);
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("Missing TCP port");
	return new URL(`http://127.0.0.1:${address.port}`);
}
afterEach(async () => {
	await Promise.all(
		servers.splice(0).map(
			(server) =>
				new Promise<void>((resolve) => {
					server.closeAllConnections();
					server.close(() => resolve());
				}),
		),
	);
});

test("checks the exact deployed identity, not just a repeated commit", async () => {
	const environment = {
		baseUrl: await fixture(),
		expectAmplify: true,
		expectDomainRedirects: false,
		expectedCommit: commit,
		expectedRunId: "1234",
		expectedRunAttempt: "2",
	};
	await verifyReleaseMarker(environment);
	await expect(
		verifyReleaseMarker({ ...environment, expectedRunId: "5678" }),
	).rejects.toThrow("runId");
	await expect(
		verifyReleaseMarker({ ...environment, expectedRunAttempt: "3" }),
	).rejects.toThrow("runAttempt");
});

test.each([
	{ commit },
	{ ...identity, commit: "b".repeat(40) },
	{ ...identity, runId: "local" },
])("rejects invalid deployed metadata %j", (value) => {
	expect(() => assertDeployedRelease(value, { commit })).toThrow();
});

test("validates build metadata without changing local build support", () => {
	expect(createReleaseIdentity("local")).toEqual({
		commit: "local",
		runId: "local",
		runAttempt: "local",
	});
	expect(createReleaseIdentity(commit, "1234", "2")).toEqual(identity);
	expect(() => createReleaseIdentity("invalid")).toThrow();
	expect(() => createReleaseIdentity(commit, "not-a-run")).toThrow();
});

test("preserves redirects and bounds the entire response body", async () => {
	const base = await fixture();
	expect((await request(new URL("/redirect", base))).response.status).toBe(301);
	await expect(
		request(new URL("/slow", base), { signal: AbortSignal.timeout(50) }),
	).rejects.toThrow();
});

test("compares complete cache directives and app-specific headers", async () => {
	const { response } = await request(await fixture());
	assertCacheDirectives(response, ["no-store", "must-revalidate"], "HTML");
	assertSecurityHeaders(response, new Map([["x-test", "yes"]]));
	expect(() => assertCacheDirectives(response, ["store"], "HTML")).toThrow();
	expect(() =>
		assertSecurityHeaders(response, new Map([["x-test", "wrong"]])),
	).toThrow();
});

test("deployment helpers run as native Node TypeScript without workspace dependencies", async () => {
	const base = await fixture();
	const module = new URL("./deploy/hosting.ts", import.meta.url).href;
	const { stdout } = await promisify(execFile)("node", [
		"--input-type=module",
		"-e",
		`import { request } from ${JSON.stringify(module)}; console.log((await request(${JSON.stringify(base.href)})).response.status);`,
	]);
	expect(stdout.trim()).toBe("200");
});
