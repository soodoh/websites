import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

// Test only the packaged files. Never fall back to Nitro/SSR or an SPA index.
const root = resolve(".amplify-hosting/static");
const port = Number(process.argv[2] ?? "4200");
await stat(join(root, "404.html"));
const contentTypes: Record<string, string> = {
	".avif": "image/avif",
	".css": "text/css",
	".html": "text/html; charset=utf-8",
	".ico": "image/x-icon",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".js": "text/javascript",
	".json": "application/json",
	".png": "image/png",
	".svg": "image/svg+xml",
	".webp": "image/webp",
	".woff": "font/woff",
	".woff2": "font/woff2",
};

async function isFile(path: string): Promise<boolean> {
	try {
		return (await stat(path)).isFile();
	} catch (error) {
		if (
			error instanceof Error &&
			"code" in error &&
			(error.code === "ENOENT" || error.code === "ENOTDIR")
		) {
			return false;
		}
		throw error;
	}
}

createServer(async (request, response) => {
	if (request.method !== "GET" && request.method !== "HEAD") {
		response.writeHead(405, { Allow: "GET, HEAD" }).end();
		return;
	}
	try {
		const url = new URL(request.url ?? "/", "http://localhost");
		const pathname = decodeURIComponent(url.pathname);
		const candidate = resolve(root, `.${pathname}`);
		if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
			response.writeHead(400).end();
			return;
		}
		let file = join(root, "404.html");
		let status = 404;
		const candidates =
			candidate === root
				? [join(root, "index.html")]
				: [candidate, `${candidate}.html`, join(candidate, "index.html")];
		for (const path of candidates) {
			if (await isFile(path)) {
				file = path;
				status = pathname === "/404.html" ? 404 : 200;
				break;
			}
		}
		const body = await readFile(file);
		response.writeHead(status, {
			"Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
			"Content-Length": body.byteLength,
		});
		response.end(request.method === "HEAD" ? undefined : body);
	} catch (error) {
		console.error(error);
		response.writeHead(500).end();
	}
}).listen(port, "127.0.0.1", () => {
	console.log(`Static artifact listening on http://127.0.0.1:${port}`);
});
