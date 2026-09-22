# Contentful visual fixture

`contentful.json` is a deterministic test scenario, not a mirror of the live
Contentful space. It keeps eight representative projects, three 12-photo
albums, rich text, protected content, and varied image aspect ratios to exercise
the production-shaped build and browser behavior.

All image records intentionally reuse the four synthetic files in
`public/test-assets`. The files cover wide, landscape, square, and portrait
rendering without committing the production media library. Add or change
fixture data only when a test needs a new presentation or behavior case; do not
refresh it from Contentful.
