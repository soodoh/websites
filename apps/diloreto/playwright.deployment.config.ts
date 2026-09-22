import {
	defineWebsitePlaywrightConfig,
	desktopProject,
} from "@websites/playwright-support/config";

const baseURL = process.env.PLAYWRIGHT_BASE_URL;
if (!baseURL) {
	throw new Error("PLAYWRIGHT_BASE_URL is required for deployment smoke tests");
}
if (new URL(baseURL).protocol !== "https:") {
	throw new Error("PLAYWRIGHT_BASE_URL must use HTTPS");
}

export default defineWebsitePlaywrightConfig({
	testDir: "./tests/deployment",
	testMatch: "**/*.spec.ts",
	fullyParallel: false,
	workers: 1,
	projects: [desktopProject()],
	use: { baseURL },
});
