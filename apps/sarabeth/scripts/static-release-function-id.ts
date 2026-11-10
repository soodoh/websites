import { createHash, randomUUID } from "node:crypto";

/** One identity per build, including content-only releases of an unchanged commit. */
export function createStaticReleaseFunctionId(
	releaseId: string = randomUUID(),
) {
	return ({
		filename,
		functionName,
	}: {
		filename: string;
		functionName: string;
	}): string | undefined => {
		if (!filename.endsWith("/utils/server-functions.ts")) return undefined;
		return createHash("sha256")
			.update(JSON.stringify([filename, functionName, releaseId]))
			.digest("hex");
	};
}
