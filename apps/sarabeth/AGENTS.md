# Repository Guidelines

## Project Structure & Module Organization

- `src/routes/`: TanStack Start file routes (`about`, `lessons`, `media`, etc.) and server route handlers (for example `src/routes/api.email.ts`).
- `src/router.tsx`: TanStack Router instance; `src/routeTree.gen.ts` is generated and must not be edited manually.
- `components/`: Reusable React components, organized by feature; shared UI primitives live in `components/ui/`.
- `utils/`: External integrations and data shaping (`contentful.ts`, `fetchers/*`, `types/*`).
- `styles/`: Global styling (`styles/globals.css`).
- `public/`: Static assets (favicons and images).
- `lib/`: Small shared helpers (`lib/utils.ts`).

## Build, Test, and Development Commands

- `bun dev`: Start local dev server at `http://localhost:3000`.
- `bun build`: Create production build.
- `bun start`: Run the production server locally.
- `bun lint`: Run Biome across the repository.
- `bun lint:fix`: Auto-fix lint issues where possible.

## Coding Style & Naming Conventions

- Language: TypeScript + React function components.
- Indentation: 2 spaces; keep files Prettier-friendly.
- Components use PascalCase folders/files with `index.tsx` (example: `components/Header/index.tsx`).
- Route segments use lowercase names in `src/routes/`.
- Use path alias imports (`@/...`) for cross-folder imports.
- Keep imports sorted and grouped consistently.

## Testing Guidelines

- Playwright coverage lives under `tests/`.
- Minimum verification is `bun lint`, then `RELEASE_COMMIT=$(git rev-parse HEAD) docker compose -f compose.playwright.yaml run --build --rm playwright` for affected browser behavior.
- For new tests, prefer colocated `*.test.ts` or `*.test.tsx` files near the code they cover.

## Commit & Pull Request Guidelines

- Root Lefthook/commitlint require Conventional Commits with one approved scope:
  `carolyn`, `paul`, `diloreto`, `sarabeth`, `repo`, `ci`, or `deps`.
- Use this app's scope for app-specific changes (example: `fix(sarabeth): handle missing data`).
- Keep changes focused, with passing lint/tests; include screenshots only for intended UI changes.
- Install at the workspace root; this app lives at `apps/sarabeth`. Historical source
  repository URLs and deployed identities are unchanged.

## Security & Configuration Tips

- Keep secrets in `.env` only; never commit credentials.
- Production builds receive the non-secret `CONTENTFUL_SPACE_ID` as Amplify branch configuration and retrieve `CONTENTFUL_ACCESS_TOKEN` from the standard SSM `SecureString` at `/sarabeth-studio/production/contentful/access-token` during `preBuild`; never expose the token to browser code or commit it.
- The contact endpoint uses the AWS SDK default credential provider chain. In Amplify, permissions come only from the compute IAM role; do not add static AWS access-key environment variables.
