import {
	expect,
	fetchRoutedResponse,
	type Page,
	test,
} from "@tests/playwright";
import { selectFilter, waitForHydration } from "@tests/visual-helpers";

const galleries = [
	{ path: "/", current: "All", next: "Design" },
	{ path: "/projects", current: "All", next: "Design" },
	{ path: "/photography", current: "Dance", next: "Portraits" },
] as const;

async function recordScrolls(page: Page): Promise<void> {
	await page.evaluate(() => {
		const scrollTo = window.scrollTo.bind(window);
		document.documentElement.dataset.filterScrolls = "[]";
		window.scrollTo = (options?: ScrollToOptions | number, y?: number) => {
			if (typeof options === "object") {
				const calls = JSON.parse(
					document.documentElement.dataset.filterScrolls ?? "[]",
				);
				calls.push(options);
				document.documentElement.dataset.filterScrolls = JSON.stringify(calls);
				scrollTo(options);
			} else {
				scrollTo(options ?? 0, y ?? 0);
			}
		};
	});
}

async function readScrolls(page: Page): Promise<ScrollToOptions[]> {
	return page
		.locator("html")
		.evaluate((element) => JSON.parse(element.dataset.filterScrolls ?? "[]"));
}

async function scrollResults(page: Page, extra: number): Promise<number> {
	return page.locator(".masonry-grid").evaluate((grid, offset) => {
		const filter = document.querySelector("[data-visual-sticky-filter]");
		if (!filter) throw new Error("Filter is missing");
		const style = getComputedStyle(filter);
		const top =
			window.scrollY +
			grid.getBoundingClientRect().top -
			Number.parseFloat(style.top) -
			filter.getBoundingClientRect().height -
			Number.parseFloat(style.marginBottom);
		window.scrollTo(0, top + offset);
		return window.scrollY;
	}, extra);
}

async function expectResultsStart(page: Page): Promise<void> {
	await expect
		.poll(() =>
			page.locator(".masonry-grid").evaluate((grid) => {
				const header = document.querySelector("header");
				const filter = document.querySelector("[data-visual-sticky-filter]");
				if (!header || !filter) throw new Error("Gallery controls are missing");
				const headerBottom = header.getBoundingClientRect().bottom;
				const filterBox = filter.getBoundingClientRect();
				const gap = Number.parseFloat(getComputedStyle(filter).marginBottom);
				return Math.max(
					Math.abs(filterBox.top - headerBottom),
					Math.abs(grid.getBoundingClientRect().top - filterBox.bottom - gap),
				);
			}),
		)
		.toBeLessThanOrEqual(1);
	await expect(page.locator(".masonry-item").first()).toBeInViewport();
}

async function expectFilterFocused(page: Page, name: string): Promise<void> {
	const desktop = page.getByRole("button", { name: `Choose filter: ${name}` });
	const control = (await desktop.isVisible())
		? desktop
		: page.getByRole("button", { name, exact: true });
	await expect(control).toBeFocused();
}

// Wait for menu dismissal, focus restoration, and any scheduled scroll callback.
async function nextFrames(page: Page): Promise<void> {
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
			}),
	);
}

test.describe("Filter result scrolling", () => {
	test.beforeEach(async ({ page }) => {
		// Leave enough scroll range even for the desktop fixture's short project grid.
		await page.setViewportSize({
			width: page.viewportSize()?.width ?? 1440,
			height: 600,
		});
	});

	for (const gallery of galleries) {
		for (const motion of ["no-preference", "reduce"] as const) {
			test(`${gallery.path} returns to its results with ${motion} motion`, async ({
				page,
			}) => {
				await page.emulateMedia({ reducedMotion: motion });
				await page.goto(gallery.path);
				await waitForHydration(page);
				const start = await scrollResults(page, 0);
				const scrolled = await scrollResults(page, 350);
				expect(scrolled).toBeGreaterThan(start + 50);
				await recordScrolls(page);

				await selectFilter(page, gallery.current, gallery.next);
				await expectResultsStart(page);
				await expectFilterFocused(page, gallery.next);
				const scrolls = await readScrolls(page);
				expect(scrolls).toHaveLength(1);
				expect(scrolls[0]?.behavior).toBe(
					motion === "reduce" ? "instant" : "smooth",
				);
				if (gallery.path === "/") {
					expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
					const heroBottom = await page
						.locator("[data-home-hero]")
						.evaluate((element) => element.getBoundingClientRect().bottom);
					const headerBottom = await page
						.locator("header")
						.evaluate((element) => element.getBoundingClientRect().bottom);
					// The last header-height strip of the hero can sit behind the header.
					expect(heroBottom).toBeLessThanOrEqual(headerBottom + 1);
				}
			});
		}

		test(`${gallery.path} does not reset the active filter or an aligned viewport`, async ({
			page,
		}) => {
			await page.goto(gallery.path);
			await waitForHydration(page);
			await nextFrames(page);
			expect(await page.evaluate(() => window.scrollY)).toBe(0);
			await scrollResults(page, 0);
			await recordScrolls(page);
			await selectFilter(page, gallery.current, gallery.next);
			await nextFrames(page);
			await expectResultsStart(page);
			expect(await readScrolls(page)).toHaveLength(0);

			const scrolled = await scrollResults(page, 350);
			expect(scrolled).toBeGreaterThan(0);
			await selectFilter(page, gallery.next, gallery.next);
			await nextFrames(page);
			expect(await readScrolls(page)).toHaveLength(0);
			expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(
				scrolled,
				0,
			);
		});
	}

	for (const path of ["/", "/projects"]) {
		test(`${path} keeps short results visible when the document clamps scrolling`, async ({
			page,
		}) => {
			await page.setViewportSize({
				width: page.viewportSize()?.width ?? 1440,
				height: 900,
			});
			await page.goto(path);
			await waitForHydration(page);
			await scrollResults(page, 350);
			await selectFilter(page, "All", "Film");
			await expect(page.locator(".masonry-grid a")).toHaveCount(2);
			await expect(page.locator(".masonry-item").first()).toBeInViewport();
			await expect
				.poll(() =>
					page.locator(".masonry-grid").evaluate((grid) => {
						const filter = document.querySelector(
							"[data-visual-sticky-filter]",
						);
						if (!filter) throw new Error("Filter is missing");
						return (
							grid.getBoundingClientRect().top -
							filter.getBoundingClientRect().bottom
						);
					}),
				)
				.toBeGreaterThanOrEqual(0);
		});
	}

	test("keyboard selection keeps focus on the filter", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/projects");
		await waitForHydration(page);
		await scrollResults(page, 350);
		const desktop = page.getByRole("button", { name: "Choose filter: Design" });
		if (await desktop.isVisible()) {
			await desktop.focus();
			await page.keyboard.press("Enter");
		} else {
			await page.getByRole("button", { name: "All", exact: true }).focus();
			await page.keyboard.press("Enter");
			await expect(
				page.getByRole("menuitem", { name: "All", exact: true }),
			).toBeFocused();
			await page.keyboard.press("ArrowDown");
			await expect(
				page.getByRole("menuitem", { name: "Design", exact: true }),
			).toBeFocused();
			await page.keyboard.press("Enter");
		}
		await expectResultsStart(page);
		await expectFilterFocused(page, "Design");
	});

	test("photography waits for the new album before scrolling once", async ({
		page,
	}) => {
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		await page.route("**/__release/albums/*.json", async (route) => {
			const response = await fetchRoutedResponse(route);
			await gate;
			await route.fulfill({ response });
		});
		try {
			await page.goto("/photography");
			await waitForHydration(page);
			const scrolled = await scrollResults(page, 350);
			await recordScrolls(page);
			const portraits = page.getByRole("button", {
				name: "Choose filter: Portraits",
			});
			if (await portraits.isVisible()) {
				await portraits.click();
			} else {
				await page.getByRole("button", { name: "Dance", exact: true }).click();
				await page
					.getByRole("menuitem", { name: "Portraits", exact: true })
					.click();
			}
			await expect(page.locator("[data-photography-album]")).toHaveAttribute(
				"aria-busy",
				"true",
			);
			await nextFrames(page);
			expect(await readScrolls(page)).toHaveLength(0);
			expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(
				scrolled,
				0,
			);

			release();
			await expect(page.locator("[data-photography-album]")).toHaveAttribute(
				"data-photography-album",
				"Portraits",
			);
			await expectResultsStart(page);
			await nextFrames(page);
			expect(await readScrolls(page)).toHaveLength(1);
			await expectFilterFocused(page, "Portraits");
		} finally {
			release();
		}
	});
});
