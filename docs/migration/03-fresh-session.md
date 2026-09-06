# Phase 3 fresh-session launch

This is a **proposed user prompt**, not standing execution authority. Merely reading this
file does not authorize its commands or permissions. The user may paste the block below
into a fresh session to authorize **offline implementation and local scoped commits only**.
GitHub writes, authenticated live inventory and production gates are explicitly excluded.

## Before starting

- Use the existing worktree `/Users/pauldiloreto/Projects/websites/main/`, not a source repo
  or an acceptance PR branch. The accepted code baseline is
  `4a947b3fd724ddfde7e633342095d41aefcbd6d6`; it is not a reset target.
- Prepared files are currently uncommitted. A fresh session in this same worktree sees
  them. A different clone will not receive them until separately approved publication
  or transfer; do not assume GitHub already contains this preparation package.
- Expected carry-over files: `AGENTS.md`, `docs/migration/02-scoped-ci-handoff.md`,
  `docs/migration/ci-parity.md`, `docs/migration/phase2-hosted-acceptance.md`,
  `docs/migration/03-execution-plan.md`, `docs/migration/03-production-cutover-handoff.md`,
  `docs/migration/03-fresh-session.md`, and `docs/migration/production-inventory.md`.
  Inspect actual status/diffs. If additional or conflicting changes exist, stop and ask;
  do not reset, stash, stage unrelated files or discard preparation evidence.
- Durable records under `docs/migration/` take precedence over historical scratch plans
  and historical checkpoint statements. `/private/tmp` results/downloads are conveniences,
  not prerequisites for recognizing recorded acceptance and not production recovery stores.

## Copy/paste prompt — offline implementation first

```text
Execute the OFFLINE IMPLEMENTATION portion of phase 3 in
/Users/pauldiloreto/Projects/websites/main/.

I authorize local deployment-workflow/helper/buildspec/IaC/test/runbook authoring and
fixture/offline validation under docs/migration/03-execution-plan.md. I also authorize
forward Conventional Commit local commits with the approved scopes, limited to the
reviewed preparation files and changes made for this offline work. Do not publish them.
Review the carry-over diff first; preserve unrelated user changes and stop on unexpected
state. Reconcile AGENTS.md only to this offline scope, preserving every other safeguard.

Read the ENTIRE docs/migration/03-execution-plan.md and its reconciled entry checkpoint,
03-production-cutover-handoff.md, this fresh-session guide, root/all four app AGENTS.md,
01-history-and-turborepo-handoff.md, 02-execution-plan.md, 02-scoped-ci-handoff.md,
phase2-hosted-acceptance.md, ci-parity.md, production-inventory.md, source-imports.json,
and the history normalization/redaction decision/maps/proofs. Read the six original
workflows through normalized importCommit:targetPrefix paths and current scripts/tests.
Use the durable phase-2 plan if the scratch copy is absent. Never rerun imports or global
normalization, restore redacted history, or require original source IDs as main ancestors.

Publication is accepted as verified by me. Phase-2 external acceptance is complete with
my explicit statement "main push behavior is accepted." Actual main-push and manual
baselines passed at 4a947b3fd724ddfde7e633342095d41aefcbd6d6; run URLs, scoped PR cases,
artifacts and cancellation evidence are in the handoff. Do not invent a multiple-main-push
test or a fresh-clone/publication command. Do not reopen those accepted prerequisites
because older checkpoint documents say pending. This does not waive phase-3 release
ordering, serialization, recovery or interleaving tests. Any newer code needs its own
validation, and unexpected subsequent history/remote drift requires reconciliation.

Start by reporting local state, accepted prerequisites and a bounded offline work plan.
Then implement the shared release authorization/order/recovery contracts and per-site
ports. Preserve the recommended production order Paul, DiLoreto, Carolyn, Sarabeth;
this is NOT permission to cut over any site. Preserve static candidate/same-byte rollback,
legacy Portfolio provenance, DiLoreto trusted harness/origin-edge checks, and separate
repository-connected SSR flows with exact commit/bundle/job attestation. Keep phase-2
CI unprivileged and migrate its workflow contracts without weakening security assertions.

Use the tested short-key scope comparator; never restore global latest-main-SHA equality.
Design an explicit compatible provenance contract for new release/recovery workflows:
phase-2 schema v1 fixes workflow identity and releaseAuthorized=false. Never modify a
historical/downloaded marker to grant permission, confuse PR source/merge SHAs, or use
SSR fixture bundles in production. New automatic deployment must be disabled/fail-closed,
including when configuration is missing. Manual production paths remain gated and must
not become accidentally runnable on publication. Preserve runtime secret namespaces,
accounts, package names, logical IDs, shared OIDC ownership and DNS/domain boundaries.

Use pinned Bun 1.4.0, Node 24.20.0, Turbo 2.10.12 and the authoritative isolated root
bun.lock. Install only at an independent TARGET checkout root with bun install
--frozen-lockfile; do not use source worktrees, production secrets or old ignored config.
Use empty HOME/environment and explicit safe tool paths for fixture validation. Preserve
Playwright 1.62.1 image/architecture pairs, snapshots, thresholds and fixture-only DNS
workarounds. No dependency upgrades, production Turbo cache or sibling credential use.

Local code must be committed before claiming exact-SHA full validation in an independent
target clone. Run required affected/full fixture chains serially per app, one Docker
app/image at a time locally. Recheck Colima disk capacity first; remove only proven
invocation-created images after fresh reference checks, with image rm --no-prune and
without force. Existing own-container cleanup traps may remain. No prune, daemon change,
old-image/volume deletion, source install, or unrelated service stop is authorized.

No GitHub API writes, pushes, workflow dispatches, release-ref promotion, PR cleanup,
settings changes or source-pipeline changes are authorized. Do not assume the prior
phase-2 test-branch approval applies to this stage. No live AWS/GitHub/source inventory,
production HTTP/CMS/email requests, credential reads, identity-only jobs, cloud lookups,
change-set creation/execution, deploy, DNS/domain mutation, automatic enablement,
old-writer disabling, trust removal, rollback drill or archival is authorized. Public
reference documentation and normal pinned dependency/tool downloads are allowed;
"offline" here means fixture/no live account or production access, not zero network.

Unknown live accounts/resources/role subjects/rollback values stay explicitly unknown.
Use local mocks/fixtures for inventory-dependent behavior, not guessed production IDs.
When actual live facts or credentials are required, stop that gate and request an exact
read-only access scope using production-inventory.md. Cloud/settings writes and each
site's preparation/candidate/production/enablement/retirement gates need separate approval.

Obtain independent review of the offline security/parity/order/history changes before
calling offline preparation complete. Update 03-production-cutover-handoff.md and the
per-site ledger with actual commit/test evidence, review findings, unknowns and the next
approval. Copy a redacted summary to /private/tmp/websites-plan-3-results.md. Finish with
what is prepared, what is blocked, exact next safe action, and what is NOT migrated.
Do not claim production migration completion or proceed across any unapproved gate.
```

## Later approvals — not included in that prompt

Before any live inventory, ask for exact repository/account/profile/role/resource/service
read scopes and any permitted non-sending URLs. `production-inventory.md` has the form.
Do not ask the user to paste secrets or silently use default AWS credentials. Actual
OIDC subjects, app IDs, branch mappings and rollback markers must be observed under that
scope before credentialed configuration is finalized.

Settings approval must specify required `CI gate`, protections/reviewers/CODEOWNERS and
environments rather than broadly permitting repository administration. Candidate/cloud
preparation, source freeze/drain, each production switch, Sarabeth domain remap, automatic
enablement, rollback window/trust removal and optional retirement remain distinct gates.

If cleanup is desired, request permission to close PRs #1–#6 without merging and delete
only their exact `ci/acceptance/20260906-890d1b/<case>` refs after matching the final heads
in `phase2-hosted-acceptance.md`. Cleanup is not a phase-3 prerequisite and is not covered
by offline implementation approval. Evidence publication also requires separate approval.
