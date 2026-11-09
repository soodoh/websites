import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import Masonry from "@/components/masonry";

const images = [
	{ id: "first", width: 400, height: 300 },
	{ id: "second", width: 200, height: 300 },
	{ id: "third", width: 300, height: 300 },
	{ id: "fourth", width: 400, height: 500 },
	{ id: "fifth", width: 400, height: 200 },
];

function renderMasonry(items = images): string {
	return renderToStaticMarkup(
		<Masonry items={items} getDimensions={(item) => item}>
			{(item, index) => <button type="button">{`${index}: ${item.id}`}</button>}
		</Masonry>,
	);
}

function itemStyles(markup: string): string[] {
	return Array.from(
		markup.matchAll(/class="masonry-item" style="([^"]+)"/g),
		(match) => match[1],
	);
}

describe("server-rendered masonry", () => {
	test("emits all four layouts without a browser, keeping source order", () => {
		const markup = renderMasonry();
		expect(markup).toBe(renderMasonry());
		for (const columns of [1, 2, 3, 4]) {
			expect(markup).toContain(`--masonry-width-${columns}:`);
			expect(markup).toContain(`--masonry-height-${columns}:`);
			for (const style of itemStyles(markup)) {
				expect(style).toContain(`--masonry-column-${columns}:`);
				expect(style).toContain(`--masonry-top-${columns}:`);
			}
		}
		expect(
			Array.from(
				markup.matchAll(/<button[^>]*>([^<]+)<\/button>/g),
				(match) => match[1],
			),
		).toEqual(images.map((image, index) => `${index}: ${image.id}`));
	});

	test("positions cards round-robin, using the preceding images' aspect ratios", () => {
		const styles = itemStyles(renderMasonry());
		expect(styles[0]).toContain("--masonry-ratio:0.75;");
		expect(styles[4]).toContain("--masonry-column-1:0;");
		expect(styles[4]).toContain(
			"--masonry-top-1:calc(4.5 * var(--masonry-width) + 4 * var(--masonry-gap))",
		);
		expect(styles[4]).toContain("--masonry-column-2:0;");
		expect(styles[4]).toContain(
			"--masonry-top-2:calc(1.75 * var(--masonry-width) + 2 * var(--masonry-gap))",
		);
		expect(styles[4]).toContain("--masonry-column-3:1;");
		expect(styles[4]).toContain(
			"--masonry-top-3:calc(1.5 * var(--masonry-width) + 1 * var(--masonry-gap))",
		);
		expect(styles[4]).toContain("--masonry-column-4:0;");
		expect(styles[4]).toContain(
			"--masonry-top-4:calc(0.75 * var(--masonry-width) + 1 * var(--masonry-gap))",
		);
	});

	test("reserves the tallest column including the existing trailing gap", () => {
		expect(renderMasonry()).toContain(
			"--masonry-height-2:max(calc(2.25 * var(--masonry-width) + 3 * var(--masonry-gap)), calc(2.75 * var(--masonry-width) + 2 * var(--masonry-gap)))",
		);
		// Both height expressions must survive: different counts mean the tallest
		// column can change with width, even when its summed aspect ratio is lower.
		expect(renderMasonry()).toContain(
			"--masonry-width-4:calc((100cqw - 3 * var(--masonry-gap)) / 4)",
		);
	});

	test("recalculates from filtered source order without stale positions", () => {
		const markup = renderMasonry([images[4], images[1]]);
		const styles = itemStyles(markup);
		expect(styles).toHaveLength(2);
		expect(styles[0]).toContain(
			"--masonry-top-1:calc(0 * var(--masonry-width) + 0 * var(--masonry-gap))",
		);
		expect(styles[1]).toContain(
			"--masonry-top-1:calc(0.5 * var(--masonry-width) + 1 * var(--masonry-gap))",
		);
		expect(styles[1]).toContain("--masonry-column-2:1;");
	});

	test("preserves percentage widths when there are fewer items than columns", () => {
		const markup = renderMasonry(images.slice(0, 2));
		expect(markup).toContain(
			"--masonry-width-2:calc((100cqw - 1 * var(--masonry-gap)) / 2)",
		);
		expect(markup).toContain(
			"--masonry-width-3:calc((100cqw - 0 * var(--masonry-gap)) / 3)",
		);
		expect(markup).toContain(
			"--masonry-width-4:calc((100cqw - 0 * var(--masonry-gap)) / 4)",
		);
	});

	test("reserves no height for an empty list and lays out a single item", () => {
		const empty = renderMasonry([]);
		expect(itemStyles(empty)).toEqual([]);
		for (const columns of [1, 2, 3, 4]) {
			expect(empty).toContain(`--masonry-height-${columns}:0px`);
		}
		expect(itemStyles(renderMasonry(images.slice(0, 1)))).toHaveLength(1);
	});

	test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
		"rejects invalid image dimensions: %s",
		(dimension) => {
			for (const dimensions of [
				{ width: dimension, height: 100 },
				{ width: 100, height: dimension },
			]) {
				expect(() => renderMasonry([{ id: "invalid", ...dimensions }])).toThrow(
					"Masonry images require finite, positive dimensions.",
				);
			}
		},
	);
});
