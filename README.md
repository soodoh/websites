# portfolio-website

My Portfolio website displaying various work and information about myself as a Software Engineer. Feel free to review my code and check out the [live website](https://pauldiloreto.com).

Website is powered by TanStack Start + React, with Netlify for continuous deployments.

## End-to-end tests

Playwright runs in a pinned Docker image so Chromium, system fonts, and screenshot rendering are identical locally and in CI.

```bash
# Run functional and visual tests against the committed baselines
bun run test:e2e

# Regenerate visual baselines after an intentional UI change
bun run test:e2e:update
```

The update command copies screenshots generated inside the container back to `e2e/__screenshots__`. Commit those baseline images with the related UI change. `bun run test:e2e:local` is available for debugging, but local output must not be used to update committed screenshots.
