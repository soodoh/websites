import type { JSX, ReactNode } from "react";
import { Parallax as ScrollParallax } from "react-scroll-parallax";
import { useReducedMotion } from "./parallax-motion";

type ParallaxProps = {
	className?: string;
	children: ReactNode;
	startY?: number;
	endY?: number;
	startX?: number;
	endX?: number;
};

const Parallax = ({
	className,
	children,
	startY,
	endY,
	startX,
	endX,
}: ParallaxProps): JSX.Element => {
	const prefersReducedMotion = useReducedMotion();
	const translateY: [number, number] | undefined =
		startY !== undefined && endY !== undefined ? [startY, endY] : undefined;
	const translateX: [number, number] | undefined =
		startX !== undefined && endX !== undefined ? [startX, endX] : undefined;

	return (
		<ScrollParallax
			className={className}
			disabled={prefersReducedMotion}
			translateY={translateY}
			translateX={translateX}
		>
			{children}
		</ScrollParallax>
	);
};

export default Parallax;
