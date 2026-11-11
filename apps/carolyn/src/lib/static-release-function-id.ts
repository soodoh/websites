import { createHash } from "node:crypto";

/** Build-only IDs: immutable route-data URLs must change with their public content. */
export function createReleaseFunctionId(publicContent: string) {
	const releaseVersion = createHash("sha256")
		.update(publicContent)
		.digest("hex");

	return ({
		filename,
		functionName,
	}: {
		filename: string;
		functionName: string;
	}): string | undefined => {
		if (!filename.endsWith("/release-server-functions.ts")) return undefined;
		return createHash("sha256")
			.update(JSON.stringify([filename, functionName, releaseVersion]))
			.digest("hex");
	};
}
