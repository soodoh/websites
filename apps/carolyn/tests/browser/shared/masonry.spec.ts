import { expect, type Page, test } from "@tests/playwright";
import { selectFilter, waitForHydration } from "@tests/visual-helpers";

const widths = [390, 660, 661, 962, 963, 1260, 1261, 1488, 1489, 1600];
const routes = ["/", "/projects", "/photography"];

async function readLayout(page: Page) {
	return page.locator(".masonry-grid").evaluate((grid) => {
		function advertisedWidth(sizes: string): number {
			// Split source-size entries, not commas nested inside CSS math functions.
			const entries: string[] = [];
			let depth = 0;
			let entry = "";
			for (const character of `${sizes},`) {
				if (character === "(") depth += 1;
				if (character === ")") depth -= 1;
				if (character === "," && depth === 0) {
					entries.push(entry.trim());
					entry = "";
				} else entry += character;
			}
			for (const candidate of entries) {
				const conditional = /^(\([^)]+\))\s+(.+)$/.exec(candidate);
				if (conditional && !window.matchMedia(conditional[1]).matches) continue;
				const length = conditional?.[2] ?? candidate;
				if (!CSS.supports("width", length)) {
					throw new Error(`Invalid image source size: ${length}`);
				}
				const probe = document.createElement("div");
				probe.style.cssText = `position:fixed;visibility:hidden;width:${length};height:0`;
				document.body.append(probe);
				const width = probe.getBoundingClientRect().width;
				probe.remove();
				return width;
			}
			throw new Error(`No matching image source size: ${sizes}`);
		}
		const gridBox = grid.getBoundingClientRect();
		const footer = document.querySelector("footer");
		if (!footer) throw new Error("Missing footer");
		return {
			width: gridBox.width,
			height: gridBox.height,
			footerTop: footer.getBoundingClientRect().top + window.scrollY,
			items: Array.from(grid.children, (item) => {
				const box = item.getBoundingClientRect();
				const image = item.querySelector("img");
				const card = item.firstElementChild;
				if (!image || !card) throw new Error("Missing masonry card or image");
				const cardBox = card.getBoundingClientRect();
				const imageBox = image.getBoundingClientRect();
				return {
					x: box.left - gridBox.left,
					y: box.top - gridBox.top,
					width: box.width,
					height: box.height,
					cardWidth: cardBox.width,
					cardHeight: cardBox.height,
					imageWidth: imageBox.width,
					imageHeight: imageBox.height,
					advertisedWidth: advertisedWidth(image.sizes),
					ratio:
						Number(image.getAttribute("height")) /
						Number(image.getAttribute("width")),
					src: image.getAttribute("src"),
				};
			}),
		};
	});
}

type Layout = Awaited<ReturnType<typeof readLayout>>;

function expectRoundRobinLayout(layout: Layout, viewportWidth: number): void {
	const columns =
		viewportWidth <= 660
			? 1
			: viewportWidth <= 962
				? 2
				: viewportWidth <= 1260
					? 3
					: 4;
	const gap = 50;
	const cardWidth =
		(layout.width -
			(layout.items.length >= columns ? (columns - 1) * gap : 0)) /
		columns;
	const columnHeights = Array<number>(columns).fill(0);
	for (const [index, item] of layout.items.entries()) {
		const column = index % columns;
		expect(Math.abs(item.x - column * (cardWidth + gap))).toBeLessThan(0.5);
		expect(Math.abs(item.y - columnHeights[column])).toBeLessThan(0.5);
		expect(Math.abs(item.width - cardWidth)).toBeLessThan(0.5);
		expect(Math.abs(item.height - cardWidth * item.ratio)).toBeLessThan(0.5);
		expect(Math.abs(item.cardWidth - item.width)).toBeLessThan(0.5);
		expect(Math.abs(item.cardHeight - item.height)).toBeLessThan(0.5);
		expect(Math.abs(item.imageWidth - item.width)).toBeLessThan(0.5);
		expect(
			Math.abs(item.advertisedWidth - item.width),
			"image sizes must describe rendered card width",
		).toBeLessThan(0.5);
		expect(Math.abs(item.imageHeight - item.height)).toBeLessThan(0.5);
		columnHeights[column] += cardWidth * item.ratio + gap;
	}
	expect(Math.abs(layout.height - Math.max(...columnHeights))).toBeLessThan(
		0.5,
	);
}

function expectStableLayout(before: Layout, after: Layout): void {
	expect(Math.abs(after.height - before.height)).toBeLessThan(0.5);
	expect(Math.abs(after.footerTop - before.footerTop)).toBeLessThan(0.5);
	expect(after.items.map((item) => item.src)).toEqual(
		before.items.map((item) => item.src),
	);
	for (const [index, item] of after.items.entries()) {
		for (const dimension of ["x", "y", "width", "height"] as const) {
			expect(
				Math.abs(item[dimension] - before.items[index][dimension]),
			).toBeLessThan(0.5);
		}
	}
}

async function settleLayout(page: Page, scriptsEnabled = true): Promise<void> {
	await expect(page.locator(".masonry-grid")).toHaveCSS("position", "relative");
	if (!scriptsEnabled) {
		// Animation-frame callbacks do not run with JavaScript disabled.
		await expect
			.poll(() => page.evaluate(() => document.fonts.status))
			.toBe("loaded");
		return;
	}
	await page.evaluate(async () => {
		await document.fonts.ready;
		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
		);
	});
}

test.describe("SSR-stable Portfolio grid", { tag: "@desktop-only" }, () => {
	for (const width of [390, 660, 661, 962, 963, 1260, 1261, 1488, 1489]) {
		test(`selects the bounded thumbnail candidate on a fresh ${width}px visit`, async ({
			page,
		}) => {
			// Set the viewport before navigation: cached larger candidates need not
			// downgrade on resize, which would mask the initial selection behavior.
			await page.setViewportSize({ width, height: 900 });
			await page.goto("/photography");
			await settleLayout(page);
			const image = page.locator(".masonry-grid img").first();
			await image.evaluate(async (element: HTMLImageElement) =>
				element.decode(),
			);
			const selection = await image.evaluate((element: HTMLImageElement) => ({
				url: element.currentSrc,
				candidates: element.srcset
					.split(",")
					.map((candidate) => Number(candidate.trim().match(/ (\d+)w$/)?.[1])),
				requestedWidth:
					element.getBoundingClientRect().width * window.devicePixelRatio,
			}));
			const expectedWidth =
				selection.candidates.find(
					(candidate) => candidate >= selection.requestedWidth,
				) ?? selection.candidates.at(-1);
			expect(Number(new URL(selection.url).searchParams.get("w"))).toBe(
				expectedWidth,
			);
			expectRoundRobinLayout(await readLayout(page), width);
		});
	}

	for (const route of routes) {
		test(`keeps ${route} geometry through hydration and delayed images`, async ({
			page,
		}) => {
			let releaseScripts = () => {};
			let releaseImages = () => {};
			const scriptsReady = new Promise<void>((resolve) => {
				releaseScripts = resolve;
			});
			const imagesReady = new Promise<void>((resolve) => {
				releaseImages = resolve;
			});
			await page.route("**/*", async (requestRoute) => {
				if (requestRoute.request().resourceType() === "script")
					await scriptsReady;
				if (requestRoute.request().resourceType() === "image")
					await imagesReady;
				await requestRoute.fallback();
			});

			try {
				await page.goto(route, { waitUntil: "commit" });
				const before = new Map<number, Layout>();
				for (const width of widths) {
					await page.setViewportSize({ width, height: 900 });
					await settleLayout(page);
					const layout = await readLayout(page);
					expectRoundRobinLayout(layout, width);
					before.set(width, layout);
				}
				await expect(page.locator("html")).not.toHaveAttribute(
					"data-hydrated",
					"true",
				);
				expect(
					await page
						.locator(".masonry-grid img")
						.evaluateAll((images) =>
							images.every(
								(image) => (image as HTMLImageElement).naturalWidth === 0,
							),
						),
				).toBe(true);

				releaseScripts();
				await waitForHydration(page);
				for (const width of widths) {
					await page.setViewportSize({ width, height: 900 });
					await settleLayout(page);
					const initial = before.get(width);
					if (!initial) throw new Error("Missing pre-hydration layout");
					expectStableLayout(initial, await readLayout(page));
				}

				releaseImages();
				// Force lazy images to load without scrolling or depending on network timing.
				await page.locator(".masonry-grid img").evaluateAll(async (images) => {
					await Promise.all(
						images.map(async (image) => {
							const element = image as HTMLImageElement;
							element.loading = "eager";
							await element.decode();
						}),
					);
				});
				for (const width of widths) {
					await page.setViewportSize({ width, height: 900 });
					await settleLayout(page);
					const initial = before.get(width);
					if (!initial) throw new Error("Missing pre-image layout");
					expectStableLayout(initial, await readLayout(page));
				}
			} finally {
				releaseScripts();
				releaseImages();
			}
		});
	}

	test("recalculates filtered projects, including fewer cards than columns", async ({
		page,
	}) => {
		await page.goto("/projects");
		let current = "All";
		for (const filter of ["Film", "Design", "Interactive", "All"]) {
			await selectFilter(page, current, filter);
			current = filter;
			for (const width of widths) {
				await page.setViewportSize({ width, height: 900 });
				await settleLayout(page);
				expectRoundRobinLayout(await readLayout(page), width);
			}
		}
	});

	test("keeps photo focus and gallery selection in source order after album changes", async ({
		page,
	}) => {
		await page.goto("/photography");
		await waitForHydration(page);
		const thumbnails = page.locator(".masonry-grid button");
		await thumbnails.first().focus();
		for (let index = 1; index < 5; index += 1) {
			await page.keyboard.press("Tab");
			await expect(thumbnails.nth(index)).toBeFocused();
		}
		await selectFilter(page, "Dance", "Portraits");
		await settleLayout(page);
		expectRoundRobinLayout(await readLayout(page), 1440);
		await expect(thumbnails.nth(2).locator("img")).toHaveAttribute(
			"src",
			/fixture-portraits-03/,
		);
		await thumbnails.nth(2).click();
		await expect(
			page.getByRole("dialog").getByText("3 / 12", { exact: true }),
		).toBeVisible();
	});
});

test.describe("Portfolio grid without JavaScript", {
	tag: "@desktop-only",
}, () => {
	test.use({ javaScriptEnabled: false });
	for (const route of routes) {
		test(`lays out ${route} at every breakpoint`, async ({
			diagnostics,
			page,
		}) => {
			// Chromium blocks module preloads when JavaScript is disabled.
			diagnostics.allowRequestFailure(
				/^GET http:\/\/127\.0\.0\.1:4000\/assets\/[^ ]+\.js: csp$/,
			);
			await page.goto(route);
			for (const width of widths) {
				await page.setViewportSize({ width, height: 900 });
				await settleLayout(page, false);
				expectRoundRobinLayout(await readLayout(page), width);
			}
			await expect(page.locator("html")).not.toHaveAttribute(
				"data-hydrated",
				"true",
			);
		});
	}
});
