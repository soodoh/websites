import { fallbackPlaceholder } from "@websites/images";
import { mapImages } from "@websites/images/server";
import { getYouTubePreviewSource } from "@websites/images/youtube";
import type { YouTubePlaylistVideo } from "@/utils/types";

export type PlaylistPreviewOptions = {
	loadThumbnailPreview?: (source: string) => Promise<string>;
	timeoutMilliseconds: number;
};

/** Optional previews share one batch budget and never mutate the playable videos. */
export async function enrichPlaylistPreviews(
	videos: readonly YouTubePlaylistVideo[],
	{ loadThumbnailPreview: load, timeoutMilliseconds }: PlaylistPreviewOptions,
): Promise<YouTubePlaylistVideo[]> {
	const deadline = Date.now() + Math.min(1000, timeoutMilliseconds);

	async function previewBeforeDeadline(source: string): Promise<string> {
		const remaining = deadline - Date.now();
		if (!load || remaining <= 0) return fallbackPlaceholder;
		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			return await Promise.race([
				Promise.resolve()
					.then(() => load(source))
					.catch(() => fallbackPlaceholder),
				new Promise<string>((resolve) => {
					timer = setTimeout(() => resolve(fallbackPlaceholder), remaining);
				}),
			]);
		} finally {
			clearTimeout(timer);
		}
	}

	return mapImages(videos, async (video) => {
		const source = getYouTubePreviewSource(
			video.thumbnailUrl,
			video.thumbnailRenditions ?? [],
		);
		const thumbnailPlaceholder = await previewBeforeDeadline(source);
		return { ...video, thumbnailPlaceholder };
	});
}
