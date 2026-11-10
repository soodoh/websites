import { expect, test } from "@tests/playwright";
import { youtubePlaylistFixture } from "@tests/support/youtube-playlist-fixture";

test("playlist button names include all visible labels, including duration and selection", async ({
	page,
}) => {
	await page.goto("/media");
	const playlist = page.getByRole("region", { name: "Arias video playlist" });
	const buttons = playlist.getByRole("list").getByRole("button");
	await expect(buttons).toHaveCount(youtubePlaylistFixture.videos.length);
	for (const [index, video] of youtubePlaylistFixture.videos.entries()) {
		const action = video.embeddable
			? "Play"
			: "Select video; opens on YouTube:";
		const selected = index === 0 ? " Selected" : "";
		await expect(buttons.nth(index)).toHaveAccessibleName(
			`${action} ${video.duration} ${index + 1}. ${video.title}${selected}`
				.replace(/\s+/g, " ")
				.trim(),
		);
	}
	await page.evaluate(() => document.fonts.ready);
	const bounds = await page.evaluate(() => ({
		documentBottom: document.documentElement.scrollHeight,
		footerBottom:
			(document.querySelector("footer")?.getBoundingClientRect().bottom ?? 0) +
			window.scrollY,
	}));
	expect(bounds.documentBottom).toBeLessThanOrEqual(
		Math.ceil(bounds.footerBottom) + 1,
	);
});

test("media resource hints start the playlist early without a duplicate API request", async ({
	page,
}) => {
	const requests: string[] = [];
	page.on("request", (request) => {
		if (new URL(request.url()).pathname === "/api/youtube-playlist")
			requests.push(request.url());
	});
	const response = await page.goto("/media");
	if (!response) throw new Error("Expected media document");
	const html = await response.text();
	expect(html).toMatch(
		/<link\b(?=[^>]*rel="preconnect")(?=[^>]*href="https:\/\/i\.ytimg\.com")[^>]*>/,
	);
	expect(html).toMatch(
		/<link\b(?=[^>]*rel="preload")(?=[^>]*href="\/api\/youtube-playlist")(?=[^>]*as="fetch")(?=[^>]*crossorigin="anonymous")[^>]*>/i,
	);
	const playlist = page.getByRole("region", { name: "Arias video playlist" });
	await expect(playlist).toBeVisible();
	await expect(playlist.locator("img").first()).toHaveAttribute(
		"fetchpriority",
		"high",
	);
	await expect(playlist.locator("ol img").first()).toHaveAttribute(
		"loading",
		"lazy",
	);
	await page.waitForLoadState("networkidle");
	expect(requests).toHaveLength(1);

	await page.goto("/about");
	await expect(
		page.locator(
			'link[rel="preload"][as="fetch"][href="/api/youtube-playlist"]',
		),
	).toHaveCount(0);
});
