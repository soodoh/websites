# Responsive image delivery

## Shared preparation and rendering, separate delivery adapters

`packages/images` owns responsive sizing, inline blur-preview generation, local encoding, provider adapters, and the native React picture renderer. All four Vite configurations install the encoder and have typed responsive imports. `@websites/images`, `/contentful`, and `/youtube` are browser-safe metadata/URL policy; `/react` owns rendering and its stylesheet. Sharp, fetching, and encoding are isolated behind `/server`, `/contentful/server`, and `/vite`, never browser imports.

- **Paul and DiLoreto:** source raster images live under `src/assets/images/`. Import with `?responsive`; Vite generates content-hashed assets and serializable picture metadata during development/build. Render with `@websites/images/react` and an explicit `alt` and layout-specific `sizes` value. No runtime image server is required. Paul no longer checks generated variants into `public/images`.
- **Carolyn and Sarabeth:** Contentful remains the full-resolution delivery/encoding service. `prepareContentfulImage` constructs bounded responsive CDN URLs and common rendering metadata. Their thin app wrappers supply layout-specific candidate lists, `sizes`, fitting, and Contentful dimension limits. Preview preparation fetches only a small CDN thumbnail and processes it through the shared blur generator; full-resolution binaries are not downloaded or republished. Existing app URL allowlists remain unchanged.
- **Sarabeth YouTube:** playlist preparation retains actual thumbnail dimensions/renditions. `/youtube` offers only existing, aspect-ratio-compatible candidates; it never invents resize URLs. The Sarabeth-local `playlist-preview-enrichment.server.ts` module selects actual preview renditions, schedules shared-loader work within one batch budget (at most one second, capped by the request timeout), and supplies an inline neutral fallback on thumbnail failure or timeout without mutating or reordering videos. The full images remain YouTube-hosted.

All content-image paths delegate native rendering and loading behavior to `@websites/images/react`. Banners, masonry, protected projects, cards, and modals remain app-owned presentation/interaction wrappers, not separate image-loading implementations. Contentful still transforms full-resolution images on demand; constructing CDN URLs is not local pre-encoding.

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

## Inline previews and loading

Local responsive imports include a `placeholder` alongside `sources` and `img`. Contentful and YouTube adapters produce the same rendering contract, with an optional native `img.srcSet`. The shared generator auto-orients, bounds previews to 24 by 24 pixels without upscaling, blurs, and encodes alpha-preserving WebP with a 2 KB encoded-byte ceiling. Preview policy is versioned. Remote loaders validate HTTPS hosts, refuse redirects, enforce timeouts and streamed response limits, deduplicate requests, bound cache lifetime/size, evict failures, and limit concurrent network/Sharp work to four per loader.

Sarabeth prepares Contentful previews during content preparation. Carolyn prepares unique remote previews before splitting its captured release into public/protected partitions; protected previews travel only with protected details, never through a public image manifest. Existing inline fixture previews are reused without network access. Contentful download-host URLs are normalized to the equivalent image CDN host before requesting a transformed preview. Failed, timed-out, oversized, or undecodable preview responses use the inline neutral fallback without blocking the release or relaxing the response limits. Invalid source URLs still fail validation, and failed fetches are evicted so subsequent requests can retry.

The renderer includes inline preview styling, dimensions, and native sources in the initial HTML. Image downloads never wait for hydration, and priority images are never opacity-gated on hydration or load callbacks. Pending images reveal after decoding with a 180 ms fade; cached, eager/high-priority, and reduced-motion images skip the fade. Neutral fallbacks render as a CSS color rather than a separate image resource, avoiding a spurious LCP candidate. Existing image opacity is preserved. Source changes reset loading state, late old-source decoding cannot reveal the new image, and failures retain the preview. Once loaded, the preview is removed, including behind transparent images. Without JavaScript, native responsive images remain visible and preview backgrounds are disabled where the browser supports the `scripting` media feature.

Keep preview fitting/positioning consistent with the image. Fill layouts must size the picture frame as well as the image; use `pictureClassName` for frame sizing and positioning. Layout-specific `sizes`, meaningful or intentionally empty `alt`, loading priority, and load callbacks stay caller-owned.

## Exceptions

- Only genuine above-the-fold/LCP images should be eager/high-priority. The renderer defaults to lazy loading and async decoding; the first DiLoreto history map explicitly overrides priority.
- `public/` is for deliberately untransformed assets such as favicons, app icons, and robots.txt. SVG logos remain vector assets. These are not sent through a raster resize ladder.
- Animated/multipage raster inputs fail the responsive build rather than silently losing frames. Use an explicit original URL import and document the exception if animation is intended.
- Third-party YouTube full-resolution thumbnails remain third-party URLs. Only small preview inputs may be fetched by the explicitly configured server adapter; do not rehost full images or apply Contentful transforms.
- A new local content image should enter through a responsive import, not a public URL or a handwritten srcset. CSS background raster images would need an explicit build import/image-set; current content image paths use image elements.

## Verification and deployment

`bun run test:workspace` includes real Vite encoding, preview generation/fetch safety, provider candidate selection, and prerendered-markup tests under `packages/images/tests/`. App browser tests cover delayed-image previews, clearing/loading failures, cached/reduced-motion loads, JavaScript-disabled delivery, responsive selection, modal behavior, and visual quality. Paul's artifact and production hosting checks discover hashed image URLs from the actual HTML rather than hardcoding generated filenames.

Sarabeth declares Sharp as an app runtime dependency as well as the shared package dependency: Vite must resolve it from the app root to keep its native loader external during SSR bundling. The native-image contract test bundles the actual workspace adapter from that root and rejects an inlined Sharp implementation.

All browser Docker images copy the shared package and install using the root frozen lockfile. Native deployment filters select shared image-package source changes for all four sites; package tests and top-level Markdown alone do not trigger a release. Run app verification serially and compare Lighthouse route medians after encoder changes. Visual baseline updates require review because different formats can legitimately produce different decoded pixels; never loosen screenshot tolerances to hide those changes.
