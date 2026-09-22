import { createServer } from "node:http";
import { describe, expect, test } from "vitest";
import { assertTcpPortAvailable, parseTcpPort } from "@/lib/artifact-server";

describe("artifact server ports", () => {
	test("rejects an occupied compute port instead of trusting its response", async () => {
		const unrelatedServer = createServer((_request, response) => {
			response.end("UNRELATED-COMPUTE-PROCESS");
		});
		await new Promise<void>((resolve, reject) => {
			unrelatedServer.once("error", reject);
			unrelatedServer.listen(0, "127.0.0.1", resolve);
		});
		try {
			const address = unrelatedServer.address();
			if (!address || typeof address === "string") {
				throw new Error("Node did not assign a test server port.");
			}
			await expect(assertTcpPortAvailable(address.port)).rejects.toThrow(
				`Amplify compute port ${address.port} is already in use`,
			);
		} finally {
			await new Promise<void>((resolve, reject) => {
				unrelatedServer.close((error) => (error ? reject(error) : resolve()));
			});
		}
	});

	test("validates configured TCP ports", () => {
		expect(parseTcpPort("4101", "TEST_PORT")).toBe(4101);
		for (const invalid of ["", "0", "65536", "1.5", "not-a-port"]) {
			expect(() => parseTcpPort(invalid, "TEST_PORT")).toThrow("TEST_PORT");
		}
	});
});
