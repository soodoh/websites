# Phase 3 handoff — offline foundation in progress; production not started

## Current offline execution checkpoint

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
