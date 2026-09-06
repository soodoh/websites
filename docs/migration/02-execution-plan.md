# Plan 2 — Scope-aware Turborepo CI, without production access

## Execution contract (fresh session)

When explicitly asked to execute phase 2, implement LOCAL CI code and tests in `/Users/pauldiloreto/Projects/websites/main/` for `git@github.com:soodoh/websites.git`. Editing or reading this plan alone does not start execution. Read this entire plan, root/app `AGENTS.md`, and these durable records before changing code:

- `docs/migration/01-history-and-turborepo-handoff.md` — current phase-1 acceptance and stopping boundary.
- `docs/migration/source-imports.json` — original versus normalized identities and current paths.
- `docs/migration/history-normalization-decision.md`, its commit map and verification JSON.
- `docs/migration/normalized-validation-evidence.json`, `final-runtime-review.md`, and `final-history-review.md`.
- `docs/migration/workspace-dependency-decisions.md` and `ci-parity.md` if already present.

Read `/private/tmp/websites-plan-3-production-cutover.md` only for the interface this phase must expose, not as authorization to execute phase 3. `docs/migration/01-execution-plan-original.md` is historical context: its original-ID/no-rewrite/regular-push assumptions were explicitly superseded by the approved normalization. Current handoffs and authorization records take precedence. If a required handoff is absent or the checkout differs unexpectedly, stop and reconcile; never redo imports, reset the worktree or repeat normalization blindly.

### Accepted phase-1 baseline — revalidate, do not reset to it

Phase 1 is complete locally at `b08ca2c3b4599653ff15be73baabb8815a6699fd`. Full fresh uncached CI and both independent reviews passed at `cb7a15fb23b810285f51432de7efeec05e115a3f`; the final commit only records migration evidence. CI passed 4/4 tasks with 24 workspace contracts / 391 assertions; all 1,111 final-main messages passed scoped commitlint with six intentionally preserved legacy footer-spacing warnings. These are local results, not GitHub-run acceptance of phase 2.

| CI/site key | Current directory | Existing package/Turbo filter |
| --- | --- | --- |
| `sarabeth` | `apps/sarabeth` | `sarabeth-studio` |
| `carolyn` | `apps/carolyn` | `carolyn-portfolio` |
| `paul` | `apps/paul` | `portfolio-website` |
| `diloreto` | `apps/diloreto` | `diloreto-website` |

Use these four short keys in detector outputs and explicitly map them to package filters. Do not rename package names, source repositories, existing cloud resources or legacy release identities as a side effect. Root entry points are `bun run verify:carolyn`, `verify:paul`, `verify:diloreto`, `verify:sarabeth`, `test:workspace` and `ci:verify`.

The accepted toolchain is Bun **1.4.0**, Node **24.20.0**, Turbo **2.10.12**, one root isolated-linker `bun.lock`, and Playwright **1.62.1** with recorded canonical images/architectures. The installed six-root dependency/peer graph matched the post-rename baseline exactly. Do not re-resolve/upgrade dependencies or update screenshots to make CI green. New commits require an approved scope: `carolyn`, `paul`, `diloreto`, `sarabeth`, `repo`, `ci`, or `deps`.

All 1,109 pre-normalization main ancestors were retained under a verified SHA map; trees, authors/dates, bodies and mapped parent topology were preserved. Portfolio credential redaction preceded this message rewrite. The original published initial commit `5b236ef3a519759c84ebd3504809d391baf085ea` maps to `2e6fb629522ff1ced21533bd572aff874bd2db90`. Do not require original source IDs to be current-main ancestors, restore the old initial commit into main, or remove normalized parents. Preserve the resulting history and private original backups; no further rewrite is authorized by this plan.

At phase-1 completion nothing was pushed: local `origin/main` still recorded the original initial commit, and ordinary fast-forward publication was impossible. Before any publication, read the live remote ref without mutating it, present an exact non-fast-forward publication strategy and expected remote SHA, preserve recovery evidence, and obtain separate explicit approval. This plan grants neither a push nor a force-push. Never falsify `origin/main`, merge old history back merely to avoid this gate, or overwrite newer remote work.

Sources remain `/Users/pauldiloreto/Projects/{sarabeth-studio,portfolio-website,carolyn-portfolio,diloreto-website}/main`; keep their worktrees/config/refs/hooks/settings untouched, and never install/test in them. Target remains an existing linked worktree; do not reinitialize or replace its `.git` file.

When phase-2 implementation is explicitly authorized, reconcile phase-1-only instructions to allow LOCAL unprivileged root CI workflow authoring; preserve all other safety boundaries. Do NOT grant AWS trust, use production credentials, deploy, enable Amplify auto-builds, modify source pipelines or archive repositories. GitHub publication, workflow execution and required-check/settings changes need separate approval. Source pipelines remain sole production owners. No deployment entry point may accidentally become executable on publication.

## Intended result

```text
.github/workflows/ci.yml                 # always starts on relevant PR/main events
.github/workflows/_sarabeth-ci.yml       # workflow_call, no cloud privileges
.github/workflows/_carolyn-ci.yml
.github/workflows/_paul-ci.yml
.github/workflows/_diloreto-ci.yml
scripts/ci/affected.*                   # tested impact calculation
config/ci-scopes.*                      # central scope -> files/tasks mapping
```

Names may vary if justified in the handoff. Original app-local workflow files can remain inert reference material until phase 3 ports deployment behavior; do not treat them as active workflows. Emit one stable `CI gate` required check and app-specific results. A change in one app should not run three unrelated browser suites. A shared/root lockfile change deliberately runs all four initially.

## 1. Revalidate and inventory exact workflow parity

- Verify clean/understood target state, accepted checkpoint ancestry, every source's normalized `importedSha`, and `target.normalizedStartingSha` ancestry. Verify pristine trees at `importCommit:targetPrefix`; use `currentPrefix` for current files. Preserve normalized import/implementation parents; no squash/rebase/rewrite.
- Recheck old repos' live main SHAs read-only against original `approvedSha`/recorded live-source identities, NOT normalized `importedSha`. Fetch any needed objects only into disposable storage. If development continued, report drift and stop for a separately approved mapping-aware catch-up strategy. A naive subtree pull/merge of original history can duplicate ancestors, restore unscoped commits or reintroduce redacted credentials. Any approved catch-up must preserve all new source ancestry under documented mappings, retain existing normalized parents, maintain credential redaction and scoped messages, reapply workspace adaptations, and rerun relevant validation. Do not silently cherry-pick, repeat global normalization, or mutate sources.
- Read current package.json, bun.lock, turbo.json, scripts, Dockerfiles and handoffs. Use the accepted pins and root lock, not legacy workflow pins or old app lockfiles.
- Read the six original workflows using normalized `importCommit` plus historical `targetPrefix` from `source-imports.json`: Sarabeth `.github/workflows/{ci.yaml,infrastructure.yaml}`, Paul/Portfolio `.github/workflows/{deploy.yml,rollback.yml}`, Carolyn `.github/workflows/visual-tests.yml`, DiLoreto `.github/workflows/deploy.yml`. Original evidence SHAs are historical; resolve them through `history-normalization-commit-map.txt`. Portfolio source-original navigation first uses `portfolio-commit-map.txt`, then the normalization map.
- Write `docs/migration/ci-parity.md` mapping EVERY old job/step to new CI coverage or an explicit phase-3 deployment/infrastructure/rollback responsibility. Include post-deploy checks and retention policy rather than dropping them just because they cannot run in this phase.

Required validation coverage:

| App | Must preserve |
| --- | --- |
| Sarabeth | actionlint, cfn-lint, lint/types, production-provider graph, deterministic Amplify fixture bundle prepare/validation, deterministic Playwright target, shell deployment-helper tests, containerized Playwright, diagnostics |
| Carolyn | full validation including unit/auth/artifact/prerender checks in fixture and hermetic production modes; infra types/unit tests/offline synth; production-shaped visual suite; diagnostics |
| Paul (Portfolio) | lint/types, ShellCheck/bash syntax, actionlint/cfn-lint, static build/output assertions, functional/visual Playwright, local Lighthouse, deterministic zip/checksum/release metadata/report upload |
| DiLoreto | lint/types, cfn-lint, static build/output assertions, containerized Playwright, validated zip/report upload; retain genealogy tests in the consolidated verification chain |

Centralize cheap root actionlint/shell tests if useful. No live production browser tests, CMS token retrieval, SSM calls, CDK deploy or Amplify jobs in untrusted CI. Preserve current screenshot platform/version guarantees from phase 1.

Carry forward the verified compatibility seams: Carolyn IPv4-first DNS stays confined to fixture/hermetic build commands; Sarabeth Gitless runs must receive the exact checked-out 40-hex `RELEASE_COMMIT` at runtime via the supported wrapper. Empty/malformed explicit values must fail; no fake/cached SHA and no copying `.git` into images. Assert the actual successful container's deployment manifest equals the tested checkout SHA. Preserve Docker diagnostic-copy failure handling and original exit status. Resolve the known inert DiLoreto legacy `deploy.yml` SC2329/actionlint diagnostic when porting that workflow; do not weaken its existing assertions.

For local Docker validation, recheck capacity first: at phase-1 completion Colima's separate 100 GiB `/dev/vdb1` had about 6.7 GiB free despite ample host disk. Run one app/image at a time. Do not prune or delete old images/volumes, resize/restart the daemon, or stop unrelated containers without approval. Only proven invocation-created images may be removed after use with fresh container-reference checks and `docker image rm --no-prune` without force; existing invocation-owned ephemeral-container cleanup traps may remain. Do not reuse earlier runs' cleanup IDs.

## 2. Implement a fail-safe scope detector

Use one small, unit-tested detector and checked-in scope configuration shared later by CI and deployment freshness. Prefer a full local Git diff with explicit event refs over relying exclusively on native `paths` filters or an API's truncated file listing. Pin third-party actions by reviewed immutable SHA if one is used.

Scope policy at launch:

- `apps/{sarabeth,carolyn,paul,diloreto}/**` affects the corresponding short-key app, including scripts/configs/Docker fixtures/infrastructure and nested legacy workflow contracts. Do not use old import-directory prefixes as current scope rules.
- Root bun.lock, package.json, turbo configuration, toolchain pins, shared Docker/tooling, scope detector/config and root CI orchestration affect all four.
- Each app-specific reusable CI workflow affects that app. Root shared workflow/action changes affect all consumers. Default unknown executable/build-affecting root changes to ALL, not none.
- Initially map `packages/**` to all apps until there are explicit workspace dependency relationships and tests proving narrower transitive impact.
- Operational root docs may skip app suites only via an explicit safe allowlist. Do not assume all Markdown/images are docs: apps contain rendered content/assets and tests that read docs/configs.
- Infra-only changes validate relevant IaC and related contracts. Do not automatically apply infra; deployment policy is separately decided in phase 3.

Diff semantics and boundaries:

- PR: merge-base of the event's pinned base SHA and head SHA to head (three-dot meaning). Validate the PR merge commit as appropriate, but do not accidentally calculate impact using a moving branch tip.
- Push to existing main: event `before` to `after` (entire pushed range, not merely HEAD~1).
- First push/all-zero base, non-ancestor before/after (including approved rewritten-history publication), no PR merge-base, missing base, insufficient history, diff error, unknown event or detector ambiguity: explicitly run all or fail; NEVER silently return no changes. Force a full baseline on initial monorepo publication.
- Detect both old and new paths for rename/copy/move across app boundaries. Use safe NUL-delimited parsing or disable rename collapsing and treat moves as delete+add. Handle deletions, spaces and unusual filenames.
- Add force-all/manual CI dispatch for initial baseline and troubleshooting. This dispatch is validation only, not release authority.
- If merge queue is used, add `merge_group` and test its diff semantics; otherwise document it as disabled/unconfigured rather than claiming support.
- Validate job outputs against the fixed four-app allowlist. Do not interpolate branch names/file paths/PR text into shell source. Checkout sufficient history; fail safely if large changes cannot be inspected. Test full-history behavior after unrelated-history imports.

Native GitHub path filters may remain a convenience for non-required auxiliary workflows, but do NOT put path filters on the only required CI gate. Skipped required workflows can remain Pending and block merges.

## 3. Orchestrate reusable workflows and a stable gate

1. `ci.yml` starts for PRs targeting main, pushes to main and explicit CI dispatch. An unprivileged change-detection job emits a Boolean per app plus machine-readable evidence/base/head SHAs. Root validation always runs as needed.
2. Conditional `workflow_call` jobs invoke each app's validation DAG. Retain separate runners/architectures: Sarabeth/Carolyn visual checks require ARM64 where currently enforced. Others retain their canonical setup. Avoid a generic matrix that hides real differences or cancels one app when another fails.
3. Root install uses `bun install --frozen-lockfile` and phase-1 pins. Explicitly use root cwd for installs/Turbo, app cwd for app scripts. `defaults.run.working-directory` does NOT rewrite `uses` inputs: prefix setup-node files, upload/download paths, config paths, Docker context and nested checkouts explicitly.
4. Use phase-1 serial per-app verification tasks or preserve explicit steps for diagnostics. Do not parallelize tasks that mutate the same .output/dist/.amplify-hosting tree. Different app workflows can run concurrently on isolated runners.
5. Final `CI gate` uses `if: always()` and depends on detection/root validation/all four app jobs. Require success for every affected app and root check; accept skipped ONLY when detector explicitly marked that app unaffected. Detection failures, cancellations or unexpected skips fail the gate. Do not write a gate that always succeeds or accepts a skipped selected job.
6. Avoid workflow-wide cancel-on-new-main concurrency: an unrelated newer commit must not cancel an app's only verification and strand its release. Cancellation may be PR-specific; main CI should complete until app-aware replacement/reconciliation is implemented. Do not share old `amplify-production` groups across apps.
7. Minimum permissions: contents read, plus only narrowly justified PR metadata read. No `id-token: write`, production environment, contents write, AWS credential step or privileged `pull_request_target` checkout. Untrusted fork CI must stay unprivileged.
8. Pin Actions and browser/tool dependencies. Keep remote Turbo cache OFF initially. Do not cache AWS credentials or secret-derived build output; do not restore writable caches from untrusted PRs into privileged release jobs later.

## 4. Artifact contract for phase 3

- Give every report/zip artifact a unique app/run/attempt name. Preserve original retention durations where applicable; Portfolio verified releases currently have 90-day GitHub retention and durable S3 retention in production. DiLoreto zip retention is short (1 day): document how an expired artifact is rebuilt/revalidated, never deploy an arbitrary replacement silently.
- For static sites, package the exact output already validated. Zip root is dist/client CONTENTS, never an extra dist/client/app parent directory. Preserve deterministic Portfolio packaging and SHA-256 verification.
- Define versioned metadata containing at least repository identity, site/app, source commit, workflow identity, run ID, build attempt, artifact checksum and artifact name. Keep manifest checksum separate if circular. Record the build attempt, not a later deployment rerun's attempt.
- Embed source/site/repository/release identity in the static release marker consistently with acceptance tests. Adding fields must not weaken previous checks. Avoid exposing any secret/environment payload.
- PR artifacts are NOT release-authorized. Production must later verify trusted `soodoh/websites` main-push or explicit approved release workflow provenance, expected site, SHA and selected attempt. A successful generic manual CI dispatch must not implicitly grant deployment permission.
- SSR CI builds are hermetic fixtures, NOT production artifacts. Label them accordingly; do not upload them as deployable releases. Sarabeth/Carolyn continue repository-connected production builds in phase 3.
- Upload diagnostics on failure/always as appropriate, even if earlier steps fail. Scan allowed files so auth manifests/SSM values/node_modules/env files cannot leak into artifacts.

## 5. Tests and CI acceptance

Add automated scope/gate/workflow tests, not just a YAML example. Cover at minimum:

1. Each app individually; two apps together; all apps via lockfile/shared config; allowed root-docs-only change.
2. Multi-commit pushes and merge commits; PR base/head differences; initial push; non-ancestor rewritten-history publication; no merge-base; missing history/diff error.
3. Rename from Sarabeth to Carolyn; deleted last file; filenames with spaces; a large diff beyond provider filtering limits.
4. Root detector/shared workflow changes run all; per-app workflow changes run that app; future shared-package dependencies cannot be silently skipped.
5. Unaffected suites skipped plus green gate; selected suite failure/cancellation/unexpected skip fails gate; detector failure fails gate.
6. Unrelated later main commit does not cancel a selected earlier app run. PR cancellation does not accidentally cancel main work.
7. Spoofed artifact site/repository/SHA/attempt is rejected by verification helpers. Fork PR cannot obtain AWS credentials or deploy.
8. All workflow files pass actionlint; shell and scope scripts pass syntax/unit tests. Check paths that use GITHUB_WORKSPACE and the separate DiLoreto verification-harness checkout expected in phase 3.

Sarabeth and Carolyn have tests that read `.github/workflows/...` and assert exact old paths/strings. Distinguish inert legacy deployment contract tests from new active CI tests. Update active CI tests to read root workflow files through robust repository-relative paths. Preserve deployment security assertions for phase 3; do not delete them just to get a green run. Record any temporarily legacy-only contract explicitly.

Only after separate approval of the exact publication strategy described above, publish the normalized history without discarding its mapped import parents. Recheck the live remote SHA immediately before the approved operation; stop if it differs from the reviewed value. Do not assume an ordinary push/history-preserving merge can publish this rewritten initial history. After approved publication, verify the remote head and a fresh clone, imported normalized ancestry, scoped messages and frozen install; exercise full baseline CI plus approved safe branches/PRs for app-only/shared/docs-only changes. Do not leave fixture changes on main. Record actual run URLs and selected-app results: local dry-runs are not GitHub runner acceptance. Ask separately before branch protection/ruleset changes; if approved, require only stable `CI gate` initially and preserve existing protections. Without publication/execution/settings approval, report local implementation/validation separately and mark external acceptance pending.

## 6. Handoff and stop boundary

Acceptance: authorized normalized phase-1 history invariants still hold; all four CI paths pass on correct GitHub runners after approved publication/execution; expected short-key scopes are selected; no required-check deadlock; static artifact provenance/checksums are tested; original quality/deployment responsibilities are fully mapped; production cannot be invoked from the new repo; old pipelines remain untouched. Local-only success does not satisfy external acceptance.

Preserve this reconciled plan as a durable phase-2 planning record when implementation is authorized. Write `docs/migration/02-scoped-ci-handoff.md` and update `ci-parity.md`. Include final commit, local versus GitHub acceptance, publication approval/remote and fresh-clone checks, run URLs/results, scope rules, short-key/package mapping, detector command/schema/base semantics, workflow/task names, artifact schema paths, branch protection status, toolchain/platform details, source drift and any separately approved mapping-aware catch-up, blocked tests, deployment freshness interface and explicit production-disabled evidence. Copy a redacted convenience summary to `/private/tmp/websites-plan-2-results.md`.

For phase 3 expose a tested function/command that computes whether ANY app release input differs between two immutable commits, including root lock/tooling and shared transitive inputs. CI's optional docs-only exclusions must not accidentally exclude release inputs. Do not implement the global rule 'tested SHA must equal latest main SHA'. Phase 3 will supply scope-aware release ordering and recovery.

Stop after the phase-2 handoff. Do not proceed to AWS, production cutover or archival. Phase 3 is next only after phase-2 acceptance and separate execution authorization.

## References

- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows
- https://turborepo.com/docs/crafting-your-repository/constructing-ci
- https://turborepo.com/docs/reference/run
