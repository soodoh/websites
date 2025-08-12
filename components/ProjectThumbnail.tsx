import Image from "next/image";
import React from "react";
import styles from "./ProjectThumbnail.module.css";
import type { Project } from "@/content/projects";

const ProjectThumbnail = ({ project }: { project: Project }) => {
  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <h3 className={styles.title}>{project.title}</h3>
      </div>

      <Image
        className={styles.thumbnail}
        alt={project.ariaLabel}
        src={project.image}
      />
    </div>
  );
};

export default ProjectThumbnail;
