import protectedProjects from "@/lib/generated-release/protected-project-content.server.json";
import type { ProjectInfo } from "@/lib/types";

const projects = protectedProjects as unknown as Record<string, ProjectInfo>;

export function getProtectedReleaseProject(
	slug: string,
): ProjectInfo | undefined {
	return projects[slug];
}
