import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { findStaticFile, startStaticServer } from "../src/preview";

const roots: string[] = [];
const servers: Server[] = [];
async function fixture(compress = false) {
	const directory = await mkdtemp(join(tmpdir(), "static-preview-"));
	roots.push(directory);
	const root = join(directory, "static");
	await mkdir(join(root, "about"), { recursive: true });
	await mkdir(join(root, "assets"));
	for (const [path, text] of Object.entries({
		"index.html": "HOME",
		"404.html": "NOT FOUND<script>hydrate()</script>",
		"about/index.html": "ABOUT",
		"about.html": "ABOUT",
		"__deployment.json": "{}",
		"assets/style-12345678.css": "body { color: red }",
	}))
		await writeFile(join(root, path), text);
	await writeFile(join(directory, "private.txt"), "PRIVATE");
	await symlink(join(directory, "private.txt"), join(root, "leak.txt"));
	const server = await startStaticServer({
		root,
		port: 0,
		compress,
		headers: { "X-Test": "yes" },
	});
	servers.push(server);
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("Missing TCP port");
	return { root, base: `http://127.0.0.1:${address.port}`, port: address.port };
}
afterEach(async () => {
	await Promise.all(
		servers.splice(0).map(
			(server) =>
				new Promise<void>((resolve) => {
					server.closeAllConnections();
					server.close(() => resolve());
				}),
		),
	);
	await Promise.all(
		roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
	);
});

test("serves indexes and all clean-path forms without redirects", async () => {
	const { base } = await fixture();
	for (const path of [
		"/about",
		"/about/",
		"/about.html",
		"/about/index.html",
	]) {
		const response = await fetch(base + path, { redirect: "manual" });
		expect(response.status, path).toBe(200);
		expect(await response.text()).toBe("ABOUT");
	}
	expect(await (await fetch(base)).text()).toBe("HOME");
});

test("retains native 404 bodies, HEAD semantics, MIME and cache headers", async () => {
	const { base } = await fixture();
	for (const path of ["/missing", "/missing.png", "/404.html"]) {
		const response = await fetch(base + path);
		expect(response.status).toBe(404);
		expect(await response.text()).toContain("NOT FOUND<script>");
		expect(response.headers.get("cache-control")).toContain("no-store");
	}
	const head = await fetch(`${base}/about`, { method: "HEAD" });
	expect(head.status).toBe(200);
	expect(await head.text()).toBe("");
	expect(head.headers.get("content-length")).toBe("5");
	const asset = await fetch(`${base}/assets/style-12345678.css`);
	expect(asset.headers.get("content-type")).toContain("text/css");
	expect(asset.headers.get("cache-control")).toContain("immutable");
	expect(asset.headers.get("x-test")).toBe("yes");
	const marker = await fetch(`${base}/__deployment.json`);
	expect(marker.headers.get("cache-control")).toContain("no-store");
});

test("rejects unsupported methods, malformed paths and escaping symlinks", async () => {
	const { root, base } = await fixture();
	const post = await fetch(base, { method: "POST" });
	expect(post.status).toBe(405);
	expect(post.headers.get("allow")).toBe("GET, HEAD");
	for (const path of ["/%zz", "/%2e%2e%2fprivate.txt"])
		expect((await fetch(base + path)).status).toBe(400);
	const leak = await fetch(`${base}/leak.txt`);
	expect(leak.status).toBe(404);
	expect(await leak.text()).not.toContain("PRIVATE");
	expect(await findStaticFile(root, "/leak.txt")).toBeUndefined();
});

test.each([
	["br, gzip", "br"],
	["gzip", "gzip"],
	["br;q=0, gzip", "gzip"],
	["br;q=0, gzip;q=0", null],
])("negotiates compression for %s", async (encoding, expected) => {
	const { base } = await fixture(true);
	const response = await fetch(base, {
		headers: { "Accept-Encoding": encoding },
	});
	expect(response.headers.get("content-encoding")).toBe(expected);
	expect(response.headers.get("vary")).toBe("Accept-Encoding");
	expect(await response.text()).toBe("HOME");
});

test("fails closed for missing artifacts and occupied ports", async () => {
	const { root, port } = await fixture();
	await expect(startStaticServer({ root, port })).rejects.toThrow("EADDRINUSE");
	await expect(
		startStaticServer({ root: join(root, "missing"), port: 0 }),
	).rejects.toThrow();
});
