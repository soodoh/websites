import { expect, test } from "@tests/playwright";

test("operates media controls in the mobile layout", async ({ page }) => {
	await page.goto("/media");

	const playlist = page.getByRole("region", { name: "Arias video playlist" });
	const playlistItems = playlist.getByRole("list").getByRole("button");
	await expect(playlistItems).toHaveCount(13);
	await playlistItems.last().tap();
	await expect(page.getByTitle("YouTube video: Seguidilla")).toBeVisible();

	const gallery = page.getByRole("region", { name: "Photo gallery" });
	await gallery.getByRole("button", { name: "Next slide" }).tap();
	await expect(gallery.getByRole("status")).toHaveText(/2 \/ \d+/);
});
