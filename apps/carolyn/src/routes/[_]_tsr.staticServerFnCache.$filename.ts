import { createFileRoute } from "@tanstack/react-router";
import { serveStaticServerFunctionCache } from "@/lib/static-server-function-cache.server";

export const Route = createFileRoute("/__tsr/staticServerFnCache/$filename")({
	server: {
		handlers: {
			GET: ({ params }) => serveStaticServerFunctionCache(params.filename),
			ANY: () =>
				new Response(null, {
					headers: { Allow: "GET, HEAD" },
					status: 405,
				}),
		},
	},
});
