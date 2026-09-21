import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import { getStaticPublicPaths } from "./src/lib/amplify-artifact.ts";
import { getArtifactMode } from "./src/lib/build-environment.ts";
import projectRoutes from "./src/lib/generated-release/project-routes.json" with {
	type: "json",
};

const publicProjectSlugs = Object.entries(projectRoutes).flatMap(
	([slug, route]) => (route === "public" ? [slug] : []),
);
const staticPublicPaths = new Set([
	...getStaticPublicPaths(publicProjectSlugs),
	"/__static-not-found",
]);

export default defineConfig(({ mode }) => {
	Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
	const artifactMode = getArtifactMode(process.env);

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
				pages: [{ path: "/__static-not-found" }],
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
