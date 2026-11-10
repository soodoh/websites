import { BLOCKS } from "@contentful/rich-text-types";
import { contentfulFixture } from "@tests/fixtures/contentful";
import { fallbackPlaceholder } from "@websites/images";
import { createContentfulPreviewLoader } from "@websites/images/contentful/server";
import { expect, test, vi } from "vitest";
import { prepareReleaseImages } from "@/lib/prepare-release-images.server";
import {
	captureReleaseContent,
	generateReleaseContent,
} from "@/lib/release-content-model";

test("prepares each unique remote preview once and retains protected partitioning", async () => {
	const snapshot = await captureReleaseContent(async () => ({
		kind: "fixture",
		content: contentfulFixture,
	}));
	const project = snapshot.projects.find((project) => project.password);
	if (!project) throw new Error("Expected protected fixture project");
	const secretImage = {
		...project.detail.coverImage,
		id: "protected-image",
		url: "https://images.ctfassets.net/space/protected/image.jpg",
		placeholder: fallbackPlaceholder,
	};
	project.detail = {
		...project.detail,
		description: {
			...project.detail.description,
			content: [
				...project.detail.description.content,
				{
					nodeType: BLOCKS.EMBEDDED_ASSET,
					data: { image: secretImage },
					content: [],
				},
				{
					nodeType: BLOCKS.EMBEDDED_ASSET,
					data: { image: secretImage },
					content: [],
				},
			],
		},
	};
	const loadPreview = vi.fn(
		async () => "data:image/webp;base64,protected-preview",
	);
	const prepared = await prepareReleaseImages(snapshot, loadPreview);
	expect(loadPreview).toHaveBeenCalledExactlyOnceWith(secretImage.url);
	expect(JSON.stringify(snapshot)).not.toContain("protected-preview");
	const release = await generateReleaseContent(
		prepared,
		async () => "hash",
		async () => "version",
	);
	expect(JSON.stringify(release.publicContent)).not.toContain(
		"protected-preview",
	);
	expect(JSON.stringify(release.albumFiles)).not.toContain("protected-preview");
	expect(JSON.stringify(release.protectedProjectDetails)).toContain(
		"protected-preview",
	);
});

test("an oversized optional preview does not abort release generation", async () => {
	const snapshot = await captureReleaseContent(async () => ({
		kind: "fixture",
		content: contentfulFixture,
	}));
	const image = {
		...snapshot.backgroundImage,
		url: "https://images.ctfassets.net/space/asset/version/photo.jpg",
		placeholder: fallbackPlaceholder,
	};
	snapshot.backgroundImage = image;
	const fetchImage = vi.fn(
		async () =>
			new Response(new Uint8Array(512_001), {
				headers: { "content-length": "512001" },
			}),
	);
	const prepared = await prepareReleaseImages(
		snapshot,
		createContentfulPreviewLoader({
			fetch: Object.assign(fetchImage, { preconnect: vi.fn() }),
		}),
	);
	expect(fetchImage).toHaveBeenCalled();
	expect(prepared.backgroundImage).toEqual(image);
	const release = await generateReleaseContent(
		prepared,
		async () => "hash",
		async () => "version",
	);
	expect(release.publicContent).toBeDefined();
});

test("fixture previews never require remote image requests", async () => {
	const snapshot = await captureReleaseContent(async () => ({
		kind: "fixture",
		content: contentfulFixture,
	}));
	const loadPreview = vi.fn(async () => {
		throw new Error("Unexpected network request");
	});
	await prepareReleaseImages(snapshot, loadPreview);
	expect(loadPreview).not.toHaveBeenCalled();
});
