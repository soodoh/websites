import type { ImgHTMLAttributes, JSX } from "react";
import type { ResponsiveImageData } from "./policy";

type Props = Omit<
	ImgHTMLAttributes<HTMLImageElement>,
	"src" | "srcSet" | "width" | "height" | "alt" | "sizes"
> & {
	image: ResponsiveImageData;
	alt: string;
	sizes: string;
	pictureClassName?: string;
};

/** Native selection works in prerendered HTML, before hydration and without an image service. */
export default function ResponsiveImage({
	image,
	alt,
	sizes,
	pictureClassName = "",
	loading = "lazy",
	decoding = "async",
	...props
}: Props): JSX.Element {
	return (
		<picture className={`block ${pictureClassName}`.trim()}>
			{Object.entries(image.sources).map(([format, srcSet]) => (
				<source
					key={format}
					type={`image/${format === "jpg" ? "jpeg" : format}`}
					srcSet={srcSet}
					sizes={sizes}
				/>
			))}
			<img
				{...props}
				src={image.img.src}
				alt={alt}
				sizes={sizes}
				width={image.img.w}
				height={image.img.h}
				loading={loading}
				decoding={decoding}
			/>
		</picture>
	);
}
