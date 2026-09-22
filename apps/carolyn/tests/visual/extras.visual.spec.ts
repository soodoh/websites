import { expect, test } from "@tests/playwright";
import {
	expectFullPageScreenshot,
	settleVisualPage,
} from "@tests/visual-helpers";

test.describe("Static route visual states", () => {
	test("prioritizes the above-the-fold About portrait", async ({ page }) => {
		await page.goto("/about");
		const portrait = page.getByAltText("Portrait of Carolyn DiLoreto", {
			exact: true,
		});
		await expect(portrait).toHaveAttribute("fetchpriority", "high");
		await expect(portrait).not.toHaveAttribute("loading", "lazy");
	});

	test("settles after an image node is replaced", async ({ page }) => {
		await page.addInitScript(() => {
			const decode = HTMLImageElement.prototype.decode;
			let replaced = false;
			HTMLImageElement.prototype.decode = function decodeWithReplacement() {
				if (!replaced && this.alt === "Portrait of Carolyn DiLoreto") {
					replaced = true;
					this.replaceWith(this.cloneNode(true));
					return Promise.reject(new Error("Image node was replaced."));
				}
				return decode.call(this);
			};
		});
		await page.goto("/about");

		await settleVisualPage(page, { expectedPath: "/about" });
		await expect(
			page.getByAltText("Portrait of Carolyn DiLoreto", { exact: true }),
		).toBeVisible();
	});

	test("matches the About page viewport", async ({ page }) => {
		await page.goto("/about");
		await settleVisualPage(page, { expectedPath: "/about" });
		await expect(
			page.getByAltText("Portrait of Carolyn DiLoreto", { exact: true }),
		).toBeVisible();
		await expect(page).toHaveScreenshot("about-viewport.png");
	});

	test("matches the entire not-found page", async ({ diagnostics, page }) => {
		diagnostics.allowResponse("/route-that-does-not-exist", 404);
		diagnostics.allowConsoleError(/Failed to load resource.*404/);
		const response = await page.goto("/route-that-does-not-exist");
		expect(response?.status()).toBe(404);
		await expect(page).toHaveTitle("CD: Page Not Found");
		await expect(page.locator('meta[name="description"]')).toHaveAttribute(
			"content",
			"The page you are looking for does not exist.",
		);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			"noindex, nofollow",
		);
		await expectFullPageScreenshot(page, "not-found-full-page.png", {
			expectedPath: "/route-that-does-not-exist",
			requireHydration: false,
		});
	});

	test("redirects the Resume route to the captured document", async ({
		request,
	}) => {
		const response = await request.get("/resume", { maxRedirects: 0 });
		expect(response.status()).toBe(307);
		expect(response.headers().location).toMatch(
			/2025_Carolyn_DiLoreto_Resume\.pdf$/,
		);
	});
});
