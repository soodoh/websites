import type { JSX } from "react";
import ImageWrapper from "@/components/image-wrapper";
import OffsetShadow from "@/components/offset-shadow";
import type { ImageType } from "@/utils/types";

type Props = {
	image: ImageType;
	title: string;
};

const BannerImage = ({ title, image }: Props): JSX.Element => {
	return (
		<div className="relative flex h-[500px] w-full items-center justify-center bg-foreground bg-cover bg-center">
			<ImageWrapper
				image={image}
				pictureClassName="absolute inset-0 z-0 h-full w-full"
				className="h-full w-full object-cover"
				priority
				sizes="100vw"
			/>
			<OffsetShadow type="bannerTitle" direction="left">
				<h1 className="m-0 bg-accent px-20 py-6 font-sans text-[1.7rem] font-thin uppercase tracking-wide text-background-light max-sm:bg-accent-dark max-sm:text-base">
					{title}
				</h1>
			</OffsetShadow>
		</div>
	);
};

export default BannerImage;
