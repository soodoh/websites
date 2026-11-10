import type { CSSProperties, JSX, ReactNode } from "react";
import ImageWrapper from "@/components/image-wrapper";
import type { ImageType } from "@/lib/types";

const containerInset = "3rem";
const containerMaximum = 1440;
const gap = 50;
const layouts = [
	{ columns: 1, through: 660 },
	{ columns: 2, through: 962 },
	{ columns: 3, through: 1260 },
	{ columns: 4, through: undefined },
];
const imageBreakpoints = [128, 256, 384, 640, 750, 828, 1080, 1200];

// CSS and image hints share the same layout facts, including the page container.
// Emit CSS with the container so static pages need neither hydration nor viewport JS.
const styles = `
@layer components {
	.portfolio-grid-container {
		margin-inline: auto;
		width: calc(100% - ${containerInset});
		max-width: ${containerMaximum}px;
		flex-grow: 1;
	}
	.masonry-container {
		container-type: inline-size;
		--masonry-gap: ${gap}px;
	}
	.masonry-grid { position: relative; }
	.masonry-item {
		position: absolute;
		left: calc(var(--masonry-column) * (var(--masonry-width) + var(--masonry-gap)));
		width: var(--masonry-width);
		height: calc(var(--masonry-ratio) * var(--masonry-width));
	}
	.masonry-item > * { display: flex; width: 100%; height: 100%; }
	${layouts
		.map(({ columns }, index) => {
			const rules = `
				.masonry-grid {
					--masonry-width: var(--masonry-width-${columns});
					height: var(--masonry-height-${columns});
				}
				.masonry-item {
					--masonry-column: var(--masonry-column-${columns});
					top: var(--masonry-top-${columns});
				}`;
			return index === 0
				? rules
				: `@media (width > ${layouts[index - 1].through}px) { ${rules} }`;
		})
		.join("\n")}
}`;

/** Wrap the grid and its surrounding page content in the same sizing context. */
export function PortfolioGridContainer({
	children,
}: {
	children: ReactNode;
}): JSX.Element {
	return (
		<div className="portfolio-grid-container">
			<style>{styles}</style>
			{children}
		</div>
	);
}

type MasonryStyle = CSSProperties & {
	[property: `--masonry-${string}`]: string | number;
};

type Props<T> = {
	items: readonly T[];
	getImage: (item: T) => ImageType;
	prioritizeFirst?: boolean;
	children: (item: T, index: number, image: ReactNode) => ReactNode;
};

function horizontalGaps(itemCount: number, columns: number): number {
	// Sparse grids retain the original unshrunk percentage card widths.
	return itemCount >= columns ? columns - 1 : 0;
}

function heightExpression(ratio: number, gaps: number): string {
	return `calc(${ratio} * var(--masonry-width) + ${gaps} * var(--masonry-gap))`;
}

/**
 * Render inside PortfolioGridContainer. Callers name the surrounding link/button
 * and supply only its interaction, overlay, and contextual priority decisions.
 * Cards contain only an image in normal flow; overlays sit over that image.
 */
export default function PortfolioGrid<T extends { id: string }>({
	items,
	getImage,
	prioritizeFirst = false,
	children,
}: Props<T>): JSX.Element {
	const images = items.map(getImage);
	const ratios = images.map(({ width, height }) => {
		if (
			!Number.isFinite(width) ||
			!Number.isFinite(height) ||
			width <= 0 ||
			height <= 0
		) {
			throw new Error(
				"Portfolio grid images require finite, positive dimensions.",
			);
		}
		return height / width;
	});
	const gridStyle: MasonryStyle = {};
	const itemStyles: MasonryStyle[] = ratios.map((ratio) => ({
		"--masonry-ratio": ratio,
	}));
	const sizes = layouts
		.map(({ columns, through }) => {
			const width = `calc((min(100vw - ${containerInset}, ${containerMaximum}px) - ${horizontalGaps(items.length, columns) * gap}px) / ${columns})`;
			return through === undefined
				? width
				: `(max-width: ${through}px) ${width}`;
		})
		.join(", ");

	// Emit every layout on the server. CSS selects it before paint, without
	// changing DOM order or measuring the viewport during hydration.
	for (const { columns } of layouts) {
		const columnRatios = Array<number>(columns).fill(0);
		const columnCounts = Array<number>(columns).fill(0);
		gridStyle[`--masonry-width-${columns}`] =
			`calc((100cqw - ${horizontalGaps(items.length, columns)} * var(--masonry-gap)) / ${columns})`;

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

		// Preserve the trailing gap and columns whose relative heights change
		// with viewport width because they contain different numbers of cards.
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
						{children(
							item,
							index,
							<ImageWrapper
								className="w-full h-full object-contain"
								alt=""
								breakpoints={imageBreakpoints}
								quality={50}
								image={images[index]}
								priority={prioritizeFirst && index === 0}
								sizes={sizes}
							/>,
						)}
					</div>
				))}
			</div>
		</div>
	);
}
