import { installContentfulRoutes } from "@tests/support/contentful-routes";
import { installYouTubePlaylistRoute } from "@tests/support/youtube-playlist-route";
import {
	test as diagnosticsTest,
	expect,
} from "@websites/playwright-support/test";

const fixedBrowserTime = new Date("2026-01-01T12:00:00.000Z");

const test = diagnosticsTest.extend<{
	contentfulRoutes: undefined;
	fixedBrowserTime: undefined;
	youtubePlaylistRoute: undefined;
}>({
	fixedBrowserTime: [
		async ({ page }, use) => {
			await page.clock.install({ time: fixedBrowserTime });
			await use(undefined);
		},
		{ auto: true },
	],
	contentfulRoutes: [
		async ({ context }, use) => {
			await installContentfulRoutes(context);
			await use(undefined);
		},
		{ auto: true },
	],
	youtubePlaylistRoute: [
		async ({ context }, use) => {
			await installYouTubePlaylistRoute(context);
			await use(undefined);
		},
		{ auto: true },
	],
});

export type { Locator, Page } from "@websites/playwright-support/test";
export { expect, test };
