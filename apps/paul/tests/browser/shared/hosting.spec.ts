import { expect, test } from "../../support/test";

const canonicalUrl = "https://pauldiloreto.com/";

test("home exposes canonical metadata and static assets", async ({ page }) => {
	const response = await page.goto("/");

	expect(response?.status()).toBe(200);
	await expect(
		page.getByRole("heading", { name: "Paul DiLoreto", level: 1 }),
	).toBeVisible();
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		"href",
		canonicalUrl,
	);
	await expect(page.locator('img[alt="Paul DiLoreto"]')).toHaveAttribute(
		"width",
		"960",
	);
});
