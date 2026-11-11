import assert from "node:assert/strict";
import { assertDeployedRelease } from "./release.ts";

/** Node-only and dependency-free: deployment jobs do not install workspaces. */
export function hostingEnvironment(
	defaultBaseUrl: string,
	environment: NodeJS.ProcessEnv = process.env,
) {
	return {
		baseUrl: new URL(environment.HOSTING_BASE_URL ?? defaultBaseUrl),
		expectAmplify: environment.HOSTING_EXPECT_AMPLIFY === "1",
		expectDomainRedirects: environment.HOSTING_EXPECT_DOMAIN_REDIRECTS === "1",
		expectedCommit: environment.HOSTING_EXPECT_COMMIT,
		expectedRunId: environment.HOSTING_EXPECT_RUN_ID,
		expectedRunAttempt: environment.HOSTING_EXPECT_RUN_ATTEMPT,
	};
}

export async function request(url: string | URL, options: RequestInit = {}) {
	const response = await fetch(url, {
		redirect: "manual",
		...options,
		signal: options.signal ?? AbortSignal.timeout(10_000),
	});
	return { response, body: await response.text() };
}

export function hasCacheDirective(
	headers: Headers,
	directive: string,
): boolean {
	return (headers.get("cache-control") ?? "")
		.toLowerCase()
		.split(",")
		.map((value) => value.trim())
		.includes(directive);
}

export function assertCacheDirectives(
	response: Response,
	directives: readonly string[],
	label: string,
) {
	assert(
		directives.every((directive) =>
			hasCacheDirective(response.headers, directive),
		),
		`${label} cache policy is incorrect: ${response.headers.get("cache-control")}`,
	);
}

export function assertSecurityHeaders(
	response: Response,
	expected: ReadonlyMap<string, string>,
	path = "/",
) {
	for (const [name, value] of expected) {
		assert(
			response.headers.get(name) === value,
			`${name} header is missing or incorrect for ${path}`,
		);
	}
}

export async function verifyReleaseMarker(
	environment: ReturnType<typeof hostingEnvironment>,
) {
	if (!environment.expectedCommit) return;
	const releaseUrl = new URL("/__deployment.json", environment.baseUrl);
	releaseUrl.searchParams.set("expectedCommit", environment.expectedCommit);
	const release = await request(releaseUrl, { cache: "no-store" });
	assert(
		release.response.status === 200,
		`Release marker returned ${release.response.status}`,
	);
	assertDeployedRelease(JSON.parse(release.body), {
		commit: environment.expectedCommit,
		runId: environment.expectedRunId,
		runAttempt: environment.expectedRunAttempt,
	});
	if (environment.expectAmplify) {
		assertCacheDirectives(
			release.response,
			["no-store", "must-revalidate"],
			"Release marker",
		);
	}
}
