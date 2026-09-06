import { expect, test } from "bun:test";
import type { Route } from "@playwright/test";
import {
	candidateOrigin,
	candidateRequestAllowed,
	routeCandidateRequest,
} from "@/tests/candidate-policy";

const environment = {
	CAROLYN_CANDIDATE_BRANCH: "fixture-candidate",
	CAROLYN_CANDIDATE_APP_ID: "dfixture",
	AMPLIFY_BASE_URL: "https://fixture-candidate.dfixture.amplifyapp.com",
	AMPLIFY_EXPECTED_RELEASE_COMMIT: "b".repeat(40),
};

test("candidate harness accepts only explicit default-domain identity and exact SHA", () => {
	expect(candidateOrigin(environment)).toBe(environment.AMPLIFY_BASE_URL);
	for (const key of Object.keys(environment)) {
		expect(() =>
			candidateOrigin({ ...environment, [key]: undefined }),
		).toThrow();
	}
	for (const branch of [
		"main",
		"amplify-production",
		"sarabeth-production",
		"*",
		"bad/ref",
		"Upper",
		"-bad",
	]) {
		expect(() =>
			candidateOrigin({ ...environment, CAROLYN_CANDIDATE_BRANCH: branch }),
		).toThrow();
	}
	for (const url of [
		"https://carolyndiloreto.com",
		"https://carolyn.diloreto.com",
		"https://evil.invalid",
		`${environment.AMPLIFY_BASE_URL}/`,
		`${environment.AMPLIFY_BASE_URL}@evil.invalid`,
	]) {
		expect(() =>
			candidateOrigin({ ...environment, AMPLIFY_BASE_URL: url }),
		).toThrow();
	}
});

test("candidate browser blocks every off-origin request, including redirect and CDN targets", () => {
	const origin = candidateOrigin(environment);
	for (const path of [
		"/",
		"/assets/app.js",
		"/projects/magnolia-app",
		"/_serverFn/fixture",
	]) {
		expect(candidateRequestAllowed(origin + path, origin)).toBe(true);
	}
	for (const url of [
		"https://carolyndiloreto.com",
		"https://www.carolyndiloreto.com",
		"https://carolyn.diloreto.com",
		"https://images.ctfassets.net/image",
		`${origin}.evil.invalid`,
		origin.replace("https:", "http:"),
	]) {
		expect(candidateRequestAllowed(url, origin)).toBe(false);
	}
});

test("actual candidate route policy fetches without redirects and blocks every Location before browser follow", async () => {
	const origin = candidateOrigin(environment);
	for (const [url, location, expected] of [
		[`${origin}/`, undefined, ["fetch", "fulfill"]],
		[`${origin}/`, "", ["fetch", "abort"]],
		[`${origin}/`, "/about", ["fetch", "abort"]],
		[`${origin}/`, "https://carolyndiloreto.com", ["fetch", "abort"]],
		[`${origin}/`, "//carolyn.diloreto.com", ["fetch", "abort"]],
		["https://carolyndiloreto.com", undefined, ["abort"]],
	] as const) {
		const calls: string[] = [];
		const response = {
			status: () => (location !== undefined ? 302 : 200),
			headers: () => ({ location }),
		};
		const route = {
			request: () => ({ url: () => url }),
			fetch: async (options: unknown) => {
				calls.push("fetch");
				expect(options).toEqual({ maxRedirects: 0 });
				return response;
			},
			abort: async (reason: string) => {
				calls.push("abort");
				expect(reason).toBe("blockedbyclient");
			},
			fulfill: async (options: unknown) => {
				calls.push("fulfill");
				expect(options).toEqual({ response });
			},
		} as unknown as Route;
		await routeCandidateRequest(route, origin);
		expect(calls).toEqual([...expected]);
	}
});
