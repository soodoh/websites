import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repositoryRoot = fileURLToPath(new URL(".", import.meta.url));

function appProject(
	name: string,
	include: string[],
	options: { testAlias?: boolean } = {},
) {
	const root = resolve(repositoryRoot, "apps", name);
	return {
		extends: true,
		root,
		resolve: {
			alias: [
				{ find: /^@\//, replacement: `${resolve(root, "src")}/` },
				...(options.testAlias
					? [{ find: /^@tests\//, replacement: `${resolve(root, "tests")}/` }]
					: []),
				{ find: /^@scripts\//, replacement: `${resolve(root, "scripts")}/` },
			],
		},
		test: {
			name,
			environment: "node",
			include,
		},
	};
}

export default defineConfig({
	root: repositoryRoot,
	test: {
		clearMocks: true,
		restoreMocks: true,
		testTimeout: 10_000,
		projects: [
			{
				extends: true,
				root: repositoryRoot,
				test: {
					name: "workspace",
					environment: "node",
					include: ["scripts/**/*.test.ts"],
				},
			},
			appProject(
				"sarabeth",
				["scripts/**/*.test.ts", "tests/contract/**/*.test.ts"],
				{ testAlias: true },
			),
			appProject("carolyn", ["tests/unit/**/*.test.{ts,tsx}"], {
				testAlias: true,
			}),
			appProject("diloreto", [
				"infra/**/*.test.ts",
				"scripts/**/*.test.ts",
				"tests/unit/**/*.test.{ts,tsx}",
			]),
			appProject("paul", ["tests/unit/**/*.test.{ts,tsx}"]),
		],
	},
});
