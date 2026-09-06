# Phase 3 release foundation — offline, not a production authority

The user adopted the complete offline block in `03-fresh-session.md` by answering
**Execute offline scope**. Foundation authoring and forward scoped local commits are
permitted; publication, hosted execution, live inventory and every production gate are
not. Production order remains Paul, DiLoreto, Carolyn, Sarabeth. All sites are unmigrated.

## Implemented boundary

`config/release-policy.json` and `scripts/ci/release-contract.mjs` are **pure offline
contracts**, not a provenance oracle, GitHub/AWS client, deploy workflow, lock manager or
state store. No new workflow is active at this checkpoint. All five phase-2 workflows
remain unprivileged and their security tests remain unchanged. All manual and automatic
flags are false. Missing identity/configuration fails closed even if an enable flag is
set. Account/region/environment/group mappings are plan baselines, not live inventory.
Actual repository/owner/workflow IDs, subjects, role ARNs and app IDs remain null; historical
phase-2 repository observations are deliberately not promoted into release configuration.

Later adapters MUST obtain trusted, attempt-specific run/job observations independently
of downloaded metadata, PR output, selected-ref scripts or caller-supplied success flags.
A receipt or Boolean produced here is NOT production proof or a transferable capability.
Protected review of shared workflow/tooling/IaC, approved environment restrictions and
single-writer ownership are prerequisites, not replaced by path filters or these checks.

## Authorization and compatible provenance

- `checkReleaseAuthorization(policy, site, mode, context)` checks explicit automatic or
  manual enablement, exact repository/name/immutable owner+repo ID, originating repository,
  workflow path+ID, main event ref, event kind, workflow SHA, run/build attempt, site,
  account/region, environment, role, app, exact observed OIDC subject and audience.
  It is a pre-credential contract; an environment declaration is not the gate. The AWS
  adapter must additionally use the pinned credentials action account allowlist and
  explicit STS equality before any mutation. No JWT logging or credentials in fixtures.
- `validateReleaseEvidence` compares an externally selected immutable commit/run/attempt
  to trusted observation: same site selected and successful, root successful, completed,
  exact checkout, workflow and event identities, and local main ancestry. An unrelated
  site's failure does not disqualify successful site/root validation. An observation of
  a different attempt at the SAME SHA is rejected; do not query only the latest run attempt.
- Main push CI requires event head = checkout = workflow SHA. PR source heads and synthetic
  merge checkouts are rejected, even if later ancestral to main. A generic manual `ci.yml`
  success never becomes release evidence. Original and normalized SHA correspondence is
  never build attestation. An adapter must authenticate the immutable main snapshot, not
  allow a metadata-supplied SHA to define its own trusted history.
- New receipt namespace: `{schemaVersion:1, kind:"website-release-validation", repository,
  repositoryId, ownerId, site, commit, workflow, workflowId, workflowSha, eventHeadSha,
  event, ref, runId, runAttempt, releaseAuthorized:false}`. This is NOT a new interpretation
  of `config/ci-artifact.schema.json`. It keeps validation provenance separate from later
  approval and release-state records.
- `bindCiArtifact` returns a separate `website-release-artifact-binding` containing the
  receipt and unchanged v1 metadata. It enforces exact identity, deterministic name/root
  and checksum syntax. The existing trusted `artifact.py verify` must ALSO verify actual
  ZIP bytes/sidecar/embedded marker against independently selected expectations. This
  function alone does not verify bytes. V1's workflow remains `.github/workflows/ci.yml`
  and `releaseAuthorized=false`; no downloaded or historical marker may be changed.
- Recovery has its OWN provenance identity `.github/workflows/release-site.yml`, never
  spoofed as `ci.yml`. Recovery cannot use `bindCiArtifact` on a relabeled v1 artifact.
  Per-site ports must implement and test a distinct recovery artifact writer/verifier
  before static recovery is runnable. SSR recovery validates fixtures but releases only
  separate repository-connected production builds with exact source/bundle/job attestation.

## Scope, progression and recovery

`planRelease` requires initialized per-site state with schema version, repository, site
and a full monorepo `highWatermark`. Missing state stops for approved bootstrap/recovery
capture; absence is not permission to call a first release safe. Legacy markers are NOT
normalized into this field. Production bootstrap needs separately reviewed migration
state backed by retained known-good recovery evidence.

Under the same app-specific non-canceling critical section, an adapter must read fresh
main and durable state, validate provenance, then call this planner:

1. Candidate and high-watermark must both be ancestors of the immutable trusted main.
2. Same watermark is already released. Earlier/divergent candidates cannot lower it,
   including delayed retries or identical app bytes from a different later main SHA.
3. Reuse the actual `releaseInputsDiffer(cwd, shortSite, candidate, main)` comparator.
   Sarabeth A remains eligible after unrelated Paul B. Relevant Sarabeth C or root/shared
   changes require fresh successful replacement validation; failed C never permits A
   as fallback. Operational docs are not excluded from release comparisons.
4. Never substitute main for the tested checkout. Pending/canceled/skipped work is not
   validated. A candidate eligible at one snapshot must be rechecked when it gains the
   lock and immediately before its first mutation. Keep lock through source-ref CAS,
   start/wait, smoke, rollback/cleanup and successful state persistence.
5. Persist/query state atomically with expected prior version/marker under that lock.
   Advance high-watermark only after verified success. On ambiguous job or persistence
   failure, stop and reconcile real serving/job state; do not certify success or blindly
   retry. Intentional site rollback restores retained bytes/source through its separate
   approval path but NEVER lowers the routine high-watermark. Retain original restored
   release identity independently. The planner does not perform persistence or rollback.

`planRecovery` is the contract for explicit `release-site(site, ref=main)`: trusted main
workflow_dispatch only, fixed four-site allowlist, resolve main ONCE, record immutable SHA
and current dispatch run/attempt/workflow SHA, and freshly validate that selected site
regardless of last-push diff. `validateReleaseEvidence` requires this exact invocation,
not a successful older run/attempt or cached fixture output. If relevant inputs advance
while validation runs, the locked planner defers again and requires another fresh recovery.
No automatic retry is enabled. Dispatch YAML and trusted API/persistence adapters are
**not implemented in this foundation** and must be wired/tested in the per-site milestone.

GitHub concurrency is not FIFO. `recoveryNotice` validates a site-specific work inventory,
reports failed/canceled/skipped/pending/running identities and returns exact
`release-site(site=<site>, ref=main)` recovery action. Later workflows must publish this
summary/alert and obtain complete attempt-specific work observations, including replaced
pending work; do not assume a job always runs to emit its own cancellation notice. This
pure helper is not an automatic inventory collector or guarantee of hosted queue behavior.
Deploy AND rollback groups: `portfolio-production`, `diloreto-production`,
`carolyn-production`, `sarabeth-production`. No queue syntax change is introduced.

## Parity seams for next milestone

- Paul: same verified bytes candidate -> hosting/browser/Lighthouse -> production;
  retained private S3 ZIP/hash/metadata; terminal-job cleanup and automatic/manual rollback.
  Implement allowlisted legacy `soodoh/portfolio-website` + `.github/workflows/deploy.yml`
  reader separately; preserve old run/attempt/SHA and `releases/<run>/<attempt>` objects.
  Capture CURRENT legacy bytes and candidate legacy/new restore evidence under later access
  approval. A missing marker/store cannot silently discard old rollback continuity.
- DiLoreto: trusted workflow-SHA harness checkout at `verification-harness`, frozen install
  at its workspace ROOT, scripts under `apps/diloreto`, selected-ref code uncredentialed.
  Preserve exact ZIP, origin+edge body/assets/cache/security/404 and browser assertions.
- Carolyn and Sarabeth: distinct WEB_COMPUTE repository builds, real dedicated monorepo
  refs, exact checkout/bundle/job SHA, SSM/auth cleanup and fixture-only IPv4 workaround.
  Carolyn ref promotion and deploy must be one lock. Sarabeth old main branch/domain/SSM
  legacy identity stays recovery evidence, not a mapped monorepo release ref.
- Keep original timeouts, reports/retention, domain/Netlify recovery and owning-IaC identities.
  Do not remove inert security assertions before active root parity exists.

## Reading and local evidence

Baseline `4a947b3fd724ddfde7e633342095d41aefcbd6d6`; starting status exactly three tracked
modifications (`AGENTS.md`, phase-2 handoff, ci-parity) and five untracked phase-3/acceptance
preparation docs named in the launch block. All eight read before staging. Root/all four
app AGENTS, every required plan/handoff/inventory/history decision/proof were read in full.
Both maps were completely parsed and checked for bijection: 1,109 normalization pairs,
152 Portfolio redaction pairs. Normalization SHA-256:
`d7ffd0daacd01c4220e5de4f790510a174082e1d90fc76beb4a904ea91490c7b`;
Portfolio map: `fc3486c05deef2d38a274eb200cb3aa91fe90e9ea14d674225ffbd625ddef1bc`.
All normalized imported heads/import commits and normalized initial are local HEAD ancestors;
all pristine import-prefix tree IDs match `source-imports.json`. No refs/history were changed
for these checks, no source worktree or remote was queried.

Six originals extracted with `git show <normalized importCommit>:<targetPrefix>/.github/workflows/<file>`
and read completely in private scratch `/private/tmp/websites-phase3-foundation.dOqX7k/`:
`sarabeth-ci.yaml` (259 lines), `sarabeth-infrastructure.yaml` (287), `paul-deploy.yml`
(389), `paul-rollback.yml` (172), `carolyn-visual-tests.yml` (300), `diloreto-deploy.yml`
(321). `read-inventory.txt` records exact Git object paths. Durable object paths are also
in `ci-parity.md`; scratch is convenience evidence, not a recovery store.

Read current root scope/gate/artifact helpers/tests/schema/workflows/tool setup, root/app
manifests/toolchain/Turbo, all four Dockerfiles/wrappers, Paul deploy/download/verify/hosting
helpers, Sarabeth source/bundle/provenance/smoke/wait/stack helpers and source/domain/provider/
redirect/email-infrastructure security tests, Carolyn deployment security tests and build/
auth cleanup scripts, and DiLoreto deployment browser assertions. No production script ran.

Targeted tests are `scripts/ci/release-contract.test.mjs`; included automatically in
`bun run test:ci`. Fixture Git repositories only; no credentials or network needed.
No install occurred in the existing worktree. Full app/build/browser chains are deferred
until per-site ports and an exact committed independent TARGET checkout; no full validation
claim attaches to this dirty foundation checkpoint. Independent review is still required.

## Public sources — parent fetched all seven; no live account observations

- https://docs.github.com/en/actions/reference/security/oidc
- https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
  — Environment jobs use environment subjects, not simultaneous branch subjects. New
  repositories after July 15, 2026 may use immutable OWNER@ID/REPO@ID defaults. Exact target
  subjects remain unknown: no guessed textual subject, wildcard or sample identity copied.
- https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
  — Referencing a nonexistent environment auto-creates it without protection. Fail closed
  BEFORE credential jobs; naming an environment is not authorization or activation control.
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
  — Default single-pending queue replaces pending work. Optional queue:max up to 100 is
  documented, but ordering is waiting-time, not dispatch order. Not adopted to bypass
  recovery requirements or pinned actionlint compatibility.
- https://docs.aws.amazon.com/amplify/latest/userguide/monorepo-configuration.html
  — Repository amplify.yml overrides console; appRoot matches AMPLIFY_MONOREPO_APP_ROOT;
  buildPath / makes artifact baseDirectory root-relative. Generic pnpm hoisting guidance
  is NOT authority to change accepted Bun isolated linking.
- https://docs.aws.amazon.com/amplify/latest/userguide/manual-deploys.html
  — Manual SSR deployment unsupported. Preserve separate repository-connected SSR flows.
- https://github.com/aws-actions/configure-aws-credentials
  — Documents allowed-account-ids, unset-current-credentials and job OIDC. Keep existing
  cbe3b392738ccf3f987d68400dafcf4b0624a56c pin; before wiring, confirm its exact action.yml
  supports intended options through public pinned reference only. No dependency upgrade.
