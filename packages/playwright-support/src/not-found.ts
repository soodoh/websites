import { expect, type Page } from "@playwright/test";
import type { RuntimeDiagnostics } from "./test";

type NotFoundOptions = {
	path: string;
	heading: string;
	title: string;
	navigation: { name: string; destination: RegExp; title: string };
	mobileMenu?: boolean;
};

/** Exercise the deployed fallback, including hydration and recovery navigation. */
export async function expectNotFoundPage(
	{ page, diagnostics }: { page: Page; diagnostics: RuntimeDiagnostics },
	{ path, heading, title, navigation, mobileMenu = true }: NotFoundOptions,
): Promise<void> {
	diagnostics.allowResponse(path, 404);
	diagnostics.allowConsoleError(/Failed to load resource.*404/);
	const response = await page.goto(path);
	expect(response?.status()).toBe(404);
	expect(await response?.text()).toContain(heading);
	await expect(
		page.getByRole("heading", { name: heading, exact: true }),
	).toBeVisible();
	await expect(page).toHaveTitle(title);
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
		"content",
		/noindex/,
	);

	const mobile = (page.viewportSize()?.width ?? 1280) < 768;
	if (mobile && mobileMenu) {
		const trigger = page.getByRole("button", {
			name: "Open Navigation",
			exact: true,
		});
		await expect(trigger).toBeVisible();
		await trigger.click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await page.keyboard.press("Escape");
		await expect(page.getByRole("dialog")).toBeHidden();
		await expect(trigger).toBeFocused();
		await trigger.click();
	}
	await page
		.getByRole("link", { name: navigation.name, exact: true })
		.filter({ visible: true })
		.click();
	await expect(page).toHaveURL(navigation.destination);
	await expect(page).toHaveTitle(navigation.title);
	await expect(
		page.locator('meta[name="robots"][content*="noindex"]'),
	).toHaveCount(0);
	await expect(
		page.getByRole("heading", { name: heading, exact: true }),
	).toHaveCount(0);
	await page.goBack();
	await expect(
		page.getByRole("heading", { name: heading, exact: true }),
	).toBeVisible();
	await expect(page).toHaveTitle(title);
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
		"content",
		/noindex/,
	);
}
