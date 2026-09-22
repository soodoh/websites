import { expect, test } from "../support/test";
import { prepareFullPage } from "../support/visual";

test("home page", async ({ page }) => {
	await page.goto("/");
	await prepareFullPage(page);
	await expect(page).toHaveScreenshot("home-page.png", {
		animations: "disabled",
		fullPage: true,
	});
});

test("family history page", async ({ page }) => {
	test.setTimeout(90_000);
	await page.goto("/areyou");
	await prepareFullPage(page);
	await expect(page).toHaveScreenshot("areyou-page.png", {
		fullPage: true,
	});
});

test("selected family tree", async ({ page }) => {
	await page.goto("/familytree?person=I103");
	const chart = page.getByRole("application", {
		name: "Interactive family relationship chart",
	});
	await expect(chart).toBeVisible();
	await expect(chart.locator(".family-tree-node-focus")).toBeVisible();
	await page.evaluate(async () => document.fonts.ready);
	await expect(page).toHaveScreenshot("family-tree-selected.png", {
		threshold: 0.2,
	});
});
