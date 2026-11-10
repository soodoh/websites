import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import PortfolioGrid, {
	PortfolioGridContainer,
} from "@/components/portfolio-grid";
import type { ImageType } from "@/lib/types";

const images: ImageType[] = [
	{ id: "first", width: 400, height: 300 },
	{ id: "second", width: 200, height: 300 },
	{ id: "third", width: 300, height: 300 },
	{ id: "fourth", width: 400, height: 500 },
	{ id: "fifth", width: 400, height: 200 },
].map((image) => ({
	...image,
	title: image.id,
	description: image.id,
	url: `/images/${image.id}.jpg`,
	placeholder:
		"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
}));

function renderGrid(items = images, prioritizeFirst = false): string {
	return renderToStaticMarkup(
		<PortfolioGridContainer>
			<h1>Portfolio</h1>
			<PortfolioGrid
				items={items.map((image) => ({ id: image.id, cover: image }))}
				getImage={(item) => item.cover}
				prioritizeFirst={prioritizeFirst}
			>
				{(item, index, image) => (
					<button type="button" aria-label={`${index}: ${item.id}`}>
						{image}
					</button>
				)}
			</PortfolioGrid>
		</PortfolioGridContainer>,
	);
}

function imageTags(markup: string): string[] {
	return Array.from(markup.matchAll(/<img\b[^>]*>/g), (match) => match[0]);
}

describe("Portfolio grid server rendering", () => {
	test("renders caller-named cards and their images in source order without a browser", () => {
		const markup = renderGrid();
		expect(markup).toBe(renderGrid());
		expect(markup).toContain("<h1>Portfolio</h1>");
		expect(
			Array.from(
				markup.matchAll(/<button[^>]*aria-label="([^"]+)"/g),
				(match) => match[1],
			),
		).toEqual(images.map((image, index) => `${index}: ${image.id}`));
		const tags = imageTags(markup);
		expect(tags).toHaveLength(images.length);
		for (const [index, tag] of tags.entries()) {
			expect(tag).toContain(`/images/${images[index].id}.jpg?`);
			expect(tag).toContain('alt=""');
			expect(tag).toContain(`width="${images[index].width}"`);
			expect(tag).toContain(`height="${images[index].height}"`);
		}
	});

	test("does not upscale small source images", () => {
		const [tag] = imageTags(
			renderGrid([{ ...images[0], width: 100, height: 75 }]),
		);
		expect(tag).toContain('srcSet="/images/first.jpg?w=100');
		expect(tag).toContain("100w");
		expect(tag).not.toMatch(/ (?:128|256|384|640|1200)w/);
	});

	test("leaves priority with the caller and prioritizes at most the first image", () => {
		expect(
			imageTags(renderGrid()).every((tag) => tag.includes('loading="lazy"')),
		).toBe(true);
		const [first, ...rest] = imageTags(renderGrid(images, true));
		expect(first).toMatch(/fetchpriority="high"/i);
		expect(first).not.toContain('loading="lazy"');
		expect(rest.every((tag) => tag.includes('loading="lazy"'))).toBe(true);
		expect(rest.every((tag) => !/fetchpriority="high"/i.test(tag))).toBe(true);
	});

	test("handles empty, single, and reordered lists without retaining previous cards", () => {
		expect(imageTags(renderGrid([]))).toEqual([]);
		expect(renderGrid([])).not.toContain("<button");
		expect(imageTags(renderGrid(images.slice(0, 1)))).toHaveLength(1);
		const reordered = imageTags(renderGrid([images[4], images[1]]));
		expect(reordered).toHaveLength(2);
		expect(reordered[0]).toContain("/images/fifth.jpg?");
		expect(reordered[1]).toContain("/images/second.jpg?");
	});

	test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
		"rejects invalid image dimensions: %s",
		(dimension) => {
			for (const dimensions of [
				{ width: dimension, height: 100 },
				{ width: 100, height: dimension },
			]) {
				expect(() => renderGrid([{ ...images[0], ...dimensions }])).toThrow(
					"Portfolio grid images require finite, positive dimensions.",
				);
			}
		},
	);
});
