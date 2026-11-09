import { expect, type Locator, test } from "../../support/test";

async function expectTextContrast(locator: Locator, minimum = 4.5) {
	const ratio = await locator.evaluate((element) => {
		const canvas = document.createElement("canvas");
		canvas.width = 1;
		canvas.height = 1;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Unable to resolve CSS colors");
		const rgb = (color: string) => {
			context.clearRect(0, 0, 1, 1);
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			return Array.from(context.getImageData(0, 0, 1, 1).data);
		};
		const luminance = (channels: number[]) => {
			const [r, g, b] = channels.slice(0, 3).map((channel) => {
				const value = channel / 255;
				return value <= 0.04045
					? value / 12.92
					: ((value + 0.055) / 1.055) ** 2.4;
			});
			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		};
		let surface: Element | null = element;
		let background = [255, 255, 255];
		while (surface) {
			const channels = rgb(getComputedStyle(surface).backgroundColor);
			if (channels[3] === 255) {
				background = channels;
				break;
			}
			surface = surface.parentElement;
		}
		const foregroundLuminance = luminance(rgb(getComputedStyle(element).color));
		const backgroundLuminance = luminance(background);
		return (
			(Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
			(Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
		);
	});
	expect(ratio).toBeGreaterThanOrEqual(minimum);
}

test("routes have one main landmark with the header outside it", async ({
	page,
}) => {
	for (const path of ["/", "/areyou", "/familytree"]) {
		await page.goto(path);
		await expect(page.getByRole("main")).toHaveCount(1);
		await expect(page.getByRole("main").locator("main, header")).toHaveCount(0);
		await expect(page.getByRole("banner")).toHaveCount(1);
	}
});

test("history buttons and text meet contrast requirements on white and gray", async ({
	page,
}) => {
	await page.goto("/areyou");
	await page.evaluate(async () => document.fonts.ready);
	await expectTextContrast(
		page.getByRole("link", { name: "Explore the Family Tree" }),
	);
	await expectTextContrast(
		page.getByRole("button", { name: "Contact Us", exact: true }),
	);
	for (const title of ["996 - 1330", "1295 - 1528", "Family Trees"]) {
		await expectTextContrast(
			page.getByRole("heading", { name: title, exact: true }),
			3,
		);
	}
	await expectTextContrast(
		page.getByRole("link", { name: "DiLoreto Family Tree", exact: true }),
	);
});

test("only the first history photo is eagerly prioritized in the initial HTML", async ({
	page,
	request,
}) => {
	const response = await request.get("/areyou");
	const images = (await response.text()).match(/<img\b[^>]*>/g) ?? [];
	expect(images.length).toBeGreaterThan(1);
	expect(images[0]).toContain('loading="eager"');
	expect(images[0]).toContain('fetchPriority="high"');
	for (const image of images.slice(1)) {
		expect(image).toContain('loading="lazy"');
	}
	await page.goto("/areyou");
	const criticalFonts = page.locator('link[rel="preload"][as="font"]');
	await expect(criticalFonts).toHaveCount(3);
	expect(
		await criticalFonts.evaluateAll((links) =>
			links.map((link) => ({
				href: link.getAttribute("href"),
				crossOrigin: link.getAttribute("crossorigin"),
			})),
		),
	).toEqual([
		{
			href: "/fonts/old-standard-tt-latin-400.woff2",
			crossOrigin: "anonymous",
		},
		{
			href: "/fonts/old-standard-tt-latin-400-italic.woff2",
			crossOrigin: "anonymous",
		},
		{ href: "/fonts/karla-latin-400.woff2", crossOrigin: "anonymous" },
	]);
	await expect(page.getByRole("main").locator("img").first()).toHaveAttribute(
		"fetchpriority",
		"high",
	);
	await expect(
		page.getByRole("main").locator('img[loading="eager"]'),
	).toHaveCount(1);
});
