import { expect, test } from "@tests/playwright";
import { youtubePlaylistFixture } from "@tests/support/youtube-playlist-fixture";

test("fixture server supplies a valid playlist without browser interception", async ({
	context,
	page,
	request,
}) => {
	const response = await request.get("/api/youtube-playlist");
	expect(response.status()).toBe(200);
	expect(response.headers()["cache-control"]).toBe(
		"public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
	);
	expect(await response.json()).toEqual(youtubePlaylistFixture);

	await context.unroute("**/api/youtube-playlist");
	await page.goto("/media");
	await expect(
		page.getByRole("region", { name: "Arias video playlist" }),
	).toBeVisible();
	await expect(
		page.getByRole("button", {
			name: "Play featured video: Agnus Dei- Bach B minor Mass",
		}),
	).toBeVisible();
});

test("fixture API retains query and method validation", async ({ request }) => {
	const queried = await request.get("/api/youtube-playlist?playlist=other");
	expect(queried.status()).toBe(400);
	expect(queried.headers()["cache-control"]).toBe("no-store");
	const posted = await request.post("/api/youtube-playlist");
	expect(posted.status()).toBe(405);
	expect(posted.headers().allow).toBe("GET");
});
