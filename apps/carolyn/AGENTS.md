# Carolyn portfolio

Apply the workspace rules in `../../AGENTS.md` together with this app-specific overlay.

## Architecture

- `src/routes/` contains TanStack Start file routes; `src/routes/__root.tsx` defines the document shell.
- `components/` contains reusable React UI; `lib/` contains Contentful access, authorization, image helpers, and shared types.
- `tests/` contains Playwright behavior/visual coverage and focused Bun tests under `tests/unit/`.
- `infra/` contains the retained AWS CDK application and its tests.
- Treat `src/routeTree.gen.ts` and `lib/project-auth-manifest.json` as generated files. The auth manifest must remain uncommitted.

## Workflows

- `bun run validate`: app lint, unit tests, type checking, fixture builds, and artifact checks.
- `bun run test:unit`: focused Bun unit tests.
- `bun run test:visual -- tests/home.test.ts`: one canonical Playwright spec; run `bun run test:visual` for the full suite.
- `bun run test:visual:update`: update canonical screenshots only after reviewing the intended visual change.
- `bun run infra:typecheck`, `bun run infra:test`, and offline `bun run infra:synth`: validate retained CDK code.

`bun run build` refreshes auth data, prerenders public pages, and emits the cleaned Amplify bundle under `.amplify-hosting/`. Keep protected project details and secrets out of public output.

## Conventions

Use TypeScript and functional React components. Prefer the `@/` alias for cross-directory imports and relative imports within one folder. Follow `biome.json` for formatting and import organization.
