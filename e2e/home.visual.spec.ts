import { expect, type Page, test } from "@playwright/test";
import {
	loadHome,
	scrollToPercentage,
	waitForVisibleImages,
} from "./home.helpers";

const scrollPercentages = Array.from({ length: 11 }, (_, index) => index * 10);

const expectScreenshot = async (page: Page, name: string): Promise<void> => {
	await expect(page).toHaveScreenshot(name, {
		animations: "disabled",
		caret: "hide",
		scale: "css",
	});
};

test.describe("home page visuals", () => {
	test("captures every 10% scroll checkpoint", async ({ page }) => {
		await loadHome(page);

		for (const percentage of scrollPercentages) {
			await test.step(`${percentage}% scroll`, async () => {
				await scrollToPercentage(page, percentage);
				await waitForVisibleImages(page);

				await expectScreenshot(
					page,
					`home-scroll-${percentage.toString().padStart(3, "0")}.png`,
				);
			});
		}
	});

	test("captures the open mobile navigation", async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== "mobile", "Mobile-only navigation");

		await loadHome(page);
		await page.getByRole("button", { name: "Open Navigation" }).click();
		await expect(
			page.getByRole("button", { name: "Close Navigation" }),
		).toBeVisible();

		await expectScreenshot(page, "home-mobile-navigation-open.png");
	});
});
