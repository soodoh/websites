import type { Route } from "@playwright/test";

export function candidateOrigin(environment: NodeJS.ProcessEnv): string {
	const branch = environment.CAROLYN_CANDIDATE_BRANCH;
	const appId = environment.CAROLYN_CANDIDATE_APP_ID;
	if (
		!branch ||
		!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(branch) ||
		["main", "amplify-production", "sarabeth-production"].includes(branch) ||
		!appId ||
		!/^d[a-z0-9]+$/.test(appId)
	) {
		throw new Error("Explicit isolated candidate branch/app identity required");
	}
	const origin = `https://${branch}.${appId}.amplifyapp.com`;
	if (
		environment.AMPLIFY_BASE_URL !== origin ||
		!/^[a-f0-9]{40}$/.test(environment.AMPLIFY_EXPECTED_RELEASE_COMMIT ?? "")
	) {
		throw new Error(
			"Exact candidate default-domain origin and release SHA required",
		);
	}
	return origin;
}

export function candidateRequestAllowed(url: string, origin: string): boolean {
	return new URL(url).origin === origin;
}

export async function routeCandidateRequest(
	route: Route,
	origin: string,
): Promise<void> {
	const url = route.request().url();
	if (!candidateRequestAllowed(url, origin)) {
		await route.abort("blockedbyclient");
		return;
	}
	// Chromium bypasses route interception after a fulfilled redirect, even to a
	// same-origin first hop. Never give the browser any Location to follow.
	const response = await route.fetch({ maxRedirects: 0 });
	const location = response.headers().location;
	if (
		response.status() >= 300 &&
		response.status() < 400 &&
		location !== undefined
	) {
		await route.abort("blockedbyclient");
		return;
	}
	await route.fulfill({ response });
}
