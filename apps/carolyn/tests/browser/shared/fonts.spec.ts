import { expect, test } from "@tests/playwright";

const fonts = [
	"karla-latin-variable.woff2",
	"karla-latin-variable-italic.woff2",
	"old-standard-tt-latin-400.woff2",
	"old-standard-tt-latin-400-italic.woff2",
	"old-standard-tt-latin-700.woff2",
];

test("serves every font face locally as WOFF2", async ({ request }) => {
	for (const font of fonts) {
		const response = await request.get(`/fonts/${font}`);
		expect(response.status(), font).toBe(200);
		expect((await response.body()).subarray(0, 4).toString()).toBe("wOF2");
	}
});

test("loads typography without Google Fonts and preserves the visible home-link name", async ({
	page,
}) => {
	const externalFontRequests: string[] = [];
	await page.route(
		(url) =>
			["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname),
		(route) => {
			externalFontRequests.push(route.request().url());
			return route.abort();
		},
	);
	await page.goto("/projects");
	await page.evaluate(async () => {
		await Promise.all([
			document.fonts.load('400 16px "Karla"'),
			document.fonts.load('italic 400 16px "Karla"'),
			document.fonts.load('400 16px "Old Standard TT"'),
			document.fonts.load('italic 400 16px "Old Standard TT"'),
			document.fonts.load('700 16px "Old Standard TT"'),
		]);
	});
	expect(
		await page.evaluate(() =>
			Array.from(document.fonts, (font) => font.status),
		),
	).toEqual(Array(5).fill("loaded"));
	await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(2);
	await expect(
		page
			.getByRole("banner")
			.getByRole("link", { name: "Carolyn DiLoreto — Home", exact: true }),
	).toBeVisible();
	expect(externalFontRequests).toEqual([]);
});
