# Responsive image delivery

## Shared policy, two delivery paths

`packages/images` owns responsive candidate sizing, local build-time encoding, and the native React picture renderer. All four Vite configurations install the encoder and have typed responsive imports, so any site can use local source images alongside its existing delivery path. Its browser-safe `@websites/images` entry contains only types and sizing policy. Encoding dependencies are isolated behind `@websites/images/vite` and never imported by browser code.

- **Paul and DiLoreto:** source raster images live under `src/assets/images/`. Import with `?responsive`; Vite generates content-hashed assets and serializable picture metadata during development/build. Render with `@websites/images/react` and an explicit `alt` and layout-specific `sizes` value. No runtime image server is required. Paul no longer checks generated variants into `public/images`.
- **Carolyn and Sarabeth:** Contentful remains the image delivery/encoding service. Their existing image wrappers generate responsive CDN URLs during prerendering (and for protected/client-loaded content when rendered). Both use the shared intrinsic-width cap/deduplication policy while retaining layout-specific candidate lists, placeholders, and Contentful limits. Contentful binaries are not downloaded and republished by the local encoder. Existing URL allowlists and Carolyn's protected-content partitioning remain unchanged.

This is deliberately not one mandatory visual component: CMS placeholders, masonry, protected projects, modals, and native static pictures have different presentation needs. Share optimization and sizing policy without coupling those behaviors or routing CMS URLs through Sharp. Contentful's CDN performs the actual transformation on demand; generating its URLs during a build is not the same as pre-encoding those bytes locally.

## Local image policy

```tsx
import image from "@/assets/images/example.jpg?responsive";
import ResponsiveImage from "@websites/images/react";

<ResponsiveImage
	image={image}
	alt="A meaningful description"
	sizes="(max-width: 640px) calc(100vw - 32px), 600px"
/>;
```

The width ladder is 240, 320, 480, 640, 960, 1440, and 2160 pixels, plus the intrinsic width when smaller than the maximum. Images are auto-oriented, metadata is stripped, and candidates never upscale the source. Larger originals remain source inputs, not directly exposed public files. Width/height attributes reserve layout space; `sizes` must describe CSS layout, not device pixel density. The browser accounts for pixel density itself.

Inputs normally generate AVIF quality 60, WebP quality 82, and a conventional fallback (GIF for GIF sources, PNG when transparency is present, otherwise JPEG). GIF/PNG inputs also try lossless WebP: it can be both sharper and smaller for palette graphics, but forcing it on photographic scans would inflate downloads. At each width the smaller WebP encoding wins. Use `?responsive&kind=diagram` to require lossless WebP plus a GIF/PNG fallback for lettering-critical illustrations, or `?responsive&kind=photo` to skip the extra lossless trial. All three import forms have shared type declarations.

Selection compares encoded byte lengths, not file extensions:

1. Choose the smaller encoding when multiple candidates have the same format/width, then discard a smaller-width candidate if a larger candidate costs no more bytes.
2. Offer a modern format only when it beats the already selected lower-preference format at every candidate-selection boundary. This is conservative: a format that wins at some widths but loses at others is omitted.
3. Keep a conventional fallback and valid width descriptors. Native picture selection works before JavaScript hydration. Unselected trial encodings may still be emitted by vite-imagetools; they are not referenced or downloaded by the page.

The surname distribution map illustrates why this matters: resizing its palette graphics can increase byte size. Its full-width 500-pixel lossless WebP is approximately 8 KB, versus the former approximately 27 KB lossy WebP; smaller but heavier candidates are omitted.

## Loading and exceptions

- Only genuine above-the-fold/LCP images should be eager/high-priority. The renderer defaults to lazy loading and async decoding; the first DiLoreto history map explicitly overrides priority.
- `public/` is for deliberately untransformed assets such as favicons, app icons, and robots.txt. SVG logos remain vector assets. These are not sent through a raster resize ladder.
- Animated/multipage raster inputs fail the responsive build rather than silently losing frames. Use an explicit original URL import and document the exception if animation is intended.
- Third-party YouTube thumbnails remain third-party URLs. Do not silently download/rehost them or apply Contentful transforms to them.
- A new local content image should enter through a responsive import, not a public URL or a handwritten srcset. CSS background raster images would need an explicit build import/image-set; current content image paths use image elements.

## Verification and deployment

`bun run test:workspace` includes real Vite encoding tests and candidate-selection tests under `packages/images/tests/`. App browser tests cover responsive markup, image selection, modal behavior, and visual quality. Paul's artifact and production hosting checks discover hashed image URLs from the actual HTML rather than hardcoding generated filenames.

All browser Docker images copy the shared package and install using the root frozen lockfile. Native deployment filters select shared image-package source changes for all four sites; package tests and top-level Markdown alone do not trigger a release. Run app verification serially and compare Lighthouse route medians after encoder changes. Visual baseline updates require review because different formats can legitimately produce different decoded pixels; never loosen screenshot tolerances to hide those changes.
