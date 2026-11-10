import { fallbackPlaceholder } from "@websites/images";
import { requireContentfulImageUrl } from "@websites/images/contentful";
import { createRemotePreviewLoader } from "@websites/images/server";

export function createContentfulPreviewLoader(
	options: { fetch?: typeof globalThis.fetch } = {},
) {
	const load = createRemotePreviewLoader({
		...options,
		validateUrl: requireContentfulImageUrl,
	});
	return (source: string): Promise<string> => {
		const url = requireContentfulImageUrl(source);
		// Download hosts serve the original asset rather than applying image transforms.
		url.hostname = url.hostname.replace(/^downloads\./, "images.");
		url.searchParams.set("w", "64");
		url.searchParams.set("q", "40");
		url.searchParams.set("fm", "webp");
		// Previews are optional; preserve byte/decode limits without blocking a release.
		// URL validation stays outside this catch, and the loader evicts failed requests.
		return load(url.href).catch(() => fallbackPlaceholder);
	};
}
