import {
	fallbackPlaceholder,
	type ResponsiveImageData,
} from "@websites/images";

export type YouTubeThumbnail = { url: string; width?: number; height?: number };

export function requireYouTubeThumbnailUrl(source: string): URL {
	const url = new URL(source);
	if (
		url.protocol !== "https:" ||
		url.username ||
		url.password ||
		url.port ||
		(url.hostname !== "ytimg.com" && !url.hostname.endsWith(".ytimg.com"))
	) {
		throw new Error("YouTube thumbnails must use an approved HTTPS host");
	}
	return url;
}

/** Use only real renditions of the same aspect ratio, never fabricated resize URLs. */
export function prepareYouTubeImage(
	source: string,
	thumbnails: readonly YouTubeThumbnail[] = [],
	placeholder = fallbackPlaceholder,
): ResponsiveImageData {
	requireYouTubeThumbnailUrl(source);
	for (const thumbnail of thumbnails) {
		requireYouTubeThumbnailUrl(thumbnail.url);
		for (const dimension of [thumbnail.width, thumbnail.height]) {
			if (
				dimension !== undefined &&
				(!Number.isSafeInteger(dimension) || dimension <= 0)
			)
				throw new Error("Thumbnail dimensions must be positive integers");
		}
	}
	const selected = thumbnails.find((thumbnail) => thumbnail.url === source);
	const [width, height] =
		selected?.width !== undefined && selected?.height !== undefined
			? [selected.width, selected.height]
			: [320, 180];
	const candidates = thumbnails.filter(
		(thumbnail): thumbnail is { url: string; width: number; height: number } =>
			Number.isSafeInteger(thumbnail.width) &&
			Number.isSafeInteger(thumbnail.height) &&
			(thumbnail.width ?? 0) > 0 &&
			(thumbnail.height ?? 0) > 0 &&
			Math.abs(
				(thumbnail.width ?? 0) / (thumbnail.height ?? 1) - width / height,
			) < 0.02,
	);
	const byWidth = new Map(
		candidates.map((thumbnail) => [thumbnail.width, thumbnail]),
	);
	const srcSet = [...byWidth.values()]
		.sort((a, b) => a.width - b.width)
		.map((thumbnail) => `${thumbnail.url} ${thumbnail.width}w`)
		.join(", ");
	return {
		sources: {},
		placeholder,
		img: { src: source, w: width, h: height, ...(srcSet ? { srcSet } : {}) },
	};
}

export function getYouTubePreviewSource(
	source: string,
	thumbnails: readonly YouTubeThumbnail[],
): string {
	const image = prepareYouTubeImage(source, thumbnails);
	return (
		thumbnails
			.filter(
				(thumbnail) =>
					thumbnail.width &&
					thumbnail.height &&
					Math.abs(
						thumbnail.width / thumbnail.height - image.img.w / image.img.h,
					) < 0.02,
			)
			.sort((a, b) => (a.width ?? Infinity) - (b.width ?? Infinity))[0]?.url ??
		source
	);
}
