const externalUrl = process.env.LHCI_URL;

module.exports = {
	ci: {
		collect: {
			numberOfRuns: 3,
			url: [externalUrl ?? "http://127.0.0.1:3000/"],
			...(externalUrl
				? {}
				: {
						startServerCommand: "bun run start",
						startServerReadyPattern: "Serving .* at",
						startServerReadyTimeout: 120_000,
					}),
			settings: {
				chromeFlags: "--headless --no-sandbox --disable-dev-shm-usage",
				formFactor: "mobile",
				screenEmulation: {
					disabled: false,
					width: 390,
					height: 844,
					deviceScaleFactor: 1,
					mobile: true,
				},
			},
		},
		assert: {
			assertions: {
				"categories:performance": [
					"error",
					{ minScore: 0.9, aggregationMethod: "median" },
				],
				"categories:accessibility": [
					"error",
					{ minScore: 1, aggregationMethod: "median" },
				],
				"categories:best-practices": [
					"error",
					{ minScore: 1, aggregationMethod: "median" },
				],
				"categories:seo": [
					"error",
					{ minScore: 1, aggregationMethod: "median" },
				],
			},
		},
		upload: {
			target: "filesystem",
			outputDir: ".lighthouseci/reports",
		},
	},
};
