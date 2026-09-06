# Target GitHub protection proposal — DRAFT, NOT APPLIED

**Current direction:** the user accepted the routine solo model, excluding infrastructure.
The earlier main REST422 remains preserved; subsequent explicitly approved browser setup
saved main plus four environments, verified in [github-browser-settings.md](github-browser-settings.md).
This independent design remains unapplied for comparison, not silently satisfied by the
weaker solo model or extended to infrastructure.
The user subsequently migrated main to ruleset22398923 (conversation resolution off,
squash-only). Current approval is **Publish PR only**, no settings correction or merge;
the linked browser/settings record documents those differences.

## Scope and evidence

User authorized local proposal/durable-inventory work after the completed target-only
read pass. **No settings writes, further live reads, publication, workflow dispatch or
production operation is authorized by this document.** All four sites remain NOT migrated.

Target: `soodoh/websites`, repository ID `1358469291`. Dated observations and approval are
in [production-inventory.md](production-inventory.md). At that observation, main was
`4a947b3fd724ddfde7e633342095d41aefcbd6d6`, unprotected with no rulesets; five CI workflows
and zero environments were returned. Local offline handoff HEAD is `cf33c900` and the
latest full-tested checkout is `37dac114`; neither this draft nor a later docs SHA is
newly full-tested or authorized for publication/release.

This is a desired-policy diff, not an executable API payload. Before applying, renew the
exact read scope, check current GitHub feature/API behavior and fresh configuration,
resolve the identity fields below, and obtain an explicit bounded write approval.
Unexpected drift/access limits stop the gate; do not broaden permissions or fall back
to weaker protection. Use one protection mechanism, not overlapping rulesets and classic
rules whose combined behavior was never reviewed.

## 1. Proposed main branch protection

Recommended mechanism: classic protection on **exact branch `main`**, with no wildcard
rule on release branches. Current state: none observed. Desired values:

| Control | Proposed value |
| --- | --- |
| Pull request required | Yes; one approving review minimum |
| Code-owner approval | Required, with valid named owners in `.github/CODEOWNERS` after the bootstrap below |
| Stale approvals | Dismiss on new reviewable commits |
| Latest reviewable push | Require approval by someone other than the last pusher |
| Conversation resolution | Required |
| Required status check | Exactly `CI gate`, bound to GitHub Actions App15368 observed in prior scoped preflight; this component is now configured in the solo browser rule, not independent-review acceptance |
| Branch freshness for merge | Strict/up-to-date checks enabled; this is PR merge protection, not a new global-main freshness test for per-site release eligibility |
| Administrator enforcement | Enabled; no configured PR/check bypass actors |
| Force pushes / branch deletion | Disallowed |
| Linear history | Not required; preserve imported ancestry and ordinary merge commits |
| Signed commits | No new requirement proposed; do not rewrite existing commits/signatures |
| Merge queue | Not enabled; current CI has no `merge_group` trigger |
| Additional push-actor restriction | None added in this proposal; PR/review/check rules apply to existing writers including admins |

The existing `.github/workflows/ci.yml` names its unconditional aggregate job `CI gate`;
it evaluates selected app results through `scripts/ci/gate.mjs`. Do not require all four
individual app jobs on every scoped PR, replace the aggregate with an always-success
placeholder, or make privileged release jobs required merge checks. Existing phase-2
main-push acceptance remains settled. A future new-SHA validation is not a rerun of that
acceptance exception.

Check identity is not established by the Actions workflow ID `351279106`. A separately
approved check-run metadata read must identify the provider App and exact context. Binding
to GitHub Actions narrows the source but does not make arbitrary same-repo workflows
trusted; sensitive workflow review remains necessary. A recent qualifying check may be
needed before GitHub permits selection; do not dispatch a workflow without approval.

## 2. CODEOWNERS and reviewer prerequisites

No CODEOWNERS file exists in the locally available tree of the observed published SHA
at `.github/CODEOWNERS`, root `CODEOWNERS`, or `docs/CODEOWNERS`. Enabling a code-owner
review toggle without a valid file and eligible owners does not protect sensitive paths.
This proposal does **not** create a placeholder `.github/CODEOWNERS` or grant collaborator
access.

Proposed initial coverage: one root catch-all `*` owned by the user-nominated independent
maintainer(s), with no later pattern overriding it. This includes `.github/**` and
CODEOWNERS itself, root manifests/lock/tool pins, `scripts/**`, `docs/migration/**`, all
app code and owning IaC. Broad coverage is intentional for initial cutover; app-specific
owners or narrower patterns require a separate reviewed change.

Before implementation:

- User supplies exact reviewer login(s); eligibility and existing repository write access
  must be verified under a renewed named read scope. Adding access is a separate write
  approval, not part of recording a login. Do not assume organization teams are available
  for this user-owned repository.
- At least one eligible independent human must be able to approve changes by the normal
  author/last pusher. Listing only the PR author does not satisfy review. AI review reports
  are not GitHub human approvals.
- If no independent reviewer is available, this proposal remains blocked. Do not silently
  permit self-approval or an admin bypass; any weaker solo-maintainer alternative requires
  a separate explicit risk decision and replacement proposal.
- With multiple CODEOWNERS on a line, do not claim approval from every listed person is
  required. This proposal requires one qualifying independent owner review.

## 3. Proposed deployment environments

Create only the following five exact names, **after reviewer identities and complete
policy are approved**. All are currently absent. Account mappings are expected plan
values, not verified AWS inventory or permission to populate credentials.

| Environment | Expected account / role purpose |
| --- | --- |
| `production-portfolio` | `658271954302`, Paul routine release/recovery |
| `production-diloreto` | `658271954302`, DiLoreto routine release/recovery |
| `production-carolyn` | `725669362139`, Carolyn routine candidate/production lifecycle |
| `production-sarabeth` | `015989770400`, Sarabeth routine release |
| `infrastructure-sarabeth` | `015989770400`, separate protected infrastructure authority |

Desired policy for each:

- Required reviewers: **unresolved user-nominated eligible human identities**, one
  qualifying approval. GitHub's reviewer list is not an all-reviewers approval quorum.
- Prevent self-review: **true**. The workflow initiator cannot approve their own run.
- Administrator protection bypass: **disabled** by unchecking the documented UI control.
  Correction: the draft's `can_admins_bypass` API-field assumption was withdrawn after
  REST/GraphQL reference inspection; no verified API field was found. Use explicit UI
  evidence, not an invented request/readback field or a waiting-timer substitute.
- Deployment branch policy: custom rules enabled, protected-branches-only disabled;
  exactly one branch-type rule for **`main`**, no tag-type or wildcard rules. Read back
  the actual rule type/name; do not use “protected branches only” as a shortcut.
- Wait timer: **0**; human approval/ref policy, not delay, is the intended control.
- No secrets, variables, auto-enable values, AWS role grants, GitHub App installation or
  branch creation included. Unknown live IDs stay unknown; don't copy plan IDs into live
  configuration as though verified.

The rule constrains the workflow invocation ref, not the checkout/source ref inside a
trusted run. Carolyn `amplify-production`/isolated candidate and Sarabeth source refs are
not additional allowed workflow invocation branches. Preserve exact-SHA selection and
existing trusted-harness guards; environment protection does not attest built contents.
No new candidate environment is invented for the current workflows.

Repository admins can still change settings with sufficient authority. Turning off an
execution bypass is not immutable protection against a malicious administrator; shared
maintainers remain a trust boundary. An environment label is not per-folder isolation.

## 4. Actions and OIDC policy — keep stable in this first proposal

| Setting | Observed value | Proposed first-stage action |
| --- | --- | --- |
| Actions enabled | true | Keep |
| Allowed actions | all | Keep for this bounded change; a restrictive allowlist needs a complete action/reusable-workflow dependency review |
| Repository SHA-pinning requirement | false | No settings change yet; preserve existing authored SHA pins. Evaluate enforcement compatibility separately, not by changing tool/image pins |
| Default workflow token permissions | read | Keep |
| Workflow approval of PR reviews | false | Keep |
| OIDC customization | use_default=true | Keep; do not request a JWT or infer runtime sub/aud from this flag |

No new Actions permissions, token scope, repository installation or OIDC custom subject
is proposed. Actual job identity/STS/account/trust checks are separately gated. All new
credential jobs/reusable release calls remain literal-false, all runtime/publication
locks stay closed, and unprivileged phase-2 CI stays unprivileged.

## 5. Approval and bootstrap order (not execution authority)

1. Resolve independent reviewer(s), valid CODEOWNERS coverage and the check App identity;
   review current live configuration under a new exact read approval. Show the complete
   settings diff and known feature support before seeking write approval.
2. Obtain separate approvals for any access grant, local CODEOWNERS authoring, exact
   publication/PR plan, and exact target settings operations. Preserve the local phase-3
   commit graph; no force push, squash, rebase or implicit publication. A merge-commit PR
   route can preserve reviewed ancestry, but is not authorized by this draft.
3. Under the approved bootstrap plan, protect main with the review/check rules before
   the publication PR is merged. Until CODEOWNERS is on the base branch, require explicit
   independent manual review of that bootstrap PR; do not claim GitHub automatically
   enforces the newly proposed owner file for its own initial PR. No bypass is proposed
   if this leaves the PR blocked. Preserve all production locks throughout.
4. After approved publication/merge, verify base-branch CODEOWNERS recognition and actual
   required-review/check enforcement. Do not claim a base-absent owner file supplied
   complete sensitive-path enforcement during bootstrap. No trusted release may be
   enabled before this prerequisite is proven.
5. If separately approved, create the five environments with reviewers and ref policies;
   do not leave permissive defaults or credentials during multi-request setup. Read back
   each completed configuration before describing it as protected. Existing literal-false
   release gates must remain closed throughout partial setup and verification.
6. Any PR/blocked-deployment/identity canary test requires its own execution scope. Metadata
   readback alone is not an executed enforcement test. Stop after the approved settings
   gate; source/AWS inventory, publication validation, identity, candidate, production,
   automatic enablement, recovery drills and retirement each retain their own approvals.

On partial failure: stop and record precisely which settings succeeded. Do not automatically
remove protections, delete environments or grant bypass. A restoration plan needs its own
approved exact previous/desired configuration; changes could otherwise weaken security or
unblock queued work. Never fix a bootstrap blockage by rewriting history or weakening CI.

## Decision needed before implementation

**Who should be the independent code owner and deployment reviewer(s)?** Exact logins and
eligibility are unresolved; do not assume the current owner `soodoh` alone is sufficient.
This draft is deliberately not apply-ready. No commit/publication or settings change has
been made by drafting it.
