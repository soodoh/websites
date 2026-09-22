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

Local builds use ignored `.env` values:

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ACCESS_TOKEN`
- `PROJECT_AUTH_SECRET`

`CONTENTFUL_ACCESS_TOKEN` is build-only. The predev/build step captures and validates one Contentful release, then atomically writes ignored files under `src/lib/generated-release/`: public content, server-only protected details, content-addressed photography album JSON, project route inventory, and the password-hash/auth-version manifest. Plaintext project passwords are discarded before generated files are written.

## Architecture

- `src/routes/` contains TanStack Start routes.
- `src/components/` contains shared React UI.
- `src/lib/` contains the build-only Contentful adapter, release-content module, project authorization, image helpers, and shared types.
- `tests/` contains Playwright behavior/visual tests and focused Vitest unit tests.
- `infra/opentofu/` contains the active AWS definition and state boundary.

Fixed public pages and every unprotected project detail are prerendered. Client navigation reads immutable TanStack static server-function cache files, while photography lazily fetches immutable static album JSON. Exact protected project paths, password verification, and the `/resume` HTTP 307 redirect remain compute-backed. Unknown routes and missing assets terminate at Amplify's static target with an edge-generated HTTP 404 and never invoke compute.

Production compute reads only the generated protected-project snapshot, generated auth manifest, generated common content, and `PROJECT_AUTH_SECRET`. It has no Contentful client or token-loading path. Amplify retrieves `CONTENTFUL_ACCESS_TOKEN` from SSM only for the build. `bun run build` emits the deployment contract under `.amplify-hosting/`.

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

Production source and Contentful-triggered deployments use the same monorepo GitHub workflow. OpenTofu manages both the AWS root and the separately stateful Contentful webhook root. See [`../../docs/deployment.md`](../../docs/deployment.md) and [`../../docs/opentofu-migration.md`](../../docs/opentofu-migration.md).
