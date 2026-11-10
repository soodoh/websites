import { createContentfulPreviewLoader } from "@websites/images/contentful/server";
import { validateContentfulAssetUrl } from "@/utils/contentful-asset-url";

const loadPreview = createContentfulPreviewLoader();

export const getPlaceholder = (source: string): Promise<string> => {
	validateContentfulAssetUrl(source, "image");
	return loadPreview(source);
};
