# Paul publication → protected observation — local DRAFT

**PLAN DECISION ONLY. Every future execution stage below is NOT APPROVED.**
Accepting this document does not authorize staging, commits, publication, account reads,
enablement, dispatch, protected approval/token minting, readback or disablement.

## Current state and next choice

- Local main/HEAD: `839e7b895c8badf4a2e81597fdeebbd1e6447945`; intentionally dirty, index empty.
  Production **0/4, legacy-owned**. No remote state was refreshed for this packet.
- M1, inert M2 and the checkout-child committer fixture repair are locally accepted.
  Workflow `7c0325df-16b2-450b-bcca-aceb6bfe11c2`, writer `b162058c`, fresh reviewer
  `a2d23df3`: No issues. Normal CI63 Bun/991 assertions +6 CI Python +68 release Python;
  workspace30/433; lint passed; selector939.83ms at unchanged5000ms. These are retained
  results, not tests run here. Approved local Python3.14.7 differs from untested hosted3.14.6.
- Observer `observe.if` is literal false. Runtime publication lock true; release/manual/
  automatic/transition flags closed; Paul subject/candidate/state remain null.
- **Recommend next:** approve narrowly scoped local assembly, exact intended-tree normal
  validation and independent review of the inert Paul-only batch below. Then decide exact
  commits/publication separately. Do not reopen accepted fixture diagnosis or run gates now.
- Publish inert preparation first; author/review the materially different observer predicate
  separately afterward. Freshness → one dispatch → pending-job binding → explicit protected
  approval (permits minting) → sanitized readback → separately approved disablement follow.
  Unknown final SHA/run is a later binding, not permission to execute against a placeholder.

## Exact proposed publication boundary and ordering

Paths below are relative to this repository. No whole-worktree staging, stash/reset, source
repository change, history rewrite, force push or implicit direct-main exception. Preserve
normalized graph. Final commits, proposed branch/PR/merge method and remote main reconciliation
are **unfilled**; PR #7/main839e7b89 are historical evidence, not new publication authority.

| Order / proposed scoped subject | Include exactly | Coupling / exclusion |
| --- | --- | --- |
| 1 `fix(ci): provide fixture checkout committer identity` | `scripts/ci/carolyn-selector.test.mjs`, only line78 checkout options hunk | Inherit environment plus synthetic committer name/email; retain five assertions and5000ms. |
| 2 `chore(paul): bind disabled release metadata` | `config/release-policy.json`, `config/release-runtime.json`, `scripts/ci/release-contract.test.mjs`, `scripts/release/configuration_test.py` | All current four-path M1 deltas together:13 strings, exact binding/denial assertions and configuration tests; no flags/unknowns change. |
| 3 `feat(paul): add inert protected identity observer` | New `.github/workflows/paul-identity-observation.yml`, `scripts/release/paul_identity_observation.py`, `scripts/release/paul_identity_observation_test.py`; ONLY M2 hunks in `scripts/ci/release-workflows.test.mjs` | Shared test: add `observationFiles`, its enumeration spread, and complete `Paul identity observation is exactly inert protected manual observation, not release authority` test (current lines9–87); exclude Retain block. Workflow/helper/tests must arrive together. |
| 4 `docs(paul): record publication and observation approval gates` | Only `docs/migration/paul-publication-observation-packet.md`, after independent document review | This DRAFT remains a plan; later receipts need separately reviewed edits, never invented SHA/run evidence. |

This is the smallest recommended **Paul-only** publication batch. All four commit trees and
final combined intended publication tree need their applicable validation/review before
publication approval; do not publish an intermediate tree with missing paired tests/source.
Root Lefthook runs `bun run lint` on pre-commit and commitlint on commit-msg; approve the
actual hook/validation location and invocations separately, not a silent hook bypass or
existing-worktree install. Use root pins and independent TARGET rules from AGENTS.md.
Future normal gates: root frozen install if needed, serial `bun run test:ci`,
`bun run test:workspace`, `bash scripts/ci/lint.sh`, and required affected/hosted CI per
reviewed publication scope. No new full-app or hosted-tested SHA is claimed here.

**Shared Retain/M2 hunk accounting:** current shared test is HEAD + pre-existing22-line
Retain insertion + M2. Retain test is the entire `shared GitHub provider retains its lifecycle
without changing identity or trust inputs` block (current lines245–264, surrounding inserted
blank lines included), between owning-IaC and Carolyn candidate tests. Never stage that test
without the two required lifecycle attributes in the DiLoreto template. The M2 incremental
patch `/private/tmp/websites-paul-identity.OMnHdK/incremental-m2.patch`, SHA256
`e00d9e5240ef1dca9c8dcb3d239bced49c5eb0f007a0e07c7d35d20d10173f02`, is relative to
**pre-M2 dirty bytes**, not HEAD; it is evidence, not a blindly applicable staging recipe.
Removing Retain from the intended Paul tree changes accepted shared-test bytes. Filtered,
recombined, committed and later documentation bytes are NOT the accepted dirty snapshot.
Require fresh exact intended-tree validation and independent review; do not reuse the
combined-file hash recorded here as evidence of a Paul-only committed file.

**Hold, preserve, do not bundle:**
- `apps/diloreto/infrastructure/amplify-hosting.yml`: only current additions are
  `GitHubOidcProvider.DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain`.
- `apps/diloreto/docs/amplify-hosting.md`: Full decommission replacement/retention paragraph;
  and the22-line shared-test Retain insertion above. Later recommend one separately reviewed
  `fix(diloreto): retain shared GitHub provider lifecycle` source/test/docs commit, never
  test-only or template-only publication. Its ownership-document link must be resolved by a
  separately reviewed website-only documentation selection, not bundling home-lab drafts.
- All existing dirty `docs/migration/` files: `03-production-cutover-handoff.md`,
  `production-inventory.md`, `site-release-ports.md`, `03-websites-completion.md`,
  `paul-activation-proposal.md`, `paul-aws-inventory.md`, `paul-github-inventory.md`,
  `paul-identity-implementation-checkpoint.md`, `paul-identity-observation-proposal.md`,
  `paul-m1-checkpoint.md`, `paul-readiness-read-scope.md`, `paul-readiness-refresh.md`,
  `shared-identity-bootstrap-plan.md`, `shared-oidc-iam-plan.md`, `shared-oidc-ownership.md`.
  These are local review evidence, **not included publication paths**. Later annotations and
  mixed historical/home-lab material need separate publication review. References here name
  retained local evidence; this batch does not promise their availability on GitHub.
- `.playwright-mcp/` stays opaque/untracked; `.pi/` and `.playwright-cli/` remain opaque.
  No generated evidence, dependencies, credentials or other paths belong in this batch.

Retain **source publication is not cloud deployment**. Sole DiLoreto CloudFormation ownership
remains. Deployment needs separately approved fresh deployed Original, only those two
attributes, preserved parameters/identity, no DeploymentMode/unrelated drift reconciliation,
and independently approved change-set creation/review/execution. Not a prerequisite to observe.

## Future observer-only enablement — NOT applied or covered by inert acceptance

Propose exactly two paths: `.github/workflows/paul-identity-observation.yml` `jobs.observe.if`
and its `if` value inside the complete-object equality in `scripts/ci/release-workflows.test.mjs`.
The proposed folded YAML predicate (assert the identical single-space folded string):

```yaml
if: >-
  ${{ github.repository == 'soodoh/websites' && github.repository_id == '1358469291' &&
  github.repository_owner == 'soodoh' && github.repository_owner_id == '18269267' &&
  github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' &&
  github.run_attempt == '1' &&
  github.workflow_ref == 'soodoh/websites/.github/workflows/paul-identity-observation.yml@refs/heads/main' }}
```

Expected offline implication: unchanged whole-object assertion fails after predicate-only
edit; update that exact expected string (test title may replace `inert` with `main-only`).
No other assertion relaxation. Current inspection finds the two-path boundary sufficient:
`deployFiles` omits only the explicitly enumerated observation category; its literal-false
checks, runtime/policy locks and Python `IDENTITY`/admission/token logic stay unchanged.
No inputs, bypass flags, API workflow-enable operation, AWS paths or release mapping addition.
Existing Python tests already reject non-main/manual/attempt1 context. Review folded-string
parsing and admission with normal offline validation; any extra required change stops for
new scope, not silent expansion. Propose `feat(paul): admit protected main identity observation`.
Publish only after separate offline authoring/normal validation/independent review and exact
commit/publication approval. Bind the resulting main SHA **after it exists**, never embed a
self-referential published SHA. Enabled code is not single-use: owner/protection gates limit
execution; no second dispatch/rerun is authorized even if GitHub technically permits one.

## Future GitHub-only packet: fixed comparisons, finite reads, stop gates

All routes below are proposals, **not commands executed or standing allowances**. `R` means
`/repos/soodoh/websites`, `W` the future positive numeric observer workflow ID, `S` the exact
reviewed enabled publication/main SHA, `D` approved dispatcher login+numeric ID, `N` new run,
`J` its sole observe job, `T0/T1` owner-bound UTC dispatch window. No invented numeric IDs.

Dated expected comparisons from `paul-readiness-refresh.md` (2026-09-09): repo1358469291,
owner soodoh18269267, main839e7b895c8badf4a2e81597fdeebbd1e6447945 (old baseline, NOT S);
environment production-portfolio21361791310; exactly Branch/main59274817; required reviewer
soodoh18269267, self-review allowed, admin bypassfalse; main ruleset22398923, PR required,
strict CI gate/App15368, zero approvals, conversation resolutionfalse, deletion/non-fast-forward
prevention; OIDC use_default=true. Compare expected approved main advancement to S; any other
drift stops. Applicable rules are not a comprehensive bypass/effective-protection audit.

**Transport prerequisite before live approval:** retain existing normal native GitHub auth,
no token export/config read/login/auth fallback, one invocation/request per listed GET/POST,
20s per request, no retries, pagination following, endpoint experiments or redirects. Each
JSON response cap256KiB plus one sentinel byte; project safe fields only, discard raw bodies
in memory; no headers/request URLs/bearers/exception bodies retained. A body cap must constrain
receipt, not merely truncate printed JSON. Existing release API helpers are not qualified for
this budget and must not be invoked as collectors. Separately qualify the smallest bounded
metadata invocation/projection seam before use; no helper is authored/executed by this DRAFT.
Permission/404/size/timeout/malformed/missing-field failures stop, not alternate API guesses.
These budgets count API invocations, not native authentication/DNS/TLS traffic.

| Stage | Exact proposed operations / maximum count | Gate |
| --- | --- | --- |
| F freshness | 9 GETs: `R`; `R/git/ref/heads/main`; `R/actions/workflows?per_page=100&page=1`; `R/actions/oidc/customization/sub`; `R/environments/production-portfolio`; `R/environments/production-portfolio/deployment-branch-policies?per_page=100&page=1`; `R/rules/branches/main`; `R/rulesets/22398923`; `/user` | Repo/owner/default-main/S match; complete workflow page identifies unique expected observer path/name, active state and W; protection/environment/branch/reviewer/bypass/OIDC fields match explicit owner-approved expectations; /user matches D. Unexpected state means stop, never API-enable workflow/change settings. |
| D dispatch/discovery | 1 baseline GET and 1 post-dispatch GET: `R/actions/workflows/W/runs?branch=main&event=workflow_dispatch&per_page=100&page=1`; exactly 1 POST `R/actions/workflows/W/dispatches` body `{"ref":"main"}` | F accepted within30min; read baseline IDs immediately before recording T0; POST once, record completion T1. At one prechosen time60s later, query once. No polling/retry/second dispatch even if response lacks run ID. |
| P pending binding, BEFORE release | 4 GETs: `R/actions/runs/N/attempts/1`; `R/actions/runs/N/attempts/1/jobs?per_page=100&page=1`; `R/actions/runs/N/pending_deployments`; `R/git/ref/heads/main` | Match N/W/path/event/main/S/attempt1/actor and triggering actor D; exactly one observe J, protected waiting state and sole expected environment pending, S still main. No premature execution or approval inferred from SHA checks. |
| R terminal readback | 3 GETs once at separately chosen post-approval time: `R/actions/runs/N/attempts/1`; `R/actions/runs/N/attempts/1/jobs?per_page=100&page=1`; `R/actions/jobs/J` | Same bindings, attempt1, sole J/run match, completed success. Not completed/mismatch/failure stops; another read requires new approval, not polling. Log seam below separately bounded. |

Maximum **18 GETs +1 POST**, at most4864KiB response bodies total (19×256KiB), single pages
only. Full/linked/incomplete lists or counts exceeding page coverage stop whenever completeness
is needed. No source repo, AWS, artifacts, public production HTTP, queue inventory or drain.
F's first seven route families are supported by retained readiness observations. Attempt/job
routes are used in `scripts/release/{deploy,static,reconcile}.py`, not live-qualified by this
packet. `/user`, exact ruleset detail, dispatch response shape, pending deployments and exact
job-detail routes/fields need separate pre-execution qualification/owner confirmation; no web
research was done here. If unavailable, stop for a revised bounded packet, not fallback calls.
No new live stage is operationally ready until its transport/API assumptions are qualified.

Discovery accepts exactly one ID absent from baseline, created within [T0,T1] with documented
clock/timestamp precision bound (fill before POST), matching W/path/main/S/manual/attempt1/D.
Bind server-returned run ID even if POST provides one; it must agree with this discovery.
Zero/multiple matches, full/ambiguous window or actor mismatch stop. POST success alone is
not run identity. Metadata cannot prove the runner's workflow_sha; pending review binds the
reviewed code/S, then Python must establish workflow_sha==head SHA==actual checkout before mint.

After P, the human owner reviews **only this pending observation** at
`https://github.com/soodoh/websites/actions/runs/N` (one pending-review view; no log expansion).
Record N/J/attempt1/W/S/environment, dispatcher and reviewer identity, timestamp and decision.
**A separate explicit approval for this now-known run is required before clicking Approve.**
One normal protected-environment approval for21361791310 permits `id-token: write` and the
single token GET; it is a privileged release of the observer, not a harmless read. No admin
bypass, settings change or approval of other jobs. Self-review allowed is not independent
two-person review. Owner/UI review receipt plus metadata supplies approval provenance;
Python context equality does NOT prove that protected approval happened. If pending metadata
cannot identify J yet, stop; do not approve simply to discover the missing job identity.

## Sanitized log delivery: bounded prerequisite, not a fictional line API

Observer success emits one ASCII record prefixed `PAUL_IDENTITY_OBSERVATION `, total<=8192
bytes including newline. JSON keys exactly `claims`, `checkout_sha`, `evidence`; claims only
`iss`, `sub`, `aud`, `repository`, `repository_id`, `repository_owner`, `repository_owner_id`,
`environment`, `event_name`, `ref`, `workflow_ref`, `workflow_sha`, `sha`, `run_id`,
`run_attempt`, `iat`, `nbf`, `exp`. Evidence label is
`decoded-platform-observation-not-signature-or-federation-proof`.

GitHub log delivery is not a supported direct single-line JSON endpoint: job-log REST can
redirect to temporary download storage; run/attempt logs can be archives. Do NOT call
`R/actions/jobs/J/logs`, run/attempt `/logs`, `gh run view --log`, download archives, follow
redirects or retain signed URLs. No such calls are in the18-GET budget.

Prefer an **owner-only UI seam**: after R, one view of exact J's final named observer step;
copy only the single prefixed record into the approval receipt for agent validation, no
screenshots/full logs/other steps/raw exports. UI rendering may itself fetch extra log data:
there is no claim of an8KiB network cap or zero redirects for the browser. Before dispatch,
separately qualify/approve that exact UI delivery operation and its exposure boundary. If it
cannot isolate the step without broad download, stop for a separately reviewed bounded
extractor/transport plan (including compressed/uncompressed limits and redirect handling);
this DRAFT does not authorize or pretend to implement one. Agent receives only<=8KiB record.

Reject absent/duplicate/denied/oversized/unsafe records, extra fields, wrong identities/S/N/
attempt/checkout, malformed times or unexpected subject structure pending review. Confirm
issuer `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`, and
claim times against run observation time, not a later receipt's expiry. Never retain raw
JWT, bearer, request URL/headers, exception body or partial claims. No subject/config update,
AWS federation, signature verification or effective-protection proof follows from decoded
platform observation. Missing required platform claims fail closed; no second token request.

## Separate owner decisions — all blanks NOT APPROVED

1. Plan choice/reviewer disposition: ___ . Local assembly/validation scope, tool paths and
   hook handling: ___ . Only the four ordered inert publication commits/paths above proposed.
2. Exact reviewed local commit/tree hashes/results: ___ . Commit authority: ___ . Separate
   remote reconciliation/read/publication/required CI scope, branch/PR/merge and final SHAs: ___ .
3. Two-path observer predicate authoring/normal validation/review: ___ . Exact enabled
   commit/publication approval and S: ___ . No embedded self-reference or global unlock.
4. Qualified metadata/API and UI log-delivery seams: ___ . Approve F only with S/D/expected
   protections/W-discovery scope and9-GET budget: ___ . No consumed readiness allowance reuse.
5. After F, bind W/S/D/T0–T1 precision/read time and approve D's2 GETs +one POST and P's4
   observation-only GETs/pending view: ___ . After P, approve exact N/J/attempt1/environment
   protected release **including token mint**, reviewer and time: ___ . No unknown-run approval.
6. After approval, bind R's3 GETs/time and qualified one-step owner readback/<=8KiB receipt: ___ .
   Sanitized acceptance/disposition: ___ . No automatic adoption into release policy.
7. Later separately approve observer-only disablement of the same predicate/assertion back
   to false, offline validation/review and exact publication: ___ . Not cloud rollback,
   workflow API disablement, run cancellation or log deletion; preserve evidence.

Later independent gates remain version-pinned legacy artifact verification, valid website
state bootstrap, narrowly owned IaC/trust, candidate-only restoration (current Paul release
is not candidate-only), source freeze/drain and first production, then automation/retirement.
No account-wide assurance or home-lab work is a prerequisite requested by this packet.

## Local authoring preservation (not new execution evidence)

Initial/final HEAD match839e7b895c8badf4a2e81597fdeebbd1e6447945; both indexes empty.
Only this new packet was authored; existing tracked diff SHA256 remained
`24d1bcaed9d6ac6e734ad73910810b0b8559090d134f658334b743e9c7f2b4eb`.
Nine initial/final accepted code SHA256s matched:

| Path | SHA256 |
| --- | --- |
| `scripts/ci/carolyn-selector.test.mjs` | `08085f278b0bb93a2424fbcee8786eed7a592c4edafb9b77b7909806ea9e0044` |
| `config/release-policy.json` | `a5f3c625c6ffbe041cf85e3cfda745cac047e8ce3b21c2622e6e4542a9581330` |
| `config/release-runtime.json` | `a1bf71ae42efcaccd3b2d67d1ccf7a240facda22f0dbd366b4e2e944c8f17ed4` |
| `scripts/ci/release-contract.test.mjs` | `21478a8dd77b2ea59672049e6e367753fccf76c8773af18af2ceace974e23044` |
| `scripts/release/configuration_test.py` | `01f0c57dc6b6572839ef1e2e57d4eb058b0b194ed7c3125462afbf652e4dbfbd` |
| `.github/workflows/paul-identity-observation.yml` | `a7a8d007284f30527945d1c7e92798af80a2fb15267325cf4aac234a632e58db` |
| `scripts/release/paul_identity_observation.py` | `68b3be8bee0e25a0d256b4d1fd02532f6876da6a22226a0d393eb8e247634063` |
| `scripts/release/paul_identity_observation_test.py` | `221d66a09939c8769cdbd050d62f511fa5833477eec1891439be1d934b027675` |
| `scripts/ci/release-workflows.test.mjs` | `f6453f872055901931243b08ebd2776e11ff27584c5add69b0557f9ab6dbaced` |
