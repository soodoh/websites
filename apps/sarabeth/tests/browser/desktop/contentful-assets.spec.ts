import { expect, test } from "@tests/playwright";

test("renders production-shaped transformed Contentful image URLs", async ({
	page,
}) => {
	await page.goto("/about");
	const image = page.getByRole("img").first();
	const source = await image.getAttribute("src");
	const sourceSet = await image.getAttribute("srcset");
	expect(source).toMatch(/^https:\/\/images\.ctfassets\.net\//);
	expect(sourceSet).toContain("images.ctfassets.net");
	expect(sourceSet).toMatch(/[?&]w=\d+/);
	expect(sourceSet?.split(",").length).toBeGreaterThan(1);
	expect(await image.getAttribute("sizes")).toContain("30vw");
	await expect
		.poll(() =>
			image.evaluate(
				(element) =>
					element instanceof HTMLImageElement &&
					element.complete &&
					element.naturalWidth > 0,
			),
		)
		.toBe(true);
});

test("Contentful previews are inline and visible before the CDN image finishes", async ({
	page,
}) => {
	let release = () => {};
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route("https://images.ctfassets.net/**", async (route) => {
		await gate;
		await route.fallback();
	});
	try {
		await page.goto("/about", { waitUntil: "domcontentloaded" });
		const image = page.getByRole("img").first();
		const picture = image.locator("..");
		await expect(picture).toHaveAttribute("data-responsive-image", "");
		await expect(picture).toHaveCSS("background-image", /data:image\//);
		await expect(image).toHaveCSS("opacity", "1");
		release();
		await expect(picture).toHaveAttribute("data-image-state", "loaded");
		await expect(picture).toHaveCSS("background-image", "none");
	} finally {
		release();
	}
});

test("keeps audio on its Contentful URL without a production proxy", async ({
	page,
}) => {
	await page.goto("/media");
	const source = await page.locator("audio").first().getAttribute("src");
	expect(source).toMatch(/^https:\/\/assets\.ctfassets\.net\//);
	expect(source).not.toContain("/api/audio");
});
