import { useState, useSyncExternalStore } from "react";
import { createAlbumSelection } from "@/lib/album-selection";
import type { Album } from "@/lib/types";

export function useAlbumSelection(
	initialAlbum: Album,
	albumSources: Readonly<Record<string, string>>,
) {
	// Release inputs are fixed for this mounted photography visit, including SSR.
	const [selection] = useState(() =>
		createAlbumSelection(initialAlbum, albumSources),
	);
	const state = useSyncExternalStore(
		selection.subscribe,
		selection.getSnapshot,
		selection.getSnapshot,
	);
	return { ...state, selectAlbum: selection.selectAlbum };
}
