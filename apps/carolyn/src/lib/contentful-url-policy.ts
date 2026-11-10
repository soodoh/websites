import { requireContentfulImageUrl } from "@websites/images/contentful";

export { requireContentfulImageUrl };

function parseStandardHttpsUrl(value: string): URL | undefined {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return undefined;
	}
	if (
		url.protocol !== "https:" ||
		url.username !== "" ||
		url.password !== "" ||
		url.port !== ""
	) {
		return undefined;
	}
	return url;
}

export function isContentfulImageUrl(value: string): boolean {
	try {
		requireContentfulImageUrl(value);
		return true;
	} catch {
		return false;
	}
}

export function isContentfulAssetUrl(value: string): boolean {
	const url = parseStandardHttpsUrl(value);
	return (
		url !== undefined &&
		(url.hostname === "ctfassets.net" ||
			url.hostname.endsWith(".ctfassets.net"))
	);
}
