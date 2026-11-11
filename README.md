# Websites

Four independent websites in one Bun / Node workspace, orchestrated by Turborepo.
Use the versions pinned in `.bun-version` and `.nvmrc`.

```sh
bun install --frozen-lockfile
bun run test:workspace
bun run test:unit             # workspace and all app Vitest projects
bun run lint
bun run typecheck
bun run verify:sarabeth        # or paul, carolyn, diloreto
bun run ci:verify              # complete serial verification
```

`bun run dev` starts the apps on ports 3100–3103. CMS-backed development requires development-only configuration.

## Formatting and linting

Root `biome.json` is the shared policy for all four sites, shared packages, root scripts, and configuration. `bun run lint` checks the repository; `bun run lint:fix` applies safe fixes. Running `bun run lint` inside an app or package inherits the same policy but checks only that workspace. Root CI also runs the repository-wide check.

The shared policy supports Tailwind and excludes generated routes, build/test reports, and downloaded OpenTofu providers. There are no app-local Biome configurations or CSS Modules overrides.

## TypeScript and generated files

Apps, shared packages, and root `tsconfig.tools.json` extend `tsconfig.base.json` for their common strict, no-emit, ESM/bundler compiler policy. Targets, runtime libraries/types, React-specific settings, aliases, and included/excluded files remain local. Relative aliases continue to resolve from each workspace, and Paul's tooling project still extends its app config. `bun run typecheck:tools` checks root scripts, their tests, and Vitest configuration; `bun run typecheck` runs that check before the serial workspace checks. Root CI also checks tooling types. No project needs `allowJs` or `checkJs`.

Repository-owned programs use TypeScript; declarative Commitlint policy lives in `.commitlintrc.json`. Generated browser/server JavaScript and dependencies remain managed by their existing tools.

Root `.gitignore` owns shared dependency, build, report, environment, secret, and local-tool exclusions. Carolyn retains a small local file for generated release/authentication content and fixture-recovery artifacts; DiLoreto retains its local deployment-recovery exclusion. Paul and Sarabeth need no local ignore file. Intentionally tracked generated route trees and genealogy data remain trackable, as do example environment files and OpenTofu provider lockfiles.

## Hosting profiles

Paul and DiLoreto are fully static Amplify apps deployed as verified ZIP artifacts. Carolyn and Sarabeth are static-first Amplify compute apps: Contentful is captured at build time, public routes are prerendered, and only explicitly allow-listed feature routes reach compute. All four publish the same `/__deployment.json` release contract and use the same operational alarm and core security-header baseline.

Account-level GitHub OIDC, alarm notifications, and budgets are defined by `infra/aws-account-foundation.yaml`. See [deployment and rollback operations](docs/deployment.md) before changing or applying infrastructure.

## Continuous delivery

Pull requests run `.github/workflows/ci.yml`, which verifies the root and all four apps. Each site also has one explicit deployment workflow:

- `.github/workflows/deploy-paul.yml`
- `.github/workflows/deploy-diloreto.yml`
- `.github/workflows/deploy-carolyn.yml`
- `.github/workflows/deploy-sarabeth.yml`

Each deployment workflow uses native path filters, a site-specific GitHub Environment, AWS OIDC, and a non-canceling concurrency group. A merge to `main` that matches a site's paths validates and deploys that site; manual dispatches must also target `main`.

See [deployment and rollback operations](docs/deployment.md).

## Lighthouse

All four sites use the same mobile/desktop Lighthouse checks, with per-site category baselines in `apps/<site>/lighthouse.json`.

```sh
bun run lighthouse:install
bun run lighthouse paul        # or carolyn, diloreto, sarabeth; builds locally first
```

PRs and deployments reuse one verification workflow, including Lighthouse. See [Lighthouse checks and baseline updates](docs/lighthouse.md).
