import { ParallaxProvider } from "react-scroll-parallax";
import About from "./About";
import Projects from "./AllProjects";
import Banner from "./Banner";

const HomeContent = () => {
  return (
    <ParallaxProvider>
      <Banner />
      <Projects />
      <About />
    </ParallaxProvider>
  );
};

export default HomeContent;
