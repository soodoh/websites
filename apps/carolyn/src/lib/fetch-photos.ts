import type { ContentSourceLoader } from "@/lib/content-source";
import type { PhotosSkeleton } from "@/lib/contentful-types";
import {
	type ContentfulEntry,
	formatImage,
	getAllContentfulEntries,
	requireContentfulAsset,
} from "@/lib/contentful-utils";
import { validateAlbumName } from "@/lib/server-function-inputs";
import type { Album, ImageType } from "@/lib/types";

function formatPhotos(photos: unknown, albumName: string): ImageType[] {
	if (!Array.isArray(photos)) {
		throw new Error(`Photo album ${albumName} is missing its photos.`);
	}
	const photoAssets = photos;
	return photoAssets.map((photo, index) =>
		formatImage(
			requireContentfulAsset(photo, `Photo ${index + 1} in album ${albumName}`),
		),
	);
}

function formatAlbumName(item: ContentfulEntry): string {
	try {
		return validateAlbumName(item.fields.album);
	} catch {
		throw new Error(`Photo entry ${item.sys.id} has a malformed album name.`);
	}
}

function validateUniqueAlbumNames(albumNames: string[]): void {
	const names = new Set<string>();
	for (const albumName of albumNames) {
		validateAlbumName(albumName);
		if (names.has(albumName)) {
			throw new Error(`Duplicate photography album name: ${albumName}`);
		}
		names.add(albumName);
	}
}

function formatAlbum(item: ContentfulEntry): Album {
	const albumName = formatAlbumName(item);
	return {
		name: albumName,
		photos: formatPhotos(item.fields.photos, albumName),
	};
}

export async function getAlbumsFromSource(
	loadSource: ContentSourceLoader,
): Promise<Album[]> {
	const source = await loadSource();
	if (source.kind === "fixture") {
		validateUniqueAlbumNames(source.content.albums.map((album) => album.name));
		return source.content.albums;
	}

	const albums = await getAllContentfulEntries(
		(skip, limit) =>
			source.client.getEntries<PhotosSkeleton>({
				content_type: "photos",
				limit,
				skip,
				order: ["fields.order"],
			}),
		"Photo albums query",
	);
	const formattedAlbums = albums.map(formatAlbum);
	validateUniqueAlbumNames(formattedAlbums.map((album) => album.name));
	return formattedAlbums;
}
