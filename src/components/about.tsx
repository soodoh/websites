import { Image } from "@unpic/react";
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
				<h1
					id="about"
					className="text-[10rem] leading-[11rem] my-[0.67em] max-sm:text-[8rem]"
				>
					About Me
				</h1>
			</Parallax>

			<Parallax
				className="absolute top-16 right-12 w-[30vw] min-w-[200px] max-w-[400px] z-0 max-sm:relative max-sm:top-52 max-sm:right-0 max-sm:w-full max-sm:px-12 max-sm:mx-auto [&_img]:opacity-80 [&_img]:w-full [&_img]:h-auto"
				startY={10}
				endY={-60}
			>
				<Image
					src={about.image}
					alt="Profile photo of Paul DiLoreto"
					layout="fullWidth"
				/>
			</Parallax>

			<div className="text-light-yellow mt-[6.5rem] grid grid-cols-[5rem_auto] gap-y-12 max-xs:grid-cols-1 relative z-5 [&_h2]:text-2xl [&_h2]:text-light-blue [&_h2]:m-0">
				<h2>About</h2>

				<div className="pr-[min(30vw,400px)] max-sm:pr-0 [&_p]:m-0 [&_p]:mb-2">
					{about.bio.map((paragraph) => (
						<p key={`about-paragraph-${paragraph}`}>{paragraph}</p>
					))}
				</div>

				<h2>Focus</h2>

				<div className="grid grid-cols-2 gap-x-10 gap-y-8 max-sm:grid-cols-1">
					{about.focusAreas.map(({ title, description }) => (
						<article
							key={`focus-area-${title}`}
							className="border-l-2 border-light-blue pl-4"
						>
							<h3 className="text-xl text-light-blue mt-0 mb-2">{title}</h3>
							<p className="m-0">{description}</p>
						</article>
					))}
				</div>
			</div>
		</div>
	);
};

export default About;
