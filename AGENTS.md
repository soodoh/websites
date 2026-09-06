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

Phase 2 local and hosted CI acceptance are complete, with the user's explicit
main-push evidence exception in `docs/migration/phase2-hosted-acceptance.md`.
The user explicitly adopted the offline execution block in `03-fresh-session.md`.
Phase-3 LOCAL authoring, fixture validation and forward scoped local commits of reviewed
preparation/offline changes are authorized. Read
`docs/migration/{03-execution-plan,03-production-cutover-handoff,03-fresh-session}.md`.
A saved launch prompt alone is not authority; this scope does not authorize publication.
Install only in an independent TARGET checkout root, with the exact pins above; use empty
HOME/environment and explicit safe tool paths for fixture validation. No existing-worktree
or source installs, credential reads, live GitHub/AWS/source inventory, production HTTP,
identity jobs, release-ref promotion, change sets or cloud/settings writes are authorized.
Do not push, execute GitHub workflows, change settings, access AWS, deploy,
or modify source repository worktrees/config/refs/hooks without separate approval.
The source repositories remain production deployment owners. Nested app workflows
are inert baselines, not runnable monorepo deployment configurations. Existing infra/
deploy-shaped scripts remain for continuity but are NOT authorized to execute.
Never use production CMS, email, deployed-smoke, or AWS lookup commands for local validation.

The approved Portfolio credential redaction and all-main scoped message normalization
are complete. Preserve the resulting commit graph; do not rewrite further history.
Source repositories remain untouched. Read `docs/migration/history-normalization-decision.md`
and use its SHA map when navigating older evidence. `source-imports.json` distinguishes
original approved source SHAs from normalized imported heads and initial target commit.
Pristine import prefixes remain historical; current folders are the four short names.
Before imports, paths were root-relative: use `git log <normalized-imported-head> --
<old-path>`, not promises of seamless `--follow apps/...`. Initial publication was
accepted as verified by the user; do not repeat normalization or restore the old initial
history. Historical publication-pending records retain their checkpoint meaning.
No new push or force-push is authorized; unexpected remote drift requires reconciliation.

Root Lefthook/commitlint own target hooks; Conventional Commits require a scope:
`carolyn`, `paul`, `diloreto`, `sarabeth`, `repo`, `ci`, or `deps`
(example: `chore(repo): update workspace guidance`). Root Renovate owns dependency/tool updates. Keep app Biome settings,
fixtures, screenshot baselines, and deployed CDK/CloudFormation identities intact.
All Turbo tasks are uncached, strict-env mode remains enabled, and remote cache is
explicitly disabled. Keep dependencies, secrets, auth manifests, bundles, reports,
and generated output out of Git. Phase 2 acceptance is not phase-3 execution authority;
each account/settings/production cutover operation requires its own approval.
