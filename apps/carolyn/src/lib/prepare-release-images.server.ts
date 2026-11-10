import { fallbackPlaceholder } from "@websites/images";
import { createContentfulPreviewLoader } from "@websites/images/contentful/server";
import { mapImages } from "@websites/images/server";
import { decodeImage } from "@/lib/image-type";
import type { ReleaseContentSnapshot } from "@/lib/release-content-model";

/** Prepare before public/protected partitioning; never emit a global image manifest. */
export async function prepareReleaseImages(
	snapshot: ReleaseContentSnapshot,
	loadPreview = createContentfulPreviewLoader(),
): Promise<ReleaseContentSnapshot> {
	const sources = new Set<string>();
	function collect(value: unknown): void {
		const image = decodeImage(value);
		if (image) {
			if (
				!image.placeholder.startsWith("data:image/") ||
				image.placeholder === fallbackPlaceholder
			)
				sources.add(image.url);
		} else if (Array.isArray(value)) value.forEach(collect);
		else if (value && typeof value === "object")
			Object.values(value).forEach(collect);
	}
	collect(snapshot);
	const previews = new Map(
		await mapImages(
			[...sources],
			async (source) => [source, await loadPreview(source)] as const,
		),
	);
	function replace(value: unknown): unknown {
		const image = decodeImage(value);
		if (image)
			return {
				...image,
				placeholder: previews.get(image.url) ?? image.placeholder,
			};
		if (Array.isArray(value)) return value.map(replace);
		if (value && typeof value === "object")
			return Object.fromEntries(
				Object.entries(value).map(([key, nested]) => [key, replace(nested)]),
			);
		return value;
	}
	return replace(snapshot) as ReleaseContentSnapshot;
}
