# portfolio-website

My Portfolio website displaying various work and information about myself as a Software Engineer. Feel free to review my code and check out the [live website](https://pauldiloreto.com).

The website is a fully static TanStack Start + React application hosted by AWS Amplify. GitHub Actions validates and deploys the prerendered `dist/client` artifact through a candidate branch before production promotion. See the [hosting runbook](docs/hosting.md) for architecture, deployment, DNS, and rollback procedures.

## Local development

Use the Bun version pinned in `.bun-version` and `package.json`.

```bash
bun install --frozen-lockfile
bun run dev

# Build and serve the same static directory deployed to Amplify
bun run typecheck
bun run lint
bun run build
bun run start
```

## End-to-end tests

Playwright runs in a pinned Docker image so Chromium, system fonts, and screenshot rendering are identical locally and in CI.

```bash
# Run functional and visual tests against the committed baselines
bun run test:e2e

# Regenerate visual baselines after an intentional UI change
bun run test:e2e:update
```

The update command copies screenshots generated inside the container back to `e2e/__screenshots__`. Commit those baseline images with the related UI change. `bun run test:e2e:local` is available for debugging, but local output must not be used to update committed screenshots.
