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
| Sarabeth infrastructure | Gated root `infrastructure-sarabeth.yml`, all 16 old operational run bodies retained with root-aware app cwd, account/environment and 230-minute shared lock | Hosting/domain/DNS/Netlify operations remain separately approved; optional transition parameters need a reviewed operation-specific invocation, not automatic default adoption |
| Queue observations | `reconcile.py`: reviewed workflow IDs, repository/owner, main/event, attempt-specific run and job status; last seven days in caller, 1000 runs/workflow, 10 attempts/run, 1000 jobs/attempt; failures mean inventory incomplete | Shared manual run API does not expose selected-site dispatch inputs before execution. Precise attribution is an API/design limitation, not promised by live inventory |

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
actual OIDC subject/ruleset restrictions must be verified separately before activation.
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
