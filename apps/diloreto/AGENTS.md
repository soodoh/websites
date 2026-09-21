# DiLoreto website

Apply the workspace rules in `../../AGENTS.md` together with this app-specific overlay.

## Architecture

- `src/routes/` contains TanStack Start file routes.
- `src/components/` contains reusable UI, with primitives under `src/components/ui/`.
- `src/content/` contains typed static content; imported images live under `src/assets/images/`.
- `src/styles/app.css` contains Tailwind v4 and shadcn theme tokens.
- `tests/` contains Playwright interaction, smoke, and visual coverage.
- `infra/opentofu/` is the AWS definition and sole infrastructure state owner.
- Treat `src/routeTree.gen.ts` and `src/content/genealogy/generated.json` as generated files. Regenerate genealogy data with `bun run genealogy:build`.

## Workflows

- `bun run check`: lint, type checking, genealogy tests, static build/output assertions, and the full Playwright suite.
- `bun run test:genealogy`: focused genealogy parser and input tests.
- `bun run test:smoke`: desktop/mobile smoke coverage against the production static output.
- `bun run test:playwright`: full interaction and visual coverage; use `bun run test:playwright:update` only for reviewed visual changes.

The deployable static artifact is `dist/client`. Smoke and Playwright tests exercise that output rather than the Vite development server. Preserve coverage for `/`, `/areyou`, 404 handling, images, and modal/gallery interactions when changing related behavior.

## Conventions

Use TypeScript and follow `biome.json`. Keep route filenames aligned with URL structure, component/view files in `PascalCase`, and utility modules lowercase. The source alias is `@/`, mapped to `src/`.
