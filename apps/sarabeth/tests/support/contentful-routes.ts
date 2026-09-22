import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { BrowserContext, Route } from "@playwright/test";
import { contentfulFixture } from "@tests/fixtures/contentful";
import {
	contentfulAssetHost,
	contentfulDownloadHost,
	contentfulImageHost,
} from "@/utils/contentful-asset-url";
import { getSnapshotAudio, getSnapshotImages } from "@/utils/contentful-data";
import type { ImageType } from "@/utils/types";

const fixtureRoot = fileURLToPath(
	new URL("../fixtures/media/", import.meta.url),
);

type AudioRange =
	| { status: 200; start: 0; end: number }
	| { status: 206; start: number; end: number }
	| { status: 416 };

export const parseAudioRange = (
	range: string | undefined,
	size: number,
): AudioRange => {
	if (range === undefined) return { status: 200, start: 0, end: size - 1 };
	const match = /^bytes=(\d*)-(\d*)$/.exec(range);
	if (!match || (match[1] === "" && match[2] === "")) return { status: 416 };
	if (match[1] === "") {
		const suffix = Number(match[2]);
		if (!Number.isSafeInteger(suffix) || suffix <= 0) return { status: 416 };
		return { status: 206, start: Math.max(0, size - suffix), end: size - 1 };
	}
	const start = Number(match[1]);
	const requestedEnd = match[2] === "" ? size - 1 : Number(match[2]);
	if (
		!Number.isSafeInteger(start) ||
		!Number.isSafeInteger(requestedEnd) ||
		start >= size ||
		start > requestedEnd
	) {
		return { status: 416 };
	}
	return { status: 206, start, end: Math.min(requestedEnd, size - 1) };
};

const baseUrl = (source: string): string => {
	const url = new URL(source);
	return `${url.origin}${url.pathname}`;
};

const imageVariant = (
	image: ImageType,
): "landscape" | "portrait" | "square" | "wide" => {
	const ratio = image.width / image.height;
	if (ratio >= 1.8) return "wide";
	if (ratio > 1.05) return "landscape";
	if (ratio <= 0.8) return "portrait";
	return "square";
};

export const installContentfulRoutes = async (
	context: BrowserContext,
): Promise<void> => {
	const imagePaths = new Map(
		getSnapshotImages(contentfulFixture).map((image) => [
			baseUrl(image.url),
			`${fixtureRoot}${imageVariant(image)}.webp`,
		]),
	);
	const audioUrls = new Set(
		getSnapshotAudio(contentfulFixture).map((audio) => baseUrl(audio.url)),
	);
	const audioPath = `${fixtureRoot}audio.wav`;

	await context.route(`https://${contentfulImageHost}/**`, async (route) => {
		const filePath = imagePaths.get(baseUrl(route.request().url()));
		if (!filePath) {
			await route.abort("failed");
			return;
		}
		await route.fulfill({
			body: await readFile(filePath),
			contentType: "image/webp",
		});
	});

	const fulfillAudio = async (route: Route): Promise<void> => {
		if (!audioUrls.has(baseUrl(route.request().url()))) {
			await route.abort("failed");
			return;
		}
		const bytes = await readFile(audioPath);
		const range = parseAudioRange(
			route.request().headers().range,
			bytes.byteLength,
		);
		const headers: Record<string, string> = {
			"Accept-Ranges": "bytes",
			"Content-Type": "audio/wav",
		};
		if (range.status === 416) {
			headers["Content-Range"] = `bytes */${bytes.byteLength}`;
			headers["Content-Length"] = "0";
			await route.fulfill({ status: 416, headers });
			return;
		}
		const body = bytes.subarray(range.start, range.end + 1);
		headers["Content-Length"] = `${body.byteLength}`;
		if (range.status === 206) {
			headers["Content-Range"] =
				`bytes ${range.start}-${range.end}/${bytes.byteLength}`;
		}
		await route.fulfill({
			status: range.status,
			headers,
			body: route.request().method() === "HEAD" ? undefined : body,
		});
	};
	for (const host of [contentfulAssetHost, contentfulDownloadHost]) {
		await context.route(`https://${host}/**`, fulfillAudio);
	}
};
