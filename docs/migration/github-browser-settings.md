# GitHub browser settings — applied and read back, 2026-09-06

## Subsequent user migration to rulesets and PR-only publication

After this browser checkpoint, the user said **“commit, push, and continue”** and then
**“I migrated these to rulesets instead of branch protections.”** Read-only preflight
confirmed main still at `4a947b3f`, protected=true, while classic-protection GET and the
old rule URL returned404. This is now reconciled as the user's migration, not an excuse
to recreate classic protection. No agent settings mutation occurred in this continuation.

Active repository ruleset **22398923**, named `main`, targets exactly `refs/heads/main`,
with no exclusions or bypass actors. Effective-rule readback confirms deletion/non-fast-
forward prevention, PR required with zero approvals, strict `CI gate` from integration15368.
However, **required conversation resolution is false and allowed merge methods are only
squash**. Status checks do not enforce on branch creation; the extra-approval-for-unattributed-
changes parameter is true. These observed values are recorded, not silently normalized.

After the differences were presented, the user selected **“Publish PR only”**: leave
settings unchanged, commit/push for ordinary PR CI, and stop before merging or rewriting
the accepted history. This does not accept squash-merging the existing commit graph or
claim that the replacement ruleset is equivalent to the original policy. No merge,
settings change, manual/privileged dispatch, AWS/source/production inventory or deployment
is authorized. The branch publication includes the fifteen previously accepted local
commits plus the new documentation commit; it is not only a seven-file remote diff.

Publication branch: `migration/phase3-offline-preparation-20260906`. Evidence directory:
`/private/tmp/websites-phase3-publication.SbNa6E/`. Fresh preflight confirmed branch absence
and no existing PR for that branch. A first SSH read omitted the existing agent socket and
failed public-key authentication; a bounded read using the inherited agent succeeded.
No credential material or Git configuration was changed/exported. The first failed classic
GET did not retain its diagnostic; the subsequent read retained the explicit404 response.

The sections below retain the earlier browser checkpoint. Its classic rule, no-publication
scope and uncommitted-documentation statements are historical, not current configuration.

## Scope and approval

After accepting the routine solo-maintainer policy and explicitly excluding infrastructure,
the user requested **“Help me set this up in the browser then”**. The browser continuation
was limited to `soodoh/websites`: exact-main protection and the four production environments.
The user personally completed GitHub's **Confirm access** prompt and replied **“done”**.
The agent did not read, enter or export passwords, cookies, session state or tokens.

**The approved settings are saved and match reopened UI readback.** This is configuration
evidence, not an executed PR/direct-push/deployment enforcement test, identity verification
or production acceptance. All four sites remain NOT migrated.

## Main protection

Saved classic rule [82810912](https://github.com/soodoh/websites/settings/branch_protection_rules/82810912),
exact pattern **`main`**, observed applying to one branch. Final reopened check:
**2026-09-06T18:56:32.780Z**.

| Setting | Saved UI value |
| --- | --- |
| Require pull request | On |
| Require approvals | Off (solo model) |
| Stale-review dismissal / code-owner / latest-push approval | Off / off / off |
| Required status check | Only `CI gate`; accepts updates from **GitHub Actions** |
| Require branch up to date | On |
| Require conversation resolution | On |
| Do not allow bypassing above settings | On; applies to administrators |
| Force pushes / deletion | Off / off |
| Signed commits / linear history / required deployments / branch lock | Off / off / off / off |

The earlier scoped API preflight observed GitHub Actions App15368. This browser pass
verified the named provider selected in the saved UI; it did not repeat API readback or
re-read the remote commit SHA. No ref was changed by these operations. The previous
published-main observation remains `4a947b3f`; local HEAD remains `cf33c900`.

## Four production environments

Final read-only reload of each environment and exact four-entry list completed at
**2026-09-06T18:56:06.331Z**:

| Environment | Observed ID / settings URL |
| --- | --- |
| `production-portfolio` | [21361791310](https://github.com/soodoh/websites/settings/environments/21361791310/edit) |
| `production-diloreto` | [21361907728](https://github.com/soodoh/websites/settings/environments/21361907728/edit) |
| `production-carolyn` | [21361962764](https://github.com/soodoh/websites/settings/environments/21361962764/edit) |
| `production-sarabeth` | [21361988297](https://github.com/soodoh/websites/settings/environments/21361988297/edit) |

Each saved configuration has:

- Required reviewers on, **only `soodoh`** selected.
- Prevent self-review **off**, deliberately permitting the sole maintainer's approval.
- **Allow administrators to bypass configured protection rules off**, verified through
  the actual UI checkbox, not an invented `can_admins_bypass` API field.
- Wait timer off; selected-branches-and-tags policy with exactly **one Branch/main rule
  and zero tag rules**. Saved UI reports “1 branch and 0 tags allowed.”
- No environment secrets or variables. No credentials, role/account mappings, custom
  protection Apps, auto-enable flags or cloud grants were added.

`infrastructure-sarabeth` is **absent and excluded**. No candidate environment or source
branch was created. Source/AWS/CMS/DNS/recovery operations and publication/deployment
execution remain separately unapproved.

Environment setup was not atomic: a newly created environment initially has defaults,
and selecting custom restrictions without adding a rule displayed that all branches/tags
were still allowed. The explicit Branch/main rule was added before final verification.
No credentials were introduced, and no deployment/workflow was run during this transition.
Do not claim that the environments were protected throughout every intermediate click.

## Preserved failures and evidence limits

The earlier [REST attempt](github-settings-attempt.md) remains HTTP422; its missing detailed
error/unknown cause is not retroactively repaired or relabeled by this browser success.
The CLI mutation was not retried. The prepared human shell wizard was not executed and is
now superseded for these already-created environments; **do not run it to recreate them**.

Browser navigation initially timed out but the subsequent snapshot showed the correct
page. A stale-ref click was rejected before execution, then refreshed; the main Create
submission led to Confirm access and resumed after the user's authentication. Saved main
was inspected before further writes. A requested snapshot path outside MCP's allowed roots
was denied; evidence was then saved under the allowed, Git-ignored `.playwright-mcp/` root.
No tool restriction or browser security control was changed.

DiLoreto's first readback helper matched hidden copies of the text “main” and stopped
on selector ambiguity after saves. A read-only visible branch-row check and saved snapshot
confirmed the intended single rule; no creation/save was retried. Later readbacks used the
visible branch row. All four final reload checks passed.

Selected non-secret snapshots: `.playwright-mcp/browser-settings-sI257J-*.yaml` (Git-ignored).
Private evidence: `/private/tmp/websites-browser-settings.sI257J/`, including approval,
human-auth checkpoint, `verified-settings.json`, copied selected snapshots and manifest.
No raw network headers or hidden form/authentication values were exported. Scratch is not
production recovery storage; prior evidence remains intact.

The 16-file manifest was hash-verified; manifest SHA256:
`14d1b2c0f8734d848e237eca96db9adadf09206261a1598fc4ef7491495ee8dc`.
Both earlier inventory/settings manifest hashes remain unchanged. Local validation passed
whitespace checks, 15 relative Markdown links across seven intentional documentation
paths, unchanged HEAD and empty index. No application tests/install/Docker work occurred.

The accepted solo model lacks independent authorization against a compromised owner:
that owner can author, merge, approve execution and change settings. Manual review and CI
are not a second person's approval. This accepted trade-off does not extend to infrastructure.

## Next gate

Stop after this settings/readback report. No push, PR merge, canary, workflow dispatch,
identity job, AWS/source inventory or deployment is implied. Next work can be separately
scoped publication planning or source/AWS read-only inventory; a new hosted commit still
needs its own validation. The latest full-tested checkout remains `37dac114`; these local
documentation changes are uncommitted and are not a new tested SHA. Offline and phase-2
acceptance remain settled; original repositories remain production owners.
