import {
	defineWebsitePlaywrightConfig,
	desktopProject,
	mobileProject,
} from "@websites/playwright-support/config";

// Deliberately ignores PLAYWRIGHT_BASE_URL: this gate must test packaged files.
const port = 4200;
export default defineWebsitePlaywrightConfig({
	workers: 2,
	testMatch: [
		"browser/shared/not-found.spec.ts",
		"browser/static/**/*.spec.ts",
	],
	outputDir: "test-results/static",
	reporter: [
		["list"],
		["html", { open: "never", outputFolder: "test-results/static-report" }],
	],
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		colorScheme: "light",
		timezoneId: "America/Los_Angeles",
	},
	projects: [desktopProject(), mobileProject()],
	webServer: {
		command: `bun --no-env-file scripts/playwright-static-server.ts ${port}`,
		url: `http://127.0.0.1:${port}`,
		reuseExistingServer: false,
		timeout: 30_000,
	},
});
