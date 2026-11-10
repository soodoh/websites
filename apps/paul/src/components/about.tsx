import ResponsiveImage from "@websites/images/react";
import type { JSX } from "react";
import { about } from "@/content/about";
import Parallax from "./parallax";

const About = (): JSX.Element => {
	return (
		<div className="relative pt-12 px-[10vw] overflow-hidden">
			<Parallax
				className="background-title absolute max-xs:left-0"
				startY={-40}
				endY={60}
				startX={5}
				endX={-5}
			>
				<h2
					id="about"
					className="background-title-text text-[10rem] leading-[11rem] my-[0.67em] max-sm:text-[8rem]"
					data-title="About Me"
				>
					<span className="sr-only">About Me</span>
				</h2>
			</Parallax>

			<Parallax
				className="absolute top-16 right-12 w-[30vw] min-w-[200px] max-w-[400px] z-0 max-sm:relative max-sm:top-52 max-sm:right-0 max-sm:w-full max-sm:px-12 max-sm:mx-auto [&_img]:opacity-80 [&_img]:w-full [&_img]:h-auto"
				startY={10}
				endY={-60}
			>
				<ResponsiveImage
					image={about.image}
					alt="Paul DiLoreto"
					sizes="(width < 700px) min(calc(80vw - 6rem), 304px), (width < 1333px) 30vw, 400px"
				/>
			</Parallax>

			<div className="text-light-yellow mt-[6.5rem] grid grid-cols-[5rem_auto] gap-y-12 max-xs:grid-cols-1 relative z-5 [&>h3]:text-2xl [&>h3]:text-light-blue [&>h3]:m-0">
				<h3>About</h3>

				<div className="pr-[min(30vw,400px)] max-sm:pr-0 [&_p]:m-0 [&_p]:mb-2">
					{about.bio.map((paragraph) => (
						<p key={`about-paragraph-${paragraph}`}>{paragraph}</p>
					))}
				</div>

				<h3>Focus</h3>

				<div className="grid grid-cols-2 gap-x-10 gap-y-8 max-sm:grid-cols-1">
					{about.focusAreas.map(({ title, description }) => (
						<article
							key={`focus-area-${title}`}
							className="border-l-2 border-light-blue pl-4"
						>
							<h4 className="text-xl text-light-blue mt-0 mb-2">{title}</h4>
							<p className="m-0">{description}</p>
						</article>
					))}
				</div>
			</div>
		</div>
	);
};

export default About;
