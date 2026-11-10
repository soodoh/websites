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
		url.searchParams.set("w", "64");
		url.searchParams.set("q", "40");
		url.searchParams.set("fm", "webp");
		return load(url.href);
	};
}
