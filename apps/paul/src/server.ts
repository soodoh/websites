import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { acceptNotFoundPrerender } from "@websites/static-site/server";

export default createServerEntry({
	async fetch(request, options) {
		return acceptNotFoundPrerender(
			request,
			await handler.fetch(request, options),
		);
	},
});
