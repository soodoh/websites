import {
	type ContentSourceLoader,
	getBuildContentSource,
} from "@/lib/content-source";
import type { SocialMediaSkeleton } from "@/lib/contentful-types";
import { getAllContentfulEntries } from "@/lib/contentful-utils";
import { parseSocialMediaLink } from "@/lib/social-media-link";
import { isIconType, type SocialMedia } from "@/lib/types";

export async function getSocialMedia(
	loadSource: ContentSourceLoader = getBuildContentSource,
): Promise<SocialMedia[]> {
	const source = await loadSource();
	if (source.kind === "fixture") {
		return source.content.socialMedia;
	}

	const socialMedia = await getAllContentfulEntries(
		(skip, limit) =>
			source.client.getEntries<SocialMediaSkeleton>({
				content_type: "socialMedia",
				limit,
				skip,
			}),
		"Social media query",
	);
	return socialMedia.map((item) => {
		const { link, title } = item.fields;
		if (!isIconType(title)) {
			throw new Error(`Social media entry ${item.sys.id} is malformed.`);
		}
		return {
			id: item.sys.id,
			title,
			link: parseSocialMediaLink(title, link),
		};
	});
}
