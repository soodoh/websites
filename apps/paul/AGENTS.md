# Paul portfolio

Apply the workspace rules in `../../AGENTS.md` together with this app-specific overlay.

## Architecture

- `src/routes/` contains TanStack Start file routes.
- `src/components/` contains reusable UI and page components; shadcn primitives live under `src/components/ui/`.
- `src/content/` contains static portfolio data; `src/styles/globals.css` contains global styles.
- `e2e/` contains Playwright functional and visual coverage.
- Treat `src/routeTree.gen.ts` and `dist/` as generated output.

This app is fully static. `bun run build` emits the deployable artifact under `dist/client`, and `bun run start` serves that exact directory.

## Workflows

- `bun run test:static`: validate the generated static artifact.
- `bun run test:e2e`: run functional and visual tests in the pinned Docker environment.
- `bun run test:e2e:static`: build and test production-static behavior, including static 404 handling.
- `bun run test:e2e:update`: regenerate committed baselines only for an intentional, reviewed visual change. Use `test:e2e:local` only for debugging, not baseline updates.

## Conventions

Use strict TypeScript and functional React components. Keep content constants in `src/content/`, UI logic in `src/components/`, and cross-directory imports on the `@/` alias. Follow `biome.json` for formatting and import organization.
