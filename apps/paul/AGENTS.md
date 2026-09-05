# Repository Guidelines

## Project Structure & Module Organization

This is a TanStack Start + React + TypeScript app built with Vite.

- `src/routes/`: file-based route modules (`__root.tsx`, `index.tsx`)
- `src/components/`: reusable UI and page components (`ui/` for shadcn primitives)
- `src/content/`: static content data (about, projects, socials)
- `src/styles/`: global styles (`globals.css`)
- `public/`: static assets (images, favicon)
- `dist/`: build artifacts (do not edit)

Use the `@/` alias for imports from `src` (for example, `@/components/Header`).

## Build, Test, and Development Commands

Use Bun for all local workflows:

- `bun run dev`: start the Vite dev server
- `bun run build`: produce production build output
- `bun run start`: serve the built static site from `dist/client`
- `bun run lint`: run Biome (lint + format check)
- `bun run lint:fix`: apply Biome fixes (lint + format)
- `bun run typecheck`: type-check application, Playwright, config, and tooling files

Before opening a PR, run at least `bun run lint`, `bun run typecheck`, and `bun run build`.

## Coding Style & Naming Conventions

- Language: TypeScript + TSX, strict mode enabled.
- Indentation: tabs (Biome default); keep imports sorted/alphabetized.
- Prefer absolute imports via `@/`; relative imports outside the same folder are blocked by linting.
- Components and route modules: `PascalCase` files for components, route filenames follow TanStack conventions.
- Keep content constants in `src/content/*.ts` and UI logic in `src/components/*`.

## Testing Guidelines

Playwright functional and visual tests are committed under `e2e/`. Run `bun run test:e2e` against the committed Docker-pinned snapshots, or `bun run test:e2e:static` to build and exercise the production-static output. Update snapshots only for intentional visual changes.

Treat `bun run lint`, `bun run typecheck`, `bun run build`, `bun run test:static`, and the relevant Playwright command as required quality gates.

## Commit & Pull Request Guidelines

- Root Lefthook/commitlint require Conventional Commits with one approved scope:
  `carolyn`, `paul`, `diloreto`, `sarabeth`, `repo`, `ci`, or `deps`.
- Use this app's scope for app-specific changes (example: `fix(paul): handle missing data`).
- Keep changes focused, with passing lint/tests; include screenshots only for intended UI changes.
- Install at the workspace root; this app lives at `apps/paul`. Historical source
  repository URLs and deployed identities are unchanged.
