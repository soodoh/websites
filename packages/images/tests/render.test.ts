import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type { ResponsiveImageData } from "../src/policy";
import ResponsiveImage from "../src/react";

const image: ResponsiveImageData = {
	sources: { avif: "/photo-320.avif 320w, /photo-640.avif 640w" },
	img: {
		src: "/photo.jpg",
		srcSet: "/photo-320.jpg 320w, /photo.jpg 640w",
		w: 640,
		h: 480,
	},
	placeholder: "data:image/webp;base64,preview",
};

test("prerenders a visible inline preview, reserved dimensions, and native sources without requiring JavaScript", () => {
	const html = renderToStaticMarkup(
		createElement(ResponsiveImage, {
			image,
			alt: "A photo",
			sizes: "320px",
			className: "opacity-50",
			placeholderFit: "contain",
		}),
	);
	expect(html).toContain('data-image-state="initial"');
	expect(html).toContain("data:image/webp;base64,preview");
	expect(html).toContain("background-size:contain");
	expect(html).toContain('srcSet="/photo-320.avif 320w, /photo-640.avif 640w"');
	expect(html).toContain('srcSet="/photo-320.jpg 320w, /photo.jpg 640w"');
	expect(html).toContain(
		'width="640" height="480" loading="lazy" decoding="async"',
	);
	expect(html).toContain('alt="A photo"');
	expect(html).not.toContain("opacity:0");
	expect(html).toContain('class="opacity-50"');
});

test("neutral fallbacks render immediately without becoming an extra LCP image resource", () => {
	const html = renderToStaticMarkup(
		createElement(ResponsiveImage, {
			image: { ...image, placeholder: undefined },
			alt: "Thumbnail",
			sizes: "320px",
		}),
	);
	expect(html).toContain("background-color:#808080");
	expect(html).not.toContain("background-image:");
});

test("preserves explicit eager priority and decorative alt text", () => {
	const html = renderToStaticMarkup(
		createElement(ResponsiveImage, {
			image,
			alt: "",
			sizes: "100vw",
			loading: "eager",
			fetchPriority: "high",
		}),
	);
	expect(html).toContain('loading="eager"');
	expect(html).toContain('fetchPriority="high"');
	expect(html).toContain('alt=""');
});
