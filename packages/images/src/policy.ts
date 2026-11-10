/** Immediate fallback when an external preview is unavailable. No network request. */
export const fallbackPlaceholder =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Cpath fill='%23808080' d='M0 0h1v1H0z'/%3E%3C/svg%3E";

export const responsiveWidths = [240, 320, 480, 640, 960, 1440, 2160];

/** Shared by local build output and Contentful's responsive URL adapters. */
export function getImageWidths(
	intrinsicWidth: number,
	widths: readonly number[] = responsiveWidths,
	maximumWidth = 2160,
): number[] {
	if (!Number.isSafeInteger(intrinsicWidth) || intrinsicWidth <= 0) {
		throw new Error("Images require a positive integer intrinsic width");
	}
	if (!Number.isSafeInteger(maximumWidth) || maximumWidth <= 0) {
		throw new Error("Images require a positive integer maximum width");
	}
	const terminalWidth = Math.min(intrinsicWidth, maximumWidth);
	return [
		...new Set([
			...widths.filter(
				(width) =>
					Number.isSafeInteger(width) && width > 0 && width < terminalWidth,
			),
			terminalWidth,
		]),
	].sort((a, b) => a - b);
}

/** Compatible with vite-imagetools' picture output and serializable in static HTML. */
export type ResponsiveImageData = {
	sources: Record<string, string>;
	img: { src: string; srcSet?: string; w: number; h: number };
	placeholder?: string;
};
