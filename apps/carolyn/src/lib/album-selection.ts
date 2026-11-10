import { fetchGeneratedAlbum } from "@/lib/generated-album";
import type { Album } from "@/lib/types";

export type AlbumSelectionState = Readonly<{
	album: Album;
	selectedAlbumName: string;
	isLoading: boolean;
	loadError?: string;
}>;

/** One visit's album selection; no cache or pending request is shared across visits. */
export function createAlbumSelection(
	initialAlbum: Album,
	albumSources: Readonly<Record<string, string>>,
	loadAlbum: (url: string) => Promise<Album> = fetchGeneratedAlbum,
) {
	let state: AlbumSelectionState = {
		album: initialAlbum,
		selectedAlbumName: initialAlbum.name,
		isLoading: false,
	};
	const cache = new Map([[initialAlbum.name, initialAlbum]]);
	const requests = new Map<string, Promise<Album>>();
	const listeners = new Set<() => void>();
	let selectionId = 0;
	let requestedAlbumName: string | undefined;

	function publish(next: AlbumSelectionState) {
		state = next;
		for (const listener of listeners) listener();
	}

	async function selectAlbum(albumName: string): Promise<void> {
		if (requestedAlbumName === albumName) return;
		const requestId = ++selectionId;
		requestedAlbumName = albumName;
		const cached = cache.get(albumName);
		if (cached) {
			requestedAlbumName = undefined;
			publish({
				album: cached,
				selectedAlbumName: albumName,
				isLoading: false,
			});
			return;
		}

		publish({
			...state,
			selectedAlbumName: albumName,
			isLoading: true,
			loadError: undefined,
		});
		try {
			let request = requests.get(albumName);
			if (!request) {
				const source = albumSources[albumName];
				if (!source) throw new Error(`Album source is missing: ${albumName}`);
				request = loadAlbum(source);
				requests.set(albumName, request);
				const evict = () => {
					if (requests.get(albumName) === request) requests.delete(albumName);
				};
				void request.then(evict, evict);
			}
			const album = await request;
			cache.set(albumName, album);
			if (selectionId === requestId) {
				requestedAlbumName = undefined;
				publish({ album, selectedAlbumName: albumName, isLoading: false });
			}
		} catch {
			if (selectionId === requestId) {
				requestedAlbumName = undefined;
				publish({
					album: state.album,
					selectedAlbumName: state.album.name,
					isLoading: false,
					loadError: "Unable to load this album. Please try again.",
				});
			}
		}
	}

	return {
		getSnapshot: () => state,
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		selectAlbum,
	};
}
