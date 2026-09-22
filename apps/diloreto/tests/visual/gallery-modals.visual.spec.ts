import {
	openGalleryThumbnail,
	prepareGalleryScreenshot,
} from "../support/gallery";
import { expect, test } from "../support/test";

const galleryPhotos = [
	{
		aspectRatio: "portrait",
		title:
			"Hand-drawn DiLoreto family tree documenting relatives from 1797 through 1938",
	},
	{
		aspectRatio: "landscape",
		title:
			"Front of an antique postcard showing Alfedena and its school building",
	},
] as const;

for (const photo of galleryPhotos) {
	test(`${photo.aspectRatio} gallery photo`, async ({ page }) => {
		await page.goto("/areyou");
		await openGalleryThumbnail(page, photo.title);
		await prepareGalleryScreenshot(page);
		await expect(page).toHaveScreenshot(`gallery-${photo.aspectRatio}.png`, {
			animations: "disabled",
		});
	});
}
