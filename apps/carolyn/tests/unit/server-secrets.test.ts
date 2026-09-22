import { describe, expect, test } from "vitest";
import { createServerSecretLoader } from "@/lib/server-secrets.server";

const emptyEnvironment: Readonly<Record<string, string | undefined>> = {};

describe("server secret loading", () => {
	test("uses the local project auth secret without querying Parameter Store", async () => {
		let parameterCalls = 0;
		const loader = createServerSecretLoader({
			environment: { PROJECT_AUTH_SECRET: "local-project-secret" },
			getParameter: async () => {
				parameterCalls += 1;
				return undefined;
			},
		});

		expect(await loader.getProjectAuthSecret()).toBe("local-project-secret");
		expect(parameterCalls).toBe(0);
	});

	test("fails closed when the project auth secret is missing", async () => {
		const loader = createServerSecretLoader({
			environment: emptyEnvironment,
			getParameter: async () => undefined,
		});

		await expect(loader.getProjectAuthSecret()).rejects.toThrow(
			"Missing PROJECT_AUTH_SECRET",
		);
	});

	test("caches successful loading for the lifetime of the process", async () => {
		let parameterCalls = 0;
		const loader = createServerSecretLoader({
			environment: emptyEnvironment,
			getParameter: async () => {
				parameterCalls += 1;
				return "cached-secret";
			},
		});

		const values = await Promise.all([
			loader.getProjectAuthSecret(),
			loader.getProjectAuthSecret(),
		]);
		expect(values).toEqual(["cached-secret", "cached-secret"]);
		expect(parameterCalls).toBe(1);
	});

	test("retries sanitized initialization failures", async () => {
		const sensitiveProviderDetail = "provider-response-with-secret-value";
		let parameterCalls = 0;
		const loader = createServerSecretLoader({
			environment: emptyEnvironment,
			getParameter: async () => {
				parameterCalls += 1;
				if (parameterCalls === 1) {
					throw new Error(sensitiveProviderDetail);
				}
				return "recovered-secret";
			},
		});

		try {
			await loader.getProjectAuthSecret();
			throw new Error("Expected secret initialization to fail");
		} catch (error) {
			if (!(error instanceof Error)) {
				throw error;
			}
			expect(error.message).toBe(
				"Failed to initialize PROJECT_AUTH_SECRET from AWS Systems Manager Parameter Store",
			);
			expect(error.message).not.toContain(sensitiveProviderDetail);
		}

		expect(await loader.getProjectAuthSecret()).toBe("recovered-secret");
		expect(JSON.stringify(loader)).not.toContain(sensitiveProviderDetail);
		expect(parameterCalls).toBe(2);
	});
});
