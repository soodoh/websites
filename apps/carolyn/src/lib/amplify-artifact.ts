import { copyFile, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

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

export type AmplifyRouteTarget = Record<string, unknown> & {
	kind: string;
};

export type AmplifyRoute = Record<string, unknown> & {
	fallback?: AmplifyRouteTarget;
	path: string;
	target: AmplifyRouteTarget;
};

export type AmplifyDeployManifest = Record<string, unknown> & {
	version: 1;
	routes: AmplifyRoute[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRoute(value: unknown): value is AmplifyRoute {
	return (
		isRecord(value) &&
		typeof value.path === "string" &&
		isRecord(value.target) &&
		typeof value.target.kind === "string"
	);
}

function isDeployManifest(value: unknown): value is AmplifyDeployManifest {
	return (
		isRecord(value) &&
		value.version === 1 &&
		Array.isArray(value.routes) &&
		value.routes.every(isRoute)
	);
}

function parseDeployManifest(value: unknown): AmplifyDeployManifest {
	if (!isDeployManifest(value)) {
		throw new Error("Amplify generated an invalid deployment manifest.");
	}
	return value;
}

export async function readAmplifyDeployManifest(
	amplifyRoot: string,
): Promise<AmplifyDeployManifest> {
	return parseDeployManifest(
		JSON.parse(
			await readFile(join(amplifyRoot, "deploy-manifest.json"), "utf8"),
		),
	);
}

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

export function matchesAmplifyRoute(
	pathname: string,
	pattern: string,
): boolean {
	const parts = pattern.split("*");
	const first = parts[0];
	if (parts.length === 1) {
		return pathname === pattern;
	}
	if (first === undefined || !pathname.startsWith(first)) {
		return false;
	}

	let cursor = first.length;
	for (const part of parts.slice(1, -1)) {
		const next = pathname.indexOf(part, cursor);
		if (next === -1) {
			return false;
		}
		cursor = next + part.length;
	}
	const last = parts.at(-1);
	return last !== undefined && pathname.slice(cursor).endsWith(last);
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

async function emitHtmlAliases(
	amplifyRoot: string,
	publicPaths: readonly string[],
): Promise<void> {
	for (const publicPath of publicPaths) {
		if (publicPath === "/") continue;
		const source = join(
			amplifyRoot,
			"static",
			publicPath.slice(1),
			"index.html",
		);
		await copyFile(
			source,
			join(amplifyRoot, "static", `${publicPath.slice(1)}.html`),
		);
	}
}

export function resolveDeploymentMetadata(
	environment: NodeJS.ProcessEnv = process.env,
): { commit: string; runAttempt: string; runId: string } {
	const commit =
		environment.RELEASE_COMMIT ?? environment.AWS_COMMIT_ID ?? "local";
	if (commit !== "local" && !/^[a-f0-9]{40}$/.test(commit)) {
		throw new Error("Release commit must be a 40-character hexadecimal SHA.");
	}
	const runId = environment.RELEASE_RUN_ID ?? "local";
	const runAttempt = environment.RELEASE_RUN_ATTEMPT ?? "local";
	if (
		commit !== "local" &&
		(!/^\d+$/.test(runId) || !/^\d+$/.test(runAttempt))
	) {
		throw new Error(
			"Production release metadata requires a numeric run identity.",
		);
	}
	return { commit, runAttempt, runId };
}

async function emitCustomNotFoundPage(amplifyRoot: string): Promise<void> {
	const source = join(
		amplifyRoot,
		"static",
		"__static-not-found",
		"index.html",
	);
	try {
		await stat(source);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			throw new Error("Vite did not prerender the static custom 404 page.");
		}
		throw error;
	}
	const prerenderedHtml = await readFile(source, "utf8");
	const staticHtml = prerenderedHtml
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<link\b(?=[^>]*\brel=["']modulepreload["'])[^>]*>/gi, "")
		.replace(/<title>[\s\S]*?<\/title>/gi, "")
		.replace("</head>", "<title>CD: Page Not Found</title></head>");
	if (!staticHtml.includes("Page not found")) {
		throw new Error("Refusing to emit a custom 404 without its expected UI.");
	}
	await writeFile(join(amplifyRoot, "static", "404.html"), staticHtml);
	await rm(join(amplifyRoot, "static", "__static-not-found"), {
		force: true,
		recursive: true,
	});
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
	await emitHtmlAliases(amplifyRoot, getStaticPublicPaths(publicProjectSlugs));
	await emitCustomNotFoundPage(amplifyRoot);
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
