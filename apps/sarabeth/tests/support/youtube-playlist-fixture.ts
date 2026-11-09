import youtubePlaylistJson from "@tests/fixtures/youtube-playlist.json" with {
	type: "json",
};
import { decodeYouTubePlaylist } from "@/utils/youtube-playlist-data";

export const youtubePlaylistFixture = decodeYouTubePlaylist(
	youtubePlaylistJson,
	"youtubePlaylistFixture",
);
