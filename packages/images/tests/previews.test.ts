import sharp from "sharp";
import { describe, expect, test, vi } from "vitest";
import { prepareContentfulImage } from "../src/contentful";
import { createContentfulPreviewLoader } from "../src/contentful.server";
import {
	createBlurPlaceholder,
	createRemotePreviewLoader,
	mapImages,
	previewPolicy,
} from "../src/server";
import {
	prepareYouTubeImage,
	requireYouTubeThumbnailUrl,
} from "../src/youtube";

const source = "https://images.ctfassets.net/space/asset/version/photo.jpg";
const fixture = () =>
	sharp({
		create: {
			width: 80,
			height: 40,
			channels: 4,
			background: { r: 120, g: 40, b: 10, alpha: 0.5 },
		},
	})
		.png()
		.toBuffer();

describe("shared preview preparation", () => {
	test("produces deterministic, tiny, alpha-preserving inline previews from bytes and local pipelines", async () => {
		const bytes = await fixture();
		const preview = await createBlurPlaceholder(bytes);
		expect(preview).toBe(await createBlurPlaceholder(sharp(bytes)));
		expect(preview).toBe(
			await createBlurPlaceholder(sharp(bytes).webp({ lossless: true })),
		);
		const encoded = Buffer.from(preview.split(",")[1], "base64");
		const metadata = await sharp(encoded).metadata();
		expect(metadata.format).toBe("webp");
		expect(metadata.width).toBe(24);
		expect(metadata.height).toBe(12);
		expect(metadata.hasAlpha).toBe(true);
		expect(encoded.length).toBeLessThanOrEqual(previewPolicy.maximumBytes);
	});

	test("deduplicates requests, validates before fetching, rejects redirects, and uses only a small CDN thumbnail", async () => {
		const bytes = await fixture();
		const fetchImage = vi.fn<typeof fetch>(async () => new Response(bytes));
		const load = createContentfulPreviewLoader({ fetch: fetchImage });
		const [first, second] = await Promise.all([load(source), load(source)]);
		expect(first).toBe(second);
		expect(fetchImage).toHaveBeenCalledTimes(1);
		const [url, options] = fetchImage.mock.calls[0];
		expect(String(url)).toContain("w=64&q=40&fm=webp");
		expect(options?.redirect).toBe("error");
		expect(options?.signal).toBeInstanceOf(AbortSignal);
		for (const invalid of [
			"http://images.ctfassets.net/a",
			"https://user:pass@images.ctfassets.net/a",
			"https://images.ctfassets.net:8443/a",
			"https://evil.test/a",
		]) {
			expect(() => load(invalid)).toThrow();
		}
		expect(fetchImage).toHaveBeenCalledTimes(1);
	});

	test("evicts failed requests and rejects oversized streamed responses", async () => {
		const bytes = await fixture();
		let attempts = 0;
		const load = createRemotePreviewLoader({
			validateUrl: requireYouTubeThumbnailUrl,
			fetch: async () =>
				++attempts === 1
					? new Response(null, { status: 503 })
					: new Response(bytes),
		});
		await expect(load("https://i.ytimg.com/a.jpg")).rejects.toThrow(
			"request failed",
		);
		await expect(load("https://i.ytimg.com/a.jpg")).resolves.toMatch(
			/^data:image\/webp;base64,/,
		);
		expect(attempts).toBe(2);
		const oversized = createRemotePreviewLoader({
			validateUrl: requireYouTubeThumbnailUrl,
			fetch: async () => new Response(new Uint8Array(512_001)),
		});
		await expect(oversized("https://i.ytimg.com/a.jpg")).rejects.toThrow(
			"too large",
		);
	});

	test("cancels failed response bodies before releasing concurrency slots", async () => {
		let active = 0;
		let maximum = 0;
		const cancel = vi.fn(async () => {
			// Cancellation must finish, not merely start, before a slot is reused.
			await new Promise<void>((resolve) => setImmediate(resolve));
			active--;
		});
		const load = createRemotePreviewLoader({
			validateUrl: requireYouTubeThumbnailUrl,
			fetch: async () => {
				active++;
				maximum = Math.max(maximum, active);
				return new Response(new ReadableStream({ cancel }), { status: 503 });
			},
		});
		const results = await Promise.allSettled(
			Array.from({ length: 12 }, (_, index) =>
				load(`https://i.ytimg.com/${index}.jpg`),
			),
		);
		expect(results).toEqual(
			Array.from({ length: 12 }, () => ({
				status: "rejected",
				reason: new Error("Image preview request failed"),
			})),
		);
		expect(cancel).toHaveBeenCalledTimes(12);
		expect(active).toBe(0);
		expect(maximum).toBe(4);
	});

	test("bounds concurrent fetches even when callers do not use the batch helper", async () => {
		const bytes = await fixture();
		let active = 0;
		let maximum = 0;
		const load = createRemotePreviewLoader({
			validateUrl: requireYouTubeThumbnailUrl,
			fetch: async () => {
				active++;
				maximum = Math.max(maximum, active);
				await Promise.resolve();
				active--;
				return new Response(bytes);
			},
		});
		await Promise.all(
			Array.from({ length: 12 }, (_, index) =>
				load(`https://i.ytimg.com/${index}.jpg`),
			),
		);
		expect(maximum).toBe(4);
	});

	test("bounds parallel processing while preserving input order", async () => {
		let active = 0;
		let maximum = 0;
		const result = await mapImages(
			Array.from({ length: 12 }, (_, index) => index),
			async (value) => {
				active++;
				maximum = Math.max(maximum, active);
				await Promise.resolve();
				active--;
				return value * 2;
			},
		);
		expect(maximum).toBe(4);
		expect(result).toEqual(Array.from({ length: 12 }, (_, index) => index * 2));
	});
});

describe("delivery adapters", () => {
	test("caps both Contentful dimensions and never upscales responsive candidates", () => {
		const prepared = prepareContentfulImage(
			{
				url: source,
				width: 1000,
				height: 8000,
				placeholder: "data:image/webp;base64,YQ==",
			},
			{ widths: [240, 320, 640, 3840] },
		);
		expect(prepared.img.w).toBe(480);
		expect(prepared.img.h).toBe(3840);
		expect(prepared.img.srcSet).toContain("480w");
		expect(prepared.img.srcSet).not.toContain("640w");
		expect(() =>
			prepareContentfulImage({
				url: source,
				width: 0,
				height: 100,
				placeholder: "",
			}),
		).toThrow();
	});

	test("keeps only actual YouTube renditions with compatible aspect ratios", () => {
		const medium = {
			url: "https://i.ytimg.com/vi/a/mqdefault.jpg",
			width: 320,
			height: 180,
		};
		const large = {
			url: "https://i.ytimg.com/vi/a/maxresdefault.jpg",
			width: 1280,
			height: 720,
		};
		const square = {
			url: "https://i.ytimg.com/vi/a/default.jpg",
			width: 120,
			height: 90,
		};
		const image = prepareYouTubeImage(large.url, [medium, large, square]);
		expect(image.img.w).toBe(1280);
		expect(image.img.srcSet).toBe(`${medium.url} 320w, ${large.url} 1280w`);
		expect(image.img.srcSet).not.toContain("120w");
		expect(prepareYouTubeImage(medium.url).img.srcSet).toBeUndefined();
		expect(
			prepareYouTubeImage(medium.url, [{ url: medium.url, width: 1280 }]).img,
		).toMatchObject({ w: 320, h: 180 });
		expect(() =>
			prepareYouTubeImage(medium.url, [{ ...medium, width: -1 }]),
		).toThrow("positive integers");
		expect(() => prepareYouTubeImage("https://evil.test/a.jpg")).toThrow();
	});
});
