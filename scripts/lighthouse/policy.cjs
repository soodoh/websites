const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const root = resolve(__dirname, "../..");
const categories = ["performance", "accessibility", "best-practices", "seo"];
const formFactors = ["mobile", "desktop"];
const sites = {
	paul: {
		build: "build",
		server: "bun run start",
		ready: "Serving .* at",
		port: 3000,
		runner: "ubuntu-26.04",
	},
	diloreto: {
		build: "build",
		server: "bun run start",
		ready: "Accepting connections",
		port: 4173,
		runner: "ubuntu-26.04",
	},
	carolyn: {
		build: "build:production:test",
		server:
			"PLAYWRIGHT_TEST=true PROJECT_AUTH_SECRET=hermetic-project-secret EXPECTED_ARTIFACT_MODE=production ARTIFACT_PORT=4100 bun run scripts/serve-amplify-artifact.ts",
		ready: "Amplify artifact smoke server listening",
		port: 4100,
		additionalPorts: [3000],
		runner: "ubuntu-26.04-arm",
	},
	sarabeth: {
		build: "build:playwright:unchecked",
		server:
			"PLAYWRIGHT_SKIP_BUILD=1 bun --no-env-file scripts/playwright-server.ts 3000",
		ready: "Listening on",
		port: 3000,
		runner: "ubuntu-26.04-arm",
	},
};

function sitePolicy(site) {
	if (!Object.hasOwn(sites, site)) {
		throw new Error(`Unknown Lighthouse site: ${site}`);
	}
	const appRoot = resolve(root, "apps", site);
	const budgets = JSON.parse(
		readFileSync(resolve(appRoot, "lighthouse.json"), "utf8"),
	);
	validateBudgets(site, budgets);
	return { ...sites[site], appRoot, budgets };
}

function validateBudgets(site, budgets) {
	if (
		!Array.isArray(budgets.routes) ||
		budgets.routes.length === 0 ||
		new Set(budgets.routes).size !== budgets.routes.length ||
		budgets.routes.some(
			(route) =>
				typeof route !== "string" ||
				!/^\/(?!\/)[^?#\\]*$/.test(route) ||
				new URL(route, "http://127.0.0.1").origin !== "http://127.0.0.1",
		)
	) {
		throw new Error(`${site}: Lighthouse routes must be unique local paths`);
	}
	for (const formFactor of formFactors) {
		const baseline = budgets[formFactor];
		if (
			!baseline ||
			Object.keys(baseline).sort().join() !== [...categories].sort().join() ||
			categories.some(
				(category) =>
					typeof baseline[category] !== "number" ||
					!Number.isFinite(baseline[category]) ||
					baseline[category] <= 0 ||
					baseline[category] > 1,
			)
		) {
			throw new Error(`${site}: invalid ${formFactor} Lighthouse baselines`);
		}
	}
}

function lighthouseConfig(site, formFactor) {
	const policy = sitePolicy(site);
	if (!formFactors.includes(formFactor)) {
		throw new Error(`Unknown Lighthouse form factor: ${formFactor}`);
	}
	return {
		ci: {
			collect: {
				numberOfRuns: 3,
				url: policy.budgets.routes.map(
					(route) => `http://127.0.0.1:${policy.port}${route}`,
				),
				startServerCommand: `cd "${policy.appRoot}" && ${policy.server}`,
				startServerReadyPattern: policy.ready,
				startServerReadyTimeout: 120_000,
				settings: {
					...(formFactor === "desktop" ? { preset: "desktop" } : {}),
					onlyCategories: categories,
					chromeFlags: "--headless --no-sandbox --disable-dev-shm-usage",
				},
			},
			assert: {
				assertions: Object.fromEntries(
					categories.map((category) => [
						`categories:${category}`,
						[
							"error",
							{
								minScore: policy.budgets[formFactor][category],
								aggregationMethod: "median",
							},
						],
					]),
				),
			},
			upload: { target: "filesystem", outputDir: "reports" },
		},
	};
}

module.exports = {
	root,
	categories,
	formFactors,
	sites,
	sitePolicy,
	validateBudgets,
	lighthouseConfig,
};
