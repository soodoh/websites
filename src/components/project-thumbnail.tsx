import { Image } from "@unpic/react";
import type { Project } from "@/content/projects";

const ProjectThumbnail = ({
  project,
}: {
  project: Project;
}): JSX.Element => {
  return (
    <div className="relative flex justify-center items-start min-w-[400px] max-w-[600px] w-1/2 max-md:w-full max-md:mt-8">
      <h2 className="absolute -top-8 z-[3] whitespace-nowrap bg-light-yellow text-dark-blue p-4 m-0 font-header text-5xl">
        {project.title}
      </h2>

      <Image
        className="w-full h-auto opacity-50"
        alt={project.ariaLabel}
        src={project.image}
        layout="fullWidth"
      />
    </div>
  );
};

export default ProjectThumbnail;
