import { expect, type Locator, type Page } from "@playwright/test";

export async function expectSuccessfulNavigation(
	page: Page,
	path: string,
): Promise<void> {
	const response = await page.goto(path);
	expect(response, `navigation response for ${path}`).not.toBeNull();
	expect(response?.status(), `HTTP status for ${path}`).toBe(200);
}

export async function waitForFonts(page: Page): Promise<void> {
	await page.evaluate(async () => document.fonts.ready);
}

export async function expectImagesLoaded(
	images: Locator,
	options: {
		onlyVisible?: boolean;
		skipAriaHidden?: boolean;
		scrollIntoView?: boolean;
	} = {},
): Promise<void> {
	const count = await images.count();
	for (let index = 0; index < count; index += 1) {
		const image = images.nth(index);
		if (options.onlyVisible && !(await image.isVisible())) continue;
		if (
			options.skipAriaHidden &&
			(await image.evaluate(
				(element) => element.closest("[aria-hidden='true']") !== null,
			))
		) {
			continue;
		}
		if (options.scrollIntoView) await image.scrollIntoViewIfNeeded();
		await expect
			.poll(() =>
				image.evaluate(
					(element) =>
						element instanceof HTMLImageElement &&
						element.complete &&
						element.naturalWidth > 0 &&
						element.naturalHeight > 0,
				),
			)
			.toBe(true);
		await image.evaluate(async (element) => {
			if (element instanceof HTMLImageElement) await element.decode();
		});
	}
}

export async function finishAnimations(page: Page): Promise<void> {
	await page.evaluate(async () => {
		for (const animation of document.getAnimations()) {
			try {
				animation.finish();
			} catch {
				animation.cancel();
			}
		}
		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
		);
	});
}

export async function resetVisualState(page: Page): Promise<void> {
	await page.evaluate(() => {
		window.scrollTo(0, 0);
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
	});
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}
