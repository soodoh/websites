# Paul local cutover preparation — not activation

## Current readiness refresh and conditional local preparation — 2026-09-12

The owner-authorized same-scope retry completed at 10:38:35–10:41:17Z: **22 AWS CLI
invocations and 15 GitHub metadata GETs**, no retries or writes. First pinned personal STS
verified account658271954302, `arn:aws:iam::658271954302:user/paul`, user ID
`AIDAZSRAQ4V7HF4X6H6UZ`. GitHub caller/repository/environment identities matched; published
main remains `31f9d69b559596c3a0ba67690d578d81fe54b00a` (tree of held TARGET `f8de639a`).
The earlier expired-session attempt remains a failure, not part of these successful reads.
Evidence: `/private/tmp/websites-paul-readiness-retry-evidence.jbt_0783/manifest.json` and
`readiness-and-next-approval.md`; scratch is an inspection packet, not a recovery store.

- Exact Paul stack is UPDATE_COMPLETE, termination protection true, with the same seven
  physical resources. Returned recorded drift is MODIFIED for app/domain, NOT_CHECKED for
  bucket/stack, IN_SYNC for the other resources; no new drift detection was executed.
- Deployment role still trusts **only** legacy `repo:soodoh/portfolio-website:environment:production`.
  Its sole inline policy lacks monorepo state, version-pinned recovery, releases-v2 and both
  domain reads; zero attached policies and no returned permissions boundary. Shared OIDC
  provider exists with audience sts.amazonaws.com; DiLoreto ownership remains unchanged.
  These documents do not prove effective IAM, SCP/session/resource-policy access or federation.
- App is WEB; app auto-build/deletion/branch creation and branch auto-build/previews are false.
  Candidate is BETA; main PRODUCTION. The only domain is AVAILABLE, apex and www both map
  to main; apex `verified=false`, www true. No production/candidate HTTP or DNS repair ran.
- Candidate/main each returned five SUCCEED jobs; latest IDs8/5, ended July20 at
  18:28:43.085Z/18:31:03.340Z. Candidate has a nextToken: **bounded history, not complete
  inventory/drain**. Main has no token. Neither returned commit IDs nor serving-byte proof.
- Existing bucket is us-east-1, versioning Enabled, AES256, all four public-access blocks true.
  `NoSuchBucketPolicy` and exact state HeadObject404 are expected absences, not403 or body
  reads. No state was created; no legacy object/version/body was accessed or revalidated.
- Protected environment21361791310 retains reviewer soodoh, self-review allowed, admin
  bypass false, sole Branch/main policy. Restore351776221 and legacy deploy315997019 are
  registered active; this does not enable the locally literal-false jobs. Source main stays
  `15630718474e8b97f7c9150dfc2357825e352adb`. Latest successful push is still29767712137/1
  at original `d351ff5fa1fca7795eac611b1e3c086277414fbb` (one of five successes returned by
  count). Five separate active-status queries each returned0. These filtered, non-atomic
  snapshots are not a writer freeze; source production ownership remains intact.

The readiness refresh added `MonorepoDomainRead`, conditional on **HasMonorepoSubject**:
`amplify:ListDomainAssociations` uses `!GetAtt AmplifyApp.Arn`; the separate
`amplify:GetDomainAssociation` uses `!Sub ${AmplifyApp.Arn}/domains/${DomainName}`.
The [official Amplify IAM reference](https://docs.aws.amazon.com/service-authorization/latest/reference/list_amplify.html)
requires app and domain resource types respectively. No wildcard domains, production writes,
new resources, trust/default/provider changes or recovery-pin changes are added. Empty subject
omits this policy. Previously published but **undeployed** optional subject/state/version grants
and releases-v2 access are separate from this new local delta. Deployed Original versus the
pre-edit template differs only in those existing transition seams (plus trailing whitespace);
non-role resource definitions are unchanged. A future owning-stack change must not silently
reconcile recorded app/domain drift or replace physical resources.

The subsequent owner-approved local IAM correction changes only the existing
`CreateTargetBranchDeployments` resources from branch `/deployments/*` suffixes to
`!GetAtt ProductionBranch.Arn` and `!GetAtt CandidateBranch.Arn` (main/candidate).
The same official reference requires **branches** for both `amplify:CreateDeployment`
and `amplify:StartDeployment`; the retained deployed policy and Original template contain
those mismatched suffixes. Actions and SID remain unchanged. Once separately deployed,
this corrects deployment resource scoping for **both legacy and future monorepo callers**;
it is not merely new read access or unchanged effective permission behavior. No actual
IAM denial or explanation of historical deployment outcomes is established.

Fresh local evidence: `/private/tmp/websites-paul-iam-validation.y1o_u4z3/manifest.json`.
One scratch Python3.14.7 venv installed **cfn-lint1.42.0** and resolved required dependencies
from public PyPI wheels only. The actual final template passes offline us-east-1 packaged-schema
validation with no findings; this closes the earlier unrun schema gate, **not effective IAM**.
The new regression genuinely failed on the old resources, then passed after the two-line fix.
Focused Bun8/93 assertions, root CI74/1,132 plus28 CI Python/107 release Python, workspace30/433,
and serial uncached app lint4/4 pass; only pre-existing Biome schema-version information remains.
The conditional domain-read policy/tests, exact trust/state/version pins and historical-gates
heading correction are preserved. No repository reinstall, account access or Git mutation ran.

The native fullguard fixture34651294220 already passed three0.98 scores and was re-locked in
published main; the earlier local failures below remain historical failures, not current native
blockers or waived thresholds. No new benchmark, browser, Docker, build or real recovery ran.
The readiness-refresh and subsequent local-correction manifests retain their separate gate receipts.
No new commit, staging, publication, OIDC mint, settings/cloud mutation or deployment occurred.
All workflow/runtime/publication/bootstrap/rehearsal/drain locks remain unchanged. **Production0/4.**

Next: independently review this cumulative three-path preparation; then separately approve
publication and an exact owning-IaC change-set plan covering the deployment-ARN correction,
reviewed subject/state parameters and existing resource identities. Cloud writes, protected federation verification, any workflow/settings activation,
create-only state with a freshly validated distinct monorepo baseline, fresh serving-identity
checks and immutable candidate-only recovery rehearsal each need explicit later authority.
The existing candidate is shared: separately approve legacy-writer exclusion/drain for rehearsal.
Production then needs its own fresh writer freeze/drain, identical-artifact promotion and serving
acceptance approval. Do not select a future SHA, overwrite state or substitute recovery pins.
Shared-provider Retain remains a separate DiLoreto owning-stack safeguard, not this Paul patch.

## Historical local acceptance retry — BLOCKED on isolated performance, not activation

Owner-approved same-protocol continuation repaired the NEW acceptance Dockerfile with explicit
`apt-get install --no-install-recommends -y unzip` and same-step package-list cleanup. The actual
image logged UnZip 6.00 and Chrome for Testing **152.0.7977.77**. All three corrected source-bound
image builds completed as linux/amd64 on the existing arm64 daemon (emulated, not native hosted).
Recursive permission adjustment is limited to copied Paul/harness files, avoiding dependency-layer
copy-up; the image still checks required tool/package access as UID1000 and executes nonroot/read-only.

First isolated run passed both guard probes and hosting, then failed on newly authored Playwright
output paths/permissions. With explicit supervisor approval, output/report paths now use child `run`
directories beneath UID1000/GID1000 mode0700 tmpfs mounts; no writable root or host mount was added.
The next run passed both runners' **26 redirect/origin/WebSocket/IP/proxy-bypass denials** with zero
foreign/escape/upgrade requests, hosting smoke, and **56 Playwright tests/four unchanged skips**, but
Lighthouse performance failed: 0.69/0.77/0.78, median0.77 below the unchanged0.9 requirement.

One separately approved source-bound diagnostic iteration added bounded numeric LHR export before
tmpfs teardown, retaining failure exit status. It again passed guards/hosting/56 browser cases but
failed performance: **0.71/0.78/0.75, median0.75**. Exported FCP1835–1870ms, LCP2135–2170ms,
TBT871–1027ms, CLS0; one Speed Index6471ms, others1835/1870ms; no audit/run warnings. Mobile390x844,
deviceScaleFactor1, simulated CPU4 and all canonical thresholds remain unchanged. These measurements
do not establish whether guard/proxy overhead or emulation causes the failure. No further isolated
retry, guard disabling, throttling/threshold/browser/platform substitution or acceptance waiver ran.
LHR user-agent version is reduced152.0.0.0; the executable build check establishes the full152 pin.
Only sanitized metrics are exported; full HTML/trace/LHR files are ephemeral, and earlier lost tmpfs
reports were not reconstructed. The stdout logs and exact stopped-container receipts are retained.

Final relevant-code canonical `verify:paul` passed in **5m44.345s**: cfn-lint1.42.0, app/workflow/shell
lint, both typechecks, build/static, explicitly verified native-arm64 Playwright56/four unchanged
skips and three local exact mac-arm64 Chrome152 Lighthouse runs. This separate canonical pass does
**not** waive the failed guarded acceptance gate. Canonical Lighthouse scored0.98 each with TBT0
and benchmark3930.5/3927/3989.5, versus guarded benchmark2031/2070.5/2025.5. Different platform and
guards prevent causal attribution from this comparison alone. Final root CI passed68 Bun/1072
assertions plus6 CI Python/107 release Python, workspace30/433, uncached app lint4/4 and
`scripts/ci/lint.sh`. New logs/manifest bind these results, not the earlier intermediate snapshot.
This final handoff annotation is documentation only; no exact-new-commit or hosted proof.
New evidence: `/private/tmp/websites-paul-acceptance-retry.uVfmeq/`; separate incremental delta against
the exact31-file stopped snapshot and cumulative HEAD patch include all new files. Narrow cleanup
removed only receipt-proven owned stopped containers/build-created images, including the specifically
authorized old40501c8b install layer when capacity required it; original logs remain immutable.
All live jobs/flags stay false, publicationLocked true, observer disabled LOCALLY only. Production0/4
legacy-owned. Independent cumulative review/acceptance has not run; the isolated gate remains failed.

## Previous missing-unzip stop — preserved historical evidence

Protected wiring and an isolated acceptance harness were authored over the accepted thirteen-path
callable snapshot, but **the isolated acceptance image did not finish building**. Its first explicit
linux/amd64 build stopped at step 14 with exit 127: the pinned Playwright image has no `unzip`.
No extraction, Chrome version check, isolated browser/hosting/Lighthouse acceptance or guard probes
ran in that image. No tool substitution, image retry, deployment or further validation followed.
The partial implementation has not received final independent review and must not be activated.
Evidence: `/private/tmp/websites-paul-recovery-wiring.tL8JBG/` (manifest and separate incremental /
cumulative patches). The failed build container and partial images remain for explicit disposition.

Before that stop, root CI passed 66 Bun tests / 1056 assertions, 6 CI Python and 106 release Python
cases; workspace and actionlint/ShellCheck/syntax passed. The full canonical `verify:paul` passed
in 5m40.731s, including cfn-lint 1.42.0, types/build/static, native-arm64 Playwright 56 pass / four
unchanged skips, and three local Lighthouse runs against exact Chrome for Testing 152.0.7977.77.
This is dirty-working-tree fixture evidence, **not hosted/exact-new-commit validation**. Subsequent
extraction of the browser guard into its shared app helper passed app lint/typecheck, but final
root/full-app gates and the new isolated probes remain unrun on the final partial snapshot.
An initial import-order lint failure and a conservative Docker cleanup assertion are retained in
evidence; only the reviewed exact-own-digest correction enabled cleanup of 15 proven canonical
build-created images, without force/prune or unrelated-image operations.

The ordinary installed Chrome was 153.0.8010.36; it was not substituted. A supervisor-approved
normal official scratch download supplied the exact mac-arm64 Chrome 152.0.7977.77 for canonical
Lighthouse. The new acceptance image is explicitly amd64 to match the intended Ubuntu24.04 runner
and pinned linux64 Chrome; local emulated validation was approved, not completed. The canonical
Paul image/architecture, screenshots, thresholds, dependencies and lock remain unchanged.

This local slice binds the observed subject, existing candidate and same-bucket state location,
adds create-only bootstrap and a **separate candidate-only recovery callable**, and returns the
identity observer job to literal false. It creates no state and executes no cloud/hosting operation.
Publication remains locked; manual/automatic, restore/redeploy, writer-drain, domain redirects,
bootstrap and rehearsal flags all remain false. Other sites and legacy production ownership stay
unchanged. The published observer is not disabled until separately approved publication.

## Reviewed bindings

- Account `658271954302`, region `us-east-1`, app `d121ux7va6hz6j`; production `main`,
  candidate `candidate`, candidate origin `https://candidate.d121ux7va6hz6j.amplifyapp.com`.
- Subject `repo:soodoh@18269267/websites@1358469291:environment:production-portfolio`;
  issuer `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
  The protected observation was decoded platform evidence, **not signature/federation proof**.
- Existing bucket `pauldiloreto-amplify-hosting-verifiedreleasebucket-idabawspxy3s`, owner
  `658271954302`; proposed state key `release-state/soodoh-websites/paul.json`.
- `config/paul-legacy-recovery.json` records the original legacy commit, source/workflow/run,
  and each exact key/version/length/digest. Repository/workflow linkage was manually reviewed
  against successful legacy metadata and the September 11 point-in-time public marker, not
  cryptographically attested by metadata or the ZIP. Never replace original SHAs with normalized
  import SHAs. No real ZIP was reopened or executed for this implementation.

Owning `apps/paul/infra/amplify-hosting.yaml` keeps legacy StringEquals trust and existing
resource identities. `MonorepoSubject` and `MonorepoStateObjectArn` default empty and allow only
empty or these exact reviewed bindings. Supply the subject above and
`arn:aws:s3:::pauldiloreto-amplify-hosting-verifiedreleasebucket-idabawspxy3s/release-state/soodoh-websites/paul.json`
only in a separately approved owning-stack operation. Three recovery read grants each bind ONE
key to ONE `s3:VersionId`; no wildcard version grant, deletion or provider ownership change.
Existing state GetObject/PutObject and legacy/new-release storage permissions remain scoped.
DiLoreto remains the sole shared-provider owner; no provider retention change is included.

## Callable support (accepted baseline; protected integration below is still unaccepted)

`scripts/release/paul_recovery.py` exposes:

- `bootstrap_proposal(policy, runtime, baseline)`: pure dry-run, no external effects. `baseline`
  must have exactly `repository="soodoh/websites"`, `repositoryId="1358469291"`, `site="paul"`,
  `ref="refs/heads/main"`, `commit=<reviewed 40-hex monorepo SHA>`, `reviewed=true`. This explicit
  ordering floor is NOT a serving release. A separately approved operator must establish its
  actual monorepo ancestry/validation and choose it at execution time. No future publication SHA
  or baseline is invented here. Output retains the legacy currentRelease, generation 0, null
  intent and the distinct reviewed monorepo highWatermark.
- `bootstrap_state(aws, policy, runtime, baseline)`: separately gated; validates before ONE
  `PutObject` with `If-None-Match: *`, AES256 and expected owner, then exact bytes/ETag readback.
  Existing, foreign or malformed objects cannot be overwritten. Conflict, missing ETag or unknown
  write/readback outcome stops; never reset/delete/retry. Even a failed call may have created state.
- `rehearse_candidate(aws, policy, runtime, release, invocation)`: separately gated, with exact
  `pinned_release(recovery_pins())` and numeric `run/attempt` invocation. Version-only recovery
  reads validate all returned identities, lengths/digests, metadata, checksum and bounded ZIP
  paths/types/CRC/marker before any hosting write. Existing retained-download routing also uses
  these exact versions for the pinned legacy run; no key-only fallback on failure.

Rehearsal uses existing State/Amplify adapters, not `release_static()`. It checks exact BETA branch
identity and disabled auto-build/preview, claims intent before candidate mutation, checks ETag
ownership around effects, records candidate jobs and never calls production promotion/compensation.
Upload permits only HTTPS S3 endpoints (`*.s3.amazonaws.com` or `*.s3.us-east-1.amazonaws.com`),
with no redirects. Candidate HTTP checks fetch only index, release marker and 404 document on the
exact candidate origin, bounded to expected bytes; redirects are rejected before follow. No
historical scripts/browser code execute. Success records `lastCandidateRecovery` separately;
currentRelease/highWatermark/production receipt remain unchanged. Any failed/ambiguous effect
requires explicit job/state/serving reconciliation, not automatic cleanup, stale-ETag rebasing or
blind retry. A final failed CAS may already have committed the receipt: inspect before retrying.

## Authored protected entry — incomplete validation, no activation

`restore-static.yml` retains workflow ID `351776221` and default `operation=restore` with the original
production meaning. A separate literal-false Paul-only recovery job handles explicit `bootstrap`
and `rehearsal`; the existing `_paul-release.yml` production lifecycle is unchanged. The recovery
job alone adds `checks:read`, retaining `production-portfolio`, noncanceling `portfolio-production`,
pinned actions, exact trusted workflow-SHA checkout, no persisted Git credentials or inherited secrets.
`request.py` prevents either site's production restoration from consuming recovery operation/baseline
inputs. Every live job/call, publication lock and existing/new enablement/drain flag stays closed.
Future activation must review operation/site routing predicates, not replace false with a variable bypass.

The new `paul_recovery_entry.py` exposes `proposal`, `check`, `execute`. Its fixed environment inputs
are `OPERATION`, `RESTORE_RELEASE` (exact checked-in legacy release identity JSON) and `PAUL_BASELINE`
(JSON containing exactly monorepo `commit`, `runId`, `runAttempt`). Proposal reads only trusted local
configuration/pins and makes no external calls. Check/execute require the actual main/manual dispatch,
exact repo/owner/workflow IDs, run/attempt 1, environment, event inputs and trusted clean checkout.
Actual baseline CI must bind the selected commit, successful run/attempt, required unique root/Paul/
CI-gate jobs, check suite and GitHub Actions App15368. Trusted-main ancestry and existing Paul input
scope comparison are rechecked; `reviewed=true` metadata alone never substitutes for this admission.
No future baseline SHA is selected now; original legacy serving SHA stays distinct and unnormalized.

Tools/image preparation precedes the normal pinned credential action. That action uses the exact role,
audience, expected account, unset-current-credentials and invocation-bound session name. Execute
rechecks returned STS account/assumed role/session, actual Amplify app ARN/default domain/manual WEB
identity, both branches and active jobs, complete domain inventory and fresh main-only apex/www
mappings before mutation. `verified=false` for apex is not confused with branch mapping. The explicit
native CLI environment disables inherited endpoint configuration and metadata lookup and requests
standard retry mode/max-attempts 1; this is **not a hard network-call cap or a claim that native action,
SDK, HTTP, polling or Lighthouse behavior has no internal retries**. Unknown outcomes require a stop.

Rehearsal calls only the candidate adapter, retaining ownership/freshness checks around mutation,
upload, acceptance and final state CAS. Bootstrap records its actual invocation on create-only state.
The full acceptance callback is separate from same-byte checks and cannot advance production release,
watermark or lifecycle receipt. Its intended immutable Docker image has no host mounts, socket,
personal HOME/profile or AWS/GitHub credentials; only bounded nonsecret release identifiers enter it.
It imports existing hosting/spec/Lighthouse assertions and adds fixed-origin fetch, browser proxy,
Playwright no-follow/WebSocket and Lighthouse CDP guards. There is no arbitrary-origin list, custom
CA/TLS interception or DIRECT fallback. The local fixture exception is unavailable in candidate mode.
These guards are **not OS-level egress confinement**. The current retry exercised both runners'
positive/negative local behavior as recorded above; real guarded Lighthouse still fails its unchanged
performance gate. No legacy archive was consumed or executed locally.

## Historical remaining gates — superseded by the current readiness section

The following records the earlier acceptance-retry checkpoint, not current readiness. The native
fixture subsequently passed and was re-locked; the domain-read grants are now prepared locally but
remain absent from the deployed role. Historical failures and limits below are retained as recorded.

The missing extraction prerequisite and nonroot report-path defects are corrected; original failures
remain recorded. The one approved Lighthouse diagnostic iteration is consumed. Next requires an
explicit narrow performance investigation/repair decision using the retained metric evidence, not
an unchanged retry or an assumption that emulation explains it. Keep guarded acceptance failed until
its unchanged thresholds pass on an approved source-bound run. Fresh cumulative read-only review is
still required after full success. Earlier fixture/canonical passes cannot waive that requirement.

The new required `amplify:ListDomainAssociations` and `amplify:GetDomainAssociation` reads are absent
from the current owning role template. This lane adds **no further IAM permissions**. Exact owning-IaC
read grants and their replacement/effective-permission assessment remain a separate activation
prerequisite; the prepared execution fails closed without them. No live permissions are claimed.

Publication/required hosted CI, protected environment enforcement, owning-IaC/federation, reviewed
monorepo baseline, retained-version availability, separately approved legacy shared-candidate writer
freeze/drain and fresh exact domain/app checks, state creation and actual candidate rehearsal remain
separate approvals. Never invoke `release_static()` for bootstrap/rehearsal or perform production
promotion, rollback compensation, state reset or a blind retry. Failed/ambiguous upload/start/CAS/
acceptance leaves the intent/jobs/container for explicit serving/state/ownership reconciliation.

Production remains **0/4, legacy-owned**. No commits, publication, account calls, token mint, production
or candidate HTTP, real recovery ZIP access, source-writer freeze or production operation occurred.
Scratch receipts are not a durable recovery store. Home-lab remains deferred.
