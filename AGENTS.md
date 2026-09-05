# Websites workspace

Read the app's own AGENTS.md before changing it. Install only at the repository root
with Bun 1.4.0 and Node 24.20.0: `bun install --frozen-lockfile`. `bun.lock` is the
only authoritative lock. Bun's isolated linker prevents undeclared sibling imports.
Do not add overlapping/nested workspaces; Carolyn infra tools belong to its app.

## Commands

- `bun run dev`: four concurrent dev servers, ports 3100 Sarabeth, 3101 Portfolio,
  3102 Carolyn, 3103 DiLoreto. CMS-backed dev servers need development configuration;
  never use production secrets for migration validation.
- `bun run lint`, `bun run typecheck`: serial per-app gates. Carolyn typecheck
  deliberately builds fixture output. Never run builds/typechecks/tests concurrently
  against the same app directories.
- `bun run test:workspace`: workspace configuration and direct-resolution contracts.
- `bun run verify:carolyn`, `verify:paul`, `verify:diloreto`, `verify:sarabeth`: one
  complete sequential fixture/offline chain. Directories use these short names;
  package-name filters remain carolyn-portfolio, portfolio-website, diloreto-website,
  sarabeth-studio respectively.
- `bun run ci:verify`: workspace contracts, then all four complete chains, concurrency 1.
- App-local scripts still run from `apps/<app>`; canonical Playwright ports are unchanged.
  Docker wrappers find the workspace by script location. Do not update screenshots to
  hide architecture or dependency drift. Sarabeth/Carolyn require ARM64 Docker.
- Offline tools: Go/actionlint, ShellCheck, Python via uv/cfn-lint, Docker, and a local
  Chrome for Portfolio Lighthouse. Versions and remaining gates are in docs/migration.

## Boundaries

This is phase 1, LOCAL ONLY. Do not push, enable root GitHub Actions, deploy, mutate
AWS, or modify source repository worktrees/config/refs/hooks. The source repositories
remain production deployment owners. Nested app workflows are inert baselines,
not runnable monorepo deployment configurations. Existing infra/deploy-shaped scripts
remain for continuity but are NOT authorized to execute. Never use production CMS,
email, deployed-smoke, or AWS lookup commands for local validation.

This stage preserves existing histories, source repositories, and pristine import prefixes.
The user approved later normalization of every local-main commit message, including
published initial commit, but ONLY the parent owns that separate rewrite stage. Do not
rewrite history/refs here. Portfolio credential redaction remains recorded in
`docs/migration/portfolio-redaction-decision.md`. Historical paths remain root-relative
before imports: use `git log <imported-head> -- <old-path>`, not promises of seamless
`--follow apps/...`. Future normalized history publication requires separate non-fast-forward
approval and fresh-clone checks; no push or force-push is authorized now.

Root Lefthook/commitlint own target hooks; Conventional Commits require a scope:
`carolyn`, `paul`, `diloreto`, `sarabeth`, `repo`, `ci`, or `deps`
(example: `chore(repo): update workspace guidance`). Root Renovate owns dependency/tool updates. Keep app Biome settings,
fixtures, screenshot baselines, and deployed CDK/CloudFormation identities intact.
All Turbo tasks are uncached, strict-env mode remains enabled, and remote cache is
explicitly disabled. Keep dependencies, secrets, auth manifests, bundles, reports,
and generated output out of Git. Phase 2 is separate and starts only after phase-1
acceptance; phase 3 production cutover requires its own approvals.
