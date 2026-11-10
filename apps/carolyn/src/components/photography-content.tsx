"use client";

import type { ErrorComponentProps } from "@tanstack/react-router";
import { CatchBoundary } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import type { JSX, MouseEvent } from "react";
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import Filter from "@/components/filter";
import ImageWrapper, {
	MASONRY_IMAGE_BREAKPOINTS,
	MASONRY_IMAGE_SIZES,
} from "@/components/image-wrapper";
import Masonry from "@/components/masonry";
import { Button } from "@/components/ui/button";
import type { CarouselNavigation } from "@/components/ui/carousel";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import type { Album } from "@/lib/types";
import { useAlbumSelection } from "@/lib/use-album-selection";
import { cn, darkSurfaceFocusClass } from "@/lib/utils";

const loadImageGallery = () => import("@/components/image-gallery");
const ImageGallery = lazy(loadImageGallery);

function preloadImageGallery(): void {
	void loadImageGallery().catch((error) => {
		console.error("Unable to preload the image gallery", error);
	});
}

function GalleryLoading(): JSX.Element {
	return (
		<div
			aria-busy="true"
			aria-live="polite"
			role="status"
			className="flex flex-1 items-center justify-center p-8 text-center text-light"
		>
			Loading image gallery…
		</div>
	);
}

function GalleryLoadError({ reset }: ErrorComponentProps): JSX.Element {
	return (
		<div
			role="alert"
			data-gallery-error-surface
			className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black p-8 text-center text-light"
		>
			<p className="m-0">Unable to load the image gallery.</p>
			<div className="flex gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						reset();
						window.location.reload();
					}}
					className={cn(
						darkSurfaceFocusClass,
						"border-light/70 bg-transparent text-light hover:border-light hover:bg-white/10 hover:text-light",
					)}
				>
					Reload page
				</Button>
			</div>
		</div>
	);
}

type GalleryNavigationIntent = "next" | "previous";

const PhotographyContent = ({
	albumNames,
	albumSources,
	initialAlbum,
}: {
	albumNames: string[];
	albumSources: Record<string, string>;
	initialAlbum: Album;
}): JSX.Element => {
	const [galleryOpen, setGalleryOpen] = useState(false);
	const { album, selectedAlbumName, isLoading, loadError, selectAlbum } =
		useAlbumSelection(initialAlbum, albumSources);
	const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
	const [galleryNavigation, setGalleryNavigation] =
		useState<CarouselNavigation>();
	const openingButtonRef = useRef<HTMLButtonElement>(null);
	const pendingGalleryNavigation = useRef<GalleryNavigationIntent[]>([]);
	const handleAlbumChange = (albumName: string) => {
		setGalleryOpen(false);
		void selectAlbum(albumName);
	};

	useEffect(() => {
		if (!galleryNavigation) {
			return;
		}
		for (const intent of pendingGalleryNavigation.current) {
			galleryNavigation[intent === "previous" ? "scrollPrev" : "scrollNext"]();
		}
		pendingGalleryNavigation.current = [];
	}, [galleryNavigation]);

	const navigateGallery = useCallback(
		(intent: GalleryNavigationIntent) => {
			if (!galleryNavigation) {
				pendingGalleryNavigation.current.push(intent);
				return;
			}
			galleryNavigation[intent === "previous" ? "scrollPrev" : "scrollNext"]();
		},
		[galleryNavigation],
	);

	const handleThumbnailClick = (
		index: number,
		event: MouseEvent<HTMLButtonElement>,
	) => {
		openingButtonRef.current = event.currentTarget;
		setGalleryNavigation(undefined);
		pendingGalleryNavigation.current = [];
		setCurrentPhotoIndex(index);
		setGalleryOpen(true);
	};

	return (
		<>
			<Filter
				options={albumNames}
				current={selectedAlbumName}
				onChange={handleAlbumChange}
			/>

			{galleryOpen ? (
				<Dialog
					open
					onOpenChange={(isOpen) => {
						if (!isOpen) {
							setGalleryNavigation(undefined);
							pendingGalleryNavigation.current = [];
							setGalleryOpen(false);
						}
					}}
				>
					<DialogContent
						aria-modal="true"
						showCloseButton={false}
						onCloseAutoFocus={(event) => {
							event.preventDefault();
							openingButtonRef.current?.focus();
						}}
						className="inset-0 translate-x-0 translate-y-0 max-w-none sm:max-w-none w-full h-full rounded-none border-none bg-black/95 p-0 shadow-none gap-0 flex flex-col data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
					>
						<DialogTitle className="sr-only">Image Gallery</DialogTitle>
						<DialogDescription className="sr-only">
							Fullscreen photography viewer
						</DialogDescription>
						<DialogClose asChild>
							<Button
								variant="ghost"
								size="icon"
								aria-label="Close image modal"
								onKeyDown={(event) => {
									if (event.key === "ArrowLeft") {
										event.preventDefault();
										navigateGallery("previous");
									} else if (event.key === "ArrowRight") {
										event.preventDefault();
										navigateGallery("next");
									}
								}}
								className={cn(
									darkSurfaceFocusClass,
									"absolute top-3 right-3 z-10 size-10 max-md:size-8 text-light/70 hover:text-light hover:bg-white/10",
								)}
							>
								<XIcon className="size-6 max-md:size-5" />
							</Button>
						</DialogClose>
						<CatchBoundary
							getResetKey={() => `${album.name}:${currentPhotoIndex}`}
							errorComponent={GalleryLoadError}
							onCatch={(error) => {
								console.error("Unable to render the image gallery", error);
							}}
						>
							<Suspense fallback={<GalleryLoading />}>
								<ImageGallery
									initialIndex={currentPhotoIndex}
									images={album.photos}
									onNavigationChange={setGalleryNavigation}
								/>
							</Suspense>
						</CatchBoundary>
					</DialogContent>
				</Dialog>
			) : null}

			{loadError ? (
				<p role="alert" className="text-center text-dark">
					{loadError}
				</p>
			) : null}
			<div aria-busy={isLoading} data-photography-album={album.name}>
				{isLoading ? (
					<span role="status" className="sr-only">
						Loading {selectedAlbumName} album
					</span>
				) : null}
				<Masonry items={album.photos} getDimensions={(image) => image}>
					{(image, index) => (
						<Button
							key={`image-${image.id}`}
							variant="ghost"
							disabled={isLoading}
							aria-label={`View fullscreen photo (${image.title})`}
							onPointerEnter={preloadImageGallery}
							onFocus={preloadImageGallery}
							onClick={(event) => handleThumbnailClick(index, event)}
							className="h-full w-full p-0 rounded-none transition-colors hover:bg-transparent"
						>
							<ImageWrapper
								className="w-full h-full object-contain"
								alt=""
								breakpoints={MASONRY_IMAGE_BREAKPOINTS}
								quality={50}
								image={image}
								priority={index === 0}
								sizes={MASONRY_IMAGE_SIZES}
							/>
						</Button>
					)}
				</Masonry>
			</div>
		</>
	);
};

export default PhotographyContent;
