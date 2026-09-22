import { loadHome, waitForVisibleImages } from "../support/home";
import { expect, type Locator, type Page, test } from "../support/test";

const visualStates = [
	{ name: "top", target: undefined },
	{ name: "projects", target: "#projects" },
	{ name: "about", target: "#about" },
	{ name: "contact", target: "#contact" },
] as const;

async function settleAt(page: Page, target?: string): Promise<void> {
	let locator: Locator | undefined;
	if (target) {
		locator = page.locator(target);
		await locator.scrollIntoViewIfNeeded();
	} else {
		await page.evaluate(() => window.scrollTo(0, 0));
	}
	await page.evaluate(
		() =>
			new Promise<void>((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
			),
	);
	if (locator) await expect(locator).toBeInViewport();
	await waitForVisibleImages(page);
}

for (const state of visualStates) {
	test(`captures the ${state.name} state`, async ({ page }) => {
		await loadHome(page);
		await settleAt(page, state.target);
		await expect(page).toHaveScreenshot(`home-${state.name}.png`);
	});
}

test("captures the static not-found page", async ({ diagnostics, page }) => {
	diagnostics.allowResponse("/visual-not-found", 404);
	diagnostics.allowConsoleError(/Failed to load resource.*404/);
	const response = await page.goto("/visual-not-found");
	expect(response?.status()).toBe(404);
	await expect(
		page.getByRole("heading", { name: "404: Page Not Found", level: 1 }),
	).toBeVisible();
	await expect(page).toHaveScreenshot("not-found.png", { fullPage: true });
});

test("captures the open mobile navigation", { tag: "@mobile-only" }, async ({
	page,
}) => {
	await loadHome(page);
	await page.getByRole("button", { name: "Open Navigation" }).click();
	await expect(
		page.getByRole("button", { name: "Close Navigation" }),
	).toBeVisible();
	await expect(page).toHaveScreenshot("home-mobile-navigation-open.png");
});
