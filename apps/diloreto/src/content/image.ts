import type { ResponsiveImageData } from "@websites/images";

export type { ResponsiveImageData } from "@websites/images";

export type ContentImage = ResponsiveImageData & {
	alt: string;
	title: string;
};
