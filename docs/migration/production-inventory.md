# Production inventory — target GitHub subset collected; production gates closed

**Target GitHub metadata is collected, and separately approved browser settings are now
saved.** Source repositories, AWS, production HTTP, recovery artifacts and actual job
identity remain unapproved/uncollected. This is not complete inventory or production
readiness. All four sites remain NOT migrated; expected AWS accounts remain unverified.

## Current ruleset reconciliation and PR-only publication scope

User reported migrating classic protection to rulesets. Active repository ruleset22398923
is named main, targets exactly refs/heads/main with no exclusions/bypass actors, and its
effective rules require PR plus strict CI gate from integration15368 and prohibit deletion/
non-fast-forward updates. Conversation resolution is false; only squash merges are allowed.
Classic GET/old rule URL404 is reconciled with this user change, not assumed loss of all
protection. Main SHA remains4a947b3f and protected=true in the renewed target-only read.

User explicitly chose **Publish PR only** after these differences were presented: no
settings adjustment or merge. See [github-browser-settings.md](github-browser-settings.md).
This renewal covers commit/branch push/PR and ordinary CI observation, not source/AWS/
production inventory or deployment. Environment observations below remain dated18:56Z;
they were not re-read or changed during this ruleset reconciliation.

## Historical browser settings observation — 2026-09-06T18:56Z

User requested “Help me set this up in the browser then” and personally completed Confirm
access, then said “done.” Scope remained exact-main plus four production environments,
with infrastructure excluded. [github-browser-settings.md](github-browser-settings.md)
records authority, actual IDs, saved policy, UI evidence and limitations.

| Resource | Reopened saved UI observation |
| --- | --- |
| Main rule82810912 | Exact main, PR required/approvals off; only CI gate from GitHub Actions, strict freshness and conversations required; administrators enforced; force/deletion off |
| production-portfolio | ID21361791310 |
| production-diloreto | ID21361907728 |
| production-carolyn | ID21361962764 |
| production-sarabeth | ID21361988297 |
| All four environment policies | Only reviewer soodoh, self-review allowed; admin bypass checkbox off, wait timer off, one Branch/main rule, zero tags/secrets/variables |
| Infrastructure | infrastructure-sarabeth absent and excluded; final list exactly four environments |

This is browser configuration readback, not API re-verification, executed enforcement,
AWS identity or production acceptance. No hidden form/authentication values or network
headers were exported. No publication/ref/workflow/deployment operation occurred. The
old CLI422 and guide remain historical; the guide was not executed and must not recreate
the now-existing environments. Further operations need their own scope.

## Historical settings approval and stopped REST attempt — 2026-09-06

User accepted the routine solo risk and selected “Main + four production environments,”
excluding infrastructure, then “CLI main + guided environments” after the admin-bypass
API-field assumption was withdrawn. This explicitly renewed target-only reads and the
exact main-setting write; it did not grant publication, source/AWS access or execution.

[github-settings-attempt.md](github-settings-attempt.md) records fresh identity/configuration
reads and exact request/response evidence under `/private/tmp/websites-github-settings.hhjm8U/`.
Additional read endpoints were `/collaborators/soodoh/permission` and
`/commits/4a947b3fd724ddfde7e633342095d41aefcbd6d6/check-runs?check_name=CI%20gate&filter=latest&per_page=100&page=1`.
They confirmed owner/admin reviewer18269267 and GitHub Actions App15368 for both recorded
successful `CI gate` checks. These are now observed identities, not guessed policy values.

One `PUT /branches/main/protection` was attempted at the exact target: **HTTP422**, precise
validation reason unknown because the error body was not retained. Readback reports the
same main SHA, protected=false, classic protection404 and zero environments. Seventeen
GETs and one rejected PUT; no successful settings change, retry or rollback. Environment
API writes were not attempted; the human UI guide remains unexecuted and paused.
That failed-operation stop was later superseded only by explicit browser continuation;
it did not authorize a CLI retry. The original read-only and rejected-write evidence
remain separate historical checkpoints; successful browser state is recorded above.

## Completed read-only approval — 2026-09-06 (closed)

| Scope field | Approved value |
| --- | --- |
| Approver / approval text / timestamp | Interactive user selected “Approve GitHub reads (Recommended)” for this session's target-only inventory; approval recorded 2026-09-06T10:56:10Z |
| Target GitHub repository read scope | `soodoh/websites`, expected repository ID `1358469291`; repository/main metadata, workflow/run metadata, protections/rulesets, environment protections, Actions/OIDC configuration |
| Authentication | Existing GitHub CLI authentication; credential contents not inspected/exported. Effective repository access reported admin, not mutation authority |
| Source GitHub repositories / refs permitted to read | None |
| AWS site/account/region and profile/role | None; no AWS identity requests or credential discovery |
| Allowed service actions / exact resource scope | Eleven GETs under `repos/soodoh/websites` on `github.com`, listed below; no writes or workflow dispatches |
| Allowed public/default/candidate production HTTP | None |
| Private export/recovery location and retention | `/private/tmp/websites-phase3-inventory.77DmFK`, directory0700/files0600; non-secret projected observations retained until user requests removal. Not a production recovery store |
| Artifact download / secret-value scope | None; no logs/artifacts/variable values/secrets or OIDC tokens downloaded |
| Approval expiry / stopping point | First report, access/identity/unexpected-drift stop, or session end, whichever first. Pass reported and closed; further live reads require renewed scope |

Do not request passwords, tokens, secret contents or long-lived AWS keys in chat.
Use configured named access only after approval. Confirm STS account identity separately
for each approved account before inventory; no cross-account trust or default profile.
Authenticated identity checks themselves are live access, not offline fixture validation.

## Dated target observations and evidence

Observed **2026-09-06T10:57:51Z–10:59:17Z**. Each private JSON record contains its
endpoint, method, timestamps and allowlisted non-secret projection; no raw API response
or error body was retained. Observation is not continuous monitoring.

All endpoints below are relative to `repos/soodoh/websites`:

| GET endpoint | Observation |
| --- | --- |
| Repository root | ID `1358469291`, owner `soodoh`/ID `18269267`, public, default `main`, not archived/disabled |
| `/branches/main` | SHA `4a947b3fd724ddfde7e633342095d41aefcbd6d6`, `protected=false` |
| `/branches/main/protection` | HTTP404; alone ambiguous between absent/inaccessible, corroborated by unprotected branch and empty rules below |
| `/rulesets?includes_parents=true&per_page=100&page=1` | Empty list |
| `/rules/branches/main?per_page=100&page=1` | Empty list |
| `/actions/workflows?per_page=100&page=1` | Five active definitions: CI `351279106`; Carolyn `351279102`; DiLoreto `351279103`; Paul `351279104`; Sarabeth `351279105`. No phase-3 release definitions returned |
| `/actions/runs?branch=main&per_page=10&page=1` | total_count2: push [34005716802](https://github.com/soodoh/websites/actions/runs/34005716802) and manual [34007139470](https://github.com/soodoh/websites/actions/runs/34007139470), both success/attempt1 at observed main. Bounded main-only query, not all workflow queues or fresh phase-3 validation |
| `/environments?per_page=100&page=1` | total_count0; no production/infrastructure environment protections configured in the observed list |
| `/actions/permissions` | enabled=true, allowed_actions=all, sha_pinning_required=false; repository policy, not a statement that authored workflows lack SHA pins |
| `/actions/permissions/workflow` | default_workflow_permissions=read; can_approve_pull_request_reviews=false |
| `/actions/oidc/customization/sub` | use_default=true; no include_claim_keys list returned. Runtime sub/aud and AWS trust NOT verified |

Live main matches the accepted published baseline and pre-read local `origin/main`.
Local HEAD for this pass was `cf33c9003d4a374b00e1cc2326f8f700476cd813`; phase-3 changes
remain local. This expected difference is not unexpected remote drift, a publication
command or grounds to reopen phase-2 acceptance. No fetch/ref mutation occurred.

Private `manifest.json` SHA256:
`06e9fa5c97c5869918c95900eb2bf7f87030f03f43acbb9008029950bbbdffaf`.
It binds all 15 original approval/collector/observation/report files; all 15 hashes were
recomputed before this durable transcription. Private `report.md` SHA256:
`3a532699868be75aef92c2ded11e160a412003b2d87a8179a49c610bebfff528`.
The report's “tracked files unchanged/template uncollected” statement describes that
completed read-only pass, before this user-authorized local documentation update.

The earlier draft-review next step was superseded by routine solo acceptance, the stopped
REST attempt and subsequently successful scoped browser setup. Refer to
`github-browser-settings.md` for the current checkpoint. Neither proposal is standing
write/deployment authority.

## Expected mapping — not verified

| Site | Expected account | Region | Deployment environment proposal |
| --- | --- | --- | --- |
| sarabeth | `015989770400` | `us-west-2` | `production-sarabeth` |
| carolyn | `725669362139` | `us-west-2` | `production-carolyn` |
| paul | `658271954302` | `us-east-1` | `production-portfolio` |
| diloreto | `658271954302` | `us-east-1` | `production-diloreto` |

Sarabeth infrastructure proposal: `infrastructure-sarabeth` in `015989770400`.
The two shared-account sites still need app-specific resource/role scopes. Preserve the
DiLoreto-owned OIDC provider and existing DNS/certificate/resource ownership boundaries.

## Collection checklist — repeat and date separately for every site

Record redacted observations with source command/API name, account identity, observation
time and evidence location. Separate actual values from proposals. Do not paste raw
responses that can contain environment variables, tokens, webhook URLs or secret values.
Choose explicit non-secret fields before displaying or persisting API output.

| Area | Required non-secret evidence | Current status |
| --- | --- | --- |
| Repository/source | Owner/repo IDs and URL; default/source/release refs; live source main SHA compared with original approvedSha; required catch-up/freeze decision | Target identity/main collected above; source/release refs and source drift uncollected |
| GitHub CI/security | Workflow IDs/states, trusted main run SHA/event/attempt, required checks/rulesets/reviewers/CODEOWNERS enforcement; Actions permissions/cache boundaries | Target metadata and prior App15368 observed; saved exact-main protection read back in browser. Earlier PUT422 preserved; enforcement canaries/cache boundaries/full job inventory uncollected |
| Environments | Exact names, reviewers, branch/tag restrictions, variable NAMES, non-secret account/role/app mappings; auto-enable flag NAMES and effective policy | Four routine environment IDs and policies read back in browser, with no secrets/variables; infrastructure absent/excluded. Source environments/account-role mappings uncollected |
| OIDC/GitHub App | Actual subject configuration, immutable/textual identity format, aud, exact repo/env subject; monorepo GitHub App authorization in SSR accounts | Target use_default=true only; runtime JWT identity, cloud trust and SSR App authorization uncollected |
| CloudFormation/CDK | Owning stacks and IDs, logical/resource IDs, parameters limited to approved non-secret fields, termination protection, current template ownership, drift/change-set capability | Uncollected |
| IAM | Routine/build/compute/infra role ARNs, exact trust, resource policies, Sarabeth permissions boundary and execution-role separation; shared provider owner | Uncollected |
| Amplify | App ID/platform/repository, branch IDs/source refs, selected BuildSpec and buildPath/appRoot, safe non-secret env names, auto-build/preview state, active/queued jobs | Uncollected |
| Domains/edge | Amplify association and branch mapping, candidate/origin/production domains, CloudFront distribution/aliases/origin, zone/record/certificate ownership | Uncollected |
| CMS | Trigger mechanism, source/attestation ordering, webhook target identity WITHOUT secret webhook URL, active jobs, allowed publish/unpublish rebuild policy | Uncollected |
| SSM/runtime | Parameter NAMES/types and role boundaries; no SecureString values retrieved. Namespace preservation including Sarabeth legacy last-known-good SHA parameter | Uncollected |
| Release provenance | Actual deployed marker SHA/repository/workflow/run/build-attempt/hash and known-good status, kept in original identity; no normalization substitution | Uncollected |
| S3 rollback | Existing bucket/prefix/version/retention/encryption/access boundaries; immutable legacy release IDs and evidence availability; approved byte-download/rehearsal scope | Uncollected |
| Smoke/monitoring | Approved non-mutating baseline expectations and observed routes/auth/404/headers/assets/origin-edge markers, monitoring/retention; no email/content mutation | Uncollected |
| Writer ownership | Old/new workflow/CMS/Amplify triggers, queued/running jobs, freeze/drain/restore procedure, single-writer checkpoint and approval | Uncollected |

Exception to secret-free value collection: only an explicitly approved non-secret release
marker/last-known-good SHA may be read as recovery evidence after verifying its purpose/type.
Never retrieve SecureString credentials merely to identify parameters or establish readiness.
Do not print full OIDC JWTs, signed/presigned URLs, Amplify access tokens or CMS webhook secrets.

## Historical GitHub observations — not fresh phase-3 inventory

Phase-2 inspection of `soodoh/websites` observed repository ID `1358469291`, five active
CI workflow definitions, main branch protection `404 Branch not protected`, and an empty
ruleset list including parents. No settings were changed. Six draft acceptance PRs remain
unmerged in the phase-2 ledger; cleanup is separately gated. These observations must not
stand in for an approved current inventory before privileged releases.

## Inventory exit and next gate

Inventory is complete only when each applicable row has dated, approved, redacted evidence,
each unknown is explicitly dispositioned, and the corresponding per-site ledger is updated.
Missing access or an unexpected account/resource/source SHA is a stop, not a reason to broaden
permissions or guess identities. Metadata reads do not authorize downloads of arbitrary
objects, change-set creation, identity workflow dispatch, mutations or production smoke.

Present the per-site old/new configuration diff, exact resources/account, owning-IaC trust
proposal, replacement risk and proven recovery requirements before asking for preparation
writes. Creating/executing change sets and candidate deployments are separate gated actions.

## Recovery-review inventory gates (still uncollected)

- DiLoreto original repo/workflow IDs, original selected SHA versus workflow head SHA,
  successful original run/build-attempt, unchanged markerless ZIP checksum, capture
  evidence digest and independently approved migration-manifest SHA-256 pin. Confirm
  artifact/API access and exact retained existing-store prefix/owner/encryption/retention;
  no supplied metadata may self-authorize or substitute normalized import identities.
- Sarabeth exact existing app ID for optional infrastructure read permissions, accepted
  candidate state/source/job and candidate/production URLs, existing state-object read
  and any KMS decrypt grants. Separate connection/retained-branch preparation approval,
  domain switch approval and explicit webhook-retarget approval. Inventory must establish
  that reconnection is in-place; the authored helper does not waive change-set review.
- Exact observed OIDC subject values for all routine jobs and Sarabeth infrastructure;
  pre-assumption observation is now authored, but no token was requested locally.
- State-object version/retention for lifecycle receipts and independently observed hosted
  completion/replacement notifications. Fixture snapshots are not live queue acceptance.
