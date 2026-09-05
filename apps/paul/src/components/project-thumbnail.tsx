import type { JSX } from "react";
import type { Project } from "@/content/projects";

const ProjectThumbnail = ({ project }: { project: Project }): JSX.Element => {
	return (
		<div className="relative flex justify-center items-start min-w-[400px] max-w-[600px] w-1/2 max-md:mt-8 max-md:w-full max-md:min-w-0 max-md:max-w-full">
			<div
				aria-hidden="true"
				className="absolute -top-8 z-[3] max-w-full whitespace-nowrap bg-light-yellow text-dark-blue p-4 m-0 font-header font-medium text-5xl max-md:text-4xl max-xs:text-3xl"
			>
				{project.title}
			</div>

			<picture className="block w-full">
				<source
					type="image/avif"
					srcSet={project.image.avifSrcSet}
					sizes="(width < 960px) 80vw, (width < 1400px) 400px, min(calc(50vw - 10rem), 600px)"
				/>
				<source
					type="image/webp"
					srcSet={project.image.webpSrcSet}
					sizes="(width < 960px) 80vw, (width < 1400px) 400px, min(calc(50vw - 10rem), 600px)"
				/>
				<img
					className="w-full h-auto opacity-50"
					alt={project.ariaLabel}
					src={project.image.src}
					width={project.image.width}
					height={project.image.height}
					loading="lazy"
					decoding="async"
				/>
			</picture>
		</div>
	);
};

export default ProjectThumbnail;
