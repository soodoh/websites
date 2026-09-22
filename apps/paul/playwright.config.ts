import {
	defineWebsitePlaywrightConfig,
	desktopProject,
	mobileProject,
} from "@websites/playwright-support/config";

const localBaseUrl = "http://127.0.0.1:3000";
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const useStaticBuild = process.env.PLAYWRIGHT_STATIC === "1";
const sharedTests = [
	"browser/shared/**/*.spec.ts",
	"visual/**/*.visual.spec.ts",
];

export default defineWebsitePlaywrightConfig({
	use: {
		baseURL: externalBaseUrl ?? localBaseUrl,
		colorScheme: "dark",
	},
	projects: [
		desktopProject({
			testMatch: [...sharedTests, "browser/desktop/**/*.spec.ts"],
		}),
		mobileProject({
			testMatch: [...sharedTests, "browser/mobile/**/*.spec.ts"],
		}),
	],
	webServer: externalBaseUrl
		? undefined
		: {
				command: useStaticBuild
					? "bun run start"
					: "bun run dev --host 0.0.0.0",
				reuseExistingServer: !process.env.CI,
				timeout: 120_000,
				url: localBaseUrl,
			},
});
