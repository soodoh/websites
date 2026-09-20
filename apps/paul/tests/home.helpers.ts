import { expect, type Locator, type Page } from "@playwright/test";

export const loadHome = async (page: Page): Promise<void> => {
	const browserErrors: string[] = [];
	page.on("pageerror", (error) => browserErrors.push(error.message));
	page.on("response", (response) => {
		if (response.status() >= 400) {
			browserErrors.push(`${response.status()} ${response.url()}`);
		}
	});

	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: "Paul DiLoreto", level: 1 }),
	).toBeVisible();
	await page.waitForLoadState("networkidle");
	await page.evaluate(async () => {
		await document.fonts.ready;
	});
	await expect(browserErrors).toEqual([]);
};

export const scrollToPercentage = async (
	page: Page,
	percentage: number,
): Promise<void> => {
	await page.evaluate(async (scrollPercentage) => {
		const root = document.documentElement;
		const previousScrollBehavior = root.style.scrollBehavior;
		root.style.scrollBehavior = "auto";

		const maximumScroll = root.scrollHeight - window.innerHeight;
		window.scrollTo(0, maximumScroll * (scrollPercentage / 100));

		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});

		root.style.scrollBehavior = previousScrollBehavior;
	}, percentage);
};

export const waitForVisibleImages = async (page: Page): Promise<void> => {
	await page.evaluate(async () => {
		const visibleImages = Array.from(document.images).filter((image) => {
			const bounds = image.getBoundingClientRect();
			return bounds.bottom >= 0 && bounds.top <= window.innerHeight;
		});

		await Promise.all(
			visibleImages.map(async (image) => {
				if (!image.complete) {
					await new Promise<void>((resolve, reject) => {
						image.addEventListener("load", () => resolve(), { once: true });
						image.addEventListener(
							"error",
							() =>
								reject(new Error(`Failed to load image: ${image.currentSrc}`)),
							{ once: true },
						);
					});
				}

				if (image.naturalWidth === 0) {
					throw new Error(`Image has no decoded width: ${image.currentSrc}`);
				}
				await image.decode();
			}),
		);
	});
};

export const expectExternalNavigation = async (
	page: Page,
	link: Locator,
	expectedUrl: string,
): Promise<void> => {
	await expect(link).toHaveAttribute("href", expectedUrl);
	await page.route(expectedUrl, async (route) => {
		await route.fulfill({
			body: "<!doctype html><title>External destination</title>",
			contentType: "text/html",
			status: 200,
		});
	});

	await Promise.all([page.waitForURL(expectedUrl), link.click()]);
	await expect(page).toHaveURL(expectedUrl);
};
