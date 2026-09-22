import {
	defineWebsitePlaywrightConfig,
	desktopProject,
} from "@websites/playwright-support/config";

const port = 4100;
const artifactMode = process.env.EXPECTED_ARTIFACT_MODE;
if (artifactMode !== "fixture" && artifactMode !== "production") {
	throw new Error("EXPECTED_ARTIFACT_MODE must be fixture or production");
}
const projectAuthSecret =
	artifactMode === "production"
		? "hermetic-project-secret"
		: "playwright-secret";

export default defineWebsitePlaywrightConfig({
	testMatch: "artifact.smoke.ts",
	fullyParallel: false,
	timeout: 60_000,
	workers: 1,
	retries: 0,
	projects: [desktopProject()],
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		colorScheme: "light",
	},
	webServer: {
		command: `PLAYWRIGHT_TEST=true PROJECT_AUTH_SECRET=${projectAuthSecret} EXPECTED_ARTIFACT_MODE=${artifactMode} ARTIFACT_PORT=${port} bun run scripts/serve-amplify-artifact.ts`,
		url: `http://127.0.0.1:${port}`,
		reuseExistingServer: false,
		timeout: 60_000,
	},
});
