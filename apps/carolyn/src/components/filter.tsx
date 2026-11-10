"use client";

import { type JSX, useEffect, useRef } from "react";
import Dropdown from "@/components/dropdown";
import { Button } from "@/components/ui/button";

type FilterProps<T extends string> = {
	current: T;
	options: T[];
	onChange: (name: T) => void;
	resultsReady?: boolean;
};

function Filter<T extends string>({
	current,
	options,
	onChange,
	resultsReady = true,
}: FilterProps<T>): JSX.Element {
	const anchorRef = useRef<HTMLDivElement>(null);
	const filterRef = useRef<HTMLDivElement>(null);
	const pendingSelectionRef = useRef<T | null>(null);

	const handleChange = (name: T) => {
		if (name !== current) {
			pendingSelectionRef.current = name;
		}
		onChange(name);
	};

	useEffect(() => {
		if (!resultsReady || pendingSelectionRef.current !== current) {
			return;
		}

		// Let the results commit and the mobile menu release its scroll lock/focus.
		const frame = requestAnimationFrame(() => {
			const anchor = anchorRef.current;
			const filter = filterRef.current;
			if (!anchor || !filter) return;
			pendingSelectionRef.current = null;

			// The anchor stays in normal flow even when the filter is stuck onscreen.
			// Aligning it below the header also leaves room for the filter and its gap.
			const headerOffset = Number.parseFloat(getComputedStyle(filter).top);
			const top = Math.max(
				0,
				window.scrollY + anchor.getBoundingClientRect().top - headerOffset,
			);
			if (Math.abs(window.scrollY - top) <= 1) return;

			window.scrollTo({
				top,
				behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
					? "instant"
					: "smooth",
			});
		});
		return () => cancelAnimationFrame(frame);
	}, [current, resultsReady]);

	return (
		<>
			<div ref={anchorRef} aria-hidden="true" />
			<div
				ref={filterRef}
				data-visual-sticky-filter
				className="sticky top-[var(--spacing-header-height)] z-3 mb-6 bg-white max-md:mb-0 max-md:pt-2 max-md:pb-6"
			>
				<fieldset className="m-0 max-md:hidden overflow-visible border-0 p-0">
					<legend className="sr-only">Filter</legend>
					{options.map((name) => (
						<Button
							key={`filter-${name}`}
							variant="ghost"
							aria-pressed={current === name}
							aria-label={`Choose filter: ${name}`}
							className="relative h-auto overflow-visible rounded-none px-8 py-4 font-body text-base leading-7 text-dark hover:bg-transparent hover:text-dark focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-[-2px] focus-visible:outline-dark focus-visible:ring-0 focus-visible:ring-offset-0"
							onClick={() => handleChange(name)}
						>
							{current === name ? (
								<span
									data-selected-filter-indicator
									aria-hidden="true"
									className="absolute -top-[5px] right-0 left-0 h-[5px] bg-light"
								/>
							) : null}
							{name}
						</Button>
					))}
				</fieldset>
				<div className="hidden max-md:block">
					<Dropdown
						current={current}
						options={options}
						onChange={handleChange}
					/>
				</div>
			</div>
		</>
	);
}

export default Filter;
