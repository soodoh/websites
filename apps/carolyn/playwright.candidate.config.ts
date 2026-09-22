import {
	defineWebsitePlaywrightConfig,
	desktopProject,
	mobileProject,
} from "@websites/playwright-support/config";
import { candidateOrigin } from "./tests/candidate-policy";

const deploymentUrl = candidateOrigin(process.env);

export default defineWebsitePlaywrightConfig({
	testMatch: "amplify.candidate.smoke.ts",
	fullyParallel: false,
	timeout: 60_000,
	workers: 1,
	projects: [desktopProject(), mobileProject()],
	use: {
		baseURL: deploymentUrl,
		colorScheme: "light",
	},
});
