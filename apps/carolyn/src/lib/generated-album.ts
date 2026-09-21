import { decodeImage } from "@/lib/image-type";
import { validateAlbumName } from "@/lib/server-function-inputs";
import type { Album } from "@/lib/types";

export function parseGeneratedAlbum(value: unknown): Album {
	if (typeof value !== "object" || value === null || !("photos" in value)) {
		throw new Error("Generated photography album is malformed.");
	}
	const name = validateAlbumName("name" in value ? value.name : undefined);
	if (!Array.isArray(value.photos)) {
		throw new Error(`Generated photography album ${name} is malformed.`);
	}
	const photos = value.photos.map((photo) => {
		const image = decodeImage(photo);
		if (!image) {
			throw new Error(
				`Generated photography album ${name} has an invalid image.`,
			);
		}
		return image;
	});
	return { name, photos };
}

export async function fetchGeneratedAlbum(url: string): Promise<Album> {
	const response = await fetch(url, {
		headers: { Accept: "application/json" },
	});
	if (!response.ok) {
		throw new Error(
			`Unable to load generated photography album: ${response.status}`,
		);
	}
	return parseGeneratedAlbum(await response.json());
}
