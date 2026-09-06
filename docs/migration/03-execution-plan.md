# Plan 3 — Isolated AWS environments, monorepo releases and controlled production cutover

## Reconciled entry checkpoint — 2026-09-06

This durable planning copy was prepared at the user's request, not under phase-3 implementation or production authorization. Read `03-production-cutover-handoff.md` for current status and `03-fresh-session.md` for the proposed next-session scope. The plan body below preserves the original execution safeguards; this checkpoint supersedes only its already-resolved phase-2/publication prerequisite status.

- Accepted implementation/main baseline: `4a947b3fd724ddfde7e633342095d41aefcbd6d6`. Actual hosted main-push run [34005716802](https://github.com/soodoh/websites/actions/runs/34005716802) and manual baseline [34007139470](https://github.com/soodoh/websites/actions/runs/34007139470), both attempt 1, passed all four apps, root checks and `CI gate`.
- Publication is accepted as verified by explicit user attestation, "Consider the publication verified." This is not invented agent publication approval, a recorded publication command, or fresh-clone execution evidence. Do not redo publication or normalization to satisfy historical pending text. Unexpected subsequent drift still requires reconciliation.
- Six scoped PR cases, artifact verification and PR replacement/cancellation passed. The user then stated "main push behavior is accepted." Phase-2 external acceptance is complete with that specific evidence exception; no multiple-main-push experiment occurred. This exception does NOT waive phase-3 release ordering, recovery or interleaving tests. See `02-scoped-ci-handoff.md` and `phase2-hosted-acceptance.md`.
- Root pins, current paths, phase-2 interfaces and normalized ancestry remain as recorded. Static schema v1 fixes `workflow` to `.github/workflows/ci.yml` and `releaseAuthorized` to false; a new recovery workflow must explicitly design and test a compatible provenance contract. Never flip a downloaded artifact's authorization flag or relabel its workflow/SHA/attempt.
- Proposed environment/concurrency mappings below were not confirmed by phase-2 configuration. Main was last inspected as unprotected with no rulesets; settings changes and privileged repository/environment protection decisions remain gated. Temporary draft acceptance PRs #1–#6 and their exact branches remain unmerged; cleanup is not authorized by this plan.
- No live AWS inventory, production recovery capture, deployment code port, identity job, candidate or cutover has occurred. All four sites remain unmigrated. Source ownership is the preserved migration boundary, not newly inventoried live state.
- Current authority is documentation preparation only. Fresh-session offline implementation, live account inventory, GitHub writes and every production operation require the explicit scope described below. Reading a saved launch prompt is not authorization.

## Execution contract (fresh session)

When explicitly authorized to execute phase 3, work in `/Users/pauldiloreto/Projects/websites/main/`, the existing linked worktree for `soodoh/websites`. Editing or reading this plan alone grants no execution, publication or production authority. Read this entire plan, root/app `AGENTS.md`, `docs/migration/source-imports.json`, `01-history-and-turborepo-handoff.md`, `02-scoped-ci-handoff.md`, `ci-parity.md`, and `history-normalization-decision.md` with its maps/proofs under `docs/migration/`. Read the current phase-2 plan at `/private/tmp/websites-plan-2-scoped-ci.md` and its durable planning record if present. The original phase-1 execution plan is historical, not authority to undo its explicitly approved exceptions. Stop if the phase-2 handoff or required external acceptance is absent; do not infer GitHub CI success from phase-1 local tests.

Prepare remaining deployment code and apply cutovers ONLY through the gates below. Reconcile phase-specific repository instructions when execution is authorized; retain all source, identity, secret and approval safeguards. Do not assume cloud settings described here match live state. Live inventory requires an approved read-only account/access scope; never use production credentials for local fixture validation.

### Accepted history/layout baseline and prerequisites

Phase 1 completed locally at `b08ca2c3b4599653ff15be73baabb8815a6699fd`. Fresh full uncached CI and independent runtime/history reviews passed at `cb7a15fb23b810285f51432de7efeec05e115a3f`; the final commit changed only migration evidence. This is a starting reference, not a reset target or evidence that phases 2/3 have run. Require the actual accepted phase-2 descendant and trusted GitHub main-run evidence before production preparation proceeds beyond offline work.

| Site key | Current directory | Existing package/Turbo filter |
| --- | --- | --- |
| `sarabeth` | `apps/sarabeth` | `sarabeth-studio` |
| `carolyn` | `apps/carolyn` | `carolyn-portfolio` |
| `paul` | `apps/paul` | `portfolio-website` |
| `diloreto` | `apps/diloreto` | `diloreto-website` |

Consume phase 2's exact short-key and artifact schema contracts. Retain package names, source URLs, deployed resources, account IDs and runtime secret namespaces; a folder rename does not authorize renaming them. Portfolio below refers to the Paul site and its legacy deployment identities. Root pins accepted in phase 1 are Bun 1.4.0 / Node 24.20.0 / Turbo 2.10.12, an isolated-linker root lock, and canonical Playwright 1.62.1 images. Reconcile any subsequently approved phase-2 changes from its handoff; do not silently upgrade. All new commits require an approved scope: `carolyn`, `paul`, `diloreto`, `sarabeth`, `repo`, `ci`, or `deps`.

The user explicitly authorized Portfolio credential redaction and then normalization of every local-main commit message, including the published initial commit. All 1,109 pre-normalization commits were retained under verified maps with identical trees/authors/dates/bodies and mapped parent topology; original IDs and some signatures necessarily changed. Preserve this resulting history, not a requirement that original source IDs remain current-main ancestors. Do not repeat imports, squash/rebase away normalized parents, run another global rewrite, or restore redacted original history.

`source-imports.json` separates original `approvedSha`/source identities from normalized `importedSha` and `importCommit`; `targetPrefix` is the pristine historical import prefix and `currentPrefix` is the current short folder. Verify normalized imported ancestry and `target.normalizedStartingSha`. Resolve old evidence SHAs through `history-normalization-commit-map.txt`; Portfolio source-original SHAs first use `portfolio-commit-map.txt`. Keep private original bundles and both maps. Never globally rewrite historical artifact/SSM/run SHAs or claim a mapped SHA was actually built/deployed without new evidence.

At phase-1 completion nothing was pushed. The original published initial commit `5b236ef3a519759c84ebd3504809d391baf085ea` mapped locally to `2e6fb629522ff1ced21533bd572aff874bd2db90`; ordinary fast-forward publication was impossible. Require phase 2's explicit publication approval, actual remote outcome and fresh-clone verification. If still unpublished or the remote differs unexpectedly, stop at that gate: separately approve an exact non-fast-forward strategy against a freshly checked remote SHA, without discarding normalized ancestry or overwriting unreviewed remote work. This plan grants no implicit push/force-push and does not authorize merging the old initial history back to evade the gate.

Original local sources remain `/Users/pauldiloreto/Projects/{sarabeth-studio,portfolio-website,carolyn-portfolio,diloreto-website}/main`. Never modify/delete their worktrees, refs, configs or hooks, and never install/test there. Source production pipelines remain the only writers until each approved cutover transfers ownership; any remote retirement/settings changes are separately gated.

This plan has independently resumable per-site checkpoints. A fresh session may finish authorized offline code/preparation and stop at an approval gate; that is NOT production completion. Record status and next action without secrets. Obtain explicit approval for remote publication/settings, IAM/stack mutations, each production switch, DNS/domain changes, automatic-deployment enablement, old-workflow disabling, trust removal and archival. Never infer permission for resource replacement, registrar edits, email sending or credential deletion.

## Known architecture — verify read-only first

| App | Account | Region | Current production mechanism |
| --- | --- | --- | --- |
| Sarabeth | `015989770400` | `us-west-2` | Amplify WEB_COMPUTE, source repo main, CI-triggered RELEASE, SSM last-known-good SHA and CMS webhook rebuilds |
| Carolyn | `725669362139` | `us-west-2` | Amplify WEB_COMPUTE, GitHub `amplify-production` source branch, exact-SHA RELEASE and deployed browser smoke |
| Paul (Portfolio) | `658271954302` | `us-east-1` | Amplify WEB, manual zip -> candidate -> main, immutable verified S3 releases, automatic/manual rollback |
| DiLoreto | `658271954302` | `us-east-1` | Amplify WEB manual zip -> main, separate CloudFront public edge, origin/edge/browser verification |

Existing IaC paths from repository root (current short directories):

- Sarabeth: `apps/sarabeth/infrastructure/cloudformation/{bootstrap,hosting,dns,domain}.yaml`; manual protected infrastructure workflow.
- Carolyn: `apps/carolyn/infra/lib/hosting-stack.ts`, `apps/carolyn/infra/lib/environment.ts` and infra tests. Infra tooling is integrated into the app workspace manifest; CDK construct/logical IDs must remain stable.
- Paul/Portfolio: `apps/paul/infra/amplify-hosting.yaml` and `apps/paul/docs/hosting.md`.
- DiLoreto: `apps/diloreto/infrastructure/amplify-hosting.yml` and `apps/diloreto/docs/amplify-hosting.md`.

The shared account's GitHub OIDC provider is owned by the DiLoreto hosting stack and referenced by Portfolio. Do not create a duplicate provider or transfer its ownership as part of this migration. No cross-account IAM trust is needed. The shared account owns the `diloreto.com` DNS zone and paul redirect; Carolyn's account owns its application/domain association, with only specific carolyn CNAMEs in the shared zone. Keep that resource boundary.

## 1. Inventory, freeze plan and rollback preparation

1. Confirm phase-1 local acceptance AND phase-2 external acceptance, approved publication/fresh-clone checks, trusted main CI runs, and normalized imported ancestry/provenance. Compare live source main SHAs with original `approvedSha`/source records, not normalized `importedSha`. Before cutover arrange an explicit approved source freeze or separately approved mapping-aware catch-up. Never blindly subtree-pull raw old history: it can duplicate ancestors, reintroduce redacted credentials or break scoped-message policy. Preserve all newly approved source ancestry under durable mappings and existing normalized parents, reapply workspace adaptations and revalidate. No late production fixes may be omitted; no source mutation or new history rewrite is implicitly authorized.
2. Read all original deploy/rollback/IaC workflows at normalized `importCommit:targetPrefix` paths plus current short-path scripts/tests. Preserve the old semantics listed in ci-parity; do not replace two SSR flows and two static flows with one generic deploy command. Historical source SHAs remain original evidence, not current-monorepo checkout instructions.
3. Inventory live GitHub repo/environments/branch policies, variable NAMES and non-secret identifiers, workflow states, GitHub App access, AWS stacks/change-set support/termination protection, roles/trust, Amplify apps/branches/build specs/auto-builds/webhooks/domain associations, deployed release markers, SSM parameter NAMES/types, S3 release retention and CloudFront domains. Use explicit account profiles/roles and `sts get-caller-identity`; never rely on default credentials. Do not retrieve or print secret values just to document them.
4. Save redacted `docs/migration/production-inventory.md` and a per-app cutover ledger: previous/current repository, source ref/SHA, app/branch/domain IDs, cloud stack, deployment owner, known-good release, restore procedure, approvals, jobs/run URLs and verification status. Keep sensitive raw exports outside Git with restrictive permissions and no presigned URLs in logs.
5. Define cloud-independent smoke expectations and capture the current baseline using non-mutating requests. No sending contact emails or making real content edits. Tests must not mutate production data.

Offline regression validation must preserve canonical browser/image/architecture pairs, screenshots and assertion strength. Use independent target clones and fixture/offline settings, never source worktrees. Phase-1 Docker capacity was about 6.7 GiB free on Colima's separate 100 GiB disk; recheck rather than assuming host free space applies. Run one app/image at a time locally; remove only proven invocation-created images after use with fresh reference checks and `docker image rm --no-prune` without force. Existing invocation-owned ephemeral-container cleanup traps may remain. Broader cleanup, old-image/volume removal or daemon changes need separate approval.

## 2. Environment and identity isolation

Create/configure these environments only after approval:

| Environment | Account | Purpose |
| --- | --- | --- |
| `production-sarabeth` | `015989770400` | routine Sarabeth deployment |
| `production-carolyn` | `725669362139` | routine Carolyn deployment |
| `production-portfolio` | `658271954302` | Portfolio deployment/rollback |
| `production-diloreto` | `658271954302` | DiLoreto deployment/redeploy |
| `infrastructure-sarabeth` | `015989770400` | protected manual infrastructure |

These environment labels are proposed mappings, not verified existing configuration. In particular short site key `paul` maps explicitly to the legacy-compatible `production-portfolio` label in this table; do not infer a `production-paul` resource rename from the folder rename. Likewise keep any approved `portfolio-production` concurrency identity explicitly mapped to Paul. Confirm exact names in the phase-2 handoff and production inventory before creating or changing settings.

- Environment-scoped variables: AWS_REGION, AWS_ACCOUNT_ID, AWS_ROLE_ARN, AMPLIFY_APP_ID, branch/URL and app-specific release settings. Normalize old variable names in code, or explicitly map them; never copy four conflicting AMPLIFY_APP_ID values into one repo-global namespace.
- Keep role ARNs/account/app IDs as variables, not long-lived AWS key secrets. Credentials are job-scoped OIDC. Only credential-requiring jobs get `id-token: write`; validation jobs stay unprivileged. No `secrets: inherit` across all apps as a convenience.
- Scope deployment-role policies to each app's exact AWS resources even for the two apps in the shared account. Separate infrastructure roles from routine releases. Retain Sarabeth permissions boundary/CloudFormation execution-role separation and all account guards.
- Each credential step uses the expected account allowlist supported by the pinned action plus an explicit STS account check before mutation. Never assume role ARN configuration alone is sufficient.
- Set branch/tag deployment restrictions to the reviewed trusted entry point (normally main), and reviewers as approved. If a job checks out a release branch while the workflow runs on main, distinguish event ref from checkout ref in environment restrictions. Do not allow arbitrary branches/tags just to make a workflow pass.
- Default OIDC subject is environment-based when a job declares an environment; it is NOT simultaneously the main-branch subject. Read current GitHub docs and inspect the actual monorepo subject configuration. New repositories may use immutable owner/repository IDs in `sub`; do not hard-code the old textual format from legacy templates. Check aud=sts.amazonaws.com and exact expected repo/environment subject. Do not log the full JWT.
- Update role trust THROUGH owning IaC. Temporarily allow exact old AND new subjects for cutover, not a wildcard repo:* trust. Sarabeth bootstrap's infrastructure subject and hosting's routine main-branch subject both need consideration. Carolyn subject is hard-coded in CDK and tests. Portfolio subject is hard-coded to environment production. DiLoreto exposes GitHubRepository/GitHubEnvironment parameters. Add narrowly scoped transition parameters/statements as needed and test the synthesized policies.
- Environment names/path filters are not folder-level authorization. A malicious approved workflow could request another environment. Require protected review of `.github/**`, shared tooling and IaC (CODEOWNERS plus enforced rules if approved); retain strong environment approvals for high-privilege work. State that repo admins/shared maintainers become a shared trust boundary.
- Keep every site's new automatic-deployment flag false until that site's cutover checkpoint. Use fail-closed per-app enablement; a missing variable must not mean enabled. The gated manual cutover path may run only after explicit approval.

## 3. Port deployment orchestration and release ordering

Prefer explicit per-app reusable DEPLOY workflows called after that app's trusted main validation in the phase-2 orchestrator. Keep CI gate scoped to validation; an unrelated app's failure need not block a valid app deployment unless the user elects all-or-nothing releases. Each privileged call must validate expected app/source/event and receive only its own outputs. Do not execute PR artifacts or PR-controlled scripts in privileged context. If using workflow_run instead, verify originating repository/event/branch/workflow/app/SHA/attempt and avoid cross-run artifact confusion.

Concurrency groups must be app-specific (`sarabeth-production`, `carolyn-production`, `portfolio-production`, `diloreto-production`). Deployment AND rollback for the same app share the same group. Enclose source-ref promotion, Amplify start/wait, smoke and state persistence in one serialized critical section per app; do not split Carolyn ref advancement and release into separately queued jobs as today. Infrastructure uses a separately guarded operation and must not race a routine deploy affecting the same branch/domain. No cancel-in-progress during live promotion/rollback.

Replace global-main-SHA equality with the tested phase-2 scope comparator:

- A tested commit is eligible only if it belongs to the trusted monorepo main history/approved release path and has the required site validation.
- Under the app's lock, fetch an immutable current main SHA and compare ALL release inputs (app tree, root lock/toolchain/workflow/buildspec/shared dependencies). An unrelated change must not invalidate the site release.
- If relevant inputs changed, do not deploy untested new code or mislabel a different SHA as tested. Defer/supersede with explicit evidence and require successful validation of the replacement revision.
- Prevent older completion/retry from rolling back a newer release accidentally. Persist/query per-app release provenance, compare ancestry/release-input identity and distinguish intentional approved rollback from routine progression.
- GitHub concurrency queues are not FIFO and can replace pending jobs even with cancel-in-progress=false. Implement/test explicit reconciliation/retry for the latest eligible site state rather than assuming every queued push runs. At minimum provide a trusted `release-site(site, ref=main)` recovery dispatch that freshly validates the selected immutable SHA regardless of last push diff, reports skipped/canceled pending work, and alerts with the exact recovery action. If automated reconciliation is implemented, keep it disabled until its account/site authority is reviewed.
- Never blindly reset global main or revert the whole monorepo for one app. App rollback restores site-specific state and any explicitly required shared dependency state through reviewed commits/artifacts.

## 4. SSR Amplify monorepo builds and isolated source refs

Keep Sarabeth/Carolyn as repository-connected WEB_COMPUTE apps initially. Manual SSR zip support is NOT assumed; AWS manual deployment support differs from static hosting. Do not convert hosting platforms to simplify this migration.

1. Author a root `amplify.yml` with `applications` entries and exact appRoot values `apps/sarabeth` and `apps/carolyn`. Set matching AMPLIFY_MONOREPO_APP_ROOT on each existing Amplify app/branch only through the approved IaC/configuration gates. Repository buildspec overrides console settings: reconcile CDK/CloudFormation BuildSpec sources, not just a console toggle. Historical `apps/sarabeth-studio` and `apps/carolyn-portfolio` import prefixes are NOT current build roots.
2. Build from repository root for root Bun frozen install, then explicitly run the selected app. Set artifact baseDirectory relative to buildPath to the selected app's `.amplify-hosting`, and cache paths relative to the actual build root. Use phase-1 exact Bun/Node versions. No copied obsolete per-app frozen lock assumptions. Avoid executing sibling lifecycle/build scripts with production credentials; audit root install/prepare scripts and use tested filtered installs where compatible.
3. Preserve Nitro AWS preset, output bundle validation, exact source attestation, secret retrieval boundaries, fixture-vs-production checks, auth manifest cleanup and secret leak checks. Sarabeth's shared resolver accepts an explicit `RELEASE_COMMIT` only when exactly 40 hex; empty/malformed values fail, and Git fallback is only for an unset value. For Gitless production builds, obtain any explicit SHA from verified trusted source/job metadata, never arbitrary environment input; compare the actual bundle marker to the selected validated checkout and Amplify job SHA. No fake/cached provenance or `.git` copied into images. Carolyn's IPv4-first workaround stays fixture/hermetic-only, not a new production default. Runtime SSM/SES/DynamoDB access remains under each app's own build/compute role. Do not cache production Turbo tasks or use fixture CI output as a production release.
4. Verify repository GitHub App authorization for the monorepo in BOTH relevant accounts. Change the repository URL on existing managed apps only via reviewed change sets; inspect replacement flags. If repository reconnection cannot be done in place safely, stop for a separately approved replacement/migration plan. Do not recreate apps/domains/IAM implicitly.
5. Isolate validated source refs. Recommended: keep Carolyn's existing Amplify/Git branch name `amplify-production` (reserve it exclusively for Carolyn in the monorepo) to minimize resource/domain changes; give Sarabeth a dedicated `sarabeth-production` source/Amplify branch. Each ref points to a real validated monorepo commit, not a subtree split or synthetic commit with a mismatched release SHA. No global main freshness requirement remains.
6. Sarabeth's new branch is an explicit production configuration change: create a NEW branch resource while retaining the old main branch for rollback, adjust branch-scoped compute trust/deploy policies/SSM source checks/webhooks/URLs, and update the domain association's branch mapping ONLY at approval-gated cutover. Inspect domain/branch change sets to avoid destructive replacement. Do not change global repository default branch. If branch mapping requires broader DNS/certificate changes, stop and seek approval rather than improvising.
7. Use trusted ref-promotion credentials with minimal repository write permissions. Lease/compare-and-swap the app ref; serialize with release start/wait. Validate exact checked-out SHA and Amplify job commit before/after build, and stop/reconcile mismatched active jobs. Do not assume passing start-job --commit-id alone forces the source revision. GitHub token-created ref pushes may not trigger another Actions run; explicitly start Amplify release rather than relying on webhook side effects.
8. Preserve CMS publish/unpublish rebuilds with app-specific webhook targets. Sarabeth currently compares webhook source against a concrete CI-attested SHA. Ensure webhook/ref/attestation ordering cannot build an unvalidated or wrong app revision during cutover, failed release or concurrent content rebuild. Inventory Carolyn's actual CMS trigger behavior instead of assuming it matches Sarabeth. Keep auto-build and PR previews disabled unless intentionally approved.
9. Sarabeth's `/sarabeth-studio/production/last-known-good-sha` initially contains an old-repo SHA. Preserve that exact namespace/value as legacy recovery evidence; update only after a successful, smoke-tested monorepo release, never merely by applying the normalization map. Original source commits are NOT guaranteed to be monorepo objects/ancestors after authorized normalization; their normalized counterparts still have pre-import root layouts and lack the monorepo buildspec. Do NOT point a new monorepo release branch at either legacy identity and expect it to build. Restore via the recorded old connection/original repository or a newly validated site-scoped restoration commit with compatible workspace inputs. A SHA map preserves correspondence, not production release attestation.

## 5. Static artifacts and cross-repository rollback continuity

Portfolio:

- Preserve verified zip -> candidate -> hosting/Playwright/Lighthouse -> identical zip production promotion -> exact release-marker verification -> previous-artifact restoration. Persist verified artifact, checksum and metadata in the existing private S3 store; do not recreate the bucket.
- Current workflows query `repos/${GITHUB_REPOSITORY}/actions/runs/<run>` and assert `.github/workflows/deploy.yml`. The currently deployed marker refers to the OLD repository/workflow, so a naive first monorepo deployment fails before promotion.
- Implement a versioned provenance reader: new records explicitly identify repo/site/workflow/run/build-attempt/SHA/hash; legacy records map ONLY to allowlisted `soodoh/portfolio-website` + `.github/workflows/deploy.yml` and existing legacy S3 layout. Never accept an arbitrary repository supplied by downloaded metadata. If old repo is private/inaccessible with the new GITHUB_TOKEN, use an approved narrow read-only credential or prepare a verified migration manifest out of band; do not assume cross-repo Actions access works.
- Before the first promotion, actually download and verify the CURRENT legacy release into a protected recovery location and rehearse candidate restore. Do not merely declare a new baseline that discards available rollback. Keep old S3 objects/metadata unchanged; a versioned new repo/site prefix is fine with a backward-compatible reader.
- Manual rollback accepts an explicit allowlisted repo/site/run/attempt or immutable release ID, verifies provenance and artifact checksums, tests candidate, then restores identical bytes to production. Use the trusted current verification harness, not scripts embedded in an untrusted historical artifact. Test legacy -> new -> rollback-to-legacy -> restore-new in candidate first. Production rollback drills require approval.

DiLoreto:

- Preserve verified static zip upload, exact target-SHA selection, origin AND CloudFront edge acceptance, route/404/cache headers/asset comparisons, and browser smoke.
- Manual `ref` redeploy must resolve an immutable commit and revalidate, but credentialed deployment code/harness must remain from a trusted workflow revision. Fix its `verification-harness` checkout plus nested app cwd/root workspace install paths. Never run arbitrary selected-ref lifecycle scripts under production credentials.
- Do not change distribution aliases, DNS ownership, paul redirect or certificates as a consequence of the repo move. Preserve a verified old zip plus restore instructions before initial monorepo promotion. Original pre-import SHAs may not exist in current main; mapped pre-import counterparts still have the old root layout. Use explicit legacy repository/layout handling or a newly validated compatible restoration commit, not the new workflow's default app path or an assumed original-SHA ancestor.

All apps: preserve timeouts, cleanup of active failed jobs, smoke evidence, diagnostic/report retention, exact source identity, and non-canceling live deployment behavior. Keep runtime secret namespaces/accounts unchanged. Rename artifact/report/concurrency identities to avoid cross-app collisions.

## 6. Infrastructure workflow and security-contract migration

- Port Sarabeth's manual infrastructure workflow to root with `infrastructure-sarabeth`, corrected app-relative paths, explicit expected account and unchanged domain/Netlify rollback confirmation gates. Main app changes must not automatically apply IAM/DNS/IaC.
- Retain Carolyn CDK deployment procedure and Portfolio/DiLoreto reviewed change-set procedures rather than adding automatic infrastructure deploys absent from the old workflows. Check template semantics/types/synth in CI.
- Update ACTIVE repository URLs, environment subjects, release branches, current short-directory BuildSpec inputs, workflow-path tests and runbooks through the approved gates. Do not globally replace historical provenance, allowlisted legacy rollback repository/workflow identities, original source SHAs or runtime secret namespaces. Tests reading old app-local `.github/workflows` must assert the ACTIVE root workflows after parity is demonstrated; archive/remove inert duplicates only then, not as a way to discard security coverage.
- Test denied wrong account/repo/environment/app/SHA cases, untrusted PR artifact rejection, old-run/attempt mismatches, canceled job cleanup, legacy rollback metadata and scope-aware freshness under interleaved pushes. Add original-versus-normalized SHA cases: mapped correspondence must never substitute for trusted build/deployment evidence or relabel an old release as a new normalized build.
- Explicit interleaving test: Sarabeth A validates; Portfolio B advances main; A is still deployable. Sarabeth C later changes relevant inputs; A cannot supersede validated/deployed C. Add shared-lock change, failed replacement CI, out-of-order queue and manual recovery cases.

## 7. Approval-gated per-app cutover (recommended order)

Proceed one app at a time: Portfolio, DiLoreto, Carolyn, Sarabeth (most infrastructure/webhook complexity). Do not combine all accounts into one shell loop that mutates production. A manual-infrastructure or domain failure in one app must not affect others.

For EACH app:

1. **Preparation gate:** present old/new repo/ref, IAM/environment/config diff, change-set replacement assessment, exact accounts/resources, known-good artifact/source and tested restore steps. Obtain explicit approval before cloud/settings writes.
2. Add tightly scoped new OIDC trust while retaining old trust, configure environment and authorize repository connection as needed. Perform an approved identity-only job first; do not treat identity success as release verification. New automatic deploy remains disabled.
3. Reconcile final source drift using the separately approved mapping-aware catch-up/freeze procedure and obtain a trusted green monorepo CI revision. Freeze/disable the OLD app's production workflow/trigger ONLY with explicit approval, recording its exact prior state. Wait for ALL old active/queued deployment and CMS jobs to reach safe terminal states. GitHub concurrency is repository-scoped and cannot protect against two repos writing the same app. Do not enable both writers simultaneously.
4. For SSR, execute the reviewed repository/buildspec/source-branch changes and candidate/default-domain build; verify exact SHA, bundle/runtime/auth/non-sending smoke. For static, use existing candidate where available and validated retained bytes. Any temporary validation branch/resource must be named, approved and tracked for later cleanup.
5. **Production gate:** show candidate evidence and rollback command/state, obtain approval, then switch/promote this app only. Sarabeth domain branch remap is a separate explicit gate. Do not change registrar nameservers, shared DNS, mail, wildcard aliases or unrelated infrastructure.
6. Verify actual production domain, release/source identity, origin/edge behavior as applicable, protected/public routes, static/SSR shape, monitoring and retention. Validate CMS webhook policy without sending email; synthetic CMS edits require their own approval.
7. Persist the new last-known-good/provenance and checkpoint after successful verification. With explicit approval, enable only this app's automatic deployment flag. Exercise an approved scope-specific release and document that unrelated app pushes do not redeploy or strand it. Verify shared-input changes select all relevant apps without overwriting each other's release state.
8. If acceptance fails, restore from the recorded verified artifact or old source connection/domain branch via the preapproved runbook, reconcile active jobs, keep new automatic deployment disabled, and report failure. Do not report successful migration just because the previous site is serving again.
9. Keep old exact trust for the agreed rollback window; remove it through IaC only after explicit approval and successful acceptance. Removing one site's old trust must not delete the shared OIDC provider or another site's roles. Keep local source repositories intact regardless.

After ALL four are verified, ask whether to archive old GitHub repos. Do not archive by default or delete local worktrees/bundles/history. Archival does not migrate issues, PRs, releases, run logs or artifacts; document retained links and any separate desired migration. Disable duplicate Renovate/CI only as approved during retirement. Preserve accessible legacy release evidence needed for rollback.

## 8. Completion evidence and resume protocol

Preserve this reconciled plan as a durable phase-3 planning record when implementation is authorized. Maintain `docs/migration/03-production-cutover-handoff.md` and per-app ledger after every gate. Required fields: status (prepared/blocked/identity-verified/candidate-verified/cut-over/rolled-back/retired), approvals, publication/fresh-clone and phase-2 acceptance evidence, exact original-source versus normalized checkout/deployment SHAs, mapping references and any approved catch-up, old/new refs, non-secret account/app/stack/env/role IDs, config commit/change-set/run/job URLs, active-writer state, automatic-enable flag, smoke results, last-known-good and rollback location, pending trust cleanup/archival and next safe command. Copy a redacted convenience summary to `/private/tmp/websites-plan-3-results.md`.

Full completion requires: approved normalized-history/provenance invariants preserved; all four actual production sites serve verified monorepo releases in their existing intended accounts; diff-scoped app releases work; app-specific serialization/ordering/recovery are tested; Portfolio legacy rollback works with its original identities intact; SSR source/CMS policies still hold; wrong identities cannot assume roles; no DNS/account/resource ownership drift; old/new deployment writers cannot race; CI parity is complete. If any gate remains, list what is NOT migrated. Offline code preparation, phase-1 local acceptance or phase-2 CI success alone is not production completion. Archival remains separately approved and optional.

## References (recheck current behavior before implementation)

- https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
- https://docs.github.com/en/actions/reference/security/oidc
- https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
- https://docs.aws.amazon.com/amplify/latest/userguide/monorepo-configuration.html
- https://docs.aws.amazon.com/amplify/latest/userguide/manual-deploys.html
- https://github.com/aws-actions/configure-aws-credentials
