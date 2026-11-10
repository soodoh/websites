import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { build } from "vite";
import type { ProcessedImage } from "vite-imagetools";
import { describe, expect, test } from "vitest";
import { getImageWidths, type ResponsiveImageData } from "../src/policy";
import { optimizedPicture, responsiveImages } from "../src/vite";

function image(format: string, width: number, bytes: number): ProcessedImage {
	return {
		src: `/${format}-${width}`,
		info: { width, height: width },
		transforms: { format },
		sharpMetadata: { size: bytes },
	} as ProcessedImage;
}

describe("responsive image policy", () => {
	test("sorts, deduplicates, validates, and never upscales", () => {
		expect(getImageWidths(500, [640, 320, 320, 0, -1, NaN, 240])).toEqual([
			240, 320, 500,
		]);
		expect(getImageWidths(100)).toEqual([100]);
		expect(getImageWidths(8000)).toEqual([240, 320, 480, 640, 960, 1440, 2160]);
		expect(() => getImageWidths(0)).toThrow();
		expect(() => getImageWidths(100.5)).toThrow();
		expect(() => getImageWidths(100, [], Infinity)).toThrow();
	});

	test("drops widths and formats that would transfer more bytes", async () => {
		const picture = (await optimizedPicture()([
			image("avif", 320, 15),
			image("avif", 500, 30),
			image("webp", 320, 20),
			image("webp", 500, 30),
			image("webp", 500, 10),
			image("gif", 320, 40),
			image("gif", 500, 25),
		])) as ResponsiveImageData;
		expect(picture.sources).toEqual({
			webp: "/webp-500 500w",
			gif: "/gif-500 500w",
		});
		expect(picture.img).toEqual({ src: "/gif-500", w: 500, h: 500 });
	});

	test("keeps AVIF, WebP, and fallback when each offers a useful improvement", async () => {
		const picture = (await optimizedPicture()([
			image("avif", 320, 10),
			image("avif", 640, 20),
			image("webp", 320, 20),
			image("webp", 640, 40),
			image("jpeg", 320, 40),
			image("jpeg", 640, 80),
		])) as ResponsiveImageData;
		expect(Object.keys(picture.sources)).toEqual(["avif", "webp", "jpeg"]);
		expect(picture.sources.jpeg).toBe("/jpeg-320 320w, /jpeg-640 640w");
	});
});

test("real Vite build emits responsive assets and keeps the map below its previous 27 KB", async () => {
	const root = await mkdtemp(join(tmpdir(), "websites-images-"));
	try {
		const map = new URL(
			"../../../apps/diloreto/src/assets/images/family-history/maps/diloreto-surname-distribution-italy.gif",
			import.meta.url,
		);
		await writeFile(join(root, "map.gif"), await readFile(map));
		await sharp({
			create: { width: 800, height: 600, channels: 3, background: "#839bd0" },
		})
			.jpeg()
			.toFile(join(root, "photo.jpg"));
		await writeFile(
			join(root, "entry.js"),
			'export { default as map } from "./map.gif?responsive"; export { default as photo } from "./photo.jpg?responsive";',
		);
		const result = await build({
			root,
			configFile: false,
			logLevel: "silent",
			plugins: [responsiveImages()],
			build: {
				minify: false,
				rollupOptions: {
					input: join(root, "entry.js"),
					preserveEntrySignatures: "strict",
				},
			},
		});
		if (Array.isArray(result) || !("output" in result))
			throw new Error("Expected a single build");
		const entry = result.output.find(
			(output) => output.type === "chunk" && output.isEntry,
		);
		if (!entry) throw new Error("Build did not emit an entry");
		const data = (await import(
			/* @vite-ignore */ pathToFileURL(join(root, "dist", entry.fileName)).href
		)) as { map: ResponsiveImageData; photo: ResponsiveImageData };
		for (const image of [data.map, data.photo]) {
			expect(image.placeholder).toMatch(/^data:image\/webp;base64,/);
			const bytes = Buffer.from(
				image.placeholder?.split(",")[1] ?? "",
				"base64",
			);
			expect(bytes.length).toBeLessThanOrEqual(2048);
			const metadata = await sharp(bytes).metadata();
			expect(metadata.width).toBeLessThanOrEqual(24);
			expect(metadata.height).toBeLessThanOrEqual(24);
		}
		expect(data.map.img.w).toBe(500);
		expect(Object.keys(data.map.sources)[0]).toBe("webp");
		const selectedUrl = data.map.sources.webp.split(" ")[0];
		const selectedBytes = await readFile(join(root, "dist", selectedUrl));
		expect(selectedBytes.length).toBeLessThan(10_000);
		expect((await sharp(selectedBytes).metadata()).width).toBe(500);
		expect(await sharp(selectedBytes).raw().toBuffer()).toEqual(
			await sharp(await readFile(map))
				.raw()
				.toBuffer(),
		);
		for (const srcSet of Object.values(data.photo.sources)) {
			const widths = [...srcSet.matchAll(/ (\d+)w/g)].map((match) =>
				Number(match[1]),
			);
			expect(widths.length).toBeGreaterThan(1);
			expect(Math.max(...widths)).toBe(800);
		}
	} finally {
		await rm(root, { recursive: true, force: true });
	}
}, 30_000);
