import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

export const desktopViewport = { width: 1440, height: 900 } as const;
export const mobileViewport = { width: 390, height: 844 } as const;

const outputRoot = process.env.PLAYWRIGHT_OUTPUT_ROOT ?? ".";

const defaults = defineConfig({
	testDir: "./tests",
	outputDir: `${outputRoot}/test-results`,
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	failOnFlakyTests: Boolean(process.env.CI),
	timeout: 45_000,
	workers: process.env.CI ? 2 : undefined,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI
		? [
				["github"],
				[
					"html",
					{ open: "never", outputFolder: `${outputRoot}/playwright-report` },
				],
			]
		: [
				["list"],
				[
					"html",
					{ open: "never", outputFolder: `${outputRoot}/playwright-report` },
				],
			],
	snapshotPathTemplate:
		"{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}",
	expect: {
		timeout: 10_000,
		toHaveScreenshot: {
			animations: "disabled",
			caret: "hide",
			maxDiffPixelRatio: 0.001,
			scale: "css",
			threshold: 0.1,
		},
	},
	use: {
		browserName: "chromium",
		deviceScaleFactor: 1,
		locale: "en-US",
		screenshot: "only-on-failure",
		serviceWorkers: "block",
		timezoneId: "UTC",
		trace: "retain-on-failure",
	},
});

export function defineWebsitePlaywrightConfig(
	config: PlaywrightTestConfig,
): PlaywrightTestConfig {
	return defineConfig(defaults, config);
}

export function desktopProject(
	overrides: NonNullable<PlaywrightTestConfig["projects"]>[number] = {},
): NonNullable<PlaywrightTestConfig["projects"]>[number] {
	return {
		name: "desktop",
		grepInvert: /@mobile-only/,
		...overrides,
		use: {
			viewport: desktopViewport,
			...overrides.use,
		},
	};
}

export function mobileProject(
	overrides: NonNullable<PlaywrightTestConfig["projects"]>[number] = {},
): NonNullable<PlaywrightTestConfig["projects"]>[number] {
	return {
		name: "mobile",
		grepInvert: /@desktop-only/,
		...overrides,
		use: {
			hasTouch: true,
			isMobile: true,
			viewport: mobileViewport,
			...overrides.use,
		},
	};
}
