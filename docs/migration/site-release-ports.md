# Phase 3 offline site ports — Carolyn authored; independent acceptance pending

## Current Carolyn implementation decision — offline only

The approved architecture is an **explicit isolated candidate branch plus separate
exact-SHA production rebuild**, not domain reassociation. The previous Carolyn
unimplemented-seam checkpoint below is historical. New code is committed at `6ccc6d8062739e690b999d58d9a76835b4fcadf4` with normal hooks.
A new independent TARGET root install and writer-run exact-SHA targeted checks passed;
`committed-targeted.log` SHA-256 is
`716d7b71fc68cb03b61fa4b5c750c5bdddd1c043ee9123b3c5416ac10267744c`.
Commands, tools and limits are detailed in `03-production-cutover-handoff.md`;
independent review and full exact-committed-SHA validation remain pending. This following
docs-only evidence commit is not a new code-tested SHA. All four sites are NOT migrated.

| Seam | Concrete behavior / remaining gate |
| --- | --- |
| Owning CDK | Optional/null `monorepoTransition.candidateBranch`; exact DNS-safe supplied name + explicit repositoryConnection required. Adds retained `MonorepoCandidateBranch` and exact candidate branch/job/GetDomainAssociation observation permissions only. Default CLI synth remains byte-identical, 19 resources. Existing domains still point to `amplify-production`; no branch is selected or provisioned. |
| Build policy | Nullable runtime candidateBranch must equal branch-specific `CAROLYN_CANDIDATE_BRANCH`; exact appRoot/account/Git/job ID/type/message/SHA required. Production branch stays fixed. Fixture/CMS rebuild denial and auth/secret cleanup unchanged. |
| Isolated acceptance | New trusted candidate Playwright config/spec, strict approved default-domain origin, redirect-disabled marker/API requests and browser off-origin blocking/service-worker denial. Public assets, invalid-password auth/no-store, SSR photography, redirect location/404/406 and exact root SHA; no production/legacy/CDN HTTP. Original production smoke remains unchanged, including image decode and canonical/default/alias acceptance. |
| Candidate state | `carolyn_operation=candidate` has its own false flag; existing initialized recovery state, both refs/branches/jobs/domains and scope checked. Durable owner/ETag intent before candidate ref CAS/build; actual new job/bundle/smoke before candidate-only receipt. `acceptedCandidate` keeps production snapshot/ref, generation, hosting/domain and job evidence; production currentRelease/highWatermark/LKG untouched. |
| Exact selection | Separately disabled `carolyn_operation=promote` requires nonempty full-SHA `carolyn_candidate_commit`, rejected elsewhere. Selector preserves real observed main, checks ancestry/modern layout and freshly validates exact candidate checkout. Candidate A remains eligible after unrelated main B; relevant/shared input C denies it. This supervisor-approved extension avoids reintroducing global latest-main equality. |
| Production rebuild | Matching candidate receipt, origin validation, hosting/domain/ref/latest job/generation/ETag and fresh scope checked before durable promote intent and production mutation. New exact-SHA RELEASE on existing `amplify-production`; actual new production job/marker and unchanged canonical/default/redirect smoke precede final production CAS. Candidate and production receipts attest separate SSR rebuilds, never identical ZIP bytes. `lastSsrCutover` preserves candidate/previous recovery; routine first-cutover release stays denied. |
| Recovery | Unknown ref/start/CAS/serving outcomes stop. Paginated active-job inventory and exact latest-job identity are checked. Lost ownership permits no cleanup mutation or rollback; failed final persistence is not success even if the external write reached S3. Reconcile actual refs/jobs/state/serving under separate approval; never clear intent merely to retry. |

The canceled previous worker's missing report was not failure/success evidence. User
approved restarting at actual `fa06a3e68fd2e0c759afe5448287b94084421d9a` after parent
confirmed only its untracked draft remained; that draft was preserved byte-exact before
replacement. New targeted checks: 30 workspace, 60 CI Bun, six CI Python, 52 release
Python, 120 Carolyn unit and 15 infra tests; lint/type/fixture build/offline synth pass.
Ten new candidate browser cases were collected only, **not executed against hosting**.
Retained authoring failures, tool identities and unique logs are in the handoff.

Actual app/candidate/ref/CMS/credential resources and hosted inventory remain unknown.
`candidateBranch`/`candidateUrl` stay null; `candidateEnabled`/`promotionEnabled` false;
all literal gates and publication locks remain. In-place connection/change-set review,
GitHub protections/access/identity, existing recovery/retention capture, source/CMS drain,
candidate and production execution/acceptance, enablement and retirement are separate
unapproved gates. No cloud/ref/domain/provisioning operation or production request ran.

## Current final-review disposition and per-site ledger

`final-security-order.md` found no remaining blocker at tested
`55ea42958f897aebd442c28b9741360c0f456656` / docs-only
`db90a3f551939bb16b033fd01da22807be7fdba6`. `final-parity.md` BLOCKED complete
port acceptance because SSR candidate acceptance depended on production acceptance.
The forward correction at `534300664a683712f5c2cd73776fef3c6bb2fb54` now passed
fresh independent-TARGET root frozen install and serial `bun run ci:verify`: 4/4,
zero cached, 12m36.55s, root 30 workspace/433 assertions, 56 CI Bun/878 assertions,
six CI Python and 40 release Python fixtures. Parent independent source review found
no additional Sarabeth blocker and closed its P1 subject to this now-passing validation.
This is NOT all-four offline acceptance or hosted/production evidence. See
`03-production-cutover-handoff.md` for commands, tool identities, retained failures and
source-review limits; the following docs-only HEAD is not a newly full-tested SHA.

Parent source review: `/private/tmp/websites-phase3-ports/report-recovery/parent-ssr-review-53430066.md`,
SHA-256 `bf1d5f2ef43f2e640a5b1d9e0f9448c88aff5c7b16f5e06105cff974578d1544`.
Fresh evidence: `recovery/candidate-full.izac7L/validation-evidence.json`, SHA-256
`5241fa1f5d91dce6381c0d8683e54a7dc691ca120a2b620ab832bf320c6f1d22` (full managed parent
path in handoff). Actual successful Sarabeth Gitless fixture marker matches full code SHA;
this is not hosted `__release.json` or actual candidate evidence. Historical review BLOCK
and the malformed runner-report distinction are preserved.

| Site | Offline state and concrete remaining work | Production state |
| --- | --- | --- |
| paul | Full chain freshly passed at exact correction SHA: 56 browser/four unchanged skips, three local Lighthouse runs at 0.98/1/1/1. Prior reviewers cleared site findings; shared correction source reviewed. | NOT migrated; no live legacy capture/access/candidate/restore proof, source remains owner. |
| diloreto | Full chain freshly passed: 13 genealogy, 37 browser/one unchanged skip. Prior original-format recovery/cleanup/receipt findings cleared; shared correction source reviewed. | NOT migrated; original IDs/manifest pin/retained bytes/origin-edge proof unknown, source remains owner. |
| carolyn | Full fixture chain passed (117 unit, 12 infra, three+three artifact, 92 visual), but **first-cutover candidate seam INCOMPLETE**, explicitly fail-closed. Need approved isolation architecture, then nullable config/optional owning-CDK branch/ref/build policy and integrated candidate/production fixtures. Do not describe this as merely unknown IDs. | NOT migrated; no candidate resource is selected/provisioned, connection/CMS/writer-drain/production gates remain closed. |
| sarabeth | Candidate/switch separation P1 closed by independent parent source review and exact-SHA fixture chain (197 Playwright plus seven host/container provenance). Integrated external-boundary tests pass; not hosted multi-step evidence. | NOT migrated; candidateEnabled/switchEnabled false, all literal gates/runtime publication lock intact, no candidate/domain/LKG/webhook operation executed. |

### Corrected candidate/switch protocol (supersedes historical implementation descriptions)

Candidate uses the prepared `sarabeth-production` default domain, not productionUrl.
The separately authorized operation requires fresh selected-SHA validation and leaves
production state/SSM unchanged. After exact source/job/bundle + non-sending smoke and
mobile/desktop Lighthouse, `acceptedCandidate` is persisted via existing state-owner/ETag
CAS, with invocation/jobs, hosting bindings, previous production/domain recovery and the
acceptance generation. It is not a production currentRelease or production watermark.
The existing RELEASE versus WEB_HOOK source verifier and CMS attestation remain unchanged.

Switch requires separate confirmations and false-by-default switchEnabled, unchanged
candidate generation/hosting/production baseline, re-observed provenance/scope/source/job
and no active/intervening branch writer. It claims `switch` intent before mutation.
Workflow steps carry an exact private ETag checkpoint; differing persisted state stops,
never rebases. Each domain/DNS mutation rechecks ownership/freshness. Domain/source/marker,
canonical redirects and production smoke precede SSM; explicitly opted-in CMS retarget
runs only afterward. Final CAS records production and `ssrProductionAccepted`, retains
`lastSsrCutover` with candidate/previous recovery, then clears intent. Routine SSR release
cannot bootstrap either SSR site by setting productionUrl to a candidate URL.

Ambiguous cloud/CAS errors leave intent; a failure after LKG but before final CAS explicitly
requires SSM/S3/serving reconciliation, not an assertion that old SSM remains. No monorepo
failure runs unconditional Netlify rollback; legacy operation retains its original bodies.
Optional bootstrap grants now include exact supplied-state CAS, branch-scoped ListJobs and
exact legacy LKG write; candidate observation adds only conditionally enabled existing-app
sarabethbelon.com GetDomainAssociation in role and boundary, not resource creation or
wildcard/unconditional default permissions. KMS/retention and
real identities remain uncollected. Candidate/switch fixture success never proves hosted
jobs, actual production serving, real rollback readiness or complete offline Carolyn parity.

## Recovery full-fixture ledger — 2026-09-06

The independent local TARGET clone at `55ea42958f897aebd442c28b9741360c0f456656`
passed root frozen install and the entire serial, uncached `bun run ci:verify`:
4/4 complete chains. This supersedes only the full-fixture-pending status of the
historical authoring checkpoints below; independent final reviewer acceptance remains
**PENDING**, and every production gate remains closed. The following docs-only evidence
commit is not a new code-tested SHA. Full commands/digests, failed scratch invocation,
Python-path correction, actual container manifest and bounded cleanup are recorded in
`03-production-cutover-handoff.md` and its linked `validation-evidence-v2.json`.

| Site | Current offline validation | Production / next safe step |
| --- | --- | --- |
| paul | Full chain passed; 56 browser / four unchanged skips; three local Lighthouse runs passed unchanged thresholds | Blocked; independent final review, then separately approved legacy capture/candidate and all preparation/cutover gates |
| diloreto | Full chain passed; 13 genealogy, 37 browser / one unchanged skip | Blocked; independent final review; original capture IDs/hash/state and real origin/edge restoration remain uncollected |
| carolyn | Full chain passed; 117 unit, 12 infra, three + three artifact, 92 visual; original 19-resource synth unchanged | Blocked; independent final review; actual connection/ref/CMS/smoke and writer-drain evidence remain uncollected |
| sarabeth | Full chain passed; 197 Playwright, seven host/container provenance tests; actual Gitless marker equals tested SHA | Blocked; independent final review; actual connection/candidate/domain/webhook/legacy recovery approvals and evidence remain absent |

All new credential jobs remain literal-false, runtime publication remains locked, and
live IDs remain unknown. No live adapter, production request, credential read, hosted
execution, publication or source-repository operation occurred. No dependency, lock,
snapshot, threshold or resource-identity changes were needed. No full-phase acceptance
or production readiness is inferred from these fixture results.

## Historical milestone-2 authoring checkpoint

Milestone 2 continues foundation `ced5abc8850a2c53f8fe988807309b01e2b9741c` in
Paul → DiLoreto → Carolyn → Sarabeth order. Authority is **Execute offline scope**:
local authoring, targeted fixtures and forward scoped checkpoint commits only.
Independent acceptance and exact-commit full fixture validation are **PENDING**.
All sites remain unmigrated; source repositories still own production. Nothing here
asserts a live account/resource/subject, successful deployment or rollback drill.

## Concrete implementation ledger

| Obligation | Authored implementation | Still blocked / unproved |
| --- | --- | --- |
| Successful relevant main CI, not unrelated site success | `release-after-ci.yml`, per-site reusable release jobs, `static.observe` queries repository/owner/workflow/run/attempt/source/event plus exact successful root/site jobs before credentials and again before use | Actual IDs, permissions and hosted workflow/job API shapes; no transferable caller Boolean is trusted |
| Whole lifecycle lock | Each reusable job has noncanceling `portfolio-production`, `diloreto-production`, `carolyn-production` or `sarabeth-production`; restore calls the same job; Sarabeth infrastructure shares its site lock | Source/CMS writer freeze/drain is separate; a GitHub lock cannot exclude old writers |
| Publication denial | Every credential job AND reusable production call has literal `${{ false }}`; checked-in runtime publication lock, per-site manual/automatic/recovery flags and writer-drain flags deny; missing IDs/subjects/roles/URLs/state denies | Removing a literal gate is a separately reviewed activation code change, not a dispatch input or environment-name protection |
| Trusted harness / selected code separation | Workflow-SHA checkout `verification-harness`, root frozen ignored-lifecycle install; selected checkout fixture lifecycle is uncredentialed; privileged acceptance uses only trusted nested app scripts and a minimal allowlisted subprocess environment | Hosted harness provenance, reviewed workflow changes and protected environment/ruleset configuration |
| Main-only fresh recovery | `release-site.yml`, `select.mjs`, `validate.sh`, `request.py`: pin main once, freshly run selected site's entire fixture chain and root checks regardless of last diff; distinct schema-v2 static artifact | Hosted canceled-pending recovery and full chains; no automatic retries |
| DiLoreto selected-ref redeploy | `redeploy-diloreto.yml`: resolve selector once, reject malformed/ambiguous/option/PR refs, enforce trusted main ancestry and modern root/app layout, freshly validate immutable SHA | Non-main authorized paths are deliberately unsupported; pre-import layouts require separately inventoried retained-byte recovery, not a modern rebuild |
| Paul static lifecycle | `static.py`: independently verify old/current and selected ZIP/hash/metadata/serving marker; candidate hosting/browser/Lighthouse; retain selected bytes; freshness recheck after candidate/upload; deploy identical ZIP; production acceptance; known terminal failure restores verified previous ZIP and fails run | Capture CURRENT legacy bytes; candidate/domain/Netlify and legacy → new → legacy → restore-new evidence; live durable object policy |
| Paul legacy/manual restoration | `restore-static.yml`, explicit original repository/run/attempt/workflow/SHA/hash JSON; allowlist `soodoh/portfolio-website` + `.github/workflows/deploy.yml`; unchanged `releases/<run>/<attempt>`; new namespace `releases-v2/soodoh-websites/<site>/<run>/<attempt>` | Existing retained objects and legacy repository/workflow IDs/reader access; no normalization of byte provenance |
| DiLoreto origin/edge/browser | Same verified static adapter; exact route/asset bytes at origin and edge, no Netlify references, no-cache/nosniff, immutable one-year JS cache, 404 body/status, trusted nested deployment-smoke browser harness | Actual origin/edge URLs and approved retained-byte/state object resources; deployed tests not run |
| Carolyn SSR | `ssr.py`: repository-connected WEB_COMPUTE only; pre-existing production ref CAS, recorded prior ref, exact RELEASE commit/message/job wait, `__release.json` source/bundle/job attestation, trusted deployed-browser smoke, state finish | Connection/ref/ruleset/credential setup; legacy serving capture and actual smoke. No manual compute ZIP deployment |
| Sarabeth SSR | Same ref/job/bundle chain plus existing source verifier, exact SecureString Contentful namespace, auth-manifest cleanup, non-sending real smoke, legacy SSM last-known-good only after smoke, mobile/desktop Lighthouse afterward | CMS webhook/ref race inventory and attested legacy state; no guessed last-known-good. Lighthouse failure intentionally does not auto-rollback |
| SSR root buildspec | `amplify.yml`: app roots `apps/carolyn`, `apps/sarabeth`, root buildPath and artifacts, Node24.20.0/Bun1.4.0, root frozen isolated install ignoring scripts; `amplify-build.sh` creates marker only after verified production build | Real Amplify checkout/job environment. New wrapper requires actual Git metadata and rejects absent/unknown metadata; legacy Gitless verifier tests remain unchanged. IPv4 workaround remains fixture-only |
| Owning IaC transition | Optional exact subject and existing state-object inputs in original Paul/DiLoreto/Sarabeth templates; Carolyn explicit context; preserve old trust/provider/logical identities. Sarabeth retains main plus optional retained `sarabeth-production` branch and explicit webhook retarget | Actual immutable subject format, bucket/object/owner/KMS selection and narrow encryption permissions; app connection/change-set review. No resources selected or deployed |
| Sarabeth infrastructure | Gated root `infrastructure-sarabeth.yml`, all historical operations retained with explicit legacy/preparation/switch parameter paths, root-aware app cwd, account/environment and 230-minute shared lock | Actual candidate/state/connection/subject values and every hosting/domain/DNS/Netlify operation remain separately approved |
| Queue observations | `reconcile.py` plus independent `release-reconciliation.yml` terminal observer: complete exact reviewed workflow-ID set, repository/owner, main/event, attempt-specific run and job status; last seven days in caller, 1000 runs/workflow, 10 attempts/run, 1000 jobs/attempt; failures mean inventory incomplete | Shared manual run API does not expose selected-site dispatch inputs before execution. Precise attribution is an API/design limitation, not promised by live inventory |

Queue notices use `affectedSite=unknown` and `possibleSites`, with each exact
`release-site(site=<site>, ref=main)` action. An overall successful run does not hide
failed/skipped/incomplete jobs. The collector is literal-false too; notices never
advance state, authorize a release or redispatch. Hosted non-FIFO/interleaving/recovery
acceptance is still required; neither the phase-2 exception nor conservative notices waive it.

## State and recovery protocol

The approved offline proposal uses an **existing, explicitly supplied S3 object**.
No second Paul bucket, implicit empty baseline, or resource creation is implemented.
The state is schema 1, `repository=soodoh/websites`, site, generation, full monorepo
`highWatermark`, independent original `currentRelease`, and nullable `intent`.
Its approved initialization must capture known-good serving bytes/marker/ref and original
legacy identity; an import-map SHA is not that capture. Bootstrap/live reconciliation
is intentionally not automated and remains a separate approved operational procedure.

`State.read/write/claim/job/finish` requires observed ETag and server-side encryption,
ExpectedBucketOwner on GET/PUT, If-Match of the **ETag** (never VersionId), preserved
AES256/KMS settings, and a claim before first mutation. Each created job is persisted;
SSR claim also captures prior production ref. Crash/unresolved intent blocks the next
invocation. Finish follows actual serving smoke. Routine release alone advances the
high-watermark; explicit historical redeploy and restore retain it. Restore-new is not
skipped merely because its SHA already equals that watermark.

409/412, unknown upload/start, missing ETag or ambiguous write outcomes stop all
promotion/rollback and retain intent. Best-effort stop may address only the exact owned
job. There is no unconditional PUT, stale-proposal rebase, blind retry, or guessed
success. Reconciliation must inspect actual state version, jobs, source ref, current
serving marker and retained bytes under a separately approved operation. Do not clear
intent simply to get a green rerun. A superseded candidate is not promoted; its intent
also requires reconciliation. Immutable retained-object writes use If-None-Match `*`;
a partially written release prefix is not automatically overwritten.

Known, reconciled terminal static failures may restore previous verified bytes under
the same lock; this still fails the run. SSR failure leaves intent/ref and original
known-good evidence for reviewed recovery, stops only the exact owned job, and never
uses RETRY/manual ZIP or force-pushes a mapped legacy SHA as a rollback. This preserves
original Carolyn/Sarabeth failure behavior; Sarabeth domain/Netlify rollback is the
separate infrastructure path. Restoring a legacy SSR serving owner/branch/connection
requires an inventory-specific runbook and approval, not the static restore dispatch.

## Tool, security and evidence limits

Pinned AWS credentials action retains expected account allowlist, isolated credentials
and explicit STS equality. Exact supplied IAM subject conditions preserve legacy trust;
the pre-assumption adapter now observes exact subject/audience/issuer/time claims from
the trusted GitHub TLS endpoint without printing or retaining the JWT. The AWS action
requests the same explicit audience; IAM/STS verifies its token signature/trust. Actual
subject values and ruleset restrictions still require approved inventory before activation.
No guessed OWNER@ID/REPO@ID/environment subject is checked in. A named GitHub environment
alone is not protection and can be implicitly created by GitHub.

AWS CLI conditional support is checked using the **local** PutObject input skeleton
before AWS access (`IfMatch`, `IfNoneMatch`, `ExpectedBucketOwner`). Public API/CLI docs
confirm semantics, not a hosted installed-version acceptance result; an exact approved
runtime CLI/version capability check remains required before activation. KMS/state
policies must be reviewed against actual encryption/ownership; optional S3 permissions
alone do not prove deployability.

Original phase-2 v1 markers/schema, five unprivileged CI workflows, nested legacy
workflow assertions, app dependency pins, lock, fixtures and screenshots are retained.
Only the root workflow test's five-CI-file enumeration is explicit now; a separate
exhaustive release-workflow test protects every new gate/lock/account/harness. Production
and fixture diagnostics are scanned and explicitly nondeployable; ZIPs are separate.
No CMS/email/prod HTTP/AWS/GitHub API or actual deployment adapter was used in validation.

Targeted worktree checks are not independent exact-SHA builds, hosted acceptance,
production rollback evidence, or authorization. See current handoff for counts and
private evidence paths. Independent security/order/parity review follows exact-commit
fixture validation; its findings must be fixed/revalidated before offline completion.

## Recovery-review additions (offline, independently unaccepted)

### Original DiLoreto capture contract

Only `soodoh/diloreto-website` + `.github/workflows/deploy.yml` is admitted for the
markerless format. `legacyDiloretoRepositoryId`, `legacyDiloretoWorkflowId` and
`legacyDiloretoManifestSha256` are **null**. Under separately approved capture scope,
retain the original `amplify-deployment.zip` bytes as `site.zip` (filename only; do not
repack or embed a marker), its new checksum sidecar, and a reviewed `metadata.json` at
`legacy-captures/soodoh-diloreto-website/<run>/<build-attempt>/` in the explicitly approved
existing release store. No capture/upload/initialization operation has been executed.

The capture manifest is schemaVersion 1, kind `legacy-diloreto-capture`, with repository,
site, original workflow/runId/runAttempt/commit/sha256, event, workflowSha,
sourceArchiveName `amplify-deployment.zip`, sourceArtifactName `amplify-static-<run>`, and
`captureEvidenceSha256` identifying independently reviewed capture evidence. The policy
pins the **exact manifest bytes' SHA-256**, not a digest supplied by downloaded metadata.
That approved evidence must prove the current served bytes, original artifact/run/build
attempt and selected original commit; an import/normalization map is never such proof.
Review actual capture access, retained-object ownership/encryption and retention first.

The reader independently checks original successful attempt-specific `Validate static
site` and `Deploy production` jobs. Main push must match original target/head SHA;
main manual dispatch may select another original SHA only through the pinned capture
manifest's independent target evidence (workflow head is NOT assumed to be target).
The unchanged ZIP is scanned/hash-checked; all retained file bytes are checked against
both origin and edge without a fictional release marker. Restoration uses the same
current trusted origin/edge/browser harness. Missing/changed manifest, unavailable old
API evidence or differing served bytes blocks bootstrap, never resets the baseline.

### Explicit Sarabeth infrastructure operations

All operations remain in the literal-false protected job and shared noncanceling lock.
`legacy` is the unchanged default. `prepare-monorepo` requires
`APPROVE_MONOREPO_PREPARATION`, disallows apply_domain/rollback/webhook retarget, and passes
EnableMonorepoConnection=true, EnableMonorepoBranch=true, MonorepoWebhookTarget=false,
exact supplied MonorepoSubject and existing MonorepoStateObjectArn. Old main remains.
No default adopts a connection, subject, state resource, domain or webhook change.

`switch-monorepo` requires `APPROVE_MONOREPO_SWITCH` **and** apply_domain plus the existing
`APPROVAL_GATE_1_CONFIRMED`. It requires exact selected_commit/selected_job, approved
runtime app/state/candidate/production URLs and drained source writers. Before mutation,
accepted state must have no intent and match the candidate commit/job; originating
validation is independently re-observed, as are Amplify repository/platform/branch,
successful exact-SHA job and candidate bundle marker. Domain deploy explicitly passes
GitHubBranch=sarabeth-production; AVAILABLE alone is insufficient: apex/www association
and served release marker must match. Failures after domain mutation retain the existing
Netlify/DNS/domain cleanup handling and failing result. CMS retarget is a separate
explicit `retarget_webhook` Boolean; default false never opts in. Branch/domain switch,
webhook and connection writes still require their actual operation approvals.

Bootstrap's optional MonorepoAppId grants infrastructure only GetApp/GetBranch/GetJob
on the supplied existing app and sarabeth-production branch, plus GetObject on the
existing supplied state object. It creates no app/state resource and grants no state
write. Actual KMS decrypt grants, GitHub Actions read access, in-place connection
capability and change-set assessment remain inventory/approval gates, not guessed policy.

### Completion evidence and recovery observation

`lastLifecycleReceipt` is scanned and written atomically with currentRelease before
intent is cleared. It contains invocation, operation, allowlisted requested/serving
provenance and checksums, every job ID/branch and acceptance/restoration outcome; upload
URLs and credentials are excluded. A CAS failure leaves prior intent/receipt unchanged.
State-object version/retention policy must be reviewed for the required evidence window.
Unknown failures keep unresolved intent; a successful previous-byte restoration still
fails the release run, with outcome `restored-previous` rather than success relabeling.

The separate disabled terminal observer covers after-CI, release-site, DiLoreto redeploy
and static restore, even when their own pending job never executes. It rescans after
completion and publishes incomplete inventory/recovery actions via always-running
summary handling. Existing initial CI notices remain; neither snapshot guarantees a
FIFO queue, automatic retry or precise unknown-site attribution. Hosted acceptance is
still unperformed. Exact entry keys/IDs are required before any API, so an empty map
cannot claim that the inventory is complete.
