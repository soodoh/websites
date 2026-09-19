import { expect, test } from "@playwright/test";
import {
	expectExternalNavigation,
	loadHome,
	waitForVisibleImages,
} from "./home.helpers";

const sectionLinks = [
	{ label: "Work", hash: "projects" },
	{ label: "About", hash: "about" },
	{ label: "Contact", hash: "contact" },
];

const socialLinks = [
	{
		accessibleName: "Github Link",
		url: "https://github.com/soodoh",
	},
	{
		accessibleName: "LinkedIn Link",
		url: "https://www.linkedin.com/in/pauldiloreto/",
	},
];

const projectLinks = [
	{ title: "UX Portfolio", url: "https://carolyndiloreto.com/" },
	{ title: "Family Website", url: "https://diloreto.com/" },
];

for (const { label, hash } of sectionLinks) {
	test(`${label} navigation scrolls to #${hash}`, async ({
		page,
	}, testInfo) => {
		await loadHome(page);

		if (testInfo.project.name === "mobile") {
			await page.getByRole("button", { name: "Open Navigation" }).click();
		}

		await page.getByRole("link", { name: label, exact: true }).click();

		await expect(page).toHaveURL(new RegExp(`#${hash}$`));
		await expect(page.locator(`#${hash}`)).toBeInViewport();

		if (testInfo.project.name === "mobile") {
			await expect(
				page.getByRole("button", { name: "Close Navigation" }),
			).toBeHidden();
		}
	});
}

for (const { accessibleName, url } of socialLinks) {
	for (const { location, navigationName } of [
		{ location: "top", navigationName: "Introductory social links" },
		{ location: "bottom", navigationName: "Footer social links" },
	]) {
		test(`${location} ${accessibleName} navigates to its profile`, async ({
			page,
		}) => {
			await loadHome(page);
			const link = page
				.getByRole("navigation", { name: navigationName })
				.getByRole("link", { name: accessibleName });

			await expectExternalNavigation(page, link, url);
		});
	}
}

test("contact links use the portfolio email address", async ({ page }) => {
	await loadHome(page);
	const mailto = "mailto:paul@diloreto.com";

	await expect(
		page.getByRole("link", { name: "Contact Me", exact: true }),
	).toHaveAttribute("href", mailto);
	await expect(
		page.getByRole("link", { name: "paul@diloreto.com", exact: true }),
	).toHaveAttribute("href", mailto);
});

for (const { title, url } of projectLinks) {
	test(`${title} View Site link navigates to the project`, async ({ page }) => {
		await loadHome(page);
		const project = page.getByRole("article").filter({
			has: page.getByRole("heading", { name: title, level: 3 }),
		});
		const link = project.getByRole("link", { name: "View Site", exact: true });

		await expectExternalNavigation(page, link, url);
	});
}

test("mobile navigation closes and restores focus", async ({
	page,
}, testInfo) => {
	test.skip(testInfo.project.name !== "mobile", "Mobile-only navigation");
	await loadHome(page);
	const trigger = page.getByRole("button", { name: "Open Navigation" });

	await trigger.click();
	await page.getByRole("button", { name: "Close Navigation" }).click();

	await expect(
		page.getByRole("button", { name: "Close Navigation" }),
	).toBeHidden();
	await expect(trigger).toBeFocused();
});

test("Escape dismisses mobile navigation", async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== "mobile", "Mobile-only navigation");
	await loadHome(page);
	const trigger = page.getByRole("button", { name: "Open Navigation" });

	await trigger.click();
	await page.keyboard.press("Escape");

	await expect(
		page.getByRole("button", { name: "Close Navigation" }),
	).toBeHidden();
	await expect(trigger).toBeFocused();
});

for (const width of [320, 390]) {
	test(`home does not overflow horizontally at ${width}px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 844 });
		await loadHome(page);

		const dimensions = await page.evaluate(() => ({
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth,
		}));
		expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
	});
}

test("responsive images select right-sized sources", async ({
	page,
}, testInfo) => {
	test.skip(testInfo.project.name !== "desktop", "Viewport-independent check");

	await page.setViewportSize({ width: 1200, height: 900 });
	await loadHome(page);
	await page
		.getByRole("heading", { name: "UX Portfolio", level: 3 })
		.scrollIntoViewIfNeeded();
	await waitForVisibleImages(page);
	await expect
		.poll(() =>
			page
				.getByAltText("Screenshot of Carolyn's UX Portfolio")
				.evaluate((image) => {
					if (!(image instanceof HTMLImageElement)) {
						throw new Error(
							"Project image locator did not resolve to an image",
						);
					}
					return image.currentSrc;
				}),
		)
		.toMatch(/\/images\/carolyn-portfolio-480\.avif$/);

	const profilePage = await page.context().newPage();
	await profilePage.setViewportSize({ width: 699, height: 844 });
	await loadHome(profilePage);
	await profilePage
		.locator('img[alt="Paul DiLoreto"]')
		.scrollIntoViewIfNeeded();
	await waitForVisibleImages(profilePage);
	await expect
		.poll(() =>
			profilePage.locator('img[alt="Paul DiLoreto"]').evaluate((image) => {
				if (!(image instanceof HTMLImageElement)) {
					throw new Error("Profile image locator did not resolve to an image");
				}
				return image.currentSrc;
			}),
		)
		.toMatch(/\/images\/profile-320\.avif$/);
	await profilePage.close();
});

test.describe("reduced motion", () => {
	test.use({ contextOptions: { reducedMotion: "reduce" } });

	test("disables scrolling, parallax, and drawer motion", async ({
		page,
	}, testInfo) => {
		await loadHome(page);
		await page.evaluate(() =>
			window.scrollTo(0, document.body.scrollHeight / 2),
		);

		await expect
			.poll(() =>
				page
					.locator(".background-title")
					.first()
					.evaluate((element) => ({
						scrollBehavior: getComputedStyle(document.documentElement)
							.scrollBehavior,
						transform: getComputedStyle(element).transform,
					})),
			)
			.toEqual({ scrollBehavior: "auto", transform: "none" });

		if (testInfo.project.name === "mobile") {
			await page.getByRole("button", { name: "Open Navigation" }).click();
			const motionStyles = await page
				.locator('[data-slot="sheet-overlay"], [data-slot="sheet-content"]')
				.evaluateAll((elements) =>
					elements.map((element) => {
						const styles = getComputedStyle(element);
						return {
							animationDuration: styles.animationDuration,
							animationName: styles.animationName,
							transitionDuration: styles.transitionDuration,
						};
					}),
				);

			expect(motionStyles).toEqual([
				{
					animationDuration: "0s",
					animationName: "none",
					transitionDuration: "0s",
				},
				{
					animationDuration: "0s",
					animationName: "none",
					transitionDuration: "0s",
				},
			]);
		}
	});
});
