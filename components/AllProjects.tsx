import VerticalBar from "@/components/VerticalBar";
import { projects } from "@/content/projects";
import titleStyles from "@/styles/backgroundTitle.module.css";
import cx from "classnames";
import React from "react";
import { Parallax } from "react-scroll-parallax";
import styles from "./AllProjects.module.css";
import ProjectContainer from "./ProjectContainer";

const AllProjects = () => {
  return (
    <div className={styles.gradientContainer}>
      <Parallax
        className={cx(titleStyles.title, styles.projectTitle)}
        translateY={[-30, 150]}
        translateX={[-10, 10]}
      >
        <h1>Projects</h1>
      </Parallax>

      <div id="projects" className={styles.projectsContainer}>
        {projects.map((project, index) => (
          <React.Fragment key={`project-${index}`}>
            <ProjectContainer project={project} isEven={index % 2 === 0} />

            {index < projects.length - 1 && <VerticalBar dark />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default AllProjects;
