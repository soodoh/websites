import {
	defineWebsitePlaywrightConfig,
	desktopProject,
	mobileProject,
} from "@websites/playwright-support/config";

const localBaseUrl = "http://127.0.0.1:4173";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? localBaseUrl;
const useLocalServer = process.env.PLAYWRIGHT_BASE_URL === undefined;
const sharedTests = [
	"browser/shared/**/*.spec.ts",
	"visual/**/*.visual.spec.ts",
];

export default defineWebsitePlaywrightConfig({
	use: { baseURL },
	projects: [
		desktopProject({
			testMatch: [...sharedTests, "browser/desktop/**/*.spec.ts"],
		}),
		mobileProject({
			testMatch: [...sharedTests, "browser/mobile/**/*.spec.ts"],
		}),
	],
	webServer: useLocalServer
		? {
				command: "bun run start",
				url: localBaseUrl,
				reuseExistingServer: !process.env.CI,
				timeout: 30_000,
			}
		: undefined,
});
