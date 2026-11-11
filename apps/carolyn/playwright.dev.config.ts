import {
	defineWebsitePlaywrightConfig,
	desktopProject,
} from "@websites/playwright-support/config";

const port = Number(process.env.DEV_SMOKE_PORT ?? "4399");
const baseURL = `http://127.0.0.1:${port}`;

export default defineWebsitePlaywrightConfig({
	testDir: "./tests/development",
	testMatch: "**/*.spec.ts",
	projects: [desktopProject()],
	workers: 1,
	use: { baseURL },
	webServer: {
		command: `bun run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
		url: baseURL,
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
			PLAYWRIGHT_TEST: "true",
			PROJECT_AUTH_SECRET: "playwright-secret",
			AMPLIFY_ARTIFACT_MODE: "fixture",
		},
	},
});
