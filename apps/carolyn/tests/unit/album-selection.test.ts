import { describe, expect, test, vi } from "vitest";
import { createAlbumSelection } from "@/lib/album-selection";
import type { Album } from "@/lib/types";

const dance: Album = { name: "Dance", photos: [] };
const portraits: Album = { name: "Portraits", photos: [] };
const spaces: Album = { name: "Spaces", photos: [] };
const sources = {
	Portraits: "/albums/portraits.json",
	Spaces: "/albums/spaces.json",
};

function deferredAlbum() {
	let resolve!: (album: Album) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<Album>((accept, fail) => {
		resolve = accept;
		reject = fail;
	});
	return { promise, resolve, reject };
}

function pendingSelection() {
	const portraitRequest = deferredAlbum();
	const spacesRequest = deferredAlbum();
	const load = vi.fn((url: string) => {
		if (url === sources.Portraits) return portraitRequest.promise;
		if (url === sources.Spaces) return spacesRequest.promise;
		throw new Error(`Unexpected album: ${url}`);
	});
	return {
		selection: createAlbumSelection(dance, sources, load),
		portraitRequest,
		spacesRequest,
		load,
	};
}

describe("photography album selection", () => {
	test("starts with a stable initial snapshot and never fetches during creation", () => {
		const { selection, load } = pendingSelection();
		expect(selection.getSnapshot()).toEqual({
			album: dance,
			selectedAlbumName: "Dance",
			isLoading: false,
		});
		expect(selection.getSnapshot()).toBe(selection.getSnapshot());
		expect(load).not.toHaveBeenCalled();
	});

	test("publishes complete loading and ready snapshots, then reuses cached albums", async () => {
		const { selection, portraitRequest, load } = pendingSelection();
		const initial = selection.getSnapshot();
		const listener = vi.fn();
		const unsubscribe = selection.subscribe(listener);
		const pending = selection.selectAlbum("Portraits");
		expect(selection.getSnapshot()).toEqual({
			album: dance,
			selectedAlbumName: "Portraits",
			isLoading: true,
		});
		expect(initial).toEqual({
			album: dance,
			selectedAlbumName: "Dance",
			isLoading: false,
		});
		portraitRequest.resolve(portraits);
		await pending;
		expect(selection.getSnapshot()).toEqual({
			album: portraits,
			selectedAlbumName: "Portraits",
			isLoading: false,
		});
		expect(listener).toHaveBeenCalledTimes(2);
		unsubscribe();
		await selection.selectAlbum("Dance");
		await selection.selectAlbum("Portraits");
		expect(selection.getSnapshot().album).toBe(portraits);
		expect(load).toHaveBeenCalledExactlyOnceWith(sources.Portraits);
		expect(listener).toHaveBeenCalledTimes(2);
	});

	test("repeated selection of the pending album does not fetch or notify twice", async () => {
		const { selection, portraitRequest, load } = pendingSelection();
		const listener = vi.fn();
		selection.subscribe(listener);
		const first = selection.selectAlbum("Portraits");
		const loading = selection.getSnapshot();
		await selection.selectAlbum("Portraits");
		expect(selection.getSnapshot()).toBe(loading);
		expect(listener).toHaveBeenCalledTimes(1);
		expect(load).toHaveBeenCalledTimes(1);
		portraitRequest.resolve(portraits);
		await first;
	});

	test("rapid switches reuse an in-flight album and only commit the latest choice", async () => {
		const { selection, portraitRequest, spacesRequest, load } =
			pendingSelection();
		const firstPortraits = selection.selectAlbum("Portraits");
		const pendingSpaces = selection.selectAlbum("Spaces");
		const latestPortraits = selection.selectAlbum("Portraits");
		expect(load.mock.calls.map(([url]) => url)).toEqual([
			sources.Portraits,
			sources.Spaces,
		]);
		portraitRequest.resolve(portraits);
		await Promise.all([firstPortraits, latestPortraits]);
		const committed = selection.getSnapshot();
		spacesRequest.resolve(spaces);
		await pendingSpaces;
		expect(selection.getSnapshot()).toBe(committed);
		expect(committed.album).toBe(portraits);
		await selection.selectAlbum("Spaces");
		expect(selection.getSnapshot().album).toBe(spaces);
		expect(load).toHaveBeenCalledTimes(2);
	});

	test("an older success does not clear the latest choice's loading state", async () => {
		const { selection, portraitRequest, spacesRequest } = pendingSelection();
		const old = selection.selectAlbum("Portraits");
		const latest = selection.selectAlbum("Spaces");
		const loading = selection.getSnapshot();
		portraitRequest.resolve(portraits);
		await old;
		expect(selection.getSnapshot()).toBe(loading);
		expect(loading).toMatchObject({
			album: dance,
			selectedAlbumName: "Spaces",
			isLoading: true,
		});
		spacesRequest.resolve(spaces);
		await latest;
		expect(selection.getSnapshot().album).toBe(spaces);
	});

	test("selecting a cached album invalidates an older request", async () => {
		const { selection, portraitRequest } = pendingSelection();
		const pending = selection.selectAlbum("Portraits");
		await selection.selectAlbum("Dance");
		const cached = selection.getSnapshot();
		portraitRequest.resolve(portraits);
		await pending;
		expect(selection.getSnapshot()).toBe(cached);
		expect(cached).toEqual({
			album: dance,
			selectedAlbumName: "Dance",
			isLoading: false,
		});
	});

	test("rolls back to the last displayed album and evicts rejection for retry", async () => {
		const retry = deferredAlbum();
		const load = vi
			.fn<(url: string) => Promise<Album>>()
			.mockResolvedValueOnce(portraits)
			.mockRejectedValueOnce(new Error("temporary failure"))
			.mockReturnValueOnce(retry.promise);
		const selection = createAlbumSelection(dance, sources, load);
		await selection.selectAlbum("Portraits");
		await expect(selection.selectAlbum("Spaces")).resolves.toBeUndefined();
		expect(selection.getSnapshot()).toEqual({
			album: portraits,
			selectedAlbumName: "Portraits",
			isLoading: false,
			loadError: "Unable to load this album. Please try again.",
		});
		const retried = selection.selectAlbum("Spaces");
		expect(selection.getSnapshot()).toMatchObject({
			selectedAlbumName: "Spaces",
			isLoading: true,
			loadError: undefined,
		});
		retry.resolve(spaces);
		await retried;
		expect(selection.getSnapshot()).toEqual({
			album: spaces,
			selectedAlbumName: "Spaces",
			isLoading: false,
		});
		expect(load.mock.calls.map(([url]) => url)).toEqual([
			sources.Portraits,
			sources.Spaces,
			sources.Spaces,
		]);
	});

	test.each(["pending", "ready"])(
		"an older rejection does not affect the latest %s choice",
		async (phase) => {
			const { selection, portraitRequest, spacesRequest } = pendingSelection();
			const old = selection.selectAlbum("Portraits");
			const latest = selection.selectAlbum("Spaces");
			if (phase === "ready") {
				spacesRequest.resolve(spaces);
				await latest;
			}
			const snapshot = selection.getSnapshot();
			portraitRequest.reject(new Error("stale failure"));
			await old;
			expect(selection.getSnapshot()).toBe(snapshot);
			spacesRequest.resolve(spaces);
			await latest;
		},
	);

	test("a missing source is a recoverable selection error, not a fetch", async () => {
		const { selection, load } = pendingSelection();
		await expect(selection.selectAlbum("Unknown")).resolves.toBeUndefined();
		expect(selection.getSnapshot()).toMatchObject({
			album: dance,
			selectedAlbumName: "Dance",
			isLoading: false,
			loadError: expect.any(String),
		});
		expect(load).not.toHaveBeenCalled();
		await selection.selectAlbum("Dance");
		expect(selection.getSnapshot().loadError).toBeUndefined();
	});

	test("a synchronous loader failure also rolls back and can be retried", async () => {
		const load = vi
			.fn<(url: string) => Promise<Album>>()
			.mockImplementationOnce(() => {
				throw new Error("loader failed");
			})
			.mockResolvedValueOnce(portraits);
		const selection = createAlbumSelection(dance, sources, load);
		await selection.selectAlbum("Portraits");
		expect(selection.getSnapshot().loadError).toBeDefined();
		await selection.selectAlbum("Portraits");
		expect(selection.getSnapshot().album).toBe(portraits);
		expect(selection.getSnapshot().loadError).toBeUndefined();
	});

	test("independent visits do not share cached albums or requests", async () => {
		const load = vi.fn().mockResolvedValue(portraits);
		const first = createAlbumSelection(dance, sources, load);
		const second = createAlbumSelection(dance, sources, load);
		await first.selectAlbum("Portraits");
		expect(second.getSnapshot().album).toBe(dance);
		await second.selectAlbum("Portraits");
		expect(load).toHaveBeenCalledTimes(2);
	});

	test.each([
		new Response("temporary failure", { status: 503 }),
		new Response("{broken"),
		new Response(JSON.stringify({ name: "Portraits", photos: [null] })),
	])(
		"uses the real album HTTP/validation adapter and recovers from invalid responses %#",
		async (response) => {
			const fetch = vi
				.spyOn(globalThis, "fetch")
				.mockResolvedValueOnce(response)
				.mockResolvedValueOnce(new Response(JSON.stringify(portraits)));
			const selection = createAlbumSelection(dance, sources);
			await selection.selectAlbum("Portraits");
			expect(selection.getSnapshot()).toMatchObject({
				album: dance,
				isLoading: false,
				loadError: expect.any(String),
			});
			await selection.selectAlbum("Portraits");
			expect(selection.getSnapshot().album).toEqual(portraits);
			expect(fetch).toHaveBeenNthCalledWith(1, sources.Portraits, {
				headers: { Accept: "application/json" },
			});
		},
	);
});
