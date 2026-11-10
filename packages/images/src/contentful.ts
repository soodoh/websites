import { getImageWidths, type ResponsiveImageData } from "@websites/images";

export type ContentfulImage = {
	url: string;
	width: number;
	height: number;
	placeholder: string;
};

export function requireContentfulImageUrl(source: string): URL {
	const url = new URL(source);
	if (
		url.protocol !== "https:" ||
		url.username ||
		url.password ||
		url.port ||
		![
			"images.ctfassets.net",
			"images.contentful.com",
			"downloads.ctfassets.net",
			"downloads.contentful.com",
		].includes(url.hostname)
	)
		throw new Error("Contentful images must use an approved HTTPS host");
	return url;
}

/** Pure URL construction: fixtures may use local URLs; live loaders validate remote URLs. */
export function contentfulImageUrl(
	source: string,
	width: number,
	quality = 80,
): string {
	const local = source.startsWith("/") && !source.startsWith("//");
	const url = new URL(source, local ? "http://localhost" : undefined);
	url.searchParams.set("w", String(width));
	url.searchParams.set("q", String(quality));
	url.searchParams.set("fm", "webp");
	return local ? `${url.pathname}${url.search}${url.hash}` : url.href;
}

export function getContentfulDimensions(
	image: Pick<ContentfulImage, "width" | "height">,
	maximumDimension: number,
) {
	if (
		!Number.isSafeInteger(image.width) ||
		!Number.isSafeInteger(image.height) ||
		image.width <= 0 ||
		image.height <= 0
	) {
		throw new Error("Images require positive integer dimensions");
	}
	const scale = Math.min(
		1,
		maximumDimension / image.width,
		maximumDimension / image.height,
	);
	return {
		width: Math.max(1, Math.round(image.width * scale)),
		height: Math.max(1, Math.round(image.height * scale)),
		aspectRatio: image.width / image.height,
	};
}

export function prepareContentfulImage(
	image: ContentfulImage,
	{
		widths,
		maximumDimension = 3840,
		quality = 80,
	}: {
		widths?: readonly number[];
		maximumDimension?: number;
		quality?: number;
	} = {},
): ResponsiveImageData {
	const { width, height } = getContentfulDimensions(image, maximumDimension);
	const candidates = getImageWidths(width, widths, maximumDimension);
	return {
		placeholder: image.placeholder,
		sources: {},
		img: {
			src: contentfulImageUrl(image.url, width, quality),
			srcSet: candidates
				.map(
					(candidate) =>
						`${contentfulImageUrl(image.url, candidate, quality)} ${candidate}w`,
				)
				.join(", "),
			w: width,
			h: height,
		},
	};
}
