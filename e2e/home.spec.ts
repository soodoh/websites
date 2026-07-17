import { expect, test } from "@playwright/test";
import { expectExternalNavigation, loadHome } from "./home.helpers";

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
	{ index: 0, url: "https://carolyndiloreto.com/" },
	{ index: 1, url: "https://diloreto.com/" },
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
	for (const location of ["top", "bottom"]) {
		test(`${location} ${accessibleName} navigates to its profile`, async ({
			page,
		}) => {
			await loadHome(page);
			const index = location === "top" ? 0 : 1;
			const link = page.getByRole("link", { name: accessibleName }).nth(index);

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

for (const { index, url } of projectLinks) {
	test(`View Site link ${index + 1} navigates to the project`, async ({
		page,
	}) => {
		await loadHome(page);
		const link = page
			.getByRole("link", { name: "View Site", exact: true })
			.nth(index);

		await expectExternalNavigation(page, link, url);
	});
}
