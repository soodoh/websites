import type { JSX, ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { ParallaxProvider } from "react-scroll-parallax";

const ReducedMotionContext = createContext(false);

export const useReducedMotion = (): boolean => useContext(ReducedMotionContext);

export const ParallaxMotionProvider = ({
	children,
}: {
	children: ReactNode;
}): JSX.Element => {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const updatePreference = (): void => {
			setPrefersReducedMotion(mediaQuery.matches);
		};

		updatePreference();
		mediaQuery.addEventListener("change", updatePreference);
		return () => mediaQuery.removeEventListener("change", updatePreference);
	}, []);

	return (
		<ReducedMotionContext.Provider value={prefersReducedMotion}>
			<ParallaxProvider isDisabled={prefersReducedMotion}>
				{children}
			</ParallaxProvider>
		</ReducedMotionContext.Provider>
	);
};
