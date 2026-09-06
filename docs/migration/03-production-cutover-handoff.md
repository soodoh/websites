# Phase 3 handoff — SSR candidate correction; offline acceptance incomplete

## Final-review recovery correction — current checkpoint

Final independent reports at the recovery output directory below disagree only on
complete offline parity: `final-security-order.md` is OK with notes, while
`final-parity.md` **BLOCKS** complete offline acceptance. Both inspected code and raw
full-chain evidence; neither reran tests. The parity P1 is concrete: the original SSR
producer required production acceptance before the Sarabeth candidate/domain switch.
Full fixture success at `55ea42958f897aebd442c28b9741360c0f456656` and following docs-only
`db90a3f551939bb16b033fd01da22807be7fdba6` did not cover that missing lifecycle.

The supervisor approved a narrow OFFLINE correction, not activation:

- Sarabeth has separate literal-disabled candidate/switch operation flags. Fresh
  `release-site` validation can select `sarabeth_operation=candidate`; existing release
  calls/jobs remain literal-false and publicationLocked remains true. Candidate acceptance
  checks the actual branch default domain, repository/root/ref/job/bundle, non-sending
  smoke and both Lighthouse forms before a candidate-only owner/ETag CAS receipt.
- Candidate leaves production currentRelease/highWatermark/lastLifecycleReceipt and
  the exact legacy LKG untouched, retaining previous recovery and domain configuration.
  The unchanged exact RELEASE source verifier needs no LKG update; WEB_HOOK guards
  remain unchanged. Candidate preparation never retargets CMS or changes the domain.
- Separately approved switch consumes matching candidate evidence; rechecks validation,
  scope, ref, latest successful job/no active writer and state ownership; claims durable
  intent before domain/DNS writes. Cross-step ETag is pinned, never silently rebased.
  Domain/source/bundle, canonical redirects and production smoke precede LKG. Optional
  explicitly approved webhook retarget follows production acceptance/LKG; final CAS
  alone advances production provenance, preserving candidate/previous recovery evidence.
- SSM and S3 are not atomic. Unknown mutation or CAS failure retains intent, including
  `production-verified`/`lkg-written` checkpoints when applicable; reconcile actual
  serving/LKG/job state before any retry or restoration. Legacy Netlify recovery bodies
  remain unchanged; monorepo switch failures never enter unconditional Netlify rollback.
  Lighthouse failure still never triggers automatic rollback.
- Optional owning-bootstrap permissions cover only supplied existing state, app/branch
  observations and exact existing LKG write; empty defaults/resource IDs/trust boundaries
  remain. Candidate baseline observation additionally needs monorepo-only
  GetDomainAssociation on the exact existing app/sarabethbelon.com in the owning hosting
  role and matching explicitly supplied-app boundary; the supervisor separately approved
  that proven permission seam. Empty/default configuration adds no permission.
  Trusted workflow-SHA Node/Bun/root ignored-lifecycle tooling precedes credentials.
- **Carolyn first-cutover candidate integration remains an INCOMPLETE offline requirement.**
  Routine SSR release now explicitly denies first-cutover/legacy state. No candidate
  branch/resource/name is invented. Next architecture decision: isolated candidate branch
  with separate exact-SHA production rebuild/promotion, versus approved domain reassociation.
  Nullable config/optional CDK/ref/build-policy integration is NOT implemented this pass.

New real-state/SSR/switch external-boundary fixtures cover old production → accepted
candidate → approved switch → production verification → provenance, plus candidate
marker/smoke/Lighthouse/CAS failures, drift, lost ownership, switch failure and final CAS
conflict. They replace AWS/GitHub/Git/HTTP/tool boundaries; they are not hosted execution.
Targeted checks, a forward code commit and new exact-SHA full validation are being recorded
in the following checkpoint. Independent review of this correction is still REQUIRED.

Recovery reports and new unique raw evidence directories are under:
`/Users/pauldiloreto/.pi/agent/sessions/--Users-pauldiloreto-Projects-websites-main--/subagent-artifacts/outputs/22685b92-f7ef-4f32-9b24-7c35b8b72f0c/recovery/`.
All four sites are **NOT migrated**; source repositories remain sole production owners.
No publication/live adapter/inventory/credential/production request or gate was executed.
Phase-2 acceptance and its explicit publication/main-push exceptions remain accepted.

Next safe scope: finish/review the offline correction, exact committed TARGET fixture
validation and the explicit Carolyn architecture decision. Any later live work requires
an approval naming repositories, site/account/region, exact read-only profile/role,
allowed metadata actions/resources/non-sending URLs, artifact download scope, private
retention location and expiry/stopping point (`production-inventory.md`). That approval
must exclude secret values and writes; candidate, settings, cloud, writer drain, switch,
enablement and retirement remain distinct later approvals, never implied by these tests.
Historical sections below retain their original checkpoint meanings.

## Recovery full-validation checkpoint — 2026-09-06

The complete canonical fixture chain passed in a **new independent local TARGET clone**
at `55ea42958f897aebd442c28b9741360c0f456656` (code correction commit
`183381d51e887669c6361248961efe44370ab71f`). This following evidence-only commit is
**not** a new code-tested SHA. Independent final security/parity/order/history reviewer
acceptance is still **PENDING**. No production readiness, publication verification,
activation, live inventory or migration completion is claimed. The phase-2 acceptance
and explicit publication/main-push evidence exceptions remain accepted, not reopened.

The clone came only from `/Users/pauldiloreto/Projects/websites/main`, using
`git clone --no-hardlinks --single-branch --branch main`; it has independent objects,
no alternates and no copied ignored configuration or dependencies. Only its ROOT ran
`bun install --frozen-lockfile`: 1,000 packages, unchanged isolated `bun.lock`.
Fixture execution used `env -i`, a newly empty scratch HOME and explicit tool paths.
Resolved tools: Bun1.4.0, Node24.20.0, Turbo2.10.12, Python3.14.6, Go1.27.1,
ShellCheck0.11.0, uv0.12.9, actionlint1.7.7, cfn-lint1.42.0/1.53.0 and local
Chrome152.0.7977.77. The actual Python executable is
`/opt/homebrew/Cellar/python@3.14/3.14.6/bin/python3`, **not** `libexec/bin/python3`.

| Gate / separately applicable site ledger | Fresh result at the exact SHA above |
| --- | --- |
| Root canonical `bun run ci:verify` | PASS: 4/4 tasks, zero cached, concurrency 1; Turbo duration 12m30.961s. Root contracts: 30 workspace / 433 assertions, 56 CI Bun / 846 assertions, six CI Python and 33 release Python tests; root/nested actionlint, ShellCheck and syntax passed. |
| carolyn — prepared offline; production blocked | Complete chain PASS: 117 unit / 1,084 assertions; 12 infra / 50 assertions; three fixture + three hermetic-production artifact tests; 92 visual. Offline synth remains the identical 19-resource template. |
| paul — prepared offline; production blocked | Complete chain PASS: 56 browser tests, four unchanged viewport skips; all three local Lighthouse runs scored performance 0.98 and accessibility/best-practices/SEO 1.00. Static, both type configs, workflow, shell and cfn-lint gates passed. |
| diloreto — prepared offline; production blocked | Complete chain PASS: 13 genealogy tests, 37 browser tests and one unchanged viewport skip; static/output/types/cfn-lint gates passed. |
| sarabeth — prepared offline; production blocked | Complete chain PASS: 197 Playwright tests, seven release-provenance tests on both host and container, mocked waiter, provider/fixture builds and Amplify prepare/validate/cfn-lint. Actual successful Gitless container marker equals the full tested SHA. |
| History / dependencies / diagnostics | All 1,123 HEAD ancestors pass commitlint, zero errors and six preserved footer warnings. Both map hashes/bijections, all 1,109 mapped normalized ancestors and four pristine import trees pass. Six-root full installed graph exactly matches the accepted hash; no missing/range failures. Four post-suite diagnostic scans pass and remain fixture/nondeployable. |

All four browser images actually report linux/arm64, Playwright1.62.1, Bun1.4.0 and
Node24.20.0. Canonical architecture policies, screenshots, skips, thresholds and
fixture-only Carolyn IPv4 routing are unchanged. No deployed-smoke/live adapter ran;
Sarabeth's logged SES failures are injected contract-test failures, not email sending.
This root invocation did not enable CI release metadata or package/upload static release
artifacts; those local integrity contracts passed as fixtures, not hosted provenance.

Colima's **Docker data disk**, not host/root disk, initially had 6,939,892 KiB available.
One app/image at a time ran. Only 34 initially absent, non-FROM/non-cache build-log-proven
images were removed, each after fresh zero-container-reference checks, using
`docker image rm --no-prune` without force. Existing exact-owned-container traps remained.
Final available capacity: 6,938,448 KiB. Exact pre/post image ID/tag reference sets and
container ID/image/name/state sets match. No old image, volume, daemon or unrelated service
was changed. The main worktree and tested clone/index were clean after validation.

**Actual failed attempts retained:** the first full invocation exited 126 before any
Docker build because the scratch recorder used nonexistent `libexec/bin/python3`.
Its Python tests actually resolved to `/usr/bin/python3` 3.9.6. The earlier recovery
report's Python3.14.6 claim was therefore not established by its supplied PATH; do not
retroactively relabel those historical logs. The corrected recorder passed read-only
`docker info`; resolved executable/version evidence and the entire unchanged-SHA rerun
establish the current result. A scratch ancestry assertion initially over-required whole
root package.json byte identity; its correction admits only the already-approved
`test:ci` integration while proving every dependency field unchanged. A malformed scratch
sed probe changed no files. The final evidence manifest excludes its own in-progress
output log; all 70 recorded completed-file digests were checked. No repository code,
dependency, snapshot, threshold, identity or production-gate correction was needed.

Private evidence directory (new managed output; old runner artifacts retained):
`/Users/pauldiloreto/.pi/agent/sessions/--Users-pauldiloreto-Projects-websites-main--/subagent-artifacts/outputs/22685b92-f7ef-4f32-9b24-7c35b8b72f0c/recovery/full-checks.e7VoTg/`.
`validation-evidence-v2.json` contains exact commands, tool/image identities, manifest,
Lighthouse results, cleanup IDs and 70 log/script digests. The original recovered rejected
and corrected reports retain their previously recorded byte hashes.

| Evidence file | SHA-256 |
| --- | --- |
| `validation-evidence-v2.json` | `468129bcfac3cf1aac2444c898b44c997e29846105b0cfb3800ac198cbd20699` |
| `root-ci-v2.log` — full passing rerun | `6f88a86de9373fd115d0a677065fd47bca2306f5785307817408d04aa3647248` |
| `root-ci.log` — actual exit 126 | `17ce748199fa1a38799d70d706207ed45d85337b445080cf04dced9791711f0b` |
| `all-resolved-tools-v2.log` | `eb3b7f96069ffe8b2c6c6fa3605194fc6fdc100206f061a6db01821bc55e57a7` |
| `ancestry-v2.log` | `960a7c9d2717d27a3578936d3ad4574d0b8afee4f25396203ead70ea74eb69c1` |
| `post-suite-checks.log` | `bd3e023d29978141565059475fb7538b420e0e02eae00efa84554389fc9b8628` |

Next safe action: independent final review of the accepted-baseline-to-tested-SHA code
and forward evidence diff, with these raw results; apply only approved concrete findings
and revalidate if code changes. Each site's source remains the sole production owner.
Literal-false credential jobs, runtime publication lock, unknown live IDs and every
inventory/settings/cloud/source/candidate/cutover/enablement/retirement gate remain intact.
The historical checkpoint sections below retain their original acceptance meanings.

## Orchestration interruption — committed checkpoint, acceptance pending

The local site-port commit is `6d5834712a5cd611200b10dda81c24442a3061fc`
(`chore(ci): port offline protected site release lifecycles`), following
`ced5abc8850a2c53f8fe988807309b01e2b9741c`. The parent confirmed a clean
worktree/index at that checkpoint. No dependency or lock changes were included.

The delegated workflow stopped before its full fixture-validation and independent
review stages: milestone 2's structured acceptance report used unsupported fields
and an object where `changedFiles` required a string array. This is an evidence-envelope
rejection, not a reported test failure, and is not an independent acceptance pass.
A report-only correction completed without code edits or new checks. The runner
reused and overwrote the original report path, despite the preservation instruction.
The parent recovered its exact bytes from the persisted transcript into
`/private/tmp/websites-phase3-ports/report-recovery/site-ports-original-rejected.md`;
SHA-256 `c91c05a431522c33b7d6988f27d61332d60a433a913a6ef7c2a277ba73ee7be0`
matches the original rejection record. The corrected response is separately retained
as `site-ports-corrected-response.md` in that directory, SHA-256
`cf949bc1bf91598d93f8b45826a7ff11e372965f027121f2153d1b663c17a6a0`.
This correction does not restart the failed workflow or satisfy independent review;
prior targeted checks are not fresh exact-SHA/full-chain evidence.

For Paul, DiLoreto, Carolyn and Sarabeth separately: offline code is authored and
locally committed; full independent-target fixture validation and independent
security/parity/order/history acceptance are **pending**. No production gate changed.
Next safe work is to recover the evidence handoff, recheck Colima capacity, validate
the committed code in an independent target checkout with the approved isolated
pins/environment and serial chains, then perform independent reviews and forward
fixes. No new publication, live inventory, credentials or production authority is
implied. The milestone descriptions below retain their original checkpoint meaning.

## Recovery review corrections — targeted checks, independent acceptance still pending

The new recovery workflow accepted the concrete findings in `security-order-review.md`
and `parity-review.md` at checkpoint `6d5834712a5cd611200b10dda81c24442a3061fc`.
The parent approved the minimal offline capture/transition contracts and corrections.
The interruption section above is preserved, including the rejected-report distinction.
This is a forward correction checkpoint, NOT a review pass, full validation, or activation.
Code commit: `183381d51e887669c6361248961efe44370ab71f`
(`fix(ci): close offline release recovery review gaps`), 24 paths, 770 insertions /
33 deletions. This following docs-only commit preserves interruption/recovery evidence;
use the final documentation-inclusive HEAD for the next isolated validation.

| Review finding | Author's disposition / concrete regression evidence |
| --- | --- |
| Both P1: authentic DiLoreto legacy ZIP cannot bootstrap | Added original-repository/workflow allowlist, independently pinned migration manifest and unchanged markerless ZIP reader. Real readers/Amplify/state/acceptance run legacy → new → legacy → new with fake external APIs/HTTP; manifest/hash/identity/event/serving-byte denials. No live bytes captured or pin invented. |
| Both P1: terminal failure loses rollback eligibility on unnecessary StopJob | Remember observed terminal jobs; query before stopping unknown jobs; poll after rejected active stop. FAILED/CANCELLED fixtures never stop terminal jobs; original ambiguous start/CAS remains ambiguous after successful cleanup. |
| Security P1: exact observed OIDC comparison unused | Release pre-credential check and infrastructure gate now observe GitHub TLS-issued JWT claims, deny wrong/missing subject/audience/issuer/expiry, reject redirects/untrusted endpoints, and never print/store tokens. AWS action explicitly requests sts.amazonaws.com too; IAM/STS remains signature/trust authority. |
| Security P1: no terminal/manual recovery notice | Added literal-disabled, unprivileged workflow_run completion observer for every release entry, independent of canceled work's own jobs. Snapshot fixtures find replacement/failure after initial CI inventory. No redispatch; unknown-site notices remain conservative. |
| Security P2: empty workflow map reports complete inventory | Require exactly four expected entry keys and distinct positive numeric IDs before any API. Empty/partial/null/extra/duplicate mappings deny. |
| Parity P1: Sarabeth transition invocation missing | Disabled legacy / prepare-monorepo / switch-monorepo operations, separate confirmations, exact hosting/domain parameters and explicit webhook opt-in. Switch preflight verifies accepted state + originating validation + candidate branch/source/job/marker before mutation; domain association and serving marker checks remain inside existing Netlify recovery handling. Optional bootstrap permissions read only exact supplied app/branch and existing state; old main/resources/defaults retained. |
| Parity P2: job evidence cleared on static completion | Scanned allowlisted lifecycle receipt is persisted in the same state CAS that clears intent: invocation, original requested/serving identity and hashes, all candidate/production/restore job IDs, acceptance/restoration outcomes. Conflict fixtures retain intent and never fabricate completion. |

Targeted checks in the existing target worktree used a fresh empty HOME/environment and
explicit Bun1.4.0 / Node24.20.0 / Python3.14.6 / Go1.27.1 / ShellCheck0.11.0 paths.
No install was performed. Results: 56 root CI Bun tests / 846 assertions, six original
CI Python tests, 33 release-adapter fixtures; 30 workspace tests / 433 assertions;
root/nested actionlint1.7.7, ShellCheck and syntax; cfn-lint1.53.0 on changed bootstrap;
41 unchanged Sarabeth source/redirect/provider/domain contracts with no webserver.
Normal code-commit hooks passed serial app lint 4/4 uncached and scoped commitlint;
only existing Biome schema-version informational diagnostics remain. Approved author /
committer environment identity was used, without config changes, bypass or date override.
Target-only checks preserved both map hashes/bijections (1,109 and 152 pairs), normalized
import/initial/baseline ancestry and all four pristine import tree IDs. No source or remote
was queried, and no dependency/lock/screenshot/history-identity files changed.
Logs are in the unique managed recovery `checks.xQbVMp/` directory alongside the
`review-fixes.md` acceptance artifact. No old runner output was overwritten.

For **each** of Paul, DiLoreto, Carolyn and Sarabeth: authoring corrected, targeted
fixture checks passed, independent exact-SHA full chains and reviewer acceptance
**PENDING**; all production gates remain closed, source owners unchanged. New live IDs,
DiLoreto manifest hash and Sarabeth candidate URL remain null. Capture evidence/retention,
KMS read grants, actual OIDC/configuration, source/CMS drain, hosted scheduler behavior,
real candidate/domain/restore smoke and all preparation/cutover operations remain gated.
The independent validation stage must use the final committed SHA, independent TARGET
root install, empty HOME/env, exact pins, prior Docker capacity check and serial chains.
Do not reuse prior writer assertions as independent full-validation evidence.

## Current milestone-2 offline checkpoint

Concrete offline ports are authored in Paul → DiLoreto → Carolyn → Sarabeth order:
root after-CI/recovery/DiLoreto-redeploy/static-restore and reusable release workflows,
trusted attempt-specific observations, static candidate/promotion/restore, conditional
S3 state, SSR ref/job/bundle attestation, root Amplify buildspec, optional owning-IaC
transitions, and gated Sarabeth infrastructure. `site-release-ports.md` is the detailed
implemented/unimplemented ledger and recovery runbook; `ci-parity.md` adds a milestone-2
map without changing its exhaustive historical 13-job/133-step ledger.

Every credential job and production reusable call is literal-false. Runtime publication
lock/enable flags/writer-drain flags remain locked; actual IDs/subjects/resources/URLs
remain uncollected, not guessed. Optional IaC inputs retain legacy subjects, resources
and defaults. Current release identity is separate from monotonic watermark; historical
restoration/redeploy never lowers it. Unknown CAS/upload/start outcomes block all further
promotion/rollback. Shared manual queue inputs cannot be attributed precisely before
execution; conservative notices say unknown site and never authorize/redispatch.

All four sites remain **blocked before production preparation; offline ports authored,
independent acceptance PENDING**. Sources remain sole production owners. No live inventory,
credentials, production HTTP, workflow execution, ref promotion, settings/cloud/source
writes or push occurred. Exact-SHA full fixture validation is the next milestone after
a forward local checkpoint commit, then independent security/order/parity review,
findings/fixes/revalidation/final acceptance. This checkpoint is not offline completion.

Targeted evidence: `test:ci` 55 Bun tests / 809 assertions, six original Python
artifact tests and 23 new Python adapter fixtures; workspace 30 tests / 433 assertions;
root/nested actionlint, ShellCheck, shell/Node/Python syntax and whitespace checks passed.
Carolyn infra types and 12 tests / 50 assertions plus original deployment 5 / 27 passed.
Sarabeth's four original source/redirect/provider/domain contract specs passed 41 tests
with a scratch no-webserver config. Pinned cfn-lint1.42.0 (Paul) and 1.53.0
(DiLoreto/Sarabeth) passed all changed templates. Existing CDK deprecation/NoEcho-name
warnings remain; no new lint warning remains. All checks used empty HOME/environment,
explicit safe tools, Bun1.4.0/Node24.20.0 and no credentials. Early fixture assertion/path
typos failed, were corrected, and passed on rerun; logs retain failures honestly.

Commit identity and full private baseline/new-file diff manifest are recorded in the
private `site-ports.md` report; logs are under `/private/tmp/websites-phase3-ports/`.
No install/full app chain/Docker launch occurred in this milestone. Existing accepted phase-2/publication evidence and
normalized graph are unchanged. Local commit hooks remain required; independent TARGET
root install and serial exact-SHA fixture chains still require empty HOME/environment,
exact pins and prior Colima capacity check.

## Historical milestone-1 offline execution checkpoint

The user explicitly answered **Execute offline scope**, adopting the entire execution
block in `03-fresh-session.md`: local authoring, fixture validation and forward scoped
local commits only. This supersedes the documentation-only authority in the historical
preparation checkpoint below, not any publication/live-account/production safeguard.
No push, hosted execution, credential read, live inventory, cloud/settings/source change,
identity job, deploy/ref promotion or retirement is authorized or performed.

Shared pure contracts are authored in `scripts/ci/release-contract.mjs` and
`config/release-policy.json`; design, original-workflow read inventory, public references
and test seams are in `release-contracts.md`. Validation receipts remain non-authorizing;
phase-2 schema-v1 markers and all five unprivileged CI workflows are unchanged. Both new
manual/automatic flags are false for every site and unknown configuration stays null.
There is no new deployment or recovery dispatch entry point. Trusted attempt-specific
observation adapters, credential gates, serialized persistence and per-site ports remain
unimplemented; caller-supplied flags cannot substitute for production proof.

Per-site ledger update (applies individually to Paul, DiLoreto, Carolyn and Sarabeth):
**blocked before production preparation; offline foundation in progress**. Offline scope
approval is recorded above; every per-site live/settings/cloud/candidate/cutover/enablement/
rollback-drill approval remains absent. All live identifiers and rollback values below
remain uncollected. Sources remain the sole permitted production owners; no migration.
Next safe action: targeted foundation review, then local per-site ports in that order.
Full app chains require committed code and an independent TARGET root install with exact
pins, empty HOME/environment, serial fixture chains and prior Colima capacity check.

Targeted validation passed under Bun 1.4.0 / Node 24.20.0, empty HOME/env and explicit
safe tools: `test:ci` 49 Bun tests / 529 assertions (nine new foundation tests / 206
assertions) plus six Python artifact tests; `test:workspace` 30 tests / 433 assertions;
Node syntax checks for both new modules. Scratch log:
`/private/tmp/websites-phase3-foundation.dOqX7k/targeted-validation.log`.
No install or real Docker invocation occurred. Foundation implementation commit:
`0d2aa7b73156b5e7a6d1b768d75883597a9d7dbb` (`chore(ci): establish offline release foundation`),
a forward child of the accepted baseline. Its 12 reviewed paths are the eight carry-over
preparation files plus policy, helper, tests and design. Pre-commit serial lint passed
4/4 uncached; commitlint passed. The first empty-environment commit attempt failed before
hooks because identity was unavailable; the parent approved explicit author/committer
`Paul DiLoreto <soodohh@pm.me>` environment values only. No config/hook bypass or modification.
Targeted-validation log SHA-256:
`5a19b9253afef3815990b739c6658b48aca98fa5988a64a533dc40d61750f5bf`.
All checks were targeted worktree checks, not a full exact-SHA independent app chain or
hosted release result. Index/worktree were clean after the foundation commit. This later
handoff update records evidence only; independent review remains pending.

Next-stage state requirement: persist CURRENT served release separately from monotonic
high-watermark. An intentional legacy rollback must not lower that watermark; explicitly
approved restore-new cannot be skipped merely because its SHA equals the watermark.
Routine retries remain blocked. DiLoreto manual immutable-ref redeploy/revalidation is
separate from main-only `release-site` recovery and must not be erased by its constraints.

## Historical documentation-preparation checkpoint and authority

Prepared on 2026-09-06 in `/Users/pauldiloreto/Projects/websites/main/`.
Code/accepted main baseline: `4a947b3fd724ddfde7e633342095d41aefcbd6d6`.
The preparation changes are documentation only and currently uncommitted. Do not reset,
stash away or discard them. If later committed, resolve the actual documentation commit
with `git log -1 --format=%H -- docs/migration/03-production-cutover-handoff.md`;
do not label it as a new hosted test or deployment revision.

**Phase 2 is accepted. Phase 3 is not executed. All four sites remain unmigrated.**
Current user authority covers preparing this documentation for a fresh session only.
The proposed prompt in `03-fresh-session.md` must be explicitly adopted by the user
before its offline implementation/local-commit scope becomes authorized.

| Decision / evidence | Status |
| --- | --- |
| Publication | Accepted as verified by user: "Consider the publication verified." No agent publication command or fresh-clone results invented. |
| Trusted hosted main push | Run [34005716802](https://github.com/soodoh/websites/actions/runs/34005716802), attempt 1, all four apps/root/gate passed at baseline SHA. |
| Hosted manual full baseline | Run [34007139470](https://github.com/soodoh/websites/actions/runs/34007139470), attempt 1, all four apps/root/gate passed at baseline SHA. |
| Hosted scoped PR/artifact/cancellation acceptance | Passed; `phase2-hosted-acceptance.md` contains exact PR/run/merge-checkout/artifact identities. |
| Multiple-main-push evidence exception | Explicitly accepted by user: "main push behavior is accepted." No such experiment executed; not a waiver of phase-3 release-ordering tests. |
| Phase-3 documentation | Authorized and prepared. |
| Phase-3 code/local commits/publication | Not authorized or performed in this session. New explicit scope required. |
| Live GitHub/source/AWS inventory | No phase-3 access scope approved; not performed. Prior phase-2 inspection is historical evidence only. |
| Settings/IAM/stack/ref/candidate/domain/production writes | None authorized or performed. |
| Automatic enablement/old-writer disablement/trust removal/archival | None authorized or performed. |

Authoritative preparation files are under `docs/migration/`, not `/private/tmp`.
The original phase-3 plan body is preserved in `03-execution-plan.md` after its reconciled
entry checkpoint. Source convenience file `/private/tmp/websites-plan-3-production-cutover.md`
had SHA-256 `7f93a478371ab97c8b32176dc5dc46b1c43bdac1d1b4d6a05bca72e8dfe314cc`.
A missing scratch file does not erase durable acceptance or require redoing completed work.

## Read before any phase-3 implementation

1. Root `AGENTS.md`, then all four `apps/<site>/AGENTS.md`.
2. This file, the entire `03-execution-plan.md`, and `03-fresh-session.md`.
3. `01-history-and-turborepo-handoff.md`, `02-execution-plan.md`,
   `02-scoped-ci-handoff.md`, `phase2-hosted-acceptance.md`, and `ci-parity.md`.
4. `source-imports.json`, `history-normalization-decision.md`, both SHA maps and
   their normalization/redaction proof JSON. Historical local validation and review
   records retain their checkpoint meanings; do not globally update their old SHAs/statuses.
5. `production-inventory.md` (currently a clearly marked uncollected template).
6. All six original workflows at each normalized `importCommit:targetPrefix` from
   `source-imports.json`, then current app deploy/rollback/IaC scripts and security tests.
   Phase-2 parity maps all 13 original jobs and 133 steps; it is not a replacement for
   reading the deployment logic before changing it.
7. Current root scope/artifact config, helpers, CI workflows, tool pins, Docker wrappers,
   root/app manifests and accepted root lock. Recheck the plan's current public references
   before implementation; no new live API/hosting assumptions were researched here.

Original workflow names: Sarabeth `ci.yaml` and `infrastructure.yaml`; Paul
`deploy.yml` and `rollback.yml`; Carolyn `visual-tests.yml`; DiLoreto `deploy.yml`.
Paths are `.github/workflows/<file>` relative to historical import prefixes.

## History and identity ledger

These original approved source-main IDs are import provenance, **not current production
release markers**. Normalized imported heads have pre-import root layouts, **not modern
monorepo release layouts**. No source catch-up/freeze has been approved or performed.
Source freshness observations in phase-2 records are historical, not a live freeze.

| Site | Original approved source SHA | Normalized imported head |
| --- | --- | --- |
| sarabeth | `dc3e3f956ccbc49a0361cddc0b79b655e46c000d` | `c3e8a41c4fca59c77a47a1150c61ea8ac747703c` |
| carolyn | `8c70afc7748ab4a18e596df597a641c9aad97ad6` | `7d10d05de25c10b3ec8e621d21530d13564a37a5` |
| paul | `15630718474e8b97f7c9150dfc2357825e352adb` | `2980d3aa065d80b55e8c670f75a24609617dc3d6` |
| diloreto | `02e49ba0c4229b864659f787493ff24678c93e6c` | `920d93ffad09a0e97a2ba5b2e13f9a2165fd173b` |

Normalized initial: `2e6fb629522ff1ced21533bd572aff874bd2db90`.
`history-normalization-commit-map.txt`: 1,109 bijective pairs, SHA-256
`d7ffd0daacd01c4220e5de4f790510a174082e1d90fc76beb4a904ea91490c7b`.
Portfolio original IDs first use `portfolio-commit-map.txt` (152 pairs), then the
normalization map. All four normalized imported heads/import commits and pristine
import trees were rechecked locally during phase-2 reconciliation. Preserve the graph,
private original bundles and maps; no further rewrite, raw subtree pull or source mutation.

## Per-site cutover ledger — all blocked before implementation

Accounts/regions and old mechanisms below are **plan baselines, not live inventory**.
New environment/concurrency/ref labels are proposals awaiting reviewed inventory and approval.
Each row inherits every common state field below; replace unknowns with evidence, not guesses.

| Site / status | Old repository / production mechanism baseline | Proposed new source / hosting path | Expected account / region | Proposed environment / concurrency |
| --- | --- | --- | --- | --- |
| paul — blocked | `soodoh/portfolio-website`; main validation, manual WEB ZIP candidate -> main | `soodoh/websites` trusted main validation, same verified ZIP candidate -> main | `658271954302` / `us-east-1` | `production-portfolio` / `portfolio-production` |
| diloreto — blocked | `soodoh/diloreto-website`; manual WEB ZIP -> main, separate public CloudFront | `soodoh/websites` trusted immutable validation, same existing origin/edge | `658271954302` / `us-east-1` | `production-diloreto` / `diloreto-production` |
| carolyn — blocked | `soodoh/carolyn-portfolio`; WEB_COMPUTE from `amplify-production` | `soodoh/websites` validated commit promoted to dedicated `amplify-production` | `725669362139` / `us-west-2` | `production-carolyn` / `carolyn-production` |
| sarabeth — blocked | `soodoh/sarabeth-studio`; WEB_COMPUTE from main, CMS rebuilds | `soodoh/websites` validated commit promoted to NEW `sarabeth-production`; retain old main branch for rollback | `015989770400` / `us-west-2` | `production-sarabeth` / `sarabeth-production` |

Sarabeth infrastructure environment proposal: `infrastructure-sarabeth`, account
`015989770400`; separate protected infrastructure role and operation, coordinated with
routine release ownership. No `production-paul` identity rename is proposed.

### Common current fields — separately applicable to every site

- Status reason: documentation ready; phase-3 offline execution and live inventory not
  authorized. No app is identity-verified, candidate-verified, cut-over or retired.
- Approvals: only shared phase-2 acceptance and planning authority above. Per-app cloud,
  writer-freeze, candidate, production, auto-enable, rollback-drill and cleanup approvals: none.
- Accepted normalized checkout: baseline SHA above. Phase-3 config commit: none.
  New tested production checkout/deployed SHA/run/build-attempt: none.
- Live old repository/ref/SHA, Amplify app/branch/domain IDs, stack/logical resource IDs,
  role ARNs/subjects, candidate/production URLs: **uncollected**. Do not infer from filenames.
- Active writer: original source pipeline remains the sole permitted owner under the plan;
  actual live trigger/job states are uncollected. No ownership transfer occurred.
- New automatic-enable flag: no deployment entry point implemented; required effective
  policy is disabled/fail-closed. Remote variable existence/value is uncollected, not asserted false.
- GitHub environment settings, OIDC identity/configuration, GitHub App authorization,
  protection approval, change-set replacement assessment: uncollected/not performed.
- Source drift/catch-up/freeze: not freshly checked; no new catch-up map or freeze approval.
- Last-known-good marker, exact old release SHA, verified rollback bytes/checksum/location,
  restoration commands and rehearsal: uncollected/not prepared. No rollback is declared ready.
- Candidate/default-domain tests, production/non-sending smoke, route/auth/source checks,
  origin/edge checks, CMS policy verification, monitoring/retention acceptance: not run.
- Change-set/run/job URLs for phase-3 work: none. Prior phase-2 CI URLs are not deployment URLs.
- Pending trust cleanup/retirement: nothing changed; no rollback window agreed. Never remove
  shared OIDC ownership, another app's role or original source worktrees/bundles.
- Next safe action: read the full plan and obtain/adopt explicit offline scope. Until then,
  local read-only `git status --short` and `git rev-parse HEAD` plus document inspection only.

### App-specific first production-preparation blockers

1. **Paul first:** verified current legacy ZIP and allowlisted legacy provenance reader;
   approved cross-repository read access or verified migration manifest if needed; candidate
   legacy -> new -> legacy -> new restore rehearsal. No baseline reset to bypass legacy recovery.
2. **DiLoreto:** retained old ZIP, trusted current verification-harness root install/app cwd,
   origin+edge+browser invariants. Keep CloudFront aliases, DNS, paul redirect and certificates.
3. **Carolyn:** in-place repository/buildspec change assessment, exact dedicated source ref,
   one ref-promotion/release/smoke critical section, actual CMS trigger inventory, compute/auth
   role boundaries. Preserve CDK logical IDs and fixture-only IPv4 workaround.
4. **Sarabeth:** new branch resource without destroying old main; approved domain remap;
   branch-scoped compute/deploy/SSM/webhook rules; exact bundle/job source attestation.
   Preserve `/sarabeth-studio/production/last-known-good-sha` and its actual legacy value.
   The normalization map is not a replacement release attestation or rollback recipe.

## Offline implementation work packages — not yet executed

| Package | Deliverable / exit evidence |
| --- | --- |
| Contracts and authorization | Explicit short-key mappings; trusted source/event/run/build-attempt checks; wrong repo/account/env/site/SHA and PR artifact rejection; root validation stays unprivileged. |
| Scope/order/recovery | Reuse `release-inputs`; add ancestry/provenance, per-app progression, non-FIFO reconciliation and trusted `release-site` recovery; deterministic interleaving/failed replacement/shared-input/out-of-order/rollback tests. |
| Static releases | Per-app workflows, same-byte candidate/promotion and verification; legacy Paul reader/recovery contracts; trusted DiLoreto harness; reviewed static provenance schema evolution without rewriting historical records. |
| SSR releases | Root `amplify.yml`, exact toolchain/root frozen install, app-specific production build inputs and attestation; preserved Nitro/SSM/auth cleanup; dedicated real validated monorepo refs. |
| IaC/security | Owning-IaC exact dual-trust transition proposals and account guards; logical-ID/resource ownership preservation; fixture/offline template/type/synth/security tests. No live diff/lookups/change sets. |
| Runbooks and handoff | Per-site inventory questions, proposed changes and rollback commands only after IDs/evidence known; denied-identity tests; independent review; exact validation SHA/log evidence and next approval. |

The phase-2 scope comparator has no authorization or release-ordering semantics.
Its release mode excludes no docs; unknown root/shared inputs conservatively affect all.
New per-app deploy paths may initially affect all until explicitly mapped and tested.
Static schema v1 hard-codes `.github/workflows/ci.yml` and `releaseAuthorized=false`.
A new recovery workflow needs an explicit compatible contract, not spoofed metadata.
PR source heads and merge checkouts must remain distinct; neither is a production release.
SSR fixture bundles cannot become production outputs by relabeling them.

Existing tests assert exactly five active CI workflows and no production permissions.
Only when offline implementation is authorized, migrate those tests to assert the new
fail-closed boundary without weakening existing app-level security/deployment contracts.
Inert nested workflows remain until active parity is demonstrated, not deleted to silence tests.

Offline validation uses pinned Bun 1.4.0 / Node 24.20.0 / Turbo 2.10.12 and root bun.lock.
Use independent target clones after any explicitly authorized local commits; no source installs.
Never claim a dirty checkout or mapped historical SHA is the exact tested release revision.
All chains are uncached and serial per app; ARM64 Sarabeth/Carolyn and Playwright 1.62.1
baselines stay intact. Recheck Colima capacity; use only proven invocation-owned cleanup
with fresh refs and `docker image rm --no-prune` without force. No broader cleanup authority.

## Approval queue and resume rules

1. Explicit offline implementation/local-commit scope (proposed prompt in `03-fresh-session.md`).
2. Separate live read-only inventory: exact repositories, accounts, profiles/roles, allowed
   metadata and endpoint scope. Fill `production-inventory.md`; never dump secret values.
3. Required CI gate, CODEOWNERS enforcement/environment restrictions/reviewers and monorepo
   GitHub App access: exact proposed settings changes need approval before application.
4. Per-app owning-IaC changes and identity-only checks; source freeze/drain; candidate;
   production switch/domain remap; smoke/provenance; automatic enablement; rollback window;
   exact old trust removal. Each gate records approval and evidence before proceeding.
5. Optional exact acceptance-PR cleanup and evidence publication need separate approval.
   Never merge the temporary markers or assume prior test-branch approval covers deploy refs.

No new production inventory or rollback values are invented to make this ledger complete.
Stop at each unresolved gate and update this file after every implementation/approval change.
Production completion requires every condition in section 8 of `03-execution-plan.md`;
phase-2 acceptance and offline preparation alone never satisfy it.

## Documentation preparation validation

Passed: original plan execution body byte-equal to its scratch source; all eight expected
changes restricted to documentation; source/import IDs match `source-imports.json` and
normalized imported heads remain ancestors; relative Markdown links and whitespace valid;
accepted exception carried through all current handoffs; `git diff --check` clean.
An initial scratch wording check did not normalize a Markdown line wrap; its corrected
check passed without changing the acceptance text. No app/runtime test was needed or run.
HEAD remains the accepted baseline, index unstaged; no commit, push, workflow, buildspec,
application, dependency, source-repository or live-resource change occurred in this step.
Convenience summaries are at `/private/tmp/websites-plan-{2,3}-results.md`.
