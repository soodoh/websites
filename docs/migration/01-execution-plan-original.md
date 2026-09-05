# Plan 1 — Preserve main histories and establish the websites Turborepo

## Execution contract (read this in a fresh session)

Implement this plan, not merely another proposal. Work in `/Users/pauldiloreto/Projects/websites/main/`. Read this entire document, root/ancestor instructions, and each imported application's AGENTS.md before editing. This is phase 1 of three:

1. This file: Git history import, Bun workspace, Turborepo, local validation.
2. `/tmp/websites-plan-2-scoped-ci.md`: diff-scoped GitHub Actions, with production disabled.
3. `/tmp/websites-plan-3-production-cutover.md`: environments, IAM, Amplify, releases, rollback and cutover.

User decisions: preserve ALL commits reachable from each source `main` (not unrelated branches/tags); use `soodoh/websites`; use three sessions; leave source repositories untouched during migration. Do not interpret this as permission to deploy, modify AWS, disable old CI, archive repositories, rewrite source history, or force-push. Keep durable handoff records in the target repository, not only in /tmp. Obtain approval before publishing imported history to the public remote. Local implementation and local commits are in scope.

## Observed starting state — revalidate, do not assume unchanged

The target ALREADY EXISTS. `/Users/pauldiloreto/Projects/websites/main` is a linked worktree whose common Git directory is `/Users/pauldiloreto/Projects/websites/.git`. It has branch `main`, origin `git@github.com:soodoh/websites.git`, and initial commit `5b236ef` with an empty README.md. GitHub reports it PUBLIC. Do NOT run git init, clone over it, delete it, or replace its .git file. If the state has advanced, inspect and preserve all existing work.

| Source worktree | Observed main SHA | Import prefix |
| --- | --- | --- |
| `/Users/pauldiloreto/Projects/sarabeth-studio/main` | `dc3e3f956ccbc49a0361cddc0b79b655e46c000d` | `apps/sarabeth-studio` |
| `/Users/pauldiloreto/Projects/portfolio-website/main` | `755f12c94dde2412d06d730787ec7b046c62fcd1` | `apps/portfolio-website` |
| `/Users/pauldiloreto/Projects/carolyn-portfolio/main` | `8c70afc7748ab4a18e596df597a641c9aad97ad6` | `apps/carolyn-portfolio` |
| `/Users/pauldiloreto/Projects/diloreto-website/main` | `c4ce9abf6fd69effa24a7ad0e78f90e59e52c58a` | `apps/diloreto-website` |

All four were clean, non-shallow linked worktrees, with local main matching local origin/main. Remote freshness was not verified. Check live GitHub main refs read-only; if they differ, ask which revision to import. Do not silently update source refs/worktrees. Fetch into the target or a scratch clone instead if a newer revision is authorized. Use an approved immutable SHA for each import and record it.

## Non-negotiable invariants

- Preserve original commit IDs, authors, commit messages, merge topology, and every ancestor of each approved main SHA. Use `git subtree add` WITHOUT `--squash`. Do not use filter-repo/history rewriting: it would change commit IDs.
- Import only committed tracked trees. Never copy a source worktree wholesale: it contains ignored `.env`, node_modules, generated outputs, reports, and potentially credentials. Honor symlinks and executable modes.
- No submodules or nested Git repositories in apps. The original source histories remain ancestors of target main, not merely local refs/bundles.
- Source repository working trees, Git configs, refs, hooks, remotes and remote settings remain unchanged. Do not run installs/tests inside source worktrees. Baseline tests, if needed, run in scratch clones.
- Preserve application behavior, screenshot baselines, infrastructure logical IDs/resource names/accounts, and existing deployment policies. Infrastructure is not applied here.
- Active root workflows must NOT be installed in this phase. Original workflows may remain under `apps/<app>/.github/workflows` as inert migration baselines. GitHub does not execute those nested files.

## 1. Preflight and provenance

1. Inventory target/source status, refs, common directories, approved SHAs and full commit counts. Record the target starting SHA. Stop for dirty/unexpected state; do not stash or discard user work.
2. Check for shallow histories, missing/promisor objects, Git LFS, submodules, unavailable objects, and dangling source-main parents. Fetch missing objects into disposable storage/target only if necessary. Resolve LFS/submodule cases explicitly before claiming completeness.
3. Because target is public, scan the imported main histories and current trees for credentials/private content with redacted output. Do not print secrets or commit scan findings containing secrets. If exposed historical secrets are found, STOP for credential rotation/publication decisions. Do not secretly rewrite history to remove them; that conflicts with the chosen preservation contract.
4. Create local backup bundles outside the worktrees, e.g. `/tmp/websites-migration-backups/<source>-main.bundle` using `git bundle create ... main`, then verify them. Bundle creation must not change source state. Do not rely on /tmp as the only preservation mechanism.
5. Establish `docs/migration/` in the target. Save a machine-readable `source-imports.json` with source path/URL, approved full SHA, source tree ID, source commit count, target prefix, import commit, and verification evidence. Never record secret values.

## 2. Import history in isolated, auditable commits

Start from the existing target history; retain its initial commit. Use an implementation branch if appropriate for the target's current policy, but complete via a history-preserving merge, not squash/rebase. Example for each approved source, run from the target:

```bash
# Substitute actual approved values. Fetch writes ONLY target refs.
git fetch --no-tags /Users/pauldiloreto/Projects/sarabeth-studio/main \
  main:refs/remotes/import/sarabeth-studio/main
# Verify fetched SHA equals the approved SHA BEFORE proceeding.
git subtree add --prefix=apps/sarabeth-studio \
  refs/remotes/import/sarabeth-studio/main \
  -m "chore: import sarabeth-studio main history"
```

Repeat once per app. No `--squash`. Immediately record each import commit before any workspace modifications. Verify:

```bash
git merge-base --is-ancestor "$SOURCE_SHA" HEAD
test "$(git rev-parse "$SOURCE_SHA^{tree}")" = \
     "$(git rev-parse "$IMPORT_COMMIT:apps/$APP")"
test -z "$(git rev-list "$SOURCE_SHA" --not HEAD)"
git fsck --full
```

Check all four source heads and all expected commit objects, not just aggregate commit counts. The equality check belongs at the pristine IMPORT COMMIT; later workspace adaptations intentionally change current trees. Repeat ancestry checks after final merging and in a fresh clone if publication is approved. Push normally; original ancestry is pushed because it is reachable from main. Never squash-merge the import branch.

Document the history-navigation trade-off: unchanged original commits contain old root-relative paths, not rewritten `apps/...` paths. Use `git log <source-sha> -- <old-path>` / source import refs for historical navigation. Do not promise seamless `git log --follow apps/...` through subtree boundaries. Preserve unrelated source branches/tags only in the untouched original repositories; they were explicitly excluded from the migration scope.

## 3. Convert to an actual Bun workspace + Turborepo

Unlike a loose directory collection, this phase MUST produce one functioning root workspace and one authoritative Bun lockfile. Target layout:

```text
websites/main/
  package.json          # private root, workspaces apps/* (packages/* only if used)
  bun.lock              # authoritative workspace lock
  turbo.json
  .bun-version / .nvmrc # pinned supported toolchain
  AGENTS.md
  apps/<four apps>/     # original names preserved
  docs/migration/
```

1. Read current official Turborepo/Bun docs and pin a mutually supported exact Turbo/Bun/Node toolchain. Bun 1.4.0 and Node 24.20.0 were locally available/used by the newer apps; validate compatibility rather than blindly upgrading to latest. Existing older apps and Amplify specs pin Bun 1.3.14 / Node 24.18.0. Record the selected versions and every deviation.
2. Keep the four existing package names unique. Keep application dependency versions distinct where necessary; do not combine this with a mass dependency upgrade, UI extraction, framework migration, or catalogs rollout.
3. Inventory resolved package versions from all four old locks and Carolyn infra's fifth lock. Build the root lock deliberately; compare resolved versions before/after. Re-resolving semver ranges can upgrade packages silently: avoid it where possible and explicitly justify/test every necessary change. Once frozen installs work, remove obsolete app locks and conflicting package-manager/engine declarations from the working tree. Old locks remain in imported history and recorded import commits.
4. Carolyn has a NESTED package at `apps/carolyn-portfolio/infra` with its own package.json/lock and relative imports into `../../lib`. Avoid overlapping nested workspaces. Recommended minimal change: retain infra source/layout and cdk.json in place, fold its tool dependencies into the Carolyn app manifest, replace infra package scripts with app scripts `infra:typecheck`, `infra:test`, `infra:synth`, `infra:diff`, `infra:deploy`, and remove the nested manifest/lock. Run synth with cwd `infra`. Preserve CDK stack/construct IDs and relative imports. If this cannot be done without behavior changes, stop and propose a peer workspace plus explicit dependency graph instead of silently moving deployed resource identities.
5. Centralize Lefthook/commitlint ownership at the root. Multiple imported `prepare: lefthook install` scripts must not race or overwrite the shared target hooks. Preserve no-scope Conventional Commit policy initially; do not edit source hooks. Consolidate Renovate into a root config that covers workspace packages and pinned Actions/Docker/tool versions. Retain app Biome/TS settings unless a root assumption actually breaks them.
6. Retain app AGENTS.md guidance and symlink correctness (CLAUDE.md may reference AGENTS.md). Add root instructions covering workspace commands, history invariants, migration phase boundaries and no-deployment policy.
7. Give four simultaneous dev servers unique documented ports, without changing canonical Playwright URLs/ports inadvertently. Existing tests can remain on their canonical ports when run serially or on separate CI runners.

## 4. Turborepo task and Docker correctness

- Define root dev/lint/typecheck and explicit per-app verification commands. Use `tasks`, not obsolete `pipeline`, with a schema appropriate to the pinned Turbo version. `dev` is persistent and uncached. Never make root scripts recursively invoke themselves via Turbo.
- Initially mark complete verification/build/deployment-shaped tasks `cache: false`. No remote cache. CMS-dependent builds, fixture vs production modes, auth manifests, release SHA stamping and live smoke tests must never reuse an inappropriate cache. Cache optimization is a later, evidence-based change.
- Do not generically run `turbo run build typecheck test` concurrently: Carolyn typecheck builds/writes outputs, several commands overwrite the same directories, and browser servers compete for ports. Provide one sequential `ci:verify` chain per app; run all-app local verification with conservative concurrency (initially 1). Separate per-app CI runners in plan 2 may parallelize safely.
- Keep generated `.amplify-hosting`, `.output`, dist, auth manifests, reports, zip files, .turbo, tsbuildinfo and dependencies out of Git. Audit any generated files already tracked before removing; never remove source fixtures or screenshot baselines.
- Inventory Turbo strict-mode environment requirements. Explicitly pass fixture flags, browser settings and relevant CI variables; avoid globally switching to loose mode. Do not read/use production secrets for local fixture validation. Never cache secret-bearing logs/artifacts.
- All current Playwright Docker builds assume an app-local lock/node_modules. Adapt Dockerfile COPY paths, build context, bind mounts, working dirs, root lock/package manifests, .dockerignore and volume isolation for workspace resolution. Containers must install with the root frozen lock and see required workspace dependencies. Do not merely mount one app and hope hoisted dependencies resolve.
- Preserve runner/browser architecture and Playwright image/version pairs: Sarabeth/Carolyn have ARM64-sensitive visual baselines; Portfolio/DiLoreto use their existing canonical environment. Do not update screenshots to hide platform or dependency drift.
- Root Docker contexts must exclude sibling `.env`, credentials, unrelated artifacts and host node_modules. Resolve paths using script locations rather than assuming cwd is repository root. Give test volumes/cache keys app/tool/lock-specific identities; never reuse ambiguous old volumes.

## 5. Baseline verification (local only)

Read all six original workflow files in the imported trees. Preserve their validation coverage, not just scripts with conventional names. Phase 2 owns relocating workflows; phase 1 may fix necessary path/toolchain compatibility but does not weaken workflow contract assertions. Record any remaining phase-2-only failing assertions precisely.

Minimum per-app coverage:

- Sarabeth: lint, types, production-provider graph, fixture Amplify bundle build/prepare/validation, deployment-shell tests and deterministic containerized Playwright. Validate CloudFormation offline. No production CMS calls/email sending.
- Carolyn: full `validate`, infra types/unit tests/offline synth, production-shaped fixture Playwright. Preserve auth/secret/artifact contracts. CDK synth must not require live account lookups or deploy.
- Portfolio: lint, both TypeScript configs, ShellCheck/bash syntax, static build/output assertions, functional/visual Playwright, local Lighthouse and offline CloudFormation lint.
- DiLoreto: lint, types, genealogy unit tests, static build/output assertions, containerized Playwright and offline CloudFormation lint.

Execute with a clean install in a disposable target checkout/container, not only warm local node_modules. Validate individual Turbo filters and the root all-app command. Verify generated paths and no tracked dirt from builds. Prove each app runs without hidden dependencies on the old filesystem paths or ignored source secrets. Record actual commands, versions, exits and skipped checks. Unavailable Docker/architecture is a blocker or explicit incomplete acceptance, never 'passed'.

## 6. Commit, verify and hand off

Keep imports separate from tooling changes. Use small implementation commits. Before marking complete:

- All four approved source heads are ancestors of final target history, all original commits exist, pristine import trees match, and target initial history survives.
- Sources remain unchanged and are still the only production deployment owners.
- Root frozen install, Turbo graph and all required local validation pass (or session stops as blocked with exact evidence).
- No production Actions activated, no AWS mutations, no source history rewrite, no committed secrets/generated outputs.
- If approved to publish, use a regular push/history-preserving merge only, then fresh-clone the target and repeat history/frozen-install verification. Otherwise explicitly record LOCAL ONLY and the commits plan 2 must publish after approval.

Write `docs/migration/01-history-and-turborepo-handoff.md`: completion/blocker status, source/import/final SHAs, tree/ancestry evidence, dependency/toolchain decisions, task names, Docker assumptions, infra integration, source freshness check, commands/results, publication status, and next steps. Maintain `docs/migration/source-imports.json`. Copy a redacted summary to `/tmp/websites-plan-1-results.md` as a convenience, not the durable authority. Tell the user phase 2 is next; do not begin it implicitly.

## References

- https://turborepo.com/docs/getting-started/add-to-existing-repository
- https://turborepo.com/docs/crafting-your-repository/structuring-a-repository
- https://turborepo.com/docs/crafting-your-repository/using-environment-variables
- https://bun.com/docs/pm/workspaces
- `git subtree --help` and `git bundle --help` from the installed Git distribution
