import assert from "node:assert/strict";

export type ReleaseIdentity = {
	commit: string;
	runId: string;
	runAttempt: string;
};

/** Build metadata may be local; deployed metadata must have numeric run fields. */
export function createReleaseIdentity(
	commit: string,
	runId = "local",
	runAttempt = "local",
): ReleaseIdentity {
	assert(
		commit === "local" || /^[a-f0-9]{40}$/i.test(commit),
		"Release commit must be a 40-character hexadecimal SHA or local.",
	);
	assert(
		[runId, runAttempt].every(
			(value) => value === "local" || /^\d+$/.test(value),
		),
		"Release run identity must be numeric or local.",
	);
	return { commit, runAttempt, runId };
}

export function assertDeployedRelease(
	value: unknown,
	expected: { commit: string; runId?: string; runAttempt?: string },
): asserts value is ReleaseIdentity {
	assert(value !== null && typeof value === "object", "Invalid release marker");
	const release = value as Record<string, unknown>;
	assert(
		typeof release.runId === "string" &&
			/^\d+$/.test(release.runId) &&
			typeof release.runAttempt === "string" &&
			/^\d+$/.test(release.runAttempt),
		"Release marker is missing its workflow run identity",
	);
	for (const [field, wanted] of Object.entries(expected)) {
		if (wanted !== undefined) {
			assert(
				release[field] === wanted,
				`Release marker ${field} does not match the expected release`,
			);
		}
	}
}
