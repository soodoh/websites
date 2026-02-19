import type { JSX } from "react";
import ArrowBack from "./arrow-back";
import ArrowForward from "./arrow-forward";
import ProjectThumbnail from "./project-thumbnail";
import type { Project } from "@/content/projects";
import { cn } from "@/lib/utils";

const ProjectContainer = ({
  project,
  isEven,
}: {
  project: Project;
  isEven: boolean;
}): JSX.Element => {
  return (
    <div
      className={cn(
        "text-dark-blue flex gap-8 justify-center max-md:flex-col",
        isEven
          ? "flex-row max-md:items-start"
          : "flex-row-reverse max-md:items-end",
      )}
    >
      <ProjectThumbnail project={project} />

      <div
        className={cn(
          "flex flex-col [&_h3]:text-2xl [&_h3]:m-0",
          isEven ? "items-start" : "items-end",
        )}
      >
        <h3>{project.title}</h3>

        <ul
          className={cn(
            "text-[1.2rem] leading-6 m-0 p-0 list-none [&_li]:p-0 [&_li]:my-4",
            isEven ? "[&_li]:text-left" : "[&_li]:text-right",
          )}
        >
          {project.bullets.map((bullet) => (
            <li key={`project-${project.title}-bullet-${bullet}`}>{bullet}</li>
          ))}
        </ul>

        <a
          className="mt-8 bg-light-yellow uppercase px-4 py-2 flex items-center gap-4"
          href={project.url}
        >
          {!isEven && <ArrowBack className="max-md:hidden" />}
          View Site
          {isEven && <ArrowForward className="max-md:hidden" />}
        </a>
      </div>
    </div>
  );
};

export default ProjectContainer;
