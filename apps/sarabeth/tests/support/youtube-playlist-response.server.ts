import { youtubePlaylistFixture } from "@tests/support/youtube-playlist-fixture";
import { youtubePlaylistSuccessCacheControl } from "@/utils/youtube-playlist.server";

export const handleYouTubePlaylistRequest = async (): Promise<Response> =>
	Response.json(youtubePlaylistFixture, {
		headers: { "Cache-Control": youtubePlaylistSuccessCacheControl },
	});
