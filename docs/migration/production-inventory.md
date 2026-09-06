# Production inventory — UNCOLLECTED template

**No phase-3 live inventory has been authorized or performed.** This file's existence
is not inventory completion, account verification, production readiness or mutation approval.
Expected accounts and architecture are plan baselines only; actual values remain unknown.
Use the per-site ledger in `03-production-cutover-handoff.md` with this collection checklist.

## Read-only access approval — fill before any live request

| Scope field | Approved value |
| --- | --- |
| Approver / approval text / timestamp | Not supplied |
| Target GitHub repository read scope | Not supplied for phase 3 |
| Source GitHub repositories / refs permitted to read | Not supplied |
| AWS site/account/region | Not supplied; expected mapping below is not permission |
| Exact named AWS profile or assumed read-only role per account | Not supplied; no default credential discovery/use |
| Allowed service actions / exact resource scope | Not supplied |
| Allowed public/default/candidate URLs and non-sending HTTP methods | Not supplied |
| Private export/recovery location and retention | Not supplied |
| Artifact download scope (if needed, separate from metadata inventory) | Not supplied |
| Approval expiry / stopping point | Not supplied |

Do not request passwords, tokens, secret contents or long-lived AWS keys in chat.
Use configured named access only after approval. Confirm STS account identity separately
for each approved account before inventory; no cross-account trust or default profile.
Authenticated identity checks themselves are live access, not offline fixture validation.

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
| Repository/source | Owner/repo IDs and URL; default/source/release refs; live source main SHA compared with original approvedSha; required catch-up/freeze decision | Uncollected |
| GitHub CI/security | Workflow IDs/states, trusted main run SHA/event/attempt, required checks/rulesets/reviewers/CODEOWNERS enforcement; Actions permissions/cache boundaries | Uncollected for phase 3 |
| Environments | Exact names, reviewers, branch/tag restrictions, variable NAMES, non-secret account/role/app mappings; auto-enable flag NAMES and effective policy | Uncollected |
| OIDC/GitHub App | Actual subject configuration, immutable/textual identity format, aud, exact repo/env subject; monorepo GitHub App authorization in SSR accounts | Uncollected |
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
