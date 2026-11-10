import { prepareContentfulImage } from "@websites/images/contentful";
import ResponsiveImage from "@websites/images/react";
import type { JSX } from "react";
import type { ImageType } from "@/utils/types";

export const responsiveWidths = [
	640, 750, 828, 960, 1080, 1280, 1668, 1920, 2048, 2560, 3200, 3840,
];

type Props = {
	image: ImageType;
	alt?: string;
	priority?: boolean;
	sizes?: string;
	widths?: number[];
	className?: string;
	pictureClassName?: string;
	placeholderFit?: "cover" | "contain";
};

const ImageWrapper = ({
	image,
	alt = image.description,
	priority = false,
	sizes = "(max-width: 639px) 100vw, (max-width: 767px) 400px, (max-width: 1023px) 600px, (max-width: 1279px) 800px, 400px",
	widths = responsiveWidths,
	className = "h-full w-full object-cover",
	pictureClassName = "h-full w-full",
	placeholderFit = "cover",
}: Props): JSX.Element => (
	<ResponsiveImage
		image={prepareContentfulImage(image, { widths, maximumDimension: 3840 })}
		alt={alt}
		sizes={sizes}
		className={className}
		style={{ aspectRatio: image.width / image.height }}
		pictureClassName={pictureClassName}
		placeholderFit={placeholderFit}
		loading={priority ? "eager" : "lazy"}
		fetchPriority={priority ? "high" : "auto"}
	/>
);

export default ImageWrapper;
