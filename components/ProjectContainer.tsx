import classNames from "classnames/bind";
import Link from "next/link";
import React from "react";
import ArrowBack from "./ArrowBack";
import ArrowForward from "./ArrowForward";
import styles from "./ProjectContainer.module.css";
import ProjectThumbnail from "./ProjectThumbnail";
import type { Project } from "@/content/projects";

const cx = classNames.bind(styles);

const ProjectContainer = ({
  project,
  isEven,
}: {
  project: Project;
  isEven: boolean;
}) => {
  return (
    <div className={cx(styles.container, { oddContainer: !isEven })}>
      <ProjectThumbnail project={project} />

      <div className={cx(styles.description, { oddDescription: !isEven })}>
        <h3>{project.title}</h3>

        <ul className={cx(styles.bullets, { oddBullets: !isEven })}>
          {project.bullets.map((bullet, index) => (
            <li key={`project-${project.title}-bullet-${index}`}>{bullet}</li>
          ))}
        </ul>

        <Link className={styles.viewButton} href={project.url}>
          {!isEven && <ArrowBack className={styles.arrow} />}
          View Site
          {isEven && <ArrowForward className={styles.arrow} />}
        </Link>
      </div>
    </div>
  );
};

export default ProjectContainer;
