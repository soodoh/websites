import { expect, test } from "../../support/test";
import { prepareFullPage } from "../../support/visual";

test("home tile pictures keep block layout and square images with custom classes", async ({
	page,
}) => {
	await page.goto("/");
	await prepareFullPage(page);
	const pictures = page.locator('[data-slot="tile"] picture');
	await expect(pictures).toHaveCount(6);
	for (const picture of await pictures.all()) {
		await expect(picture).toHaveCSS("display", "block");
		for (const element of [picture, picture.locator("img")]) {
			const { width, height } = await element.evaluate((element) => {
				const { width, height } = element.getBoundingClientRect();
				return { width, height };
			});
			expect(width).toBeGreaterThan(0);
			expect(Math.abs(width - height)).toBeLessThan(1);
		}
	}
});

test("all content images expose build-generated, ordered responsive candidates", async ({
	page,
}) => {
	for (const path of ["/", "/areyou"]) {
		await page.goto(path);
		const pictures = await page
			.getByRole("main")
			.locator("picture")
			.evaluateAll((elements) =>
				elements.map((picture) => {
					const image = picture.querySelector("img");
					return {
						sizes: image?.sizes,
						width: image?.width,
						height: image?.height,
						src: image?.getAttribute("src"),
						sources: Array.from(
							picture.querySelectorAll("source"),
							(source) => ({
								sizes: source.sizes,
								candidates: source.srcset.split(", ").map((candidate) => {
									const [url, width] = candidate.split(" ");
									return { url, width: Number.parseInt(width, 10) };
								}),
							}),
						),
					};
				}),
			);
		expect(pictures.length).toBeGreaterThan(0);
		for (const picture of pictures) {
			expect(picture.sizes).toBeTruthy();
			expect(picture.src).toMatch(/^\/assets\//);
			expect(picture.width).toBeGreaterThan(0);
			expect(picture.height).toBeGreaterThan(0);
			expect(picture.sources.length).toBeGreaterThan(0);
			for (const source of picture.sources) {
				expect(source.sizes).toBe(picture.sizes);
				const widths = source.candidates.map((candidate) => candidate.width);
				expect(widths).toEqual([...new Set(widths)].sort((a, b) => a - b));
				expect(Math.max(...widths)).toBeLessThanOrEqual(2160);
				for (const candidate of source.candidates)
					expect(candidate.url).toMatch(/^\/assets\//);
			}
		}
	}
});

test("history LCP map uses its smaller lossless rendition without upscaling", async ({
	page,
	request,
}) => {
	await page.goto("/areyou");
	const map = page.getByAltText(
		"Map of Italy showing the regional distribution of people with the DiLoreto surname",
		{ exact: true },
	);
	await expect(map).toHaveAttribute("loading", "eager");
	await expect(map).toHaveAttribute("fetchpriority", "high");
	const source = map.locator("..").locator('source[type="image/webp"]');
	const srcSet = await source.getAttribute("srcset");
	expect(srcSet).toMatch(/\.webp 500w$/);
	const response = await request.get(srcSet?.split(" ")[0] ?? "");
	expect(response.status()).toBe(200);
	expect((await response.body()).length).toBeLessThan(10_000);
});
