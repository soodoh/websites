# Websites

Four independent websites in one Bun 1.4.0 / Node 24.20.0 workspace, orchestrated by Turborepo.

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
