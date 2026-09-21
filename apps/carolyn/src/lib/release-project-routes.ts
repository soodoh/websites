import projectRoutes from "@/lib/generated-release/project-routes.json";

export type ReleaseProjectRoute = "protected" | "public";

const routes = projectRoutes as Record<string, ReleaseProjectRoute>;

export function getReleaseProjectRoute(
	slug: string,
): ReleaseProjectRoute | undefined {
	return routes[slug];
}

export function getPublicReleaseProjectSlugs(): string[] {
	return Object.entries(routes).flatMap(([slug, route]) =>
		route === "public" ? [slug] : [],
	);
}

export function getProtectedReleaseProjectSlugs(): string[] {
	return Object.entries(routes).flatMap(([slug, route]) =>
		route === "protected" ? [slug] : [],
	);
}
