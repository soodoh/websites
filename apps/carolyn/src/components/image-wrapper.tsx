import { prepareContentfulImage } from "@websites/images/contentful";
import ResponsiveImage from "@websites/images/react";
import type { JSX } from "react";
import type { ImageType } from "@/lib/types";

const IMAGE_BREAKPOINTS = [
	32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840,
];

type Props = {
	image: ImageType;
	alt?: string;
	breakpoints?: number[];
	quality?: number;
	priority?: boolean;
	sizes?: string;
	className?: string;
	pictureClassName?: string;
	onLoad?: () => void;
	placeholderFit?: "contain" | "cover";
};

const ImageWrapper = ({
	image,
	alt = image.description,
	breakpoints = IMAGE_BREAKPOINTS,
	quality = 80,
	priority = false,
	className = "w-full h-auto object-contain",
	pictureClassName = "w-full",
	onLoad,
	placeholderFit = "cover",
	sizes = "(max-width: 399px) 184px, (max-width: 519px) 244px, (max-width: 639px) 200px, (max-width: 767px) 156px, (max-width: 1023px) 220px, (max-width: 1279px) 280px, 280px",
}: Props): JSX.Element => (
	<ResponsiveImage
		image={prepareContentfulImage(image, {
			widths: breakpoints,
			maximumDimension: 4000,
			quality,
		})}
		alt={alt}
		sizes={sizes}
		className={className}
		pictureClassName={pictureClassName}
		placeholderFit={placeholderFit}
		onLoad={onLoad}
		loading={priority ? "eager" : "lazy"}
		fetchPriority={priority ? "high" : "auto"}
	/>
);

export default ImageWrapper;
