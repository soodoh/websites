import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import {
	createProductionRoutes,
	getStaticPublicPaths,
	maximumAmplifyRouteCount,
} from "@/lib/amplify-artifact";
import { assertSafeProductionBuildEnvironment } from "@/lib/build-environment";
import authManifest from "@/lib/generated-release/project-auth-manifest.server.json" with {
	type: "json",
};
import projectRoutes from "@/lib/generated-release/project-routes.json" with {
	type: "json",
};
import protectedProjects from "@/lib/generated-release/protected-project-content.server.json" with {
	type: "json",
};
import publicRelease from "@/lib/generated-release/public-release-content.json" with {
	type: "json",
};
import { getProjectAuthSecret } from "@/lib/server-secrets.server";

const amplifyRoot = ".amplify-hosting";
const publicRoot = join(amplifyRoot, "static");
const computeRoot = join(amplifyRoot, "compute", "default");
const maximumComputeBytes = 220 * 1024 * 1024;
const intendedRuntime = "nodejs24.x";
const artifactMode = assertSafeProductionBuildEnvironment(process.env);
const typedProjectRoutes = projectRoutes as Record<
	string,
	"protected" | "public"
>;
const publicSlugs = Object.entries(typedProjectRoutes).flatMap(
	([slug, route]) => (route === "public" ? [slug] : []),
);
const protectedSlugs = Object.entries(typedProjectRoutes).flatMap(
	([slug, route]) => (route === "protected" ? [slug] : []),
);
const staticPublicPaths = getStaticPublicPaths(publicSlugs);

async function assertFileMissing(path: string, message: string): Promise<void> {
	try {
		await stat(path);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			return;
		}
		throw error;
	}
	throw new Error(message);
}

for (const path of staticPublicPaths) {
	const relativePath =
		path === "/" ? "index.html" : `${path.slice(1)}/index.html`;
	await stat(join(publicRoot, relativePath));
	if (path !== "/") {
		await stat(join(publicRoot, `${path.slice(1)}.html`));
	}
}
for (const slug of protectedSlugs) {
	await assertFileMissing(
		join(publicRoot, "projects", slug, "index.html"),
		`Protected project was prerendered: ${slug}`,
	);
	await assertFileMissing(
		join(publicRoot, "projects", `${slug}.html`),
		`Protected project alias was emitted: ${slug}`,
	);
}
await assertFileMissing(
	join(publicRoot, "resume", "index.html"),
	"Dynamic resume redirect was prerendered",
);
await stat(join(publicRoot, "404.html"));

const aboutHtml = await readFile(
	join(publicRoot, "about", "index.html"),
	"utf8",
);
const aboutPortrait = aboutHtml
	.match(/<img[^>]+alt="Portrait of Carolyn DiLoreto"[^>]*>/)?.[0]
	.toLowerCase();
if (
	!aboutPortrait?.includes('fetchpriority="high"') ||
	aboutPortrait.includes('loading="lazy"')
) {
	throw new Error(
		"The above-the-fold About portrait must be eager and high priority.",
	);
}

const albumDirectory = join(publicRoot, "__release", "albums");
const albumFiles = (await readdir(albumDirectory)).filter((file) =>
	/^[a-f0-9]{64}\.json$/.test(file),
);
const albumSources = Object.values(publicRelease.photography.albumSources);
if (albumFiles.length !== publicRelease.photography.albumNames.length) {
	throw new Error("Static photography output does not contain every album.");
}
for (const source of albumSources) {
	await stat(join(publicRoot, source.slice(1)));
}

const staticCacheDirectory = join(publicRoot, "__tsr", "staticServerFnCache");
const staticCacheFiles = (await readdir(staticCacheDirectory)).filter((file) =>
	/^[a-f0-9]{40}\.json$/.test(file),
);
if (staticCacheFiles.length === 0) {
	throw new Error("No static server-function cache files were generated.");
}

if (artifactMode === "fixture") {
	await stat(join(publicRoot, "test-assets"));
} else {
	await assertFileMissing(
		join(publicRoot, "test-assets"),
		"Local visual-test fixtures were copied into the production artifact",
	);
}

async function findInspectableFiles(directory: string): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await findInspectableFiles(path)));
		} else if (/\.(?:css|html|js|json|map|mjs)$/.test(entry.name)) {
			files.push(path);
		}
	}
	return files;
}

const publicFiles = await findInspectableFiles(publicRoot);
const artifactFiles = await findInspectableFiles(amplifyRoot);
const computeFiles = await findInspectableFiles(computeRoot);
if (publicFiles.some((file) => file.endsWith(".map"))) {
	throw new Error("Production client source maps must not be published.");
}

const requiredIndexPages = staticPublicPaths
	.map((path) => (path === "/" ? "index.html" : `${path.slice(1)}/index.html`))
	.sort();
const actualIndexPages = publicFiles
	.filter((file) => file.endsWith("index.html"))
	.map((file) => relative(publicRoot, file))
	.filter((file) => !file.startsWith("__static-not-found/"))
	.sort();
if (
	actualIndexPages.length !== requiredIndexPages.length ||
	actualIndexPages.some((page, index) => page !== requiredIndexPages[index])
) {
	throw new Error(
		`Prerendered page set differs from the expected public routes.\nExpected: ${requiredIndexPages.join(", ")}\nActual: ${actualIndexPages.join(", ")}`,
	);
}

const authValues = Object.values(authManifest).flatMap((auth) => [
	auth.passwordHash,
	auth.authVersion,
]);
const protectedSentinels = Object.values(protectedProjects).flatMap(
	(project) => {
		const values: string[] = [];
		const visit = (value: unknown): void => {
			if (typeof value === "string" && value.length >= 80) values.push(value);
			else if (Array.isArray(value)) value.forEach(visit);
			else if (typeof value === "object" && value !== null) {
				Object.values(value).forEach(visit);
			}
		};
		visit(project.description);
		return values.slice(0, 1);
	},
);
for (const file of publicFiles) {
	const contents = await readFile(file, "utf8");
	if (/\$2[aby]\$\d{2}\$/.test(contents)) {
		throw new Error(`Password hash leaked into public output: ${file}`);
	}
	for (const value of [...authValues, ...protectedSentinels]) {
		if (value && contents.includes(value)) {
			throw new Error(
				`Protected release data leaked into public output: ${file}`,
			);
		}
	}
	if (contents.includes("playwright-password")) {
		throw new Error(
			`Plaintext project password leaked into public output: ${file}`,
		);
	}
}

const privateValues = [
	process.env.CONTENTFUL_ACCESS_TOKEN,
	process.env.PROJECT_AUTH_SECRET,
].filter((value): value is string => Boolean(value));
if (
	process.env.VERIFY_DEPLOYMENT_SECRETS === "true" &&
	!process.env.PROJECT_AUTH_SECRET
) {
	privateValues.push(await getProjectAuthSecret());
}
for (const file of artifactFiles) {
	const contents = await readFile(file, "utf8");
	if (privateValues.some((value) => contents.includes(value))) {
		throw new Error(`A secret value was serialized into the artifact: ${file}`);
	}
}
for (const file of computeFiles) {
	const contents = await readFile(file, "utf8");
	if (
		contents.includes("CONTENTFUL_ACCESS_TOKEN") ||
		contents.includes("/carolyn-portfolio/prod/contentful-access-token") ||
		contents.includes("Missing CONTENTFUL_ACCESS_TOKEN")
	) {
		throw new Error(`Compute contains Contentful token runtime code: ${file}`);
	}
}

await stat(join(computeRoot, "server.js"));
const deployManifest = JSON.parse(
	await readFile(join(amplifyRoot, "deploy-manifest.json"), "utf8"),
);
if (deployManifest.version !== 1) {
	throw new Error("Amplify deploy manifest must use specification version 1");
}
const defaultCompute = deployManifest.computeResources?.find(
	(resource: { name?: string }) => resource.name === "default",
);
if (
	defaultCompute?.entrypoint !== "server.js" ||
	defaultCompute.runtime !== intendedRuntime
) {
	throw new Error(
		`Amplify default compute must use server.js on ${intendedRuntime}`,
	);
}
const expectedRoutes = createProductionRoutes(protectedSlugs);
if (JSON.stringify(deployManifest.routes) !== JSON.stringify(expectedRoutes)) {
	throw new Error(
		"Amplify deployment route order differs from the release contract.",
	);
}
if (deployManifest.routes.length > maximumAmplifyRouteCount) {
	throw new Error("Amplify deployment manifest exceeds its route limit.");
}
const cacheRoute = deployManifest.routes.find(
	(route: { path?: string }) => route.path === "/__tsr/staticServerFnCache/*",
);
const albumRoute = deployManifest.routes.find(
	(route: { path?: string }) => route.path === "/__release/albums/*",
);
for (const route of [cacheRoute, albumRoute]) {
	if (
		route?.target?.kind !== "Static" ||
		route.target.cacheControl !== "public, max-age=31536000, immutable"
	) {
		throw new Error("Generated static data must use immutable caching.");
	}
}
for (const route of deployManifest.routes) {
	if (["/*.*", "/*"].includes(route.path) && route.target?.kind !== "Static") {
		throw new Error(`${route.path} must never invoke compute.`);
	}
	if (route.fallback?.kind === "Compute") {
		throw new Error(`Static route has a compute fallback: ${route.path}`);
	}
}

async function getDirectorySize(directory: string): Promise<number> {
	let totalBytes = 0;
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		totalBytes += entry.isDirectory()
			? await getDirectorySize(path)
			: (await stat(path)).size;
	}
	return totalBytes;
}

const computeBytes = await getDirectorySize(computeRoot);
if (computeBytes >= maximumComputeBytes) {
	throw new Error(
		`Amplify compute bundle is ${(computeBytes / 1024 / 1024).toFixed(1)} MiB; it must remain below 220 MiB uncompressed`,
	);
}

process.stdout.write(
	`Verified ${staticPublicPaths.length} static pages, ${albumFiles.length} static albums, ${protectedSlugs.length} protected compute routes, static 404 routing, and a ${(computeBytes / 1024 / 1024).toFixed(1)} MiB Node.js 24 compute bundle.\n`,
);
