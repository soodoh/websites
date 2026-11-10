import { getImageWidths } from "@websites/images";
import {
	imagetools,
	type OutputFormat,
	type ProcessedImage,
	resolveConfigs,
} from "vite-imagetools";

const formatOf = (image: ProcessedImage): string =>
	image.transforms.format === "jpg" ? "jpeg" : String(image.transforms.format);

/** Prefer larger images when a smaller rendition actually costs more bytes. */
function removeWastefulWidths(images: ProcessedImage[]): ProcessedImage[] {
	let smallestBytes = Number.POSITIVE_INFINITY;
	const bestAtWidth = new Map<number, ProcessedImage>();
	for (const image of images) {
		const previous = bestAtWidth.get(image.info.width);
		if (
			!previous ||
			(image.sharpMetadata.size ?? Infinity) <
				(previous.sharpMetadata.size ?? Infinity)
		)
			bestAtWidth.set(image.info.width, image);
	}
	return [...bestAtWidth.values()]
		.sort((a, b) => b.info.width - a.info.width)
		.filter((image) => {
			const bytes = image.sharpMetadata.size;
			if (bytes === undefined) throw new Error("Encoded image size is missing");
			if (bytes >= smallestBytes) return false;
			smallestBytes = bytes;
			return true;
		})
		.reverse();
}

/** Avoid serving a modern format that is larger than the fallback at any candidate width. */
export const optimizedPicture: OutputFormat = () => (images) => {
	const formats = [...new Set(images.map(formatOf))];
	const fallbackFormat = formats.at(-1);
	if (!fallbackFormat) throw new Error("Responsive image has no fallback");
	const byFormat = new Map(
		formats.map((format) => [
			format,
			removeWastefulWidths(
				images.filter((image) => formatOf(image) === format),
			),
		]),
	);
	const fallback = byFormat.get(fallbackFormat);
	if (!fallback?.length)
		throw new Error("Responsive image has no fallback candidates");
	let preferred = fallback;
	const selected = new Set([fallbackFormat]);
	for (const format of formats.slice(0, -1).reverse()) {
		const candidates = byFormat.get(format);
		if (!candidates?.length) continue;
		// Compare the actual assets a browser could choose, after pruning widths.
		const widths = new Set(
			[...preferred, ...candidates].map((image) => image.info.width),
		);
		const atWidth = (group: ProcessedImage[], width: number) =>
			group.find((image) => image.info.width >= width) ??
			group[group.length - 1];
		if (
			[...widths].every(
				(width) =>
					(atWidth(candidates, width).sharpMetadata.size ?? Infinity) <
					(atWidth(preferred, width).sharpMetadata.size ?? 0),
			)
		) {
			selected.add(format);
			preferred = candidates;
		}
	}
	const largest = fallback[fallback.length - 1];
	return {
		sources: Object.fromEntries(
			formats
				.filter((format) => selected.has(format))
				.map((format) => [
					format,
					byFormat
						.get(format)
						?.map((image) => `${image.src} ${image.info.width}w`)
						.join(", "),
				]),
		),
		img: { src: largest.src, w: largest.info.width, h: largest.info.height },
	};
};

/** Build-only encoding; browser code imports policy.ts, never Sharp or Vite. */
export function responsiveImages() {
	return imagetools({
		include: /\.(?:heif|avif|jpeg|jpg|png|tiff|webp|gif)(?:\?.*)?$/i,
		defaultDirectives: async (url, readMetadata) => {
			if (!url.searchParams.has("responsive")) return new URLSearchParams();
			const metadata = await readMetadata();
			if ((metadata.pages ?? 1) > 1) {
				throw new Error(
					`Animated images require an explicit untransformed import: ${url.pathname}`,
				);
			}
			const lossless = url.searchParams.get("kind") === "diagram";
			const tryLossless =
				url.searchParams.get("kind") !== "photo" &&
				/\.(gif|png)$/i.test(url.pathname);
			const fallback = /\.gif$/i.test(url.pathname)
				? "gif"
				: lossless || metadata.hasAlpha
					? "png"
					: "jpeg";
			return new URLSearchParams({
				w: getImageWidths(metadata.autoOrient.width).join(";"),
				format: lossless ? `webp;${fallback}` : `avif;webp;${fallback}`,
				quality: "82",
				lossless: String(lossless),
				tryLossless: String(tryLossless),
				as: "optimizedPicture",
			});
		},
		resolveConfigs: (entries, outputFormats) =>
			resolveConfigs(entries, outputFormats).flatMap((config) => {
				const base = {
					...config,
					...(config.lossless === "true" || config.format === "gif"
						? { quality: "100" }
						: {}),
					...(config.format === "avif" ? { quality: "60", effort: "4" } : {}),
				};
				return config.tryLossless === "true" &&
					config.lossless !== "true" &&
					config.format === "webp"
					? [base, { ...base, lossless: "true", quality: "100" }]
					: [base];
			}),
		extendOutputFormats: (formats) => ({ ...formats, optimizedPicture }),
	});
}
