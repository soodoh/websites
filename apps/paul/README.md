# Paul DiLoreto Portfolio

A fully static software-engineering portfolio built with TanStack Start, React, Vite, and Tailwind CSS.

Production: [pauldiloreto.com](https://pauldiloreto.com)

## Workspace development

Install once from the repository root with the pinned Bun and Node versions:

```sh
bun install --frozen-lockfile
bun run dev
```

The workspace dev command serves Paul on `http://localhost:3101`. To run only this app, change to `apps/paul` and run `bun run dev`; the app then uses Vite's default port.

## Architecture

- `src/routes/` contains TanStack Start routes.
- `src/components/` contains reusable UI and page components.
- `src/content/` contains portfolio and social content.
- `src/styles/` contains global styles.
- `tests/` contains Playwright behavior and visual coverage.
- `infra/` contains the retained Amplify CloudFormation template.

`bun run build` emits the deployable static site under `dist/client`; `bun run start` serves that exact directory.

## Verification

From the repository root, run the complete app chain:

```sh
bun run verify:paul
```

Useful focused commands from `apps/paul`:

```sh
bun run test:static
bun run test:e2e
bun run test:e2e:static
bun run test:e2e:update   # intentional, reviewed screenshot changes only
```

Canonical screenshots come from the pinned Docker environment. Use `test:e2e:local` only for debugging, not for committed baseline updates.

## Deployment

Production deployments are owned by the monorepo workflow and protected GitHub Environment. See [`../../docs/deployment.md`](../../docs/deployment.md) for deployment, rollback, and infrastructure ownership rules.
