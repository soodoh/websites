# Carolyn portfolio

Apply the workspace rules in `../../AGENTS.md` together with this app-specific overlay.

## Architecture

- `src/routes/` contains TanStack Start file routes; `src/routes/__root.tsx` defines the document shell.
- `src/components/` contains reusable React UI; `src/lib/` contains the build-only Contentful adapter, generated-release seam, authorization, image helpers, and shared types.
- `tests/` contains Playwright behavior/visual coverage and focused Bun tests under `tests/unit/`.
- `infra/opentofu/` is the AWS definition and sole infrastructure state owner.
- Treat `src/routeTree.gen.ts` and `src/lib/generated-release/` as generated files. Generated public content, protected content, route inventory, album JSON, and auth data must remain uncommitted.

## Workflows

- `bun run validate`: app lint, unit tests, type checking, fixture builds, and artifact checks.
- `bun run test:unit`: focused Bun unit tests.
- `bun run test:visual -- tests/home.test.ts`: one canonical Playwright spec; run `bun run test:visual` for the full suite.
- `bun run test:visual:update`: update canonical screenshots only after reviewing the intended visual change.
- Root `bun run infra:validate` and local `bun run infra:validate` validate OpenTofu.

`bun run build` captures one build-time Contentful release, atomically emits its public/protected/auth partitions, prerenders fixed and public project pages, and emits the cleaned Amplify bundle under `.amplify-hosting/`. Public navigation uses static server-function cache files; photography uses content-addressed static album JSON. Compute serves only protected projects, password functions, and `/resume`, and its only runtime secret is `PROJECT_AUTH_SECRET`. Keep protected project details and secrets out of public output.

## Conventions

Use TypeScript and functional React components. Prefer the `@/` alias for cross-directory imports and relative imports within one folder. Follow `biome.json` for formatting and import organization.
