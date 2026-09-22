import {
	test as base,
	type ConsoleMessage,
	expect,
	type Request,
	type Response,
} from "@playwright/test";

type MessageMatcher = string | RegExp;

export type RuntimeDiagnostics = {
	allowConsoleError: (matcher: MessageMatcher) => void;
	allowPageError: (matcher: MessageMatcher) => void;
	allowRequestFailure: (matcher: MessageMatcher) => void;
	allowResponse: (path: MessageMatcher, status: number) => void;
};

export type DiagnosticFixtures = {
	diagnostics: RuntimeDiagnostics;
};

const criticalResourceTypes = new Set(["document", "script", "stylesheet"]);

function matches(value: string, matcher: MessageMatcher): boolean {
	return typeof matcher === "string" ? value === matcher : matcher.test(value);
}

function isAllowed(value: string, matchers: MessageMatcher[]): boolean {
	return matchers.some((matcher) => matches(value, matcher));
}

export const test = base.extend<DiagnosticFixtures>({
	diagnostics: [
		async ({ baseURL, page }, use) => {
			const consoleErrors: string[] = [];
			const pageErrors: string[] = [];
			const failedRequests: string[] = [];
			const badResponses: string[] = [];
			const allowedConsoleErrors: MessageMatcher[] = [];
			const allowedPageErrors: MessageMatcher[] = [];
			const allowedRequestFailures: MessageMatcher[] = [];
			const allowedResponses: Array<{
				path: MessageMatcher;
				status: number;
			}> = [];
			const configuredOrigin = baseURL ? new URL(baseURL).origin : undefined;
			const isCriticalSameOriginRequest = (request: Request): boolean => {
				if (!criticalResourceTypes.has(request.resourceType())) return false;
				if (!configuredOrigin) return true;
				return new URL(request.url()).origin === configuredOrigin;
			};
			const responseIsAllowed = (response: Response): boolean => {
				const path = new URL(response.url()).pathname;
				return allowedResponses.some(
					(allowed) =>
						allowed.status === response.status() && matches(path, allowed.path),
				);
			};
			const onConsole = (message: ConsoleMessage) => {
				if (message.type() === "error") consoleErrors.push(message.text());
			};
			const onPageError = (error: Error) => pageErrors.push(error.message);
			const onRequestFailed = (request: Request) => {
				if (!isCriticalSameOriginRequest(request)) return;
				failedRequests.push(
					`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? "unknown failure"}`,
				);
			};
			const onResponse = (response: Response) => {
				if (
					response.status() >= 400 &&
					isCriticalSameOriginRequest(response.request()) &&
					!responseIsAllowed(response)
				) {
					badResponses.push(`${response.status()} ${response.url()}`);
				}
			};

			page.on("console", onConsole);
			page.on("pageerror", onPageError);
			page.on("requestfailed", onRequestFailed);
			page.on("response", onResponse);

			await use({
				allowConsoleError: (matcher) => allowedConsoleErrors.push(matcher),
				allowPageError: (matcher) => allowedPageErrors.push(matcher),
				allowRequestFailure: (matcher) => allowedRequestFailures.push(matcher),
				allowResponse: (path, status) =>
					allowedResponses.push({ path, status }),
			});

			if (!page.isClosed()) await page.waitForTimeout(50);
			expect(
				consoleErrors.filter(
					(message) => !isAllowed(message, allowedConsoleErrors),
				),
				"unexpected browser console errors",
			).toEqual([]);
			expect(
				pageErrors.filter((message) => !isAllowed(message, allowedPageErrors)),
				"unexpected uncaught page errors",
			).toEqual([]);
			expect(
				failedRequests.filter(
					(message) => !isAllowed(message, allowedRequestFailures),
				),
				"unexpected failed critical browser requests",
			).toEqual([]);
			expect(badResponses, "unexpected critical HTTP error responses").toEqual(
				[],
			);
		},
		{ auto: true },
	],
});

export type { Locator, Page } from "@playwright/test";
export { expect } from "@playwright/test";
