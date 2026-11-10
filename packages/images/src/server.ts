import sharp, { type Sharp } from "sharp";

export const previewPolicy = {
	version: 1,
	width: 24,
	quality: 45,
	maximumBytes: 2048,
} as const;

/** Shared by the local encoder and remote-source adapters; never shipped to browsers. */
export async function createBlurPlaceholder(
	input: Uint8Array | Sharp,
): Promise<string> {
	const image =
		input instanceof Uint8Array
			? sharp(input, { limitInputPixels: 16_000_000 })
			: input.clone();
	const bytes = await image
		.rotate()
		.resize({
			width: previewPolicy.width,
			height: previewPolicy.width,
			fit: "inside",
			withoutEnlargement: true,
		})
		.blur()
		.webp({
			quality: previewPolicy.quality,
			lossless: false,
			nearLossless: false,
		})
		.toBuffer();
	if (bytes.length > previewPolicy.maximumBytes) {
		throw new Error("Image preview exceeds the inline byte budget");
	}
	return `data:image/webp;base64,${bytes.toString("base64")}`;
}

type PreviewLoaderOptions = {
	fetch?: typeof globalThis.fetch;
	validateUrl: (url: string) => URL;
	maximumEntries?: number;
	timeoutMilliseconds?: number;
};

/** Cache scope belongs to the caller. Failures are evicted so later calls can retry. */
export function createRemotePreviewLoader({
	fetch: fetchImage = globalThis.fetch,
	validateUrl,
	maximumEntries = 256,
	timeoutMilliseconds = 8_000,
}: PreviewLoaderOptions): (source: string) => Promise<string> {
	const cache = new Map<string, { expires: number; value: Promise<string> }>();
	const waiting: Array<() => void> = [];
	let active = 0;
	async function acquire() {
		if (active < 4) active++;
		else await new Promise<void>((resolve) => waiting.push(resolve));
	}
	function release() {
		const next = waiting.shift();
		if (next) next();
		else active--;
	}
	return (source) => {
		const url = validateUrl(source);
		const key = `${previewPolicy.version}:${url.href}`;
		const cached = cache.get(key);
		if (cached && cached.expires > Date.now()) return cached.value;
		const value = (async () => {
			await acquire();
			try {
				const response = await fetchImage(url, {
					redirect: "error",
					signal: AbortSignal.timeout(timeoutMilliseconds),
				});
				if (!response.ok || !response.body) {
					await response.body?.cancel();
					throw new Error("Image preview request failed");
				}
				const maximumInputBytes = 512_000;
				if (
					Number(response.headers.get("content-length")) > maximumInputBytes
				) {
					await response.body.cancel();
					throw new Error("Image preview response is too large");
				}
				const reader = response.body.getReader();
				const chunks: Uint8Array[] = [];
				let size = 0;
				try {
					while (true) {
						const { done, value: chunk } = await reader.read();
						if (done) break;
						size += chunk.length;
						if (size > maximumInputBytes)
							throw new Error("Image preview response is too large");
						chunks.push(chunk);
					}
				} finally {
					await reader.cancel();
				}
				return await createBlurPlaceholder(Buffer.concat(chunks));
			} finally {
				release();
			}
		})();
		cache.delete(key);
		cache.set(key, { expires: Date.now() + 3_600_000, value });
		if (cache.size > maximumEntries) {
			const oldest = cache.keys().next().value;
			if (oldest !== undefined) cache.delete(oldest);
		}
		void value.catch(() => {
			if (cache.get(key)?.value === value) cache.delete(key);
		});
		return value;
	};
}

/** Limit both network and Sharp work, without allocating one promise per image. */
export async function mapImages<T, R>(
	items: readonly T[],
	prepare: (item: T) => Promise<R>,
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(4, items.length) }, async () => {
			while (next < items.length) {
				const index = next++;
				results[index] = await prepare(items[index]);
			}
		}),
	);
	return results;
}
