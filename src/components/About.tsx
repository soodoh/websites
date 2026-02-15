import { Image } from "@unpic/react";
import { Fragment } from "react";
import { Parallax } from "react-scroll-parallax";
import { about } from "@/content/about";

const About = () => {
  return (
    <div className="relative pt-12 px-[10vw] overflow-hidden">
      <Parallax
        className="background-title absolute max-xs:left-0"
        translateY={[-40, 60]}
        translateX={[5, -5]}
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
        translateY={[10, -60]}
      >
        <Image
          src={about.image}
          alt="Profile photo of Paul DiLoreto"
          layout="fullWidth"
        />
      </Parallax>

      <div className="text-light-yellow mt-[6.5rem] grid grid-cols-[5rem_auto] max-xs:grid-cols-1 relative z-5 [&_h2]:text-2xl [&_h2]:text-light-blue [&_h2]:m-0">
        <h2>About</h2>

        <div className="pr-40 max-sm:pr-0 [&_p]:m-0 [&_p]:mb-2">
          {about.bio.map((paragraph, index) => (
            <p key={`about-paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>

        <h2>Skills</h2>

        <div className="[&_h3]:text-2xl [&_h3]:m-0 [&_h3]:mb-4 [&_ul]:text-[1.2rem] [&_ul]:m-0 [&_ul]:mb-4 [&_ul]:p-0 [&_ul]:grid [&_ul]:grid-cols-[50%_50%] [&_ul]:ml-2 [&_ul]:list-none max-sm:[&_ul]:grid-cols-1 [&_li]:before:content-['+'] [&_li]:before:pr-2">
          {about.skills.map(({ title, bullets }) => (
            <Fragment key={`skill-category-${title}`}>
              <h3>{title}</h3>
              <ul>
                {bullets.map((bullet, index) => (
                  <li key={`skill-${title}-${index}`}>{bullet}</li>
                ))}
              </ul>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
