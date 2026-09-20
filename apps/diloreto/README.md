# DiLoreto Website

A static family website built with TanStack Start, React, Vite, Tailwind CSS, and typed genealogy content.

Production: [diloreto.com](https://diloreto.com)

## Workspace development

Install once from the repository root with the pinned Bun and Node versions:

```sh
bun install --frozen-lockfile
bun run dev
```

The workspace dev command serves DiLoreto on `http://localhost:3103`. To run only this app, change to `apps/diloreto` and run `bun run dev`; the app then uses port 3000.

## Architecture

- `src/routes/` contains TanStack Start routes.
- `src/components/` contains reusable UI and gallery/modal behavior.
- `src/content/` contains typed site and family-history content.
- `src/assets/images/` contains build-managed images.
- `tests/` contains desktop/mobile smoke, interaction, and visual coverage.
- `infra/` contains the final-state CloudFormation template, the four-phase migration template, and the [native Amplify hosting decision](infra/hosting-architecture.md).

The production delivery path is Route 53 to a native Amplify domain association. Amplify owns the custom 404 rewrite, clean URLs, domain redirects, cache/security headers, and managed TLS; GitHub Actions continues to upload the verified `dist/client` artifact directly to the production branch.

`bun run genealogy:build` regenerates `src/content/genealogy/generated.json`. The deployable static artifact is `dist/client`.

## Verification

From the repository root, run the complete app chain:

```sh
bun run verify:diloreto
```

Useful focused commands from `apps/diloreto`:

```sh
bun run test:genealogy
bun run test:infra
bun run test:smoke
bun run test:hosting          # candidate/production URL supplied through environment
bun run test:playwright
bun run test:playwright:update   # intentional, reviewed screenshot changes only
bun run check
```

Playwright exercises the production static output in the pinned Docker environment.

## Deployment

Production deployments are owned by the monorepo workflow and protected GitHub Environment. See [`../../docs/deployment.md`](../../docs/deployment.md) for deployment, rollback, and infrastructure ownership rules.
