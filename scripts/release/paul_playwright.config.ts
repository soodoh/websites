import config from "../../apps/paul/playwright.config";
import guard from "./paul_acceptance_guard.cjs";

const origin = guard.origin(process.env.PAUL_ACCEPTANCE_MODE);
if (process.env.PAUL_RECOVERY_ORIGIN !== origin) throw Error("Wrong candidate origin");
export default {
	...config,
	testDir: "../../apps/paul/e2e",
	// Playwright removes outputDir; it must be a child, not the tmpfs mount root.
	outputDir: "/work/apps/paul/test-results/run",
	reporter: [["list"], ["html", { open: "never", outputFolder: "/work/apps/paul/playwright-report/run" }]],
	retries: 0,
	webServer: undefined,
	use: {
		...config.use,
		baseURL: origin,
		launchOptions: { args: guard.browserArgs() },
	},
};
