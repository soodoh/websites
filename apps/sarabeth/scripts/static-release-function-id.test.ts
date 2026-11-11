import { describe, expect, test } from "vitest";
import { createStaticReleaseFunctionId } from "./static-release-function-id";

const aboutFunction = {
	filename: "/src/utils/server-functions.ts",
	functionName: "fetchAboutData_createServerFn_handler",
};

describe("static release function IDs", () => {
	test("changes between builds without requiring a different source commit", () => {
		const previousBuild = createStaticReleaseFunctionId();
		const contentOnlyBuild = createStaticReleaseFunctionId();
		expect(contentOnlyBuild(aboutFunction)).not.toBe(
			previousBuild(aboutFunction),
		);
	});

	test("keeps client, server, and prerender identities stable within a build", () => {
		const generate = createStaticReleaseFunctionId("one-build");
		expect(generate(aboutFunction)).toBe(generate(aboutFunction));
		expect(generate(aboutFunction)).toBe(
			createStaticReleaseFunctionId("one-build")(aboutFunction),
		);
		expect(generate(aboutFunction)).toMatch(/^[a-f0-9]{64}$/);
	});

	test("does not collide across static functions", () => {
		const generate = createStaticReleaseFunctionId("one-build");
		expect(generate(aboutFunction)).not.toBe(
			generate({ ...aboutFunction, functionName: "fetchHomeData" }),
		);
	});

	test("leaves runtime functions on the default ID generator", () => {
		expect(
			createStaticReleaseFunctionId("one-build")({
				filename: "/src/utils/email.server.ts",
				functionName: "sendEmail",
			}),
		).toBeUndefined();
	});
});
