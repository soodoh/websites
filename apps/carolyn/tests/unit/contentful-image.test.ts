import { prepareContentfulImage } from "@websites/images/contentful";
import ResponsiveImage from "@websites/images/react";
import { describe, expect, test, vi } from "vitest";
import ImageWrapper from "@/components/image-wrapper";

const image = {
	id: "image",
	title: "Image",
	description: "Description",
	url: "https://images.ctfassets.net/space/image.jpg?fit=pad",
	width: 800,
	height: 600,
	placeholder: "data:image/webp;base64,YQ==",
};

describe("Contentful image layout adapter", () => {
	test("uses the common renderer for both priority and lazy images", () => {
		const onLoad = vi.fn();
		const element = ImageWrapper({ image, onLoad });
		const priority = ImageWrapper({ image, priority: true });
		expect(element.type).toBe(ResponsiveImage);
		expect(priority.type).toBe(element.type);
		expect(element.props.loading).toBe("lazy");
		expect(priority.props.loading).toBe("eager");
		expect(element.props.image.placeholder).toBe(image.placeholder);
		expect(element.props.onLoad).toBe(onLoad);
	});

	test("preserves layout sizes, fitting, and load callbacks", () => {
		const element = ImageWrapper({
			image,
			sizes: "500px",
			placeholderFit: "contain",
		});
		expect(element.props.sizes).toBe("500px");
		expect(element.props.placeholderFit).toBe("contain");
	});

	test("caps candidates, preserves URL parameters, and supports local fixtures", () => {
		const prepared = prepareContentfulImage(image, {
			widths: [32, 64, 128, 3840],
			maximumDimension: 4000,
			quality: 50,
		});
		expect(prepared.img.src).toBe(
			"https://images.ctfassets.net/space/image.jpg?fit=pad&w=800&q=50&fm=webp",
		);
		expect(prepared.img.srcSet).toContain("800w");
		expect(prepared.img.srcSet).not.toContain("3840w");
		expect(
			prepareContentfulImage({ ...image, url: "/image.jpg?token=keep#preview" })
				.img.src,
		).toBe("/image.jpg?token=keep&w=800&q=80&fm=webp#preview");
	});
});
