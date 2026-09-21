import manifest from "@/lib/generated-release/project-auth-manifest.server.json";
import type { ProjectAuthManifest } from "@/lib/project-auth-manifest-builder";

const projectAuth = new Map(Object.entries(manifest as ProjectAuthManifest));

export function getProjectAuth(slug: string) {
	return projectAuth.get(slug);
}

export function isReleasedProjectSlug(slug: string): boolean {
	return projectAuth.has(slug);
}
