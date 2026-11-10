import {
	type CSSProperties,
	type ImgHTMLAttributes,
	type JSX,
	type Ref,
	useEffect,
	useRef,
	useState,
} from "react";
import { fallbackPlaceholder, type ResponsiveImageData } from "./policy";
import "./image.css";

type Props = Omit<
	ImgHTMLAttributes<HTMLImageElement>,
	"src" | "srcSet" | "width" | "height" | "alt" | "sizes"
> & {
	image: ResponsiveImageData;
	alt: string;
	sizes: string;
	pictureClassName?: string;
	pictureStyle?: CSSProperties;
	placeholderFit?: "cover" | "contain";
	ref?: Ref<HTMLImageElement>;
};

type Phase = "initial" | "pending" | "revealing" | "loaded" | "failed";

function ImageElement({
	image,
	alt,
	sizes,
	pictureClassName,
	pictureStyle,
	placeholderFit = "cover",
	loading = "lazy",
	decoding = "async",
	ref,
	onLoad,
	onError,
	...props
}: Props): JSX.Element {
	const elementRef = useRef<HTMLImageElement | null>(null);
	const [phase, setPhase] = useState<Phase>("initial");
	const mounted = useRef(false);
	const priority = loading === "eager" || props.fetchPriority === "high";

	function reveal() {
		// Cached and priority images should paint immediately, not wait for an animation.
		const next =
			priority || window.matchMedia("(prefers-reduced-motion: reduce)").matches
				? "loaded"
				: "revealing";
		setPhase((current) => (current === "loaded" ? current : next));
	}

	useEffect(() => {
		mounted.current = true;
		const element = elementRef.current;
		if (element?.complete && element.naturalWidth > 0) setPhase("loaded");
		else if (element?.complete && element.currentSrc) setPhase("failed");
		// Never gate priority image painting on hydration or a load callback.
		else setPhase(priority ? "initial" : "pending");
		return () => {
			mounted.current = false;
		};
	}, [priority]);

	useEffect(() => {
		if (phase !== "revealing") return;
		const timer = window.setTimeout(() => setPhase("loaded"), 180);
		return () => window.clearTimeout(timer);
	}, [phase]);

	const placeholder =
		phase === "loaded" ? undefined : (image.placeholder ?? fallbackPlaceholder);
	// A neutral fallback is paint, not an image resource or an LCP candidate.
	const previewImage =
		placeholder === fallbackPlaceholder ? undefined : placeholder;
	return (
		<picture
			data-responsive-image=""
			data-image-state={phase}
			className={pictureClassName}
			style={{
				display: "block",
				...pictureStyle,
				backgroundImage: previewImage ? `url("${previewImage}")` : undefined,
				backgroundColor:
					placeholder === fallbackPlaceholder
						? "#808080"
						: pictureStyle?.backgroundColor,
				backgroundSize: placeholder ? placeholderFit : undefined,
				backgroundPosition: placeholder
					? (props.style?.objectPosition ?? "center")
					: undefined,
				backgroundRepeat: placeholder ? "no-repeat" : undefined,
			}}
		>
			{Object.entries(image.sources).map(([format, srcSet]) => (
				<source
					key={format}
					type={`image/${format === "jpg" ? "jpeg" : format}`}
					srcSet={srcSet}
					sizes={sizes}
				/>
			))}
			<img
				{...props}
				ref={(element) => {
					elementRef.current = element;
					if (typeof ref === "function") return ref(element);
					if (ref) ref.current = element;
				}}
				src={image.img.src}
				srcSet={image.img.srcSet}
				alt={alt}
				sizes={sizes}
				width={image.img.w}
				height={image.img.h}
				loading={loading}
				decoding={decoding}
				onLoad={(event) => {
					const element = event.currentTarget;
					const currentSrc = element.currentSrc;
					void element
						.decode()
						.catch(() => {})
						.then(() => {
							if (
								mounted.current &&
								element.currentSrc === currentSrc &&
								element.naturalWidth > 0
							)
								reveal();
						});
					onLoad?.(event);
				}}
				onError={(event) => {
					setPhase("failed");
					onError?.(event);
				}}
			/>
		</picture>
	);
}

/** Native sources and a visible preview are present in HTML, before hydration. */
export default function ResponsiveImage(props: Props): JSX.Element {
	// A changed source starts a new lifecycle; late decode results cannot reveal the old image.
	return (
		<ImageElement
			key={`${props.image.img.src}:${props.image.img.srcSet ?? ""}:${JSON.stringify(props.image.sources)}`}
			{...props}
		/>
	);
}
