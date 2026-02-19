import { motion } from "motion/react";
import { Parallax } from "react-scroll-parallax";
import ArrowForward from "./arrow-forward";
import ContactButtons from "./contact-buttons";
import VerticalBar from "./vertical-bar";
import { about } from "@/content/about";

const Banner = (): JSX.Element => {
  return (
    <div className="h-screen flex flex-col bg-dark-blue text-light-yellow relative overflow-hidden">
      <Parallax
        className="background-title absolute top-[10vh] left-[8vw] max-sm:top-0 max-sm:left-4"
        translateY={[-60, 60]}
      >
        <motion.h1
          className="text-[10rem] leading-[11rem] my-[0.67em] max-sm:text-[8rem]"
          initial={{ opacity: 0, y: 500 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            y: { type: "spring", visualDuration: 1, bounce: 0.3 },
          }}
        >
          Paul
          <br />
          DiLoreto
        </motion.h1>
      </Parallax>

      <Parallax
        className="absolute top-[30vh] left-[11vw] z-5 max-sm:top-[25vh] max-sm:left-12 [&_h2]:m-0 [&_h2]:p-0 [&_p]:m-0 [&_p]:p-0"
        translateY={[5, -5]}
        translateX={[-10, 10]}
      >
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 1,
            y: { type: "spring", delay: 0.5, visualDuration: 1, bounce: 0.3 },
          }}
        >
          <h2 className="text-[3.7rem]">{about.title}</h2>

          <p className="text-2xl">{about.jobTitle}</p>

          <p className="text-base italic">{about.tagLine}</p>

          <a
            className="bg-light-blue text-dark-blue uppercase px-4 py-2 mt-12 inline-flex items-center gap-4 hover:bg-purple transition-colors duration-300 [&_line]:stroke-dark-blue [&_line]:fill-dark-blue [&_path]:stroke-dark-blue [&_path]:fill-dark-blue"
            href={`mailto:${about.email}`}
          >
            Contact Me
            <ArrowForward />
          </a>
        </motion.div>
      </Parallax>

      <div className="absolute bottom-32 right-16 max-sm:top-0 max-sm:left-12 max-sm:right-auto max-sm:z-[1100]">
        <ContactButtons />
      </div>

      <motion.div
        className="absolute bottom-0 w-full flex flex-col justify-center items-center p-4 gap-[5px]"
        initial={{ opacity: 0, y: 200 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 1,
          duration: 1,
          y: { type: "spring", delay: 1, visualDuration: 1, bounce: 0.3 },
        }}
      >
        <span>View More</span>
        <VerticalBar />
      </motion.div>
    </div>
  );
};

export default Banner;
