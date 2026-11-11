import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { responsiveImages } from "@websites/images/vite";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import { getStaticPublicPaths } from "./src/lib/amplify-artifact.ts";
import { assertSafeProductionBuildEnvironment } from "./src/lib/build-environment.ts";
import projectRoutes from "./src/lib/generated-release/project-routes.json" with {
	type: "json",
};
import publicReleaseContent from "./src/lib/generated-release/public-release-content.json" with {
	type: "json",
};
import { createReleaseFunctionId } from "./src/lib/static-release-function-id.ts";

const publicProjectSlugs = Object.entries(projectRoutes).flatMap(
	([slug, route]) => (route === "public" ? [slug] : []),
);
const staticPublicPaths = new Set([
	...getStaticPublicPaths(publicProjectSlugs),
	"/404",
]);

export default defineConfig(({ mode }) => {
	Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
	const artifactMode = assertSafeProductionBuildEnvironment(process.env);

	return {
		publicDir: false,
		define: {
			"process.env.RELEASE_COMMIT": JSON.stringify(
				process.env.AWS_COMMIT_ID ?? process.env.GITHUB_SHA ?? "local",
			),
		},
		resolve: {
			tsconfigPaths: true,
		},
		plugins: [
			responsiveImages(),
			nitro({
				preset: "aws_amplify",
				awsAmplify: { runtime: "nodejs24.x" },
				publicAssets: [
					{
						dir: "public",
						maxAge: 0,
						ignore:
							artifactMode === "production" ? ["public/test-assets/**"] : [],
					},
					{
						baseURL: "/__release",
						dir: "src/lib/generated-release/static",
						maxAge: 31_536_000,
					},
				],
			}),
			tanstackStart({
				serverFns: {
					generateFunctionId: createReleaseFunctionId(
						JSON.stringify(publicReleaseContent),
					),
				},
				pages: [
					{
						path: "/404",
						prerender: { outputPath: "/404.html", crawlLinks: false },
					},
				],
				prerender: {
					enabled: true,
					autoStaticPathsDiscovery: true,
					concurrency: 1,
					crawlLinks: true,
					failOnError: true,
					filter: ({ path }) => {
						const normalizedPath =
							path.length > 1 ? path.replace(/\/$/, "") : path;
						return staticPublicPaths.has(normalizedPath);
					},
				},
			}),
			tailwindcss(),
			viteReact(),
		],
		server: {
			port: 3000,
		},
		build: {
			sourcemap: false,
		},
	};
});
