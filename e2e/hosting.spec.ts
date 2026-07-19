import { expect, test } from "@playwright/test";

const canonicalUrl = "https://pauldiloreto.com/";
const expectsStatic404 =
	process.env.PLAYWRIGHT_STATIC === "1" ||
	Boolean(process.env.PLAYWRIGHT_BASE_URL);

test("home exposes canonical metadata and static assets", async ({ page }) => {
	const response = await page.goto("/");

	expect(response?.status()).toBe(200);
	await expect(
		page.getByRole("heading", { name: "Paul DiLoreto", level: 1 }),
	).toBeVisible();
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		"href",
		canonicalUrl,
	);
	await expect(page.locator('img[alt="Paul DiLoreto"]')).toHaveAttribute(
		"width",
		"960",
	);
});

test("unknown paths render the custom static 404 without hydration errors", async ({
	page,
}, testInfo) => {
	const clientErrors: string[] = [];
	page.on("console", (message) => {
		if (
			message.type() === "error" &&
			/hydrat|mismatch|react error/i.test(message.text())
		) {
			clientErrors.push(message.text());
		}
	});
	page.on("pageerror", (error) => clientErrors.push(error.message));

	const response = await page.goto("/hosting-migration-missing-page");
	const responseBody = await response?.text();

	expect(response?.status()).toBe(404);
	expect(responseBody).toContain("404: Page Not Found");
	expect(responseBody).not.toContain('class="h-screen flex flex-col');
	if (expectsStatic404) {
		expect(responseBody).not.toContain('aria-label="Open Navigation"');
	}
	await expect(
		page.getByRole("heading", { name: "404: Page Not Found", level: 1 }),
	).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Paul DiLoreto", level: 1 }),
	).toHaveCount(0);
	if (expectsStatic404 && testInfo.project.name === "mobile") {
		await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Open Navigation" }),
		).toHaveCount(0);
	}
	await page.waitForLoadState("networkidle");
	expect(clientErrors).toEqual([]);
});
