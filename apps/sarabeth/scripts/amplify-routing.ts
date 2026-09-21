export type AmplifyTarget = {
	kind: string;
	src?: string;
	cacheControl?: string;
};

export type AmplifyRoute = {
	path: string;
	target: AmplifyTarget;
	fallback?: AmplifyTarget;
};

const computeTarget: AmplifyTarget = { kind: "Compute", src: "default" };
const staticTarget: AmplifyTarget = { kind: "Static" };
export const productionComputePaths = [
	"/api/email",
	"/api/youtube-playlist",
] as const;

export const createProductionRoutes = (
	routes: readonly AmplifyRoute[],
	prerenderedRoutes: readonly string[],
): AmplifyRoute[] => {
	const replacedPaths = new Set([
		...prerenderedRoutes,
		"/__deployment.json",
		"/__tsr/staticServerFnCache/*",
		...productionComputePaths,
		"/*",
	]);
	const remainingRoutes = routes
		.filter((route) => !replacedPaths.has(route.path))
		.map((route) =>
			route.target.kind === "Compute" || route.fallback?.kind === "Compute"
				? { ...route, target: staticTarget, fallback: undefined }
				: route,
		);

	return [
		{
			path: "/__deployment.json",
			target: { kind: "Static", cacheControl: "no-store" },
		},
		...prerenderedRoutes.map((path) => ({ path, target: staticTarget })),
		{
			path: "/__tsr/staticServerFnCache/*",
			target: {
				kind: "Static",
				cacheControl: "public, max-age=31536000, immutable",
			},
		},
		...productionComputePaths.map((path) => ({ path, target: computeTarget })),
		...remainingRoutes,
		{ path: "/*", target: staticTarget },
	];
};

export const resolveRouteTarget = (
	pathname: string,
	routes: readonly AmplifyRoute[],
): AmplifyTarget | undefined => {
	for (const route of routes) {
		if (route.path === pathname) return route.target;
		if (route.path === "/*.*" && /\/[^/]*\.[^/]+$/.test(pathname)) {
			return route.target;
		}
		if (route.path === "/*") return route.target;
	}
	return undefined;
};
