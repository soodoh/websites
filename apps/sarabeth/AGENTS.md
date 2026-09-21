# Sarabeth Studio

Apply the workspace rules in `../../AGENTS.md` together with this app-specific overlay.

## Architecture

- `src/routes/` contains TanStack Start page routes and server handlers such as `api.email.ts`.
- `src/router.tsx` creates the router; treat `src/routeTree.gen.ts` as generated.
- `src/components/`, `src/utils/`, `src/styles/`, and `src/lib/` contain shared UI, integrations/data shaping, global styles, and small helpers.
- `tests/contract/` contains behavior contracts; `tests/visual/` contains browser coverage.
- `infra/opentofu/` is the AWS definition and sole infrastructure state owner.

## Workflows

- `bun run typecheck` and `bun run lint`: focused static checks.
- `bun run test:container`: canonical Docker-pinned browser tests.
- `bun run build:playwright:unchecked`: fixture browser build used by the verification chain.
- `bun run build:amplify:fixture`, `bun run prepare:amplify`, and `bun run validate:amplify`: build and validate the fixture Amplify artifact.
- Root `bun run infra:validate` validates OpenTofu; `infra:lint` runs the app-specific OpenTofu validation.

Add contract tests under `tests/contract/` and page/visual coverage under `tests/visual/`. Update browser snapshots only for reviewed UI changes.

## Security

- Keep Contentful and YouTube tokens server-only; never expose them through `VITE_` variables or browser code.
- Production retrieves `CONTENTFUL_ACCESS_TOKEN` from `/sarabeth-studio/production/contentful/access-token` during Amplify `preBuild`.
- The contact and runtime integrations use the AWS SDK default credential provider chain and compute IAM role. Keep static AWS access keys out of app configuration.

Use TypeScript, functional React components, the `@/` alias for cross-folder imports, and `biome.json` as the formatting source of truth.
