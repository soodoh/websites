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
- `bun run start`: run the built server (`.output/server/index.mjs`)
- `bun run lint`: run Oxlint
- `bun run lint:fix`: apply safe lint fixes

Before opening a PR, run at least `bun run lint` and `bun run build`.

## Coding Style & Naming Conventions
- Language: TypeScript + TSX, strict mode enabled.
- Indentation: 2 spaces; keep imports sorted/alphabetized.
- Prefer absolute imports via `@/`; relative imports outside the same folder are blocked by linting.
- Components and route modules: `PascalCase` files for components, route filenames follow TanStack conventions.
- Keep content constants in `src/content/*.ts` and UI logic in `src/components/*`.

## Testing Guidelines
There is currently no committed automated test suite in this repository. Treat linting and build success as required quality gates.

When adding tests, prefer Playwright (already included in dev dependencies) and use `*.spec.ts` naming under a dedicated `tests/` or `e2e/` directory.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits (examples in history: `feat: ...`, `fix: ...`, `chore: ...`). Commitlint is enforced via Husky and currently requires no scope in the subject (for example, `feat: add banner animation`).

PRs should include:
- clear summary of user-visible and technical changes
- linked issue(s) when applicable
- screenshots or short recordings for UI changes
- confirmation that `bun run lint` and `bun run build` pass
