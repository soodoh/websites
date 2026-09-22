import { expect, test } from "@tests/playwright";
import {
	expectCurrentPath,
	expectDesktopFilterIndicator,
	expectStickyFilterBelowHeader,
	selectFilter,
	settleVisualPage,
} from "@tests/visual-helpers";

const photographyFilters = ["Dance", "Portraits", "Spaces"] as const;
const albumExpectations = {
	Dance: { count: 12, firstPhotoId: "fixture-dance-01" },
	Portraits: { count: 12, firstPhotoId: "fixture-portraits-01" },
	Spaces: { count: 12, firstPhotoId: "fixture-spaces-01" },
} as const;

test.describe("Photography visual states", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/photography");
	});

	for (const filter of photographyFilters) {
		test(`matches the ${filter} filter`, async ({ page }) => {
			const mobileFilter = page.getByRole("button", {
				name: photographyFilters[0],
				exact: true,
			});
			if (await mobileFilter.isVisible()) {
				await expect(mobileFilter).toHaveCSS("padding", "4px 8px");
			}
			if (filter !== photographyFilters[0]) {
				await selectFilter(page, photographyFilters[0], filter);
			}
			const selectedMobileFilter = page.getByRole("button", {
				name: filter,
				exact: true,
			});
			if (await selectedMobileFilter.isVisible()) {
				await expect(selectedMobileFilter).toHaveCSS(
					"border-top-style",
					"solid",
				);
			}
			await expectDesktopFilterIndicator(page, filter);
			const expectation = albumExpectations[filter];
			const thumbnails = page
				.locator(".masonry-grid")
				.getByRole("button", { name: /View fullscreen photo/ });
			await expect(thumbnails).toHaveCount(expectation.count);
			await expect(thumbnails.first().locator("img")).toHaveAttribute(
				"src",
				new RegExp(expectation.firstPhotoId),
			);
			await expect(page.locator("[data-photography-album]")).toHaveAttribute(
				"data-photography-album",
				filter,
			);
			await settleVisualPage(page, {
				expectedPath: "/photography",
				album: filter,
			});
			await expect(page).toHaveScreenshot(
				`photography-filter-${filter.toLowerCase()}.png`,
			);
		});
	}

	test("matches the selected Portraits filter while scrolled", async ({
		page,
	}) => {
		await selectFilter(page, "Dance", "Portraits");
		await settleVisualPage(page, {
			expectedPath: "/photography",
			album: "Portraits",
		});
		await page
			.locator(".masonry-grid")
			.getByRole("button", { name: /View fullscreen photo/ })
			.nth(8)
			.scrollIntoViewIfNeeded();
		await expectCurrentPath(page, "/photography");
		await expect(page.locator("[data-photography-album]")).toHaveAttribute(
			"data-photography-album",
			"Portraits",
		);
		await expectStickyFilterBelowHeader(page);
		await expect(page).toHaveScreenshot(
			"photography-filter-portraits-scrolled.png",
		);
	});

	test("matches a portrait-oriented photo", async ({ page }) => {
		await selectFilter(page, "Dance", "Portraits");
		await page
			.locator(".masonry-grid")
			.getByRole("button", { name: /View fullscreen photo/ })
			.first()
			.click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await settleVisualPage(page, {
			expectedPath: "/photography",
			album: "Portraits",
			images: () => dialog.locator("img"),
		});
		await expect(dialog.locator("[aria-hidden='false'] img")).toBeVisible();
		await expect(page).toHaveScreenshot("photography-portrait-photo.png");
	});

	test("matches a landscape-oriented photo", async ({ page }) => {
		await selectFilter(page, "Dance", "Spaces");
		await page
			.locator(".masonry-grid")
			.getByRole("button", { name: /View fullscreen photo/ })
			.first()
			.click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await settleVisualPage(page, {
			expectedPath: "/photography",
			album: "Spaces",
			images: () => dialog.locator("img"),
		});
		await expect(dialog.locator("[aria-hidden='false'] img")).toBeVisible();
		await expect(page).toHaveScreenshot("photography-landscape-photo.png");
	});
});
