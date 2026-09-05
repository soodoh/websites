import type { JSX } from "react";
import About from "./about";
import Projects from "./all-projects";
import Banner from "./banner";
import { ParallaxMotionProvider } from "./parallax-motion";

const HomeContent = (): JSX.Element => {
	return (
		<ParallaxMotionProvider>
			<Banner />
			<Projects />
			<About />
		</ParallaxMotionProvider>
	);
};

export default HomeContent;
