# Phase 3 handoff — all-four offline authoring accepted; no production migration

## Current publication gate — PR only; user migrated main to ruleset22398923

User explicitly approved “commit, push, and continue,” then disclosed their migration from
classic protection to rulesets. Read-only reconciliation confirms active exact-main
ruleset22398923, no bypass actors, PR/strict CI gate15368/deletion/non-fast-forward rules.
**Conversation resolution is off; only squash merges are permitted.** User selected
**“Publish PR only”** after these differences were presented: leave settings unchanged,
publish accepted history plus documentation to `migration/phase3-offline-preparation-20260906`
for PR CI, but do not merge, rewrite history or execute production operations. Main remains
at observed4a947b3f. No new full-tested SHA is claimed;37dac114 remains the full-tested checkout.
See [github-browser-settings.md](github-browser-settings.md) for current approval/readback,
including the superseded classic-rule observations. Source/AWS inventory still needs exact
scopes. All four sites remain NOT migrated; runtime/publication code locks stay closed.

## Historical browser checkpoint — main and four production environments saved

The user accepted routine solo risk, excluded infrastructure, then requested browser setup
and personally completed GitHub Confirm access. [github-browser-settings.md](github-browser-settings.md)
records the separately authorized browser continuation and final reopened UI checks on
2026-09-06 at18:56Z. These are configuration readbacks, not executed enforcement tests.

- Exact-main classic rule **82810912** is saved: PR required, approvals/code-owner/latest-push
  approval off for the solo model; only `CI gate` from GitHub Actions required, strict
  freshness/conversation resolution/admin enforcement on; force pushes/deletion off.
- Four environments saved: `production-portfolio`21361791310,
  `production-diloreto`21361907728, `production-carolyn`21361962764,
  `production-sarabeth`21361988297. Each has only reviewer `soodoh`, self-review allowed,
  administrator bypass disabled in the UI, wait timer off, one Branch/main rule and no
  tags, secrets or variables. Final environment list matches exactly these four.
- **`infrastructure-sarabeth` remains absent and excluded.** No credentials, cloud grants,
  App access, source refs, runtime flags, workflows or deployments were changed/executed.

The earlier [REST422 attempt](github-settings-attempt.md), missing detailed error and
unknown cause remain preserved. Browser success does not relabel it. The CLI request and
human shell wizard were not rerun; do not run the old creation wizard now. Browser readback
selector ambiguity was reconciled read-only, without repeating writes. Multi-step environment
creation briefly had default/unrestricted settings; no credentials or execution were
introduced, and every final policy was verified after reload. No atomic-setup claim.

Next is separately scoped publication planning, source/AWS inventory or enforcement-test
planning—not deployment or further settings writes by default. No push/merge/canary/identity
job was performed. Local HEAD remains `cf33c900`; latest full-tested checkout remains
`37dac114`. Local documentation is uncommitted; no new fixture validation or tested-SHA
claim. The last observed published main was `4a947b3f`, not reread in the browser pass.
Phase-2/offline acceptance stands; all publication/runtime locks remain closed and **all
four sites remain NOT migrated**. Prior checkpoints retain their historical meaning.

## Historical final independent offline acceptance — 2026-09-06

**All-four bounded offline authoring/fixture acceptance is complete. Production migration:
NONE (0/4).** Final independent standards/security and parity/order reviews both report
`needsFixes=false`, no findings, and **OK with notes — bounded offline acceptance only**.
This closes the Carolyn implementation/review/evidence blockers, not any hosted/live gate.
Earlier pending/BLOCK statements below retain their historical checkpoint meaning and
are superseded only for current offline acceptance by this section. Prior Paul/DiLoreto
finding dispositions and reviewed Sarabeth flow at `53430066` remain intact; the fresh
all-four chain below, not that historical run, supplies current regression evidence.

### Exact source, tested checkout and later documentation

- Original isolated-cutover implementation: `6ccc6d8062739e690b999d58d9a76835b4fcadf4`;
  initial review started at docs HEAD `d7e1ea7d40bcbc9a70a7188e2831b9b7b18f0f98`.
- Final source-code fix: `866dd65d36ad9db9b8764758a22caf45c8dd5dcc`, following
  `fd580ecfd3b44fa380747e49e66478784261a6b0`. Both reject browser redirects before follow,
  including empty Location; no lifecycle, production-smoke or Sarabeth rewrite.
- **Latest independently full-tested checkout: `37dac114eaa41f487a893e9655b3b2d9a509be43`.**
  Only two evidence docs separate it from the final source-code fix. Its fresh TARGET
  root frozen install, complete serial canonical 4/4 and additional actual candidate
  10/10 are the accepted offline execution evidence.
- Reviewed evidence-only successor: `bedbc07cc50bdddcae75cfaaa6bc4fcef2812376`.
  This final handoff is another **docs-only successor, not a newly full-tested SHA**.
  Resolve its exact commit with `git log -1 --format=%H --
  docs/migration/03-production-cutover-handoff.md`; the unique final report records it.
  Operational docs remain release inputs: source equality does not authorize deploying
  a later docs SHA using an earlier checkout's validation.

### Independent axes and final finding dispositions

Reports live under
`/Users/pauldiloreto/.pi/agent/sessions/--Users-pauldiloreto-Projects-websites-main--/subagent-artifacts/outputs/72894acd-0125-4963-a2c3-827b08d39482/carolyn-review/`.

| Axis / report | Findings and final disposition |
| --- | --- |
| Standards/security: `initial-0.md` → `followup-0.md` → `final-review-0.md` | Initial no-blocker result's redirect-isolation assertion was superseded by the reproduced P1. Final review closes redirect-chain/empty-Location defect and missing auth/SSR execution evidence; optional retained resources, unchanged domains, trusted harness, credential filtering and production-state separation remain correct. No unresolved finding. |
| Parity/order: `initial-1.md` → `followup-1.md` → `final-review-1.md` | Initial P1 multi-hop browser escape fixed with real two-origin counter regressions; follow-up P1 four unexecuted auth/photography cases closed by unchanged ten-case TLS run and four actual CSRF denials. Exact candidate selection, durable intent before mutation, separate production rebuild/verification/CAS and Sarabeth ordering preserved. No unresolved finding. |

Final reviewer SHA-256 values:
`final-review-0.md` = `b7ff0dac9ea4f6f1a73adf3d6a75f04ad39f9cad35b9c8a70d5d17f0e259e099`;
`final-review-1.md` = `82af4c9ee628bc28c99907fceeb4a5af078870095ef3b58c16dd7c49ba1e5e47`.
Both are read-only source/evidence reviews, not second executions or independent digest
recomputations. This docs pass separately recomputed all 147 completed-file hashes,
six preserved prior/follow-up hashes and final review hashes; it ran no new test chain.
`final-fixes-validation.md` supplies the independent TARGET execution report; its SHA-256
is `cfe24dfc191fb6a6ba50b82dc6483f0dbd43848b595dfcde570ef1219b04d2ea`.

### Accepted execution evidence and retained limits

Exact commands, counts, tool paths, log digests and transport details follow in the
bounded validation checkpoint. In `/private/tmp/carolyn-tls-final.L26kKr/`, root
`bun install --frozen-lockfile` and `bun run ci:verify` passed (4/4 uncached, concurrency 1,
12m48.831s). `run-post-suite.sh` ran `history-checks.py`, `lint-history.mjs`,
`audit-installed-ranges.ts --full-graph` and four `artifact.py diagnostics` scans.
`run-candidate-tls-v2.sh` separately passed ten unchanged candidate cases in 2.6s with
zero failures/skips/retries and four real missing/cross-Origin 403/Forbidden probes.
No fixture result is production job/bundle/serving proof. Synthetic local TLS/direct
emitted-fetch dispatch, scratch-only certificate bypass and root-overridable chmod are
explicit limitations. Hosted Amplify API shapes/routing/source/job attestation remain
unverified; Docker stable-reference comparisons do not establish unrelated-service
continuity or raw snapshot equality.

All earlier failures remain retained: pre-fix escape, superseded cleanup guards, unshared
binds, missing browser path, six-pass/four-blocked transport, TLS hash preflight/export,
non-fail-fast recovery continuation and collector Size/self-sentinel corrections. No
failure is relabeled as passing. The canceled worker's absent report remains cancellation,
not failed testing or acceptance. User-approved restart from actual `fa06a3e6`, unknown
cause of missing tracked partial edits and byte-exact surviving-draft preservation remain
in the historical implementation checkpoint; neither history nor earlier artifacts changed.

This docs-only pass uses unique `/private/tmp/carolyn-final-handoff.QqRaHX/` evidence,
including `evidence-inspection.json`; previous convenience summary was preserved first as
`results-before-final-handoff.md` (SHA-256
`60a7e792dfdc99dfd9df7be2ea4e438ffd3fbdb38afa4773bd33d00b3b7519f9`).
The unique managed `carolyn-review/final-handoff.md` records final HEAD/status/commit evidence;
`/private/tmp/websites-plan-3-results.md` is refreshed convenience, not a recovery store.

**Next safe action: stop at the live approval gate.** Request only a separately scoped
read-only inventory under `production-inventory.md` if the user chooses to continue;
do not execute it now. Unknown IDs/subjects/candidate names remain null, optional CDK
candidate absent by default, candidate/promotion flags false and literal publication/runtime
locks closed. Actual recovery capture/retention/KMS, GitHub protections/access/identity,
in-place connection/change-set assessment, source/CMS freeze and writer drain, candidate,
separate exact-SHA production rebuild/serving acceptance, enablement, rollback drill,
trust removal and retirement each require their own later approval/evidence. No push,
publication, live inventory/credential read, production HTTP/CMS/email, workflow dispatch,
cloud/domain/release-ref/settings mutation or deployment occurred. Source repositories
remain the sole permitted production owners. Phase-2/publication/main-push acceptance and
its explicit exception remain accepted, not reopened.

## Historical final bounded offline evidence correction — 2026-09-06

**New full-tested checkout:** `37dac114eaa41f487a893e9655b3b2d9a509be43`.
Its application/release/test source is unchanged from code commit
`866dd65d36ad9db9b8764758a22caf45c8dd5dcc`; only the two identified evidence documents
separate those SHAs. Independent follow-up reviews `carolyn-review/followup-0.md` and
`followup-1.md` both close the redirect-chain P1 and identify only missing candidate
invalid-password/photography browser evidence. They find no further proven source defect.
The supervisor approved a bounded scratch-only true-HTTPS fixture transport, **not a
source change**. No gratuitous code commit, test assertion edit or production-smoke change
was made. This following docs-only evidence commit is **not a newly full-tested SHA**;
resolve it with `git log -1 --format=%H -- docs/migration/03-production-cutover-handoff.md`.
Final independent acceptance remains **PENDING**, not granted by this writer's report.

### Fresh exact-checkout validation

Independent TARGET: `/private/tmp/carolyn-tls-final.L26kKr/target`, local no-hardlink
single-main clone without alternates, copied ignored configuration/dependencies or source
repository access. Only its root installed `bun install --frozen-lockfile` (1,000 packages).
All validation used `env -i`, a freshly empty HOME and explicit pinned tool paths. Bun1.4.0,
Node24.20.0, Turbo2.10.12, Playwright1.62.1, Go1.27.1, ShellCheck0.11.0, uv0.12.9,
actionlint1.7.7 and cfn-lint1.42.0/1.53.0 remain unchanged. Actual Python3.14.6 is
`/opt/homebrew/Cellar/python@3.14/3.14.6/bin/python3`; local Chrome152.0.7977.77.

| Exact37dac114 gate | Actual result |
| --- | --- |
| Root `bun run ci:verify` | PASS 4/4 uncached, concurrency1; Turbo12m48.831s. Root30 workspace/433 assertions,60 CI Bun/939 assertions,six CI Python,52 release Python; workflow/shell/syntax gates |
| Carolyn full canonical chain | PASS120 unit/1,128 assertions;15 infra/87 assertions;three fixture+three hermetic-production artifact;100 browser=92 unchanged visual+eight redirect-policy regressions |
| Paul | PASS56 browser/four unchanged skips;three local Lighthouse runs each0.98 performance and1.00 accessibility/best-practices/SEO;complete static/type/workflow/shell/infra chain |
| DiLoreto | PASS13 genealogy,37 browser/one unchanged skip;complete static/type/output/infra chain |
| Sarabeth | PASS197 Playwright;seven host/container provenance tests;complete provider/fixture/waiter/Amplify/type/infra chain;actual Gitless marker equals37dac114 |
| History/maps/imports/graph/synth/diagnostics | PASS1,131 ancestral messages,zero errors/six preserved warnings;unchanged maps,normalized ancestry,four pristine imports,six-root installed graph;byte-identical original19-resource synth;four fixture/nondeployable diagnostic scans |

### Actual unchanged candidate harness: all ten pass

After the full serial chain and postchecks finished, a separately reviewed scratch TLS
edge ran on owned container loopback443. Container-only `/etc/hosts` maps exactly
`fixture-candidate.dfixture.amplifyapp.com` to127.0.0.1; **network none,zero mounts,no
published ports,private IPC,no privilege/devices/socket/credentials**. No host/VM DNS or
settings changed. All actually copied tracked Carolyn/.github source and scratch hashes,
Gitless checkout, exact tool versions and pinned preinstalled Chromium151.0.7922.34 were
checked before execution. The root Docker ignore deliberately excludes `.env.example`;
the corrected preflight excludes only that tracked file and explicitly asserts its absence.

The unchanged committed candidate spec/config/policy is imported, not rewritten. The
Node24 TLS dispatcher uses existing artifact manifest/clean-route/proxy helpers and the
**actual emitted Nitro fetch handler**, preserving the real HTTPS Request URL,Host,method,
body,auth/cookies and security headers through real TanStack middleware. It does not
monkeypatch Route/API, virtualize response URLs, synthesize Origin/Sec-Fetch metadata,
bypass CSRF or forge application responses. Its fresh one-day fixture key stayed only in
container `/fixture-cert` (0700,key0600); no key was exported. `ignoreHTTPSErrors` exists
only in scratch config for the fixture certificate, not any repository configuration.

**Actual result:10 passed in2.6s,exit0,zero failures/skips/retries**, including invalid
password and photography server-function behavior on both viewports. All72 TLS requests
reached only owned loopback;four successful browser server-function POSTs had the real
candidate Origin. Four additional missing-Origin/cross-Origin probes, without Sec-Fetch
bypass metadata, reached actual compute middleware and returned403/`Forbidden` across both
real function endpoints. The unchanged browser policy blocked163 off-origin requests.
Test, evidence-export and exact-owned-container removal each have distinct exit0 receipts.

This closes the **execution evidence gap for reviewer assessment**, not hosted Amplify
acceptance. The synthetic hostname,self-signed TLS,local static dispatcher and direct
emitted fetch entry are fixture transport, not cloud routing/domain/TLS/build-job/source
attestation. The original emitted HTTP listener starts but is unused by the candidate and
confined to network-none. Scratch chmod read-only remains root-overridable, not an immutable
bind. Production smoke and every Sarabeth lifecycle/source identity remain unchanged.

### Retained failures, cleanup and independent review handoff

Attempt1 failed solely because its hash manifest overincluded Docker-excluded `.env.example`,
before app build/cert/server/browser execution. Absent `/evidence` caused export1 and outer
launcher92 after preflight1; the exact stopped container was retained. The approved v2
preflight correction and all outputs have new paths; originals and prior six-pass/four-blocked
transport evidence remain intact. A recovery proof then overrequired raw HostConfig equality:
Docker changed only `OomKillDisable` null→false. Its outer shell lacked fail-fast and continued
the already approved v2 while the old container remained stopped; this **procedural failure
is retained**, not relabeled as successful recovery. A separately approved fail-fast fresh
proof admitted only null/false for that field, compared every other config field, and normally
removed the exact old stopped container. No concurrent running app chains occurred.

The first collector failed on an existing container's reported Size12.9MB→13MB (virtual3.71GB).
The supervisor approved treating Size,Status,RunningFor as dynamic and normalizing only mount
ordering; all other fields must match. Growth cause is not established. A second collector
self-matched its own quoted PEM sentinel; the final collector checks actual PEM header lines,
retaining both failures. No repository security/test assertion was weakened.

Exactly39 initially absent,non-FROM/non-cache build-log-proven images were removed after fresh
no-container/no-unrelated-tag-or-digest checks with `image rm --no-prune`,without force.
Initial/final109 reported image-reference rows and33 container identities/remaining stable
fields match. Raw snapshots are **not equal**; no unrelated-service continuity or filesystem
immutability is claimed, only absence of unrelated operations in the recorder. Colima data-disk
available capacity was6,936,096→6,935,112KiB. No old image,volume,service or daemon mutation ran.

Raw evidence: `/private/tmp/carolyn-tls-final.L26kKr/`.
`validation-evidence.json` verifies147 completed-file digests plus preserved follow-up/prior
reports. Its successful candidate result is separate from every retained failed attempt.

| Completed file | SHA-256 |
| --- | --- |
| `validation-evidence.json` | `9220ac338858d06c189adfb6fc8f5c37c0843361943a8b66a665f66c999c5872` |
| `root-ci-v2.log` | `dda043bbc9024f8241787cb441c413089060007347884c8b0720e05128c100b2` |
| `candidate-tls-v2.log` | `c40f7e0632dedfd08d7b35b9bc0a09c59a568aef0a2774ada8c896adee70e5ce` |
| `candidate-v2-tls-evidence/csrf-probes.json` | `42c6c7ddf2b4df9dbd188d2285d9752fa7ba237563fd4e6c3ab44f8dc9c4ad8c` |

**Next safe action:final independent source/evidence review and finding disposition.**
All four sites remain **NOT migrated**. Source owners,history/maps,pins,lock,screenshots,
thresholds,unknown/null live identities,literal-false gates and publication/runtime locks
remain unchanged. No publication,live inventory,credential read,production HTTP/CMS/email,
workflow dispatch,cloud/domain/ref/deploy/settings mutation,enablement,writer disablement,
trust removal,archival or rollback drill occurred. Each live gate still requires its separate
approval; accepted phase2/publication/main-push exceptions are not reopened.

## Historical redirect correction and exact-SHA fixture evidence — 2026-09-06

**Full canonical-tested code:** `866dd65d36ad9db9b8764758a22caf45c8dd5dcc`
(`fix(carolyn): reject empty candidate redirect locations`), following
`fd580ecfd3b44fa380747e49e66478784261a6b0`
(`fix(carolyn): block candidate browser redirect chains`). Both are forward children of
starting documentation HEAD `d7e1ea7d40bcbc9a70a7188e2831b9b7b18f0f98`;
the original isolated-cutover code remains `6ccc6d8062739e690b999d58d9a76835b4fcadf4`.
Normal serial Lefthook lint (4/4 uncached) and scoped commitlint passed for both fixes,
using the approved environment-only Paul DiLoreto identity, without bypass/config changes.
This following **docs-only evidence commit is not a new full-tested SHA**; resolve it with
`git log -1 --format=%H -- docs/migration/03-production-cutover-handoff.md`.

Initial independent reviews are `carolyn-review/initial-0.md` and `initial-1.md` under
managed output run `72894acd-0125-4963-a2c3-827b08d39482`. The latter's P1 is confirmed:
Chromium can follow a fulfilled same-origin redirect without routing its later hops.
The real pre-fix two-loopback regression contacted the second origin's `/escaped` route.
The supervisor approved aborting **every 3xx carrying Location, including empty Location**.
Current policy does so; unit fixtures distinguish absent/empty headers, and the canonical
browser gate executes nonredirect control, direct, multihop and empty-header regressions.
The original production smoke, API no-follow assertions, candidate/production lifecycle,
Sarabeth flow, resource identities, locks, dependencies and snapshots are unchanged.
Initial-0's broader redirect-isolation assertion is superseded; its other positive source
observations stand. Finding closure and overall acceptance still require follow-up reviewers.

### Final independent TARGET result (not independent reviewer acceptance)

Fresh local no-hardlink, single-main TARGET:
`/private/tmp/carolyn-review-final.ysn726/target`, exactly the full code SHA above.
No alternates, copied ignored configuration/dependencies or source-repository access.
Only this new TARGET root installed `bun install --frozen-lockfile` (1,000 packages).
Validation used `env -i`, newly empty scratch HOME and explicit safe pins: Bun1.4.0,
Node24.20.0, Turbo2.10.12, Python3.14.6 at
`/opt/homebrew/Cellar/python@3.14/3.14.6/bin/python3`, Go1.27.1, ShellCheck0.11.0,
uv0.12.9, actionlint1.7.7, cfn-lint1.42.0/1.53.0 and host Chrome152.0.7977.77.

| Exact-SHA gate | Actual result |
| --- | --- |
| `bun run ci:verify` | PASS 4/4 uncached, concurrency 1, 12m46.193s; root 30 workspace/433 assertions, 60 CI Bun/939 assertions, six CI Python and 52 release Python tests; actionlint/ShellCheck/syntax gates |
| Carolyn complete canonical fixture chain | PASS 120 unit/1,128 assertions; 15 infra/87 assertions; three fixture + three hermetic-production artifact tests; 100 browser invocations = 92 unchanged visual + eight isolation regression runs |
| DiLoreto complete chain | PASS 13 genealogy, 37 browser, one unchanged viewport skip; types/static/output/cfn-lint |
| Paul complete chain | PASS 56 browser, four unchanged viewport skips; three local Lighthouse runs each 0.98 performance and 1.00 accessibility/best-practices/SEO; remaining static/type/workflow/shell/cfn-lint gates |
| Sarabeth complete chain | PASS 197 Playwright; seven host/container provenance tests; provider/fixture/waiter/Amplify/type/workflow/cfn-lint; actual Gitless container marker equals tested SHA |
| History/maps/pristine imports/installed graph/synth | PASS 1,130 ancestral messages, zero errors, six preserved footer warnings; both unchanged maps/bijections, normalized ancestry and all four pristine imports; exact accepted six-root installed graph; byte-identical original 19-resource CLI synth |
| Four diagnostic scans | PASS fixture/nondeployable; no hosted upload or production artifact provenance claimed |

### Actual candidate harness execution — incomplete transport, not a pass

The exact committed candidate spec/policy/config was additionally executed with a reviewed
scratch-only browser/API loopback transport. Final attempt used pinned image Chromium
**151.0.7922.34**, Playwright1.62.1, Bun1.4.0 and Node24.20.0, a Gitless exact-source
hash preflight, fresh container HOME, `env -i`, explicitly verified preinstalled
`PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`, **network none, zero mounts, private IPC and
no extra devices/privilege**. Only three reviewed scratch files were copied into a
separate container directory; no app source/config/dependency edits or installs occurred.
Scratch `chmod` read-only is only a permission convention (root could override), not an
immutable bind. API `response.url()` is virtualized by the transport; it proves no real
hosted origin identity. Every forwarded URL was loopback with redirects disabled.

**Final candidate attempt: six passed, four transport-blocked, exit 1, zero skips/retries.**
Public routes/assets, redirect/client-error assertions and exact root SHA ran on both
viewports. Auth/photography browser POSTs stopped with
`Missing actual same-origin browser metadata`: even `request.allHeaders()` lacks
Sec-Fetch-Site at this interception boundary. No metadata was synthesized and CSRF was
not bypassed. Final logs record 62 loopback transports (34 browser/28 API), 123 policy
blocks and executed origin-escape denial probes. This is meaningful harness execution,
**not all-ten acceptance**, production smoke or an identified application defect.
The supervisor chose a bounded stop; a separately reviewed true same-origin fixture
transport may be needed if follow-up reviewers require complete candidate-harness proof.
No such new transport design is authorized or implemented here.

Retained failures: pre-fix browser redirect/counter logs; the superseded `fd580ecf` full
attempt stopped after Carolyn passed at a scratch cleanup guard overrestricting Docker's
exact own-image RepoDigest (not an app failure); two candidate bind creates failed because
neither chosen host prefix was shared by Colima; mount-free v1 had ten browser-launch setup
failures after empty environment removed the browser path; v2 ran six passes/four 403-backed
failures under loopback/virtual-Origin mismatch. The incomplete-header hypothesis was
insufficient: v3's actual metadata absence is retained, not relabeled as an app regression.
No test assertion, snapshot, threshold, CSRF check or production harness was weakened.

### Evidence, bounded cleanup and remaining gates

Final raw evidence: `/private/tmp/carolyn-review-final.ysn726/`.
Superseded/failing regression evidence: `/private/tmp/carolyn-review-full.neNUaQ/`.
`validation-evidence.json` verifies 171 completed-file digests plus initial reviews and
superseded logs. It explicitly records candidate failure, not a green acceptance envelope.

| Completed evidence | SHA-256 |
| --- | --- |
| `validation-evidence.json` | `f524abe4cb2ec6887bb9f0b45c93a18a6c70ab637b001787926eb708320beb0e` |
| `root-ci-v2.log` — final canonical PASS | `3ee4ba69fd49b9c3b41bc7c542cda111352bfba6da274d26fce8e6bf5071b6d0` |
| `history.log` | `79ee3bf58c6c0a00871a4d7e4868987dd847a7a038ddba5d5dfaa844e9fbaa68` |
| `post-suite-checks.log` | `46c0e3539f1e73a1b747d9b4aefdecb9eaf56909609122500bf6742c111f9356` |
| `candidate-run-mountfree-v3.log` — six pass/four blocked | `d77989620daa6762ce0ba506e6045f9c4c490c9356efdf604968356c70c3cacd` |

Final invocation Colima data-disk availability: 6,934,732 → 6,937,936 KiB.
Exactly 39 initially absent, non-FROM/non-cache, build-log-proven images were removed
with fresh zero-container/no-unrelated-tag-or-digest checks and `image rm --no-prune`,
without force. The only permitted top-image digest was its exact invocation repository
at its actual full image ID; intermediate images had no tags/digests. Terminal blocked
candidate-image cleanup was separately approved and does not assert those tests passed.
Pre/post 109 image-reference rows and 33 container rows match on stable fields.
Raw container JSON differs: Mounts ordering and Status/RunningFor are not byte-equality
or unrelated-service continuity guarantees. No old image, volume, daemon or unrelated
container mutation occurred. The stopped prior invocation's separate bounded cleanup
and initial/final reference proof are retained too.

**Acceptance remains pending follow-up independent reviewers; all four sites are NOT
migrated.** Source repositories remain production owners. No live inventory, credential
read, production HTTP/CMS/email, hosted workflow, publication, resource/domain/ref/cloud
mutation, deploy, enablement, writer disablement, trust removal, archival or rollback drill
ran. All literal-false gates, nullable unknown identities and runtime/publication locks
remain closed. Existing phase-2/publication/main-push acceptance is not reopened.
Next safe action: review the final code and raw evidence, explicitly disposition the
four candidate transport-blocked cases, and only then decide any additional offline
fixture work. Every live preparation/candidate/production/retirement gate still requires
its separate approval.

## Historical Carolyn isolated first-cutover authoring checkpoint

**Committed code:** `6ccc6d8062739e690b999d58d9a76835b4fcadf4`
(`feat(carolyn): isolate first-cutover candidate and production rebuild`), forward from
`fa06a3e68fd2e0c759afe5448287b94084421d9a`; 22 paths, 1,471 insertions / 17 deletions.
Normal Lefthook serial lint (4/4 uncached) and scoped commitlint passed with approved
Paul DiLoreto environment-only author/committer identity, without hook/config bypass.
This following evidence-only documentation commit does not change the tested code.

A **second new independent TARGET** at exactly that code SHA, `target-committed/` under
the unique evidence directory below, passed a fresh root frozen install and the entire
same targeted sequence in the table below (including fixture-building typecheck).
`committed-targeted.log` SHA-256:
`716d7b71fc68cb03b61fa4b5c750c5bdddd1c043ee9123b3c5416ac10267744c`.
It used `env -i`, the same explicit pinned tool paths, new initially empty
`home-committed/`, no hardlinks/alternates/copied ignored configuration or dependencies,
and finished with clean tracked worktree/index. Its default CLI template is byte-equal
to the original 19-resource baseline too. This is **writer-run exact-SHA targeted
validation**, not an independent review, full Docker chain or deployed-browser pass.
The complete committed-targeted invocation had no failed attempt; earlier authoring
failures remain separately preserved below.

The user approved **an isolated explicitly configured candidate branch followed by a
separate exact-SHA rebuild on existing `amplify-production`**, not domain reassociation.
This supersedes only the earlier unimplemented Carolyn seam below. Source repositories
remain sole production owners; all four sites are **NOT migrated**. Independent review
and full exact-committed-SHA fixture validation of this change remain REQUIRED; the prior
all-four result at `534300664a683712f5c2cd73776fef3c6bb2fb54` does not validate this code.

Starting HEAD was `fa06a3e68fd2e0c759afe5448287b94084421d9a`. The canceled
`96ee1c0b-4903-417a-a056-216da35659bc` worker's absent report is cancellation, not a test
failure or acceptance. Initial inspection found **only** untracked
`scripts/release/carolyn_transition.py`, not the expected tracked partial edits. The
parent independently confirmed this and the user explicitly chose **Restart from current
base**; the cause of the missing tracked edits was not established. The remaining draft
was copied byte-exact before replacement to
`/private/tmp/carolyn-astra-00636229-evidence/carolyn_transition.original.py`, SHA-256
`c5a82a0b3b1e4ffb8c4d13f070c094a90028b9c84f2b148cdeb91cb4fd8ac5dd`.
Critical inspection found missing integration, the coupled promotion enable predicate,
production-directed candidate smoke, and insufficient ownership/job/baseline rechecks.
The replacement is newly authored and tested, not an accepted continuation of that draft.

### Concrete implemented protocol

- `monorepoTransition.candidateBranch` in the owning Carolyn CDK context is optional/null.
  A supplied DNS-safe exact name requires the explicit monorepo connection decision and
  excludes existing reserved production/main refs. Only then is retained
  `MonorepoCandidateBranch` synthesized. Existing domain mappings, production branch,
  compute/secret/account/logical identities and old trust remain. Exact candidate branch/
  job policies and read-only observations of the two existing domain associations are
  conditional; no domain mutation or branch-creation API is in the release adapter.
- Checked-in `candidateBranch`/`candidateUrl` remain **null**; `candidateEnabled` and
  `promotionEnabled` remain independently **false**. Build admission requires BOTH the
  reviewed checkout's exact candidate name and CDK's `CAROLYN_CANDIDATE_BRANCH`, exact
  app root/account/Git SHA/RELEASE job ID/message/type, with fixture and uncollected CMS
  rebuild denials unchanged. Auth manifest and secret cleanup remain unchanged.
- Candidate verifies the repository/app/default domain, both branch roots/disabled
  writers, paginated terminal-job inventory, original domain bindings and production
  ref. Owner/ETag CAS claims intent before ref CAS/start-job. The actual new candidate
  job, source and bundle marker precede isolated public/auth/SSR/404/root-release smoke.
  `acceptedCandidate` separately stores hosting/domain/production-ref bindings, previous
  production snapshot, generation and candidate receipt. Production currentRelease,
  highWatermark, lastLifecycleReceipt and LKG are not advanced.
- The new trusted `playwright.candidate.config.ts`/`amplify.candidate.smoke.ts` requires
  exactly `https://<explicit-branch>.<explicit-app-id>.amplifyapp.com`. Marker and API
  requests do not follow redirects; browser routes block **every off-origin request**,
  with service workers disabled. No canonical/legacy production or CDN HTTP is needed
  for candidate acceptance. Photography checks the SSR function/content/image URL but
  intentionally does not decode the blocked external image. The original production
  harness is byte-unchanged and retains canonical/default equality, aliases, redirects,
  public/auth/status checks and external-image decode acceptance.
- Separate `carolyn_operation=promote` requires an exact nonempty 40-hex
  `carolyn_candidate_commit`. The supervisor approved this narrow selector extension
  because pinning only latest main would strand accepted candidate A after unrelated B.
  Selection preserves actual observed main separately, verifies candidate ancestry and
  modern root layout, and freshly validates the exact candidate checkout with the trusted
  workflow-SHA harness. Nonempty candidate SHA on any other operation/site is rejected;
  normal main recovery and DiLoreto selected-ref semantics remain intact.
- Promotion consumes matching accepted-candidate evidence, re-observes validation,
  scope against actual current main, hosting/domain/ref/latest jobs and exact state
  generation/ETag, and claims durable intent BEFORE production ref/job mutation. It
  rebuilds the same SHA on existing `amplify-production`; the actual new production job,
  marker and original production smoke must pass before `production-verified` and final
  CAS advance production state. `lastSsrCutover` retains candidate/previous recovery.
  Receipts explicitly attest **separate SSR rebuilds**, never static same-byte ZIPs.
  Routine SSR release still denies first-cutover state without this protocol.
- Unknown start/ref/serving/CAS outcomes retain reconciliation obligations. An ambiguous
  successful external write may already have changed S3 despite a failed invocation;
  do not assert persistence failed unchanged. Lost ownership prevents cleanup mutations;
  no unconditional retry, stale-ETag rebase, legacy-SHA push, domain reassociation or
  blind rollback is implemented. Existing S3 encryption/owner/CAS and Sarabeth correction
  semantics are preserved.

### Targeted fixture evidence and remaining approvals

Unique evidence directory: `/private/tmp/carolyn-astra-00636229-evidence/`.
Only its new independent local TARGET checkout ROOT ran `bun install --frozen-lockfile`
(1,000 packages); no existing-worktree/source install. All checks used `env -i`, freshly
empty scratch HOME and explicit safe paths in `environment.sh`: Bun1.4.0, Node24.20.0,
Python3.14.6 at `/opt/homebrew/Cellar/python@3.14/3.14.6/bin/python3`, Go1.27.1,
ShellCheck0.11.0 and jq1.8.2. Dependencies/lock/Turbo2.10.12/Playwright1.62.1 unchanged.
Initial targeted runs used an explicitly overlaid authoring snapshot, not an asserted
committed-SHA/full-chain build. `targeted-complete-v2.log` records the passing final snapshot:

| Command | Actual result |
| --- | --- |
| `bun run test:workspace` | 30 tests / 433 assertions pass |
| `bun run test:ci` | 60 Bun / 935 assertions; six CI Python; 52 release Python pass |
| `bash scripts/ci/lint.sh` | Root/nested actionlint, ShellCheck, shell/Node/Python syntax pass |
| Carolyn `bun run lint`, `infra:typecheck`, `infra:test`, `infra:synth` | Pass; 15 infra / 87 assertions; default CLI synth 19 resources |
| Carolyn `bun run test:unit`, `bun run typecheck` | 120 unit / 1,125 assertions; fixture build and app types pass (same complete targeted log) |
| Candidate Playwright `--list` with explicit fixture-only identity | 10 tests collected; **no browser or deployed smoke executed** |
| Baseline-versus-current default CLI synth | Byte-identical 19-resource templates, SHA-256 `d3692bfbbe154221c8ab34133a712c54f97005025ded527437615fddec435002` |

Integrated fixtures exercise actual deploy routing, trusted observation, ref CAS argv,
state/CAS/receipt/job and smoke selection, with only external APIs/Git/HTTP/tools replaced.
They cover wrong repository/branch/job/SHA, independent flags, absent/unsafe config,
production preservation, candidate→production rebuild, stale scope/ref/generation/ETag,
active paginated jobs, unknown start/persistence, serving failures and first-cutover
routine denial. Real fixture Git histories exercise A/unrelated B eligibility versus
relevant/shared-lock C denial, old-layout/nonancestral/malformed selection rejection,
and selected-SHA validation-wrapper/request provenance wiring. The actual browser route
policy is unit-executed with external response fixtures: fetch never follows redirects,
and absolute/protocol-relative production Location headers abort before browser follow.

Retained failed authoring checks: an unsafe optional-chain lint diagnostic, then a test
fixture type missing `Effect`, an erroneous direct-App resource-count assertion (18
application resources versus CLI's additional CDK metadata = 19), and formatting of the
corrected type, a direct Bun filter missing its required `./` prefix, and a readonly
fixture tuple passed to a mutable-array assertion overload. Each was corrected and rerun; logs are retained, not relabeled. Existing
Biome schema-version information and CDK deprecation/NoEcho-name warnings remain. No
Docker/full-chain invocation or image/container cleanup occurred in this worker.

Next safe gate: independent security/parity/order review and committed TARGET full
fixture validation. Live IDs, repository connection capability/replacement assessment,
GitHub App access/subjects/protection, candidate name/CMS/credentials, recovery capture,
S3/KMS retention and real writer/job inventory remain unknown. All literal-false workflow
calls/jobs, publicationLocked and runtime flags remain closed. Publication, read-only
inventory, resource/connection preparation, identity-only checks, source/CMS freeze/drain,
candidate execution, production rebuild, enablement and retirement each still require
separate approval. No live access, production HTTP/CMS/email, ref promotion, provisioning,
push or other production operation was executed.

## Bounded recovery disposition — 2026-09-06

**Full tested code + reviewed correction SHA:**
`534300664a683712f5c2cd73776fef3c6bb2fb54`
(`fix(ci): separate SSR candidate and production acceptance`), a forward child of
`db90a3f551939bb16b033fd01da22807be7fdba6`. The correction has 15 paths,
690 insertions / 63 deletions. Normal Lefthook serial lint and scoped commitlint passed
with approved environment-only identity; no hook/config bypass or history rewrite.
This following **docs-only evidence commit is not a new full-tested SHA**; resolve its
identity using `git log -1 --format=%H -- docs/migration/03-production-cutover-handoff.md`.
The final runtime-authoritative `recovery/final-handoff.md` report records the final HEAD.

Independent parent source review at that exact code SHA found no additional Sarabeth
blocker and closed its candidate/production P1 subject to exact-SHA fixture validation,
which has now passed. Review:
`/private/tmp/websites-phase3-ports/report-recovery/parent-ssr-review-53430066.md`, SHA-256
`bf1d5f2ef43f2e640a5b1d9e0f9448c88aff5c7b16f5e06105cff974578d1544`.
It inspected the committed implementation, wiring, IAM and fixtures; it did NOT execute
another test chain or any hosted/production request. Cross-step CLI ETag persistence is
source-inspected, not claimed as hosted coverage. Historical `final-parity.md` **BLOCK**
is preserved (SHA-256 `222a5a73177198fb995e230a7887b334e6f05846f4e32849ce2a47a2ff4e0f0a`);
`final-security-order.md` remains its earlier bounded OK-with-notes review
(SHA-256 `a774b935e347901ee543013e7b1877465fe81a09734ebbe52ff6d8c475b3bd88`).

**All-four offline completion remains BLOCKED for Carolyn's unimplemented first-cutover
candidate/ref/build/IaC/production-promotion seam. All four sites are NOT migrated.**
This is a bounded reviewed/tested Sarabeth correction, not complete phase-3 acceptance,
publication authority, a release candidate, or production readiness. Do not initialize
`ssrProductionAccepted`, repurpose URLs, or invent resources to bypass Carolyn's denial.

### Fresh independent TARGET validation

New unique evidence directory under the recovery path recorded below:
`candidate-full.izac7L/`; independent checkout is its `target/`. Commands ran with
`env -i`, freshly empty scratch HOME and explicit safe pinned paths in
`environment-v2.sh`. Install only at this independent TARGET root, cloned locally with
`git clone --no-hardlinks --single-branch --branch main`; no alternates, copied ignored
configuration/dependencies or source checkout access. `bun install --frozen-lockfile`
installed 1,000 packages; authoritative isolated lock is unchanged.

| Actual command / gate at the exact code SHA | Result |
| --- | --- |
| `bun run ci:verify` | PASS 4/4, zero cached, concurrency 1; 12m36.55s. Root: 30 workspace / 433 assertions; 56 CI Bun / 878 assertions; six CI Python and 40 release Python tests; actionlint, ShellCheck and syntax gates. |
| `diloreto` full chain | PASS 13 genealogy, 37 browser, one unchanged viewport skip; types/static/output/cfn-lint. |
| `paul` full chain | PASS 56 browser, four unchanged viewport skips; three local Lighthouse runs each 0.98 performance / 1.00 accessibility, best practices and SEO; types/static/workflow/shell/cfn-lint. |
| `sarabeth` full chain | PASS 197 Playwright; seven provenance tests on host and container; provider/fixture/Amplify/waiter/types/workflow/cfn-lint. Actual successful Gitless container marker equals full tested SHA. |
| `carolyn` full fixture chain (NOT candidate integration) | PASS 117 unit / 1,084 assertions; 12 infra / 50 assertions; three fixture + three hermetic production artifact tests; 92 visual; identical original 19-resource synth. |
| `python3 history-checks-v2.py <target>`; `bun docs/migration/scripts/lint-history.mjs <target> <report>` | PASS both unchanged map hashes/bijections (1,109 and 152), all mapped normalized ancestors, four pristine imports and baseline ancestry; 1,125 commit messages, zero errors, six preserved footer warnings. |
| `bun docs/migration/scripts/audit-installed-ranges.ts <target> <report> --full-graph` | PASS six roots, zero missing/range failures; exact accepted installed graph and unchanged lock/dependency/toolchain/snapshot identities. |
| `python3 scripts/ci/artifact.py diagnostics <site>` for each site, serially | PASS four fixture/nondeployable scans; no hosted upload or static release packaging/provenance is claimed. |

Resolved tools: Bun1.4.0 / Node24.20.0 / Turbo2.10.12 / Python3.14.6 at the actual
`/opt/homebrew/Cellar/python@3.14/3.14.6/bin/python3`, Go1.27.1, ShellCheck0.11.0,
uv0.12.9, actionlint1.7.7, cfn-lint1.42.0/1.53.0 and Chrome152.0.7977.77.
All actual canonical images report linux/arm64, Playwright1.62.1/Bun1.4.0/Node24.20.0.
No screenshot, threshold, skip, fixture-only IPv4 policy or deployed identity changed.
Mocked SES failures remain injected tests; no email or live production smoke was sent.

Colima's Docker data disk initially had 6,935,476 KiB available; final 6,940,360 KiB.
Only one app/image ran at a time. Exactly 34 initially absent, non-FROM/non-cache,
build-log-proven images were removed after fresh no-container-reference checks using
`docker image rm --no-prune` without force. Existing exact-owned-container traps remain.
Pre/post image ID/tag sets and container ID/image/name/state/other stable fields match.
**Raw docker-ps JSON is NOT byte-identical:** mount-list order and one existing service's
relative age/uptime/health text varied. No unrelated container operation appears in the
recorder; this is not an assertion that independently running services never restarted.
No old image/volume/daemon/source resource was modified.

Retained failures: the initial targeted worktree test failed on a preexisting MagicMock
rejecting the newly added `assert_owned` attribute; `spec=State` fixed the fixture setup,
then all targeted gates passed (logs `candidate-checks.P087VM/`). The initial evidence
collector overrequired raw Docker snapshot equality; its failed script/log are retained.
The corrected collector sorts mount lists and excludes only dynamic Status/RunningFor,
while comparing all other fields. The full canonical run had **no failed attempt**.
No production adapter, credential read, live inventory, publication or production gate ran.

| Completed evidence file | SHA-256 |
| --- | --- |
| `candidate-full.izac7L/validation-evidence.json` — 59 completed-file digests checked | `5241fa1f5d91dce6381c0d8683e54a7dc691ca120a2b620ab832bf320c6f1d22` |
| `candidate-full.izac7L/root-ci-v2.log` | `bfdf6c9f5bed7847e217939ce9a614bb1071e493529a081e7a6778c650fd67b6` |
| `candidate-full.izac7L/resolved-tools.log` | `a81c7154e2caf192fb13905b70fa8ddd0fdc35193e31e00c8b14232c523fbd16` |
| `candidate-full.izac7L/history.log` | `57340b9fdf41bda20536ed9a3adf572a27dbf33b441aeee43e251be0aa1ac4f5` |
| `candidate-full.izac7L/post-suite-checks.log` | `8ed788925c1043553333d7d2052dd529ad2bae7fe153ce978be25c721cf9454d` |

Original rejected/corrected runner reports retain their exact recorded hashes; no older
runner output was overwritten. The authority/remaining-work section below and per-site
ledger distinguish approved offline follow-up from live access. Next safe step is the
explicit Carolyn isolation/promotion architecture decision and bounded offline authoring,
not inventory or activation. Phase-2 acceptance/exceptions remain accepted, not reopened.

## Final-review recovery correction — authoring checkpoint (superseded validation status)

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
