import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { matchesAmplifyRoute, readAmplifyDeployManifest } from "../src/amplify";
import {
	artifactSize,
	assertNoArtifactSecrets,
	listArtifactFiles,
} from "../src/artifact";

const roots: string[] = [];
async function fixture() {
	const root = await mkdtemp(join(tmpdir(), "artifact-inspection-"));
	roots.push(root);
	return root;
}
afterEach(async () => {
	await Promise.all(
		roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
	);
});

test("enumerates nested artifacts and measures all bytes", async () => {
	const root = await fixture();
	await mkdir(join(root, "assets"));
	await writeFile(join(root, "index.html"), "hello");
	await writeFile(join(root, "assets", "image.png"), Buffer.from([0, 1, 2]));
	const files = await listArtifactFiles(root);
	expect(files.sort()).toEqual([
		join(root, "assets/image.png"),
		join(root, "index.html"),
	]);
	expect(await artifactSize(files)).toBe(8);
	await expect(listArtifactFiles(join(root, "missing"))).rejects.toThrow();
});

test("detects secrets in binary output without printing the value", async () => {
	const root = await fixture();
	const file = join(root, "image.png");
	await writeFile(
		file,
		Buffer.concat([Buffer.from([0, 255]), Buffer.from("private-value")]),
	);
	await assertNoArtifactSecrets([file], [undefined, "", "not-present"]);
	try {
		await assertNoArtifactSecrets([file], ["private-value"]);
		throw new Error("Scan unexpectedly succeeded");
	} catch (error) {
		expect(String(error)).toContain(file);
		expect(String(error)).not.toContain("private-value");
	}
});

test.each([
	{ version: 2, routes: [] },
	{ version: 1, routes: [{ path: "/", target: null }] },
	{
		version: 1,
		routes: [{ path: "/", target: { kind: "Static", cacheControl: 5 } }],
	},
	{ version: 1, routes: [], computeResources: [{}] },
])("rejects malformed Amplify shape %j", async (manifest) => {
	const root = await fixture();
	await writeFile(join(root, "deploy-manifest.json"), JSON.stringify(manifest));
	await expect(readAmplifyDeployManifest(root)).rejects.toThrow(
		"invalid deployment manifest",
	);
});

test("preserves manifest fields without imposing app routing policy", async () => {
	const root = await fixture();
	const manifest = {
		version: 1,
		routes: [{ path: "/*", target: { kind: "Compute", src: "default" } }],
		framework: { name: "nitro" },
	};
	await writeFile(join(root, "deploy-manifest.json"), JSON.stringify(manifest));
	expect(await readAmplifyDeployManifest(root)).toEqual(manifest);
	expect(
		JSON.parse(await readFile(join(root, "deploy-manifest.json"), "utf8")),
	).toEqual(manifest);
});

test.each([
	["/", "/", true],
	["/projects/a", "/projects/*", true],
	["/assets/a.js", "/*.*", true],
	["/missing", "/*.*", false],
	["/a/one/b/two/end", "/a/*/b/*/end", true],
	["/a/b", "/a", false],
])("matches %s against %s", (path, pattern, expected) => {
	expect(matchesAmplifyRoute(path, pattern)).toBe(expected);
});
