import type { CSSProperties, JSX, ReactNode } from "react";

type Dimensions = { width: number; height: number };
type MasonryStyle = CSSProperties & {
	[property: `--masonry-${string}`]: string | number;
};

type Props<T> = {
	items: readonly T[];
	getDimensions: (item: T) => Dimensions;
	children: (item: T, index: number) => ReactNode;
};

function heightExpression(ratio: number, gaps: number): string {
	return `calc(${ratio} * var(--masonry-width) + ${gaps} * var(--masonry-gap))`;
}

/** Image-only cards: overlays may be positioned over the image, not in normal flow. */
export default function Masonry<T extends { id: string }>({
	items,
	getDimensions,
	children,
}: Props<T>): JSX.Element {
	const ratios = items.map((item) => {
		const { width, height } = getDimensions(item);
		if (
			!Number.isFinite(width) ||
			!Number.isFinite(height) ||
			width <= 0 ||
			height <= 0
		) {
			throw new Error("Masonry images require finite, positive dimensions.");
		}
		return height / width;
	});
	const gridStyle: MasonryStyle = {};
	const itemStyles: MasonryStyle[] = ratios.map((ratio) => ({
		"--masonry-ratio": ratio,
	}));

	// Emit every layout on the server. CSS selects it before paint, without
	// changing DOM order or measuring the viewport during hydration.
	for (const columns of [1, 2, 3, 4]) {
		const columnRatios = Array<number>(columns).fill(0);
		const columnCounts = Array<number>(columns).fill(0);
		// Match the old flex layout, including its unshrunk percentage widths
		// when there are fewer cards than available columns.
		const horizontalGaps = items.length >= columns ? columns - 1 : 0;
		gridStyle[`--masonry-width-${columns}`] =
			`calc((100cqw - ${horizontalGaps} * var(--masonry-gap)) / ${columns})`;

		for (let index = 0; index < ratios.length; index += 1) {
			const column = index % columns;
			itemStyles[index][`--masonry-column-${columns}`] = column;
			itemStyles[index][`--masonry-top-${columns}`] = heightExpression(
				columnRatios[column],
				columnCounts[column],
			);
			columnRatios[column] += ratios[index];
			columnCounts[column] += 1;
		}

		// Keep the existing trailing 50px gap. max() also handles columns whose
		// relative heights change with viewport width because of unequal counts.
		gridStyle[`--masonry-height-${columns}`] = items.length
			? `max(${columnRatios
					.map((ratio, column) => heightExpression(ratio, columnCounts[column]))
					.join(", ")})`
			: "0px";
	}

	return (
		<div className="masonry-container">
			<div className="masonry-grid" style={gridStyle}>
				{items.map((item, index) => (
					<div className="masonry-item" style={itemStyles[index]} key={item.id}>
						{children(item, index)}
					</div>
				))}
			</div>
		</div>
	);
}
