import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type AmplifyRouteTarget = Record<string, unknown> & {
	kind: string;
	src?: string;
	cacheControl?: string;
};
export type AmplifyRoute = Record<string, unknown> & {
	path: string;
	target: AmplifyRouteTarget;
	fallback?: AmplifyRouteTarget;
};
export type AmplifyDeployManifest = Record<string, unknown> & {
	version: 1;
	routes: AmplifyRoute[];
	computeResources?: { name: string; entrypoint: string; runtime: string }[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isTarget(value: unknown): value is AmplifyRouteTarget {
	return (
		isRecord(value) &&
		typeof value.kind === "string" &&
		(value.src === undefined || typeof value.src === "string") &&
		(value.cacheControl === undefined || typeof value.cacheControl === "string")
	);
}

/** Shape validation only. Compute allowlists, ordering, and cache policy belong to each app. */
export async function readAmplifyDeployManifest(
	root: string,
): Promise<AmplifyDeployManifest> {
	const value: unknown = JSON.parse(
		await readFile(join(root, "deploy-manifest.json"), "utf8"),
	);
	if (
		!isRecord(value) ||
		value.version !== 1 ||
		!Array.isArray(value.routes) ||
		!value.routes.every(
			(route) =>
				isRecord(route) &&
				typeof route.path === "string" &&
				isTarget(route.target) &&
				(route.fallback === undefined || isTarget(route.fallback)),
		) ||
		(value.computeResources !== undefined &&
			(!Array.isArray(value.computeResources) ||
				!value.computeResources.every(
					(resource) =>
						isRecord(resource) &&
						typeof resource.name === "string" &&
						typeof resource.entrypoint === "string" &&
						typeof resource.runtime === "string",
				)))
	) {
		throw new Error("Amplify generated an invalid deployment manifest.");
	}
	return value as AmplifyDeployManifest;
}

/** Match emitted Amplify wildcard patterns; callers retain manifest traversal order. */
export function matchesAmplifyRoute(
	pathname: string,
	pattern: string,
): boolean {
	const parts = pattern.split("*");
	const first = parts[0];
	if (parts.length === 1) return pathname === pattern;
	if (first === undefined || !pathname.startsWith(first)) return false;
	let cursor = first.length;
	for (const part of parts.slice(1, -1)) {
		const next = pathname.indexOf(part, cursor);
		if (next === -1) return false;
		cursor = next + part.length;
	}
	const last = parts.at(-1);
	return last !== undefined && pathname.slice(cursor).endsWith(last);
}
