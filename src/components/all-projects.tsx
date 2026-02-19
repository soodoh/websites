import type { JSX } from "react";
import React from "react";
import { Parallax } from "react-scroll-parallax";
import ProjectContainer from "./project-container";
import VerticalBar from "@/components/vertical-bar";
import { projects } from "@/content/projects";

const AllProjects = (): JSX.Element => {
  return (
    <div
      className="z-[1] w-full relative flex flex-col bg-light-blue py-80 px-40 max-xs:px-8 max-xs:py-0"
      style={{
        background: `linear-gradient(to bottom,
          var(--color-dark-blue),
          var(--color-light-blue) 20%,
          var(--color-light-blue) 45%,
          var(--color-purple) 55%,
          var(--color-purple) 80%,
          var(--color-dark-blue))`,
      }}
    >
      <Parallax
        className="background-title z-[2] text-lighter-blue absolute top-0 left-[8vw] max-xs:left-8"
        translateY={[-30, 150]}
        translateX={[-10, 10]}
      >
        <h1 className="text-[10rem] leading-[11rem] my-[0.67em] max-sm:text-[8rem]">
          Projects
        </h1>
      </Parallax>

      <div
        id="projects"
        className="z-[2] flex flex-col gap-8 items-center justify-center pt-60 text-dark-blue"
      >
        {projects.map((project, index) => (
          <React.Fragment key={`project-${project.title}`}>
            <ProjectContainer project={project} isEven={index % 2 === 0} />

            {index < projects.length - 1 && <VerticalBar dark />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default AllProjects;
