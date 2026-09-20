# Sarabeth Studio

Website for Sarabeth Belón's music studio, voice lessons, performances, media, booking, and contact form. It uses TanStack Start, React, Contentful, AWS Amplify Hosting, Amazon SES, and the YouTube Data API.

Production: [sarabethbelon.com](https://sarabethbelon.com)

## Workspace development

Install once from the repository root with the pinned Bun and Node versions:

```sh
bun install --frozen-lockfile
bun run dev
```

The workspace dev command serves Sarabeth on `http://localhost:3100`. To run only this app, change to `apps/sarabeth` and run `bun run dev`; the app then uses port 3000.

Contentful and YouTube development values belong in an ignored `.env` file. Keep tokens server-only and never prefix them with `VITE_`.

## Architecture

- `src/routes/` contains page routes and server handlers.
- `components/` contains shared React UI.
- `utils/` contains Contentful fetchers, integrations, and data shaping.
- `tests/contract/` contains behavior contracts; `tests/visual/` contains browser coverage.
- `infrastructure/` contains the retained CloudFormation templates.

The media page calls a server-side YouTube endpoint after hydration. Contact and runtime integrations use the AWS SDK default credential provider chain; production credentials come from IAM roles and SSM rather than static AWS keys.

## Verification

From the repository root, run the complete app chain:

```sh
bun run verify:sarabeth
```

Useful focused commands from `apps/sarabeth`:

```sh
bun run lint
bun run typecheck
bun run test:container
bun run validate:amplify
```

Browser tests use checked-in fixtures and the pinned ARM64 Playwright container, so CI does not call Contentful, Google, or production services.

## Deployment

Production deployments are owned by the monorepo workflow and protected GitHub Environment. See [`../../docs/deployment.md`](../../docs/deployment.md) for deployment, rollback, and infrastructure ownership rules. The published YouTube disclosure is recorded in [`docs/privacy-policy.md`](docs/privacy-policy.md).
