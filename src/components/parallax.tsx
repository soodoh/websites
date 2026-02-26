import { useMemo } from "react";
import type { JSX, ReactNode } from "react";
import { Parallax as ScrollParallax } from "react-scroll-parallax";

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
  const translateY = useMemo(
    () =>
      startY !== undefined && endY !== undefined
        ? ([startY, endY] as [number, number])
        : undefined,
    [startY, endY],
  );

  const translateX = useMemo(
    () =>
      startX !== undefined && endX !== undefined
        ? ([startX, endX] as [number, number])
        : undefined,
    [startX, endX],
  );

  return (
    <ScrollParallax
      className={className}
      translateY={translateY}
      translateX={translateX}
    >
      {children}
    </ScrollParallax>
  );
};

export default Parallax;
