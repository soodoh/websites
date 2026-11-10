import { contentfulFixture } from "@tests/fixtures/contentful";
import { describe, expect, test } from "vitest";
import {
	captureReleaseContent,
	generateReleaseContent,
} from "@/lib/release-content-model";
import { createReleaseFunctionId } from "@/lib/static-release-function-id";

const photographyFunction = {
	filename: "/src/lib/release-server-functions.ts",
	functionName: "getStaticPhotographyContent_createServerFn_handler",
};

describe("static release function IDs", () => {
	test("changes the cache identity when a new release replaces an album file", async () => {
		const snapshot = await captureReleaseContent(async () => ({
			kind: "fixture",
			content: contentfulFixture,
		}));
		const previousRelease = await generateReleaseContent(
			snapshot,
			async () => "test-hash",
			async () => "test-auth-version",
		);
		const currentRelease = await generateReleaseContent(
			{
				...snapshot,
				albums: snapshot.albums.map((album) =>
					album.name === "Portraits"
						? {
								...album,
								photos: album.photos.map((photo) => ({
									...photo,
									title: `${photo.title} updated`,
								})),
							}
						: album,
				),
			},
			async () => "test-hash",
			async () => "test-auth-version",
		);
		const oldAlbumUrl =
			previousRelease.publicContent.photography.albumSources.Portraits;
		expect(
			currentRelease.publicContent.photography.albumSources.Portraits,
		).not.toBe(oldAlbumUrl);
		expect(Object.keys(currentRelease.albumFiles)).not.toContain(
			oldAlbumUrl.split("/").at(-1),
		);
		const previous = createReleaseFunctionId(
			JSON.stringify(previousRelease.publicContent),
		);
		const current = createReleaseFunctionId(
			JSON.stringify(currentRelease.publicContent),
		);
		expect(current(photographyFunction)).not.toBe(
			previous(photographyFunction),
		);
	});

	test("is deterministic for an unchanged content release", () => {
		const content = JSON.stringify({ albumNames: ["Dance", "Portraits"] });
		expect(createReleaseFunctionId(content)(photographyFunction)).toBe(
			createReleaseFunctionId(content)(photographyFunction),
		);
		expect(createReleaseFunctionId(content)(photographyFunction)).toMatch(
			/^[a-f0-9]{64}$/,
		);
	});

	test("keeps functions within one release distinct", () => {
		const generate = createReleaseFunctionId("public content");
		expect(generate(photographyFunction)).not.toBe(
			generate({
				...photographyFunction,
				functionName: "getStaticHomeContent",
			}),
		);
	});

	test("preserves the default ID generation for runtime functions", () => {
		expect(
			createReleaseFunctionId("public content")({
				filename: "/src/lib/project-auth.ts",
				functionName: "authenticateProject",
			}),
		).toBeUndefined();
	});
});
