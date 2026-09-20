# Carolyn DiLoreto Portfolio

Portfolio website for a film editor, graphic designer, and UX engineer. It uses TanStack Start, React, Vite, Contentful, Tailwind CSS, and AWS Amplify Hosting.

Production: [carolyndiloreto.com](https://carolyndiloreto.com)

## Workspace development

Install once from the repository root with the pinned Bun and Node versions:

```sh
bun install --frozen-lockfile
bun run dev
```

The workspace dev command serves Carolyn on `http://localhost:3102`. To run only this app, change to `apps/carolyn` and run `bun run dev`; the app then uses port 3000.

Local Contentful and protected-project development uses ignored `.env` values:

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ACCESS_TOKEN`
- `PROJECT_AUTH_SECRET`

Keep these values server-only. The predev/build steps generate the ignored `src/lib/project-auth-manifest.json`.

## Architecture

- `src/routes/` contains TanStack Start routes.
- `src/components/` contains shared React UI.
- `src/lib/` contains Contentful access, project authorization, image helpers, and shared types.
- `tests/` contains Playwright behavior/visual tests and focused Bun unit tests.
- `infra/` contains the retained AWS CDK infrastructure.

Public index pages are prerendered. Protected project details, `/resume`, server functions, unknown routes, and missing assets remain compute-backed. `bun run build` emits the deployment contract under `.amplify-hosting/`.

## Verification

From the repository root, run the complete app chain:

```sh
bun run verify:carolyn
```

Useful focused commands from `apps/carolyn`:

```sh
bun run validate
bun run test:unit
bun run test:visual
bun run test:visual:update   # intentional, reviewed screenshot changes only
```

Canonical visual tests run in the pinned ARM64 Playwright container. Production smoke tests use `bun run test:amplify` with `AMPLIFY_BASE_URL` set.

## Deployment

Production source and Contentful-triggered deployments use the same monorepo GitHub workflow. OpenTofu manages the Contentful-to-GitHub webhook, and AWS CDK continues to own Amplify Hosting and the encrypted OpenTofu state bucket. See [`../../docs/deployment.md`](../../docs/deployment.md) for setup, deployment, rollback, and infrastructure ownership rules.
