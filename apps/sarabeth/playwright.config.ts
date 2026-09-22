import {
	defineWebsitePlaywrightConfig,
	desktopProject,
	mobileProject,
} from "@websites/playwright-support/config";

const port = 3000;
const sharedBrowserTests = [
	"browser/shared/**/*.spec.ts",
	"visual/**/*.visual.spec.ts",
];

export default defineWebsitePlaywrightConfig({
	workers: 2,
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		colorScheme: "light",
		timezoneId: "America/Los_Angeles",
	},
	projects: [
		desktopProject({
			testMatch: [...sharedBrowserTests, "browser/desktop/**/*.spec.ts"],
		}),
		mobileProject({
			testMatch: [...sharedBrowserTests, "browser/mobile/**/*.spec.ts"],
		}),
	],
	webServer: {
		command: `bun --no-env-file scripts/playwright-server.ts ${port}`,
		port,
		reuseExistingServer: false,
		timeout: 180_000,
	},
});
