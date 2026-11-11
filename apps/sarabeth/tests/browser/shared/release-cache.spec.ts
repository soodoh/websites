import { expect, test } from "@tests/playwright";

test("navigation does not reuse a previous release's cached biography", async ({
	page,
}) => {
	// This immutable URL shipped before static data was scoped to a build.
	await page.route(
		"**/__tsr/staticServerFnCache/833c4439fe7b8061fca7fc4cc8040f84f2684af1.json",
		async (route) => {
			const response = await route.fetch({
				headers: {
					...(await route.request().allHeaders()),
					"sec-fetch-site": "same-origin",
				},
			});
			const body = (await response.text()).replaceAll(
				'"s":"Sarabeth Belón"',
				'"s":"Previous release biography"',
			);
			await route.fulfill({ response, body });
		},
	);

	// Direct loads embed the current content even when navigation data is stale.
	await page.goto("/about");
	await expect(
		page.getByRole("heading", { name: "Sarabeth Belón", exact: true }),
	).toBeVisible();
	await page.goto("/");
	const mobileNavigation = page.getByRole("button", {
		name: "Open Navigation",
	});
	if (await mobileNavigation.isVisible()) await mobileNavigation.click();
	await page.getByRole("link", { name: "About", exact: true }).click();
	await expect(page).toHaveURL(/\/about$/);
	await expect(
		page.getByRole("heading", { name: "Sarabeth Belón", exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Previous release biography" }),
	).toHaveCount(0);
});
