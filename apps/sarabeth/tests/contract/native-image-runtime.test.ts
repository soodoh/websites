import { fileURLToPath } from "node:url";
import { build } from "vite";
import { expect, test } from "vitest";

test("keeps Sharp external when bundling the workspace image adapter for Sarabeth SSR", async () => {
	// Resolve from the app, just as its production SSR build does. A transitive
	// workspace dependency alone lets Vite bundle Sharp and break its native loader.
	const result = await build({
		configFile: false,
		root: fileURLToPath(new URL("../..", import.meta.url)),
		logLevel: "silent",
		build: {
			ssr: fileURLToPath(
				new URL("../../../../packages/images/src/server.ts", import.meta.url),
			),
			write: false,
		},
	});
	if (!("output" in result)) throw new Error("Expected an SSR bundle");
	const code = result.output
		.filter((chunk) => chunk.type === "chunk")
		.map((chunk) => chunk.code)
		.join("\n");
	expect(code).toMatch(/import .* from ["']sharp["']/);
	expect(code).not.toContain('Could not load the "sharp" module');
});
