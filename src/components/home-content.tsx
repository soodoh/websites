import { ParallaxProvider } from "react-scroll-parallax";
import About from "./about";
import Projects from "./all-projects";
import Banner from "./banner";

const HomeContent = (): JSX.Element => {
  return (
    <ParallaxProvider>
      <Banner />
      <Projects />
      <About />
    </ParallaxProvider>
  );
};

export default HomeContent;
