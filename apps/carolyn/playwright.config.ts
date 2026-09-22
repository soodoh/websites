import {
	defineWebsitePlaywrightConfig,
	desktopProject,
	mobileProject,
} from "@websites/playwright-support/config";

const port = 4000;
if (
	process.env.EXPECTED_ARTIFACT_MODE !== "production" ||
	process.env.HERMETIC_ARTIFACT_TEST !== "true"
) {
	throw new Error(
		"Browser tests require the production-shaped hermetic Amplify artifact.",
	);
}

export default defineWebsitePlaywrightConfig({
	testMatch: "**/*.spec.ts",
	fullyParallel: false,
	timeout: 60_000,
	workers: 1,
	expect: { timeout: 30_000 },
	projects: [
		desktopProject({ grepInvert: /@mobile-only/ }),
		mobileProject({ grepInvert: /@desktop-only/ }),
	],
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		colorScheme: "light",
	},
	webServer: {
		command: `PLAYWRIGHT_TEST=true PROJECT_AUTH_SECRET=hermetic-project-secret EXPECTED_ARTIFACT_MODE=production ARTIFACT_PORT=${port} bun run scripts/serve-amplify-artifact.ts`,
		url: `http://127.0.0.1:${port}`,
		reuseExistingServer: false,
		timeout: 180_000,
	},
});
