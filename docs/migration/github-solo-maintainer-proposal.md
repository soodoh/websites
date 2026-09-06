# Solo-maintainer GitHub policy — routine settings applied; infrastructure excluded

**Later checkpoint:** the user migrated main to ruleset22398923. Conversation resolution
is now off and only squash merges are allowed; the user chose **Publish PR only**, not
settings changes or merge. See [github-browser-settings.md](github-browser-settings.md).
The original policy and18:56Z acceptance below remain historical, not a claim of current
equivalence. Preserve accepted history and all production gates.

## Decision and boundary

The user accepted routine solo risk, approved main plus four production environments,
then authorized browser setup and personally completed Confirm access. Saved main rule
82810912 and all four environments now match reopened UI checks at2026-09-06T18:56Z:
[github-browser-settings.md](github-browser-settings.md). Infrastructure remains excluded.

The earlier [REST422 attempt](github-settings-attempt.md) remains a separate failed record;
its cause is unknown and the CLI write was not retried. The browser continuation applied
the policy below, not independent review or production authorization. The
[independent design](github-protection-proposal.md) remains for comparison.

Target remains `soodoh/websites` / repository ID `1358469291`. The dated
[production inventory](production-inventory.md) is the evidence baseline, not a current
configuration guarantee. All four sites remain NOT migrated and every release/runtime
publication lock remains closed. No CODEOWNERS, workflow, settings, reviewer access or
cloud resource is changed by this draft.

## Security trade-off to accept explicitly before implementation

One person can author, merge and approve production execution. This design therefore
**does not provide independent code review, enforced code-owner review, separation of
duties or protection against a compromised sole-maintainer account**. CI can detect tested
failures, but that same maintainer can modify the workflow/check implementation or change
repository settings. A green check is not independent authorization of its own definition.

Manual environment review provides a deliberate pause and execution record, not a second
person. Turning off admin execution bypass does not prevent an administrator from changing
settings. AI reviews and a second account controlled by the same person are not independent
human review. Do not describe them as equivalent compensating controls.

If this residual risk is unacceptable, retain the independent-review design and wait for
an eligible reviewer. In particular, accepting routine solo review must not silently accept
solo high-privilege Sarabeth infrastructure execution; that requires its own risk decision.

## 1. Exact proposed main-branch policy

Use classic protection on exact `main`, not a release-ref wildcard. Desired values:

| Control | Solo proposal | Difference from independent design |
| --- | --- | --- |
| Pull request required | Yes; no routine direct pushes or configured bypass actors | Unchanged |
| Required approving reviews | **0** | Removes the unavailable second-person requirement |
| Require code-owner reviews | **false** | No claim of enforced sensitive-path ownership |
| Require latest push approval by another person | **false** | Cannot require a second person in a solo design |
| Dismiss stale approvals | **false** | No required approval exists; advisory reviews are not authorization |
| Required status check | Exactly `CI gate`; GitHub Actions App15368 observed in prior API preflight | Saved browser rule accepts GitHub Actions; no new numeric API readback |
| Require up-to-date branch for merge | **true** | Merge protection only; per-site release input comparison remains unchanged |
| Require resolved conversations | **true** | Unchanged; sole maintainer may still resolve conversations |
| Enforce for administrators | **true** | No PR/check execution bypass proposed |
| Allow force pushes / deletion | **false / false** | Unchanged |
| Require linear history / signed commits | **false / no new requirement** | Preserve existing graph and signatures; no history rewrite |
| Merge queue | Not enabled | Current CI lacks `merge_group` trigger |
| Additional push-actor restrictions | None added | Do not assume organization-only controls exist for a personal repository |

Implementation must verify that GitHub actually requires a PR with zero approving reviews;
if the API/UI instead removes the PR requirement, **stop**, rather than allowing direct
pushes. Keep `CI gate` as the single aggregate required check so scoped app skips remain
valid. Do not require credentialed jobs for merging or weaken the CI gate implementation.
Binding to the Actions App is not a workflow-content signature or a barrier against a
malicious workflow change by an authorized maintainer.

CODEOWNERS is not an enforcement prerequisite for this alternative. A later optional
notification-only file could name the owner, but is not authored here and must not be
represented as mandatory independent review. Sensitive changes (`.github/**`, tooling,
lock/tool pins, migration/release inputs, app code and IaC) still warrant manual diff and
advisory independent review; that is an operating practice, not a GitHub-enforced gate.

## 2. Exact proposed environment policy

Proposed reviewer: sole owner **`soodoh`**, user ID **`18269267`** from the dated repository
owner observation. This is a proposed policy identity, not fresh verification of current
reviewer eligibility, an access grant, or permission to use any additional credentials.
Verify it again under renewed scope before an approved write.

| Environment | Purpose / expected account (AWS unverified) |
| --- | --- |
| `production-portfolio` | Paul release/recovery; `658271954302` |
| `production-diloreto` | DiLoreto release/recovery; `658271954302` |
| `production-carolyn` | Carolyn candidate/production lifecycle; `725669362139` |
| `production-sarabeth` | Sarabeth routine release; `015989770400` |
| `infrastructure-sarabeth` | Separate high-privilege infrastructure; `015989770400`; separate explicit solo-risk and execution approval required |

Desired settings for each approved environment:

- Required reviewers: exactly the verified `soodoh` user, one manual approval.
- **`prevent_self_review=false`**: deliberately permits the initiating maintainer to
  approve their own deployment. This is the explicit reduction from the independent model.
- Administrator bypass: **disabled through the documented UI checkbox**, “Allow
  administrators to bypass configured protection rules” unchecked. The earlier
  `can_admins_bypass=false` API assumption was withdrawn: published REST/GraphQL schemas
  do not expose a verified field. Do not send it or claim API readback verifies it.
  Approval by the listed owner is ordinary self-approval, not an admin bypass.
- Custom deployment branch policies enabled, protected-branches-only disabled; exactly
  one **branch-type `main`** rule, no tag or wildcard rules. Verify actual name/type.
- Wait timer **0**; a time delay is not independent approval.
- No automatic/bot/agent approval, secrets, variables, cloud grants, GitHub App access,
  source-ref creation, runtime flag changes or release enablement in this settings proposal.

The invoking workflow must be on main; its trusted selected checkout can still be an
approved exact candidate/recovery SHA. Do not admit release branches/tags just to make a
job pass. Retain candidate/production separation, trusted harnesses, account guards and
same-resource recovery semantics. Environment labels alone provide no folder-level
security isolation.

A later, separately authorized production run should be approved by the human only after
reviewing its exact workflow/source SHA, operation, intended account/resource, candidate
proof and recovery readiness. A chat instruction or drafting this file does not approve a
pending GitHub deployment. Infrastructure approvals are not inherited from routine ones.

## 3. Unchanged policy and migration boundaries

Keep Actions enabled, default workflow token permissions read-only, workflow PR-review
approval disabled, and existing Actions allow policy/OIDC customization unchanged. Preserve
current authored action pins and canonical tool/image pins; repo-level pinning enforcement
or an action allowlist needs a separate compatibility review. No JWT/STS request is part
of this draft, and use_default=true does not prove the runtime OIDC subject/audience.

Keep every literal-false credential/reusable release gate, disabled candidate/promotion/
automatic flag and publication/runtime lock. Settings preparation does not activate any
pipeline or transfer production ownership. Source repos, AWS resources, CMS/DNS, recovery
capture, identity jobs, cutover, rollback drills and retirement remain separately gated.

## 4. Proposed implementation sequence — no execution authorized

1. User explicitly accepts the solo risk and this policy instead of the independent
   version; separately decide whether to include the infrastructure environment at all.
2. Renew narrowly scoped target reads to verify identity/configuration, reviewer eligibility,
   exact `CI gate` check App ID, API support and current main. Show a complete exact settings
   diff and stop on unexpected drift. Do not guess IDs or use broader account discovery.
3. Obtain explicit write approval for exact-main protection and each included environment;
   collaborator grants, secrets/variables, OIDC changes and publication remain excluded.
4. Apply only the approved controls, preserving full closed deployment gates. If a setup
   requires multiple requests, do not leave a credentialed permissive environment; verify
   each final reviewer/self-review/bypass/ref policy before calling setup complete.
5. Publication requires its own exact commit/ref/PR approval. Use a graph-preserving PR
   merge path, never force/squash/rebase. The sole maintainer may merge after required CI;
   zero review count does not excuse failing or missing checks. No CODEOWNERS bootstrap
   exemption or second-account self-review workaround is needed for this alternative.
6. Read back protection and environment settings. Any PR/direct-push-denial or deployment
   canary is a separately approved test, not implied by write access. A deliberate positive
   or negative push is still a remote operation. Do not claim enforcement was exercised
   from metadata alone. Record partial failures and stop; no automatic protection removal,
   environment deletion or bypass grants as recovery.
7. Stop before identity/candidate/production execution. Each site still needs source/AWS
   inventory and a reviewed preparation/recovery/cutover plan. Production order remains
   Paul → DiLoreto → Carolyn → Sarabeth, one separately approved site at a time.

## Current disposition

**Routine solo risk accepted; approved main and four environment settings applied.**
Reopened browser UI verified the policy at2026-09-06T18:56Z; see
[github-browser-settings.md](github-browser-settings.md). The earlier REST422 remains
historical with unknown cause, not a successful API attempt. The shell guide was never
executed and is superseded. Infrastructure remains excluded. Do not re-ask routine risk
acceptance, rerun creation or infer execution approval: every downstream publication,
identity, enforcement-test and production gate remains closed.
