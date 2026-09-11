/**
 * @param {import('@playwright/test').BrowserContext} context
 * @param {string} origin
 * @param {string | undefined} mode
 */
export async function installRecoveryBrowserGuard(context, origin, mode) {
	const expected =
		mode === "candidate"
			? "https://candidate.d121ux7va6hz6j.amplifyapp.com"
			: mode === "fixture"
				? "http://127.0.0.1:3000"
				: undefined;
	if (origin !== expected) throw new Error("Wrong recovery origin");
	await context.routeWebSocket("**/*", (socket) => socket.close());
	await context.route("**/*", async (route) => {
		const url = new URL(route.request().url());
		if (url.origin !== origin || url.username || url.password) {
			await route.abort("blockedbyclient");
			return;
		}
		const response = await route.fetch({ maxRedirects: 0, maxRetries: 0 });
		if (
			response.status() >= 300 &&
			response.status() < 400 &&
			response.headers().location !== undefined
		) {
			await route.abort("blockedbyclient");
		} else {
			await route.fulfill({ response });
		}
		await response.dispose();
	});
}
