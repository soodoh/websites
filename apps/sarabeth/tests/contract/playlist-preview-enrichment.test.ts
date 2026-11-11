import { fallbackPlaceholder } from "@websites/images";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { enrichPlaylistPreviews } from "@/utils/playlist-preview-enrichment.server";
import type { YouTubePlaylistVideo } from "@/utils/types";

const preview = "data:image/webp;base64,cHJldmlldw==";
const video = (id = "video-1"): YouTubePlaylistVideo => ({
	id,
	title: id,
	duration: "5:08",
	thumbnailUrl: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
	thumbnailRenditions: [
		{
			url: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
			width: 1280,
			height: 720,
		},
		{
			url: `https://i.ytimg.com/vi/${id}/default.jpg`,
			width: 120,
			height: 90,
		},
		{
			url: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
			width: 320,
			height: 180,
		},
	],
	embeddable: true,
	madeForKids: false,
	watchUrl: `https://www.youtube.com/watch?v=${id}`,
});

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	vi.useRealTimers();
});

test("selects an existing same-ratio rendition without mutating or reordering videos", async () => {
	const videos = Object.freeze([
		Object.freeze(video("second")),
		Object.freeze(video("first")),
	]);
	const original = structuredClone(videos);
	const loadThumbnailPreview = vi.fn(async (_source: string) => preview);
	const result = await enrichPlaylistPreviews(videos, {
		timeoutMilliseconds: 8000,
		loadThumbnailPreview,
	});
	expect(loadThumbnailPreview.mock.calls.map(([source]) => source)).toEqual([
		"https://i.ytimg.com/vi/second/mqdefault.jpg",
		"https://i.ytimg.com/vi/first/mqdefault.jpg",
	]);
	expect(result).toEqual(
		videos.map((item) => ({ ...item, thumbnailPlaceholder: preview })),
	);
	expect(result[0]).not.toBe(videos[0]);
	expect(videos).toEqual(original);
	expect(vi.getTimerCount()).toBe(0);
});

test("uses the original thumbnail when no rendition metadata exists", async () => {
	const item = { ...video(), thumbnailRenditions: undefined };
	const loadThumbnailPreview = vi.fn(async (_source: string) => preview);
	await enrichPlaylistPreviews([item], {
		timeoutMilliseconds: 100,
		loadThumbnailPreview,
	});
	expect(loadThumbnailPreview).toHaveBeenCalledExactlyOnceWith(
		item.thumbnailUrl,
	);
});

test("missing adapters and empty playlists need no timers or remote work", async () => {
	const loadThumbnailPreview = vi.fn(async () => preview);
	await expect(
		enrichPlaylistPreviews([], {
			timeoutMilliseconds: 100,
			loadThumbnailPreview,
		}),
	).resolves.toEqual([]);
	expect(loadThumbnailPreview).not.toHaveBeenCalled();
	await expect(
		enrichPlaylistPreviews([video()], { timeoutMilliseconds: 100 }),
	).resolves.toEqual([
		{ ...video(), thumbnailPlaceholder: fallbackPlaceholder },
	]);
	expect(vi.getTimerCount()).toBe(0);
});

test.each(["reject", "throw"])(
	"a loader that fails by %s retains videos and clears its deadline timer",
	async (failure) => {
		const result = await enrichPlaylistPreviews([video()], {
			timeoutMilliseconds: 100,
			loadThumbnailPreview: () => {
				if (failure === "throw") throw new Error("unavailable");
				return Promise.reject(new Error("unavailable"));
			},
		});
		expect(result).toEqual([
			{ ...video(), thumbnailPlaceholder: fallbackPlaceholder },
		]);
		expect(vi.getTimerCount()).toBe(0);
	},
);

test("stalled previews share the one-second budget and do not start queued loads after it", async () => {
	const videos = Array.from({ length: 8 }, (_, index) => video(`v${index}`));
	const loadThumbnailPreview = vi.fn(() => new Promise<string>(() => {}));
	const pending = enrichPlaylistPreviews(videos, {
		timeoutMilliseconds: 8000,
		loadThumbnailPreview,
	});
	await vi.advanceTimersByTimeAsync(0);
	expect(loadThumbnailPreview).toHaveBeenCalledTimes(4);
	await vi.advanceTimersByTimeAsync(1000);
	await expect(pending).resolves.toEqual(
		videos.map((item) => ({
			...item,
			thumbnailPlaceholder: fallbackPlaceholder,
		})),
	);
	expect(loadThumbnailPreview).toHaveBeenCalledTimes(4);
	expect(vi.getTimerCount()).toBe(0);
});

test("later batches use the remaining budget and late results cannot change returned previews", async () => {
	const videos = Array.from({ length: 6 }, (_, index) => video(`v${index}`));
	const loadThumbnailPreview = vi.fn(
		() =>
			new Promise<string>((resolve) => setTimeout(() => resolve(preview), 750)),
	);
	const pending = enrichPlaylistPreviews(videos, {
		timeoutMilliseconds: 8000,
		loadThumbnailPreview,
	});
	await vi.advanceTimersByTimeAsync(750);
	expect(loadThumbnailPreview).toHaveBeenCalledTimes(6);
	await vi.advanceTimersByTimeAsync(250);
	const result = await pending;
	const expected = videos.map((item, index) => ({
		...item,
		thumbnailPlaceholder: index < 4 ? preview : fallbackPlaceholder,
	}));
	expect(result).toEqual(expected);
	await vi.advanceTimersByTimeAsync(500);
	expect(result).toEqual(expected);
	expect(vi.getTimerCount()).toBe(0);
});

test("a shorter request timeout caps the entire preview budget", async () => {
	let settled = false;
	const pending = enrichPlaylistPreviews([video()], {
		timeoutMilliseconds: 10,
		loadThumbnailPreview: () => new Promise<string>(() => {}),
	}).then((result) => {
		settled = true;
		return result;
	});
	await vi.advanceTimersByTimeAsync(9);
	expect(settled).toBe(false);
	await vi.advanceTimersByTimeAsync(1);
	await expect(pending).resolves.toEqual([
		{ ...video(), thumbnailPlaceholder: fallbackPlaceholder },
	]);
	expect(vi.getTimerCount()).toBe(0);
});

test("an exhausted budget skips remote work", async () => {
	const loadThumbnailPreview = vi.fn(async () => preview);
	await expect(
		enrichPlaylistPreviews([video()], {
			timeoutMilliseconds: 0,
			loadThumbnailPreview,
		}),
	).resolves.toEqual([
		{ ...video(), thumbnailPlaceholder: fallbackPlaceholder },
	]);
	expect(loadThumbnailPreview).not.toHaveBeenCalled();
	expect(vi.getTimerCount()).toBe(0);
});
