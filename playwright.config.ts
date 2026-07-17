import { defineConfig } from "@playwright/test";

const desktopViewport = { width: 1440, height: 900 };
const mobileViewport = { width: 390, height: 844 };

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	reporter: [["list"], ["html", { open: "never" }]],
	snapshotPathTemplate:
		"{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}",
	use: {
		baseURL: "http://127.0.0.1:3000",
		browserName: "chromium",
		colorScheme: "dark",
		deviceScaleFactor: 1,
		screenshot: "only-on-failure",
		serviceWorkers: "block",
		trace: "retain-on-failure",
	},
	projects: [
		{
			name: "desktop",
			use: { viewport: desktopViewport },
		},
		{
			name: "mobile",
			use: {
				hasTouch: true,
				viewport: mobileViewport,
			},
		},
	],
	webServer: {
		command: "PLAYWRIGHT_TEST=1 bun run dev --host 0.0.0.0",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		url: "http://127.0.0.1:3000",
	},
});
