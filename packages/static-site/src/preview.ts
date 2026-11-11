import { readFile, realpath, stat } from "node:fs/promises";
import { createServer, type RequestListener, type Server } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const contentTypes: Record<string, string> = {
	".avif": "image/avif",
	".css": "text/css; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".ico": "image/x-icon",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".txt": "text/plain; charset=utf-8",
	".webp": "image/webp",
	".woff": "font/woff",
	".woff2": "font/woff2",
};
const compressible = new Set([".css", ".html", ".js", ".json", ".svg", ".txt"]);

function inside(root: string, path: string): boolean {
	return path === root || path.startsWith(`${root}${sep}`);
}

/** Static files/aliases only: never invoke SSR, list directories, or use an SPA fallback. */
export async function findStaticFile(
	rootDirectory: string,
	pathname: string,
): Promise<string | undefined> {
	const root = await realpath(rootDirectory);
	const decoded = decodeURIComponent(pathname);
	const candidate = resolve(root, `.${decoded}`);
	if (!inside(root, candidate))
		throw new URIError("Static path escapes the artifact");
	const candidates =
		candidate === root
			? [join(root, "index.html")]
			: [candidate, `${candidate}.html`, join(candidate, "index.html")];
	for (const path of candidates) {
		try {
			if ((await stat(path)).isFile() && inside(root, await realpath(path)))
				return path;
		} catch (error) {
			if (
				error instanceof Error &&
				"code" in error &&
				(error.code === "ENOENT" || error.code === "ENOTDIR")
			)
				continue;
			throw error;
		}
	}
	return undefined;
}

type StaticServerOptions = {
	root: string;
	headers?: Record<string, string>;
	compress?: boolean;
};

function preferredEncoding(header: string): "br" | "gzip" | undefined {
	const qualities = new Map(
		header.split(",").map((entry) => {
			const [name, ...parameters] = entry.trim().split(";");
			const q = parameters.find((part) => part.trim().startsWith("q="));
			return [name, q ? Number(q.trim().slice(2)) : 1] as const;
		}),
	);
	const br = qualities.get("br") ?? qualities.get("*") ?? 0;
	const gzip = qualities.get("gzip") ?? qualities.get("*") ?? 0;
	return br > 0 && br >= gzip ? "br" : gzip > 0 ? "gzip" : undefined;
}

export function createStaticHandler(
	options: StaticServerOptions,
): RequestListener {
	const root = resolve(options.root);
	return async (request, response) => {
		if (request.method !== "GET" && request.method !== "HEAD") {
			response.writeHead(405, { Allow: "GET, HEAD" }).end();
			return;
		}
		try {
			const url = new URL(request.url ?? "/", "http://localhost");
			const found = await findStaticFile(root, url.pathname);
			const file = found ?? (await findStaticFile(root, "/404.html"));
			if (!file) {
				response
					.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
					.end(request.method === "HEAD" ? undefined : "Not Found");
				return;
			}
			const status = found && url.pathname !== "/404.html" ? 200 : 404;
			const extension = extname(file).toLowerCase();
			const headers: Record<string, string | number> = {
				...options.headers,
				"Content-Type": contentTypes[extension] ?? "application/octet-stream",
				"Cache-Control":
					extension === ".html" || url.pathname === "/__deployment.json"
						? "no-cache, no-store, must-revalidate"
						: url.pathname.startsWith("/assets/") &&
								/-[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/.test(url.pathname)
							? "public, max-age=31536000, immutable"
							: "no-cache",
			};
			let body = await readFile(file);
			if (options.compress && compressible.has(extension)) {
				headers.Vary = "Accept-Encoding";
				const encoding = preferredEncoding(
					request.headers["accept-encoding"] ?? "",
				);
				if (encoding === "br")
					body = brotliCompressSync(body, {
						params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
					});
				if (encoding === "gzip") body = gzipSync(body, { level: 6 });
				if (encoding) headers["Content-Encoding"] = encoding;
			}
			headers["Content-Length"] = body.byteLength;
			response.writeHead(status, headers);
			response.end(request.method === "HEAD" ? undefined : body);
		} catch (error) {
			const status = error instanceof URIError ? 400 : 500;
			response.writeHead(status).end();
		}
	};
}

export async function startStaticServer(
	options: StaticServerOptions & { host?: string; port: number },
): Promise<Server> {
	await stat(join(options.root, "404.html"));
	const server = createServer(createStaticHandler(options));
	await new Promise<void>((resolve, reject) => {
		server.once("error", reject);
		server.listen(options.port, options.host ?? "127.0.0.1", () => {
			server.off("error", reject);
			resolve();
		});
	});
	return server;
}
