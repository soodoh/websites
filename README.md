# Websites

Four independent websites in one Bun 1.4.0 / Node 24.20.0 workspace, orchestrated by Turborepo.

```sh
bun install --frozen-lockfile
bun run test:workspace
bun run lint
bun run typecheck
bun run verify:sarabeth        # or paul, carolyn, diloreto
bun run ci:verify              # complete serial verification
```

`bun run dev` starts the apps on ports 3100–3103. CMS-backed development requires development-only configuration.

## Continuous delivery

Pull requests run `.github/workflows/ci.yml`, which verifies the root and all four apps. Each site also has one explicit deployment workflow:

- `.github/workflows/deploy-paul.yml`
- `.github/workflows/deploy-diloreto.yml`
- `.github/workflows/deploy-carolyn.yml`
- `.github/workflows/deploy-sarabeth.yml`

Each deployment workflow uses native path filters, a site-specific GitHub Environment, AWS OIDC, and a non-canceling concurrency group. Deployment jobs remain disabled until their repository-level `<SITE>_DEPLOY_ENABLED` variable is set to `true` during that site's cutover.

See [deployment and rollback operations](docs/deployment.md) and the [current migration plan](docs/migration/README.md).
