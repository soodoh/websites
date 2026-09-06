import { defineConfig } from "@playwright/test";

import { candidateOrigin } from "./tests/candidate-policy";

const deploymentUrl = candidateOrigin(process.env);

export default defineConfig({
	testDir: "tests",
	testMatch: "amplify.candidate.smoke.ts",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	failOnFlakyTests: Boolean(process.env.CI),
	timeout: 60_000,
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	reporter: [["list"]],
	projects: [
		{
			name: "desktop",
			use: { viewport: { width: 1440, height: 900 } },
		},
		{
			name: "mobile",
			use: {
				viewport: { width: 390, height: 844 },
				isMobile: true,
				hasTouch: true,
			},
		},
	],
	use: {
		baseURL: deploymentUrl,
		serviceWorkers: "block",
		colorScheme: "light",
		locale: "en-US",
		screenshot: "only-on-failure",
		trace: "retain-on-failure",
	},
});
