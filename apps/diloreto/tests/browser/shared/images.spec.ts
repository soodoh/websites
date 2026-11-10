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

test("inline previews fill reserved space while full images are delayed, then clear without layout shift", async ({
	page,
}) => {
	let release = () => {};
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(
		/\/assets\/.*\.(?:avif|webp|png|gif|jpe?g)(?:\?.*)?$/,
		async (route) => {
			await gate;
			await route.continue();
		},
	);
	try {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		const priorityPicture = page.locator('[data-slot="tile"] picture').first();
		await expect(priorityPicture).toHaveAttribute(
			"data-image-state",
			"initial",
		);
		await expect(priorityPicture.locator("img")).toHaveCSS("opacity", "1");
		const picture = page.locator('[data-slot="tile"] picture').nth(3);
		await expect(picture).toHaveAttribute("data-image-state", "pending");
		await expect(picture).toHaveCSS(
			"background-image",
			/data:image\/webp;base64/,
		);
		await expect(picture.locator("img")).toHaveCSS("opacity", "0");
		const before = await picture.boundingBox();
		expect(before?.width).toBeGreaterThan(0);
		release();
		await expect(picture).toHaveAttribute("data-image-state", "loaded");
		await expect(picture).toHaveCSS("background-image", "none");
		await expect(picture.locator("img")).toHaveCSS("opacity", "1");
		const after = await picture.boundingBox();
		expect(after?.width).toBe(before?.width);
		expect(after?.height).toBe(before?.height);
	} finally {
		release();
	}
});

test("failed images retain their inline preview", async ({
	page,
	diagnostics,
}) => {
	diagnostics.allowConsoleError("Failed to load resource: net::ERR_FAILED");
	await page.route(
		/\/assets\/.*\.(?:avif|webp|png|gif|jpe?g)(?:\?.*)?$/,
		(route) => route.abort(),
	);
	await page.goto("/");
	const picture = page.locator('[data-slot="tile"] picture').first();
	await expect(picture).toHaveAttribute("data-image-state", "failed");
	await expect(picture).toHaveCSS(
		"background-image",
		/data:image\/webp;base64/,
	);
});

test("cached and reduced-motion images do not stay hidden", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	const picture = page.locator('[data-slot="tile"] picture').nth(3);
	await expect(picture).toHaveAttribute("data-image-state", "loaded");
	await expect(picture.locator("img")).toHaveCSS("animation-name", "none");
	await page.reload();
	await expect(picture).toHaveAttribute("data-image-state", "loaded");
	await expect(picture.locator("img")).toHaveCSS("opacity", "1");
});

test("native responsive images remain visible without JavaScript", async ({
	browser,
	baseURL,
}) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto(`${baseURL}/areyou`);
		const map = page.getByAltText(
			"Map of Italy showing the regional distribution of people with the DiLoreto surname",
			{ exact: true },
		);
		await expect
			.poll(() =>
				map.evaluate((element) => (element as HTMLImageElement).naturalWidth),
			)
			.toBeGreaterThan(0);
		await expect(map).toHaveCSS("opacity", "1");
		await expect(map.locator("..")).toHaveAttribute(
			"data-image-state",
			"initial",
		);
	} finally {
		await context.close();
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
