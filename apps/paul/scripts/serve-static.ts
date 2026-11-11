import { startStaticServer } from "@websites/static-site/preview";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? "3000");
await startStaticServer({
	root: process.env.STATIC_DIR ?? "dist/client",
	host,
	port,
	compress: true,
	headers: {
		"Permissions-Policy":
			"camera=(), geolocation=(), microphone=(), payment=(), usb=()",
		"Referrer-Policy": "strict-origin-when-cross-origin",
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options": "DENY",
	},
});
console.log(`Serving static artifact at http://${host}:${port}`);
