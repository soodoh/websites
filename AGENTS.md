# Websites workspace

This file defines workspace-wide rules. For work under an app, apply it together with the
nearest app `AGENTS.md`, which contains only that app's constraints.

Install only at the repository root with Bun 1.4.0 and Node 24.20.0:
`bun install --frozen-lockfile`. `bun.lock` is authoritative; Bun's isolated linker means
apps must declare every dependency they import.

## Commands

- `bun run dev`: starts Sarabeth, Paul, Carolyn, and DiLoreto on ports 3100–3103.
- `bun run lint`, `bun run typecheck`: serial workspace checks.
- `bun run test:workspace`: root workspace, Docker-wrapper, and commit-policy tests.
- `bun run verify:<site>`: complete verification for one of `sarabeth`, `paul`, `carolyn`, or `diloreto`.
- `bun run ci:verify`: root checks followed by all four complete verification chains, concurrency 1.

Run app verification serially because tests generate files in app directories. Sarabeth and
Carolyn browser fixtures require ARM64 Docker. Portfolio Lighthouse requires local Chrome.

## Deployment

When changing GitHub Actions, AWS deployment, Amplify configuration, rollback behavior, or IaC,
read `docs/deployment.md`. The deployment interface is one explicit workflow per site, with native
path filters, GitHub Environments, OIDC, and site concurrency. Production releases require the
matching protected GitHub Environment.

For AWS IaC, state, or ownership changes, read `docs/opentofu-migration.md`. OpenTofu is the
sole active AWS definition. Obtain explicit approval before GitHub settings writes, AWS changes,
state mutations, workflow dispatch, source-writer shutdown, production HTTP tests, or deployment.

## Repository rules

Root Lefthook/commitlint require Conventional Commits with one scope: `carolyn`, `paul`,
`diloreto`, `sarabeth`, `repo`, `ci`, or `deps`. Root Renovate owns dependency updates.
Each app keeps source under `src/`, browser tests under `tests/`, retained IaC under `infra/`,
and maps `@/` to `src/`. Keep secrets, credentials, build output, auth manifests, reports, and
generated evidence out of Git.
