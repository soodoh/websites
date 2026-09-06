# GitHub settings attempt — 2026-09-06, STOPPED; no successful change confirmed

**Historical checkpoint.** The user later separately authorized browser continuation and
completed Confirm access. Main and four production environment settings were saved and
read back: [github-browser-settings.md](github-browser-settings.md). That success does not
change this original REST422 result or establish its missing diagnostic cause. No CLI
retry or shell-wizard execution occurred. The old guide is superseded; do not use it to
recreate existing environments. Infrastructure remains excluded.
The user subsequently migrated main to ruleset22398923; current scope is PR publication
only, leaving its recorded policy differences unchanged and stopping before merge.

## Accepted policy and exact authority

The user said **“i accept, proceed”** for the solo-maintainer policy, then explicitly
selected **“Main + four production environments (Recommended)”**. This accepts the routine
solo-review trade-off and authorized fresh target metadata/check-provider reads plus the
specified settings/readback on `soodoh/websites` (ID `1358469291`).

**`infrastructure-sarabeth` was excluded.** Publication, pushes/ref changes, collaborator
or App grants, workflow/deployment execution or approvals, secrets/variables, source repos,
AWS and production HTTP remained excluded. This was not production migration approval.

Public API preflight found that the draft's `can_admins_bypass` field was not exposed in
the published REST or GraphQL environment schemas. The supported UI instruction is to
uncheck **Allow administrators to bypass configured protection rules**. The assistant
withdrew the API-field assumption before live requests; no undocumented field was sent
and no weaker environment policy was substituted.

The user then selected **“CLI main + guided environments (Recommended)”**: perform the
approved main protection through CLI and prepare a human UI guide for all four production
environments. No environment writes were made by the agent.

## Preflight and one attempted write

Fresh repository/main/settings metadata matched the prior baseline. `soodoh` / user ID
`18269267` was freshly observed with admin permission on this repository. Both successful
`CI gate` check runs at `4a947b3fd724ddfde7e633342095d41aefcbd6d6` identify **GitHub Actions
App ID `15368`**, slug `github-actions`, owner `github` / ID `9919`:

- [Check 101417364565](https://github.com/soodoh/websites/actions/runs/34007139470/job/101417364565), suite `92146509087`.
- [Check 101413075585](https://github.com/soodoh/websites/actions/runs/34005716802/job/101413075585), suite `92143011958`.

No new run, log download, identity token or application test was executed. Main was
unprotected, rulesets/effective rules empty, and environments absent. Actions/default-token/
OIDC settings matched the earlier observations. Fresh main/protection/ruleset reads were
repeated immediately before the single approved mutation; this is not an atomic lease.

Attempted once: `PUT /repos/soodoh/websites/branches/main/protection` with API version
`2022-11-28` and exactly this non-secret payload:

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [],
    "checks": [{"context": "CI gate", "app_id": 15368}]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
```

**Result: HTTP422, CLI exit1 at 2026-09-06T17:28:58.778469Z.** No automatic retry,
rollback or alternative mutation followed. The original error response body was not
retained by the recorder; **the precise validation reason is unknown**. This is a
diagnostic limitation, not proof of an invalid check identity, unsupported zero-review
policy, permission failure or successful protection. Do not repeat a live mutation merely
to recover missing diagnostics. Any revised attempt should retain allowlisted validation
fields/codes safely rather than discard all useful error detail.

Read-only reconciliation then observed:

- Classic protection GET: HTTP404.
- Main: same expected SHA, `protected=false`.
- Environment list: total_count0.

Taken together these observations confirm **no successful protection/environment setup**
at readback. No direct-push, PR, environment or identity canary was executed. Stop at this
failed-operation checkpoint; continued writes need an explicitly revised approach. Routine
solo-risk acceptance is recorded and need not be asked again; it does not authorize an
unbounded retry or a weaker policy.

## Evidence and manual guide

Private evidence directory: `/private/tmp/websites-github-settings.hhjm8U/`. Approval and
method decisions, exact preflight projections, original request bytes/intent, rejected
result and reconciliation are retained. The main payload file SHA256 is
`1a054733c9c928a7e7b61ff01117e8b3021f96a5d41c702e197e87a9c309fcc5`; rejected result SHA256 is
`8cf8ff450cdc1155063bfd350cb111b49222330a46336dd41219af44149385c5`.
The final private manifest binds the completed scratch files; raw account responses,
credentials and error bodies were not persisted. Total live requests in this attempt:
**17 GETs and one rejected PUT**, no environment writes. Scratch is not production recovery
storage and is retained until user requests removal.

Prepared but **not executed**:
`/private/tmp/websites-github-settings.hhjm8U/configure-production-environments.sh`.
Five stages: failed-main gate, then Paul, DiLoreto, Carolyn, Sarabeth. Each environment
stage guides the user through exact reviewer `soodoh`, self-review allowed, no wait timer,
admin bypass unchecked, and a single Branch/main rule. It creates no secrets/variables,
performs no CLI API calls and captures no values. Template library is unchanged. Initial
ShellCheck reported the template's unused RED variable; the stage now uses that color,
and final `bash -n` and ShellCheck pass. The guide remains paused until main protection is
resolved and manual setup scope is renewed; do not execute it as a continuation of the
failed operation. When those prerequisites are met, its invocation is:

```bash
/private/tmp/websites-github-settings.hhjm8U/configure-production-environments.sh
```

Future verification must distinguish API-visible fields from the UI-only admin-bypass
observation. A wizard confirmation or settings screenshot is human evidence, not an
executed enforcement test. Never record all four environments as protected from this
unexecuted guide.

## Next safe action

Review a revised exact main-protection approach (or a human UI procedure), with useful
redacted failure diagnostics and explicit retry/method approval. Do not infer a cause for
422. After successful main protection, resume the separately confirmed four-environment
UI setup and readback; infrastructure remains excluded. No settings recovery/deletion,
publication, AWS access or deployment is authorized by this report.

Local HEAD remains `cf33c900`; latest independently full-tested checkout remains
`37dac114`. This pass changes documentation only locally, makes no commit and does not
reopen offline or phase-2 acceptance. **All four sites remain NOT migrated.**

## Sources

- [Protected branches REST API](https://docs.github.com/en/rest/branches/branch-protection?apiVersion=2022-11-28#update-branch-protection): documented zero-review count and App-bound status checks; documentation does not explain this particular422.
- [Environment REST API](https://docs.github.com/en/rest/deployments/environments?apiVersion=2022-11-28#create-or-update-an-environment): no documented admin-bypass input/readback field.
- [Deployment branch policies](https://docs.github.com/en/rest/deployments/branch-policies?apiVersion=2022-11-28#create-a-deployment-branch-policy): distinct branch/tag rule types.
- [Deployments GraphQL schema](https://docs.github.com/en/graphql/reference/deployments): published UpdateEnvironmentInput also lacks that admin-bypass control.
- [Managing environments UI](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments): documented checkbox and save operation for disabling administrator bypass.
