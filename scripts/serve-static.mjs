import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const root = resolve(process.env.STATIC_DIR ?? "dist/client");
const host = process.env.HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const contentTypes = new Map([
	[".avif", "image/avif"],
	[".css", "text/css; charset=utf-8"],
	[".html", "text/html; charset=utf-8"],
	[".ico", "image/x-icon"],
	[".jpeg", "image/jpeg"],
	[".jpg", "image/jpeg"],
	[".js", "text/javascript; charset=utf-8"],
	[".json", "application/json; charset=utf-8"],
	[".png", "image/png"],
	[".svg", "image/svg+xml"],
	[".webp", "image/webp"],
	[".woff", "font/woff"],
	[".woff2", "font/woff2"],
]);

const compressibleExtensions = new Set([
	".css",
	".html",
	".js",
	".json",
	".svg",
]);
const imageExtensions = new Set([".avif", ".jpeg", ".jpg", ".png", ".webp"]);

const isFile = async (path) => {
	try {
		return (await stat(path)).isFile();
	} catch {
		return false;
	}
};

const resolveRequestPath = async (pathname) => {
	const decodedPath = decodeURIComponent(pathname);
	const relativePath = normalize(decodedPath).replace(/^[/\\]+/, "");
	const candidate = resolve(join(root, relativePath || "index.html"));

	if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
		return undefined;
	}

	if (await isFile(candidate)) {
		return candidate;
	}

	const directoryIndex = join(candidate, "index.html");
	if (await isFile(directoryIndex)) {
		return directoryIndex;
	}

	return undefined;
};

const server = createServer(async (request, response) => {
	if (request.method !== "GET" && request.method !== "HEAD") {
		response.writeHead(405, { Allow: "GET, HEAD" });
		response.end();
		return;
	}

	try {
		const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
		const requestedFile = await resolveRequestPath(url.pathname);
		const file = requestedFile ?? join(root, "404.html");
		const status = requestedFile && url.pathname !== "/404.html" ? 200 : 404;

		if (!(await isFile(file))) {
			response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
			response.end("404: Page Not Found");
			return;
		}

		const extension = extname(file).toLowerCase();
		const headers = {
			"Cache-Control": "public, max-age=3600, must-revalidate",
			"Content-Type": contentTypes.get(extension) ?? "application/octet-stream",
			"Permissions-Policy":
				"camera=(), geolocation=(), microphone=(), payment=(), usb=()",
			"Referrer-Policy": "strict-origin-when-cross-origin",
			"X-Content-Type-Options": "nosniff",
			"X-Frame-Options": "DENY",
		};

		if (extension === ".html") {
			headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
		} else if (
			url.pathname.startsWith("/assets/") &&
			/-[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/.test(url.pathname)
		) {
			headers["Cache-Control"] = "public, max-age=31536000, immutable";
		} else if (imageExtensions.has(extension)) {
			headers["Cache-Control"] = "public, max-age=86400, must-revalidate";
		}

		const rawBody = await readFile(file);
		const acceptedEncodings = request.headers["accept-encoding"] ?? "";
		let body = rawBody;
		if (
			compressibleExtensions.has(extension) &&
			acceptedEncodings.includes("br")
		) {
			body = brotliCompressSync(rawBody, {
				params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
			});
			headers["Content-Encoding"] = "br";
			headers.Vary = "Accept-Encoding";
		} else if (
			compressibleExtensions.has(extension) &&
			acceptedEncodings.includes("gzip")
		) {
			body = gzipSync(rawBody, { level: 6 });
			headers["Content-Encoding"] = "gzip";
			headers.Vary = "Accept-Encoding";
		}

		headers["Content-Length"] = body.byteLength;
		response.writeHead(status, headers);
		response.end(request.method === "HEAD" ? undefined : body);
	} catch (error) {
		console.error(error);
		response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
		response.end("Bad Request");
	}
});

server.listen(port, host, () => {
	console.log(`Serving ${root} at http://${host}:${port}`);
});
