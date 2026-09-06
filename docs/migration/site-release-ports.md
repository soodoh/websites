# Phase 3 offline site ports — authored, not activated or accepted

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
