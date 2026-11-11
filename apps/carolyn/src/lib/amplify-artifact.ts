import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	type AmplifyRoute,
	readAmplifyDeployManifest,
} from "@websites/static-site/amplify";
import { writeCleanPathAliases } from "@websites/static-site/output";
import { createReleaseIdentity } from "../../../../scripts/deploy/release.ts";

export {
	type AmplifyDeployManifest,
	type AmplifyRoute,
	type AmplifyRouteTarget,
	matchesAmplifyRoute,
	readAmplifyDeployManifest,
} from "@websites/static-site/amplify";

export type AmplifyArtifactMode = "fixture" | "production";

export type AmplifyCustomRule = {
	source: string;
	status: "301";
	target: string;
};

const artifactModeMarker = ".artifact-mode";
const fixedStaticPublicPaths = [
	"/",
	"/about",
	"/photography",
	"/projects",
] as const;
export const maximumAmplifyRouteCount = 25;

export async function readAmplifyArtifactMode(
	amplifyRoot: string,
): Promise<AmplifyArtifactMode> {
	const mode = (
		await readFile(join(amplifyRoot, artifactModeMarker), "utf8")
	).trim();
	if (mode !== "fixture" && mode !== "production") {
		throw new Error(`Amplify artifact has an invalid mode marker: ${mode}`);
	}
	return mode;
}

export function getStaticPublicPaths(
	publicProjectSlugs: readonly string[] = [],
): string[] {
	return [
		...fixedStaticPublicPaths,
		...publicProjectSlugs.map((slug) => `/projects/${slug}`),
	];
}

export function getStaticFilePath(publicPath: string): string {
	return publicPath === "/" ? "/index.html" : `${publicPath}/index.html`;
}

export function getCleanUrlRules(): AmplifyCustomRule[] {
	return fixedStaticPublicPaths.flatMap((publicPath) =>
		publicPath === "/"
			? []
			: [
					{
						source: `${publicPath}/`,
						status: "301" as const,
						target: publicPath,
					},
				],
	);
}

export function createProductionRoutes(
	protectedProjectSlugs: readonly string[],
): AmplifyRoute[] {
	const staticTarget = { kind: "Static" };
	const computeTarget = { kind: "Compute", src: "default" };
	const routes: AmplifyRoute[] = [
		{
			path: "/__deployment.json",
			target: { kind: "Static", cacheControl: "no-store" },
		},
		...fixedStaticPublicPaths.map((path) => ({ path, target: staticTarget })),
		{
			path: "/__tsr/staticServerFnCache/*",
			target: {
				kind: "Static",
				cacheControl: "public, max-age=31536000, immutable",
			},
		},
		{
			path: "/__release/albums/*",
			target: {
				kind: "Static",
				cacheControl: "public, max-age=31536000, immutable",
			},
		},
		...protectedProjectSlugs.map((slug) => ({
			path: `/projects/${slug}`,
			target: computeTarget,
		})),
		{ path: "/resume", target: computeTarget },
		{ path: "/_serverFn/*", target: computeTarget },
		{ path: "/projects/*", target: staticTarget },
		{ path: "/*.*", target: staticTarget },
		{ path: "/*", target: staticTarget },
	];
	if (routes.length > maximumAmplifyRouteCount) {
		throw new Error(
			`Amplify deployment exceeds the ${maximumAmplifyRouteCount}-route limit.`,
		);
	}
	return routes;
}

export function resolveDeploymentMetadata(
	environment: NodeJS.ProcessEnv = process.env,
): { commit: string; runAttempt: string; runId: string } {
	const identity = createReleaseIdentity(
		environment.RELEASE_COMMIT ?? environment.AWS_COMMIT_ID ?? "local",
		environment.RELEASE_RUN_ID,
		environment.RELEASE_RUN_ATTEMPT,
	);
	if (
		identity.commit !== "local" &&
		(!/^\d+$/.test(identity.runId) || !/^\d+$/.test(identity.runAttempt))
	) {
		throw new Error(
			"Production release metadata requires a numeric run identity.",
		);
	}
	return identity;
}

export async function prepareAmplifyArtifact(
	amplifyRoot: string,
	mode: AmplifyArtifactMode,
	projectRoutes: Readonly<Record<string, "protected" | "public">>,
): Promise<void> {
	const manifestPath = join(amplifyRoot, "deploy-manifest.json");
	const generatedManifest = await readAmplifyDeployManifest(amplifyRoot);
	const publicProjectSlugs = Object.entries(projectRoutes).flatMap(
		([slug, route]) => (route === "public" ? [slug] : []),
	);
	const protectedProjectSlugs = Object.entries(projectRoutes).flatMap(
		([slug, route]) => (route === "protected" ? [slug] : []),
	);
	generatedManifest.routes = createProductionRoutes(protectedProjectSlugs);
	await writeFile(
		manifestPath,
		`${JSON.stringify(generatedManifest, null, 2)}\n`,
	);
	await writeCleanPathAliases(
		join(amplifyRoot, "static"),
		getStaticPublicPaths(publicProjectSlugs),
	);
	await writeFile(
		join(amplifyRoot, "static", "__deployment.json"),
		`${JSON.stringify(resolveDeploymentMetadata())}\n`,
	);

	const fixtureAssets = join(amplifyRoot, "static", "test-assets");
	if (mode === "production") {
		await rm(fixtureAssets, { force: true, recursive: true });
	}
	await writeFile(join(amplifyRoot, artifactModeMarker), `${mode}\n`);
}
