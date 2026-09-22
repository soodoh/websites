import {
	mkdir,
	mkdtemp,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
	createProductionRoutes,
	getCleanUrlRules,
	getStaticPublicPaths,
	matchesAmplifyRoute,
	maximumAmplifyRouteCount,
	prepareAmplifyArtifact,
	readAmplifyArtifactMode,
	resolveDeploymentMetadata,
} from "@/lib/amplify-artifact";

const temporaryDirectories: string[] = [];
const projectRoutes = {
	"protected-project": "protected",
	"public-project": "public",
} as const;

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { force: true, recursive: true })),
	);
});

async function createArtifact(): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "amplify-artifact-"));
	temporaryDirectories.push(root);
	for (const path of [
		"index.html",
		"about/index.html",
		"photography/index.html",
		"projects/index.html",
		"projects/public-project/index.html",
		"__static-not-found/index.html",
		"test-assets/image.jpg",
	]) {
		await mkdir(join(root, "static", path, ".."), { recursive: true });
		await writeFile(join(root, "static", path), `<html>${path}</html>`);
	}
	await writeFile(
		join(root, "static", "__static-not-found/index.html"),
		'<html><head><link rel="modulepreload" href="/route.js"></head><body>__static-not-found Page not found<script src="/hydrate.js"></script></body></html>',
	);
	await writeFile(
		join(root, "deploy-manifest.json"),
		JSON.stringify({
			version: 1,
			routes: [
				{
					path: "/*.*",
					target: { kind: "Static", cacheControl: "public" },
					fallback: { kind: "Compute", src: "default" },
				},
				{ path: "/*", target: { kind: "Compute", src: "default" } },
			],
			computeResources: [],
			framework: { name: "nitro", version: "1.0.0" },
		}),
	);
	return root;
}

describe("Amplify artifact preparation", () => {
	test("ignores ambient GitHub CI metadata without release identity", () => {
		expect(resolveDeploymentMetadata({ GITHUB_SHA: "a".repeat(40) })).toEqual({
			commit: "local",
			runAttempt: "local",
			runId: "local",
		});
	});

	test("orders bounded static and compute routes without compute fallbacks", () => {
		const routes = createProductionRoutes(["protected-project"]);
		expect(routes.map(({ path }) => path)).toEqual([
			"/__deployment.json",
			"/",
			"/about",
			"/photography",
			"/projects",
			"/__tsr/staticServerFnCache/*",
			"/__release/albums/*",
			"/projects/protected-project",
			"/resume",
			"/_serverFn/*",
			"/projects/*",
			"/*.*",
			"/*",
		]);
		expect(routes).toHaveLength(13);
		expect(routes.length).toBeLessThanOrEqual(maximumAmplifyRouteCount);
		expect(routes.every((route) => route.fallback === undefined)).toBe(true);
		expect(routes.at(-2)?.target.kind).toBe("Static");
		expect(routes.at(-1)?.target.kind).toBe("Static");
	});

	test("puts exact protected compute routes before the static project wildcard", () => {
		const routes = createProductionRoutes(["protected-project"]);
		const protectedIndex = routes.findIndex(
			({ path }) => path === "/projects/protected-project",
		);
		const projectWildcardIndex = routes.findIndex(
			({ path }) => path === "/projects/*",
		);
		expect(protectedIndex).toBeLessThan(projectWildcardIndex);
		expect(routes[protectedIndex]?.target).toEqual({
			kind: "Compute",
			src: "default",
		});
	});

	test("emits clean aliases, a custom 404, and immutable static data routes", async () => {
		const root = await createArtifact();
		await prepareAmplifyArtifact(root, "fixture", projectRoutes);
		expect(await readAmplifyArtifactMode(root)).toBe("fixture");
		await expect(
			stat(join(root, "static", "about.html")),
		).resolves.toBeDefined();
		await expect(
			stat(join(root, "static", "projects", "public-project.html")),
		).resolves.toBeDefined();
		const notFoundHtml = await readFile(
			join(root, "static", "404.html"),
			"utf8",
		);
		expect(notFoundHtml).toContain("__static-not-found");
		expect(notFoundHtml).toContain("<title>CD: Page Not Found</title>");
		expect(notFoundHtml).not.toContain("<script");
		expect(notFoundHtml).not.toContain('rel="modulepreload"');
		expect(
			JSON.parse(
				await readFile(join(root, "static", "__deployment.json"), "utf8"),
			),
		).toEqual({ commit: "local", runAttempt: "local", runId: "local" });
		await expect(
			stat(join(root, "static", "projects", "protected-project.html")),
		).rejects.toMatchObject({ code: "ENOENT" });
		const manifest = JSON.parse(
			await readFile(join(root, "deploy-manifest.json"), "utf8"),
		);
		expect(manifest.routes).toEqual(
			createProductionRoutes(["protected-project"]),
		);
	});

	test("defines canonical slash redirects without per-project custom rules", () => {
		const rules = getCleanUrlRules();
		expect(rules).toContainEqual({
			source: "/about/",
			status: "301",
			target: "/about",
		});
		expect(rules.some((rule) => /^\/projects\/[^/]/.test(rule.source))).toBe(
			false,
		);
		expect(getStaticPublicPaths(["public-project"])).toContain(
			"/projects/public-project",
		);
	});

	test("matches emitted manifest route patterns in traversal order", () => {
		expect(matchesAmplifyRoute("/projects/public-project", "/projects/*")).toBe(
			true,
		);
		expect(matchesAmplifyRoute("/favicon.png", "/*.*")).toBe(true);
		expect(matchesAmplifyRoute("/missing", "/*.*")).toBe(false);
		expect(matchesAmplifyRoute("/missing", "/*")).toBe(true);
	});

	test("removes fixture assets in production mode", async () => {
		const root = await createArtifact();
		await prepareAmplifyArtifact(root, "production", projectRoutes);
		await expect(
			stat(join(root, "static", "test-assets")),
		).rejects.toMatchObject({
			code: "ENOENT",
		});
		expect(await readAmplifyArtifactMode(root)).toBe("production");
	});
});
