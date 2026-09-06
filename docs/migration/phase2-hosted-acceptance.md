# Phase 2 hosted acceptance — accepted with explicit evidence exception

## Authority and status

The user accepted publication as verified, approved read-only GitHub inspection and
local evidence edits, then explicitly approved validation-only dispatches and temporary
acceptance branches/PRs. This is a bounded exception to the root's phase-2 local-only
execution boundary, not general GitHub or phase-3 authority. No main merge, main push,
settings change, production access, source-repository operation or AWS access occurred.

All authorized hosted cases passed. The user subsequently stated **"main push behavior
is accepted"** and requested fresh-session phase-3 preparation. The parent therefore
accepts phase-2 external validation with that specific evidence exception. The unexecuted
multiple-main-push experiment remains unexecuted; dispatch overlap is not equivalent proof.
This exception does not waive phase-3 release ordering/recovery/interleaving tests.
Required-check settings and phase-3 execution authorization remain separate decisions.

Base/main remained `4a947b3fd724ddfde7e633342095d41aefcbd6d6`, checked before writes
and after artifact verification. The first main-push baseline is documented in
`02-scoped-ci-handoff.md`. No history rewrite or repeated import occurred.

## Temporary changes and exact identities

Batch `20260906-890d1b`; branches are `ci/acceptance/20260906-890d1b/<case>`.
All PRs target main, are draft, say DO NOT MERGE, and remain open/unmerged with their
branches retained. Cleanup has not been performed. No temporary fixture is on main.
Commits were created through the target GitHub Git-data API with scoped messages and
normal parent ancestry. Only the invocation-owned Sarabeth branch advanced again, by a
non-force fast-forward, to test replacement cancellation. Local main was not committed.

- App cases add only `apps/<site>/ci-acceptance.md`, a non-runtime Markdown marker.
- Shared case changes one space to two after `"schemaVersion":` in
  `config/ci-scopes.json`; parsed configuration is identical.
- Docs case appends a non-rendering acceptance comment to allowlisted root `README.md`.
- Sarabeth replacement appends one explanatory sentence to its marker.

| Case / PR | Final source head | Actual validated PR merge checkout |
| --- | --- | --- |
| [sarabeth #1](https://github.com/soodoh/websites/pull/1) | `16fde0b9984a21c31a71e9f4c79798a8fb865523` | `4f44461f24d54b0d2db8eeeaf596caa9ca1b3e5e` |
| [carolyn #2](https://github.com/soodoh/websites/pull/2) | `0d45157aca2fe2c5a890b686c0ae2f3dfe658990` | `7cb751130e5e4c16a535cfd2190228963a3425f4` |
| [paul #3](https://github.com/soodoh/websites/pull/3) | `f3a619740cae0dcff019fdb0d50b19562502c4fc` | `a8f538d167c1436e375f082677f9bcf895f2358c` |
| [diloreto #4](https://github.com/soodoh/websites/pull/4) | `47ccb53d56cabd41b3869279564fd80aba2fba17` | `9e0255685a11ead85399549db79463d9757425a5` |
| [shared #5](https://github.com/soodoh/websites/pull/5) | `7e7ea99683518e71dd335718939ad60b61dd873e` | `6bfddd598b23a1c322150e7394b99db84051b212` |
| [docs #6](https://github.com/soodoh/websites/pull/6) | `fe0ccc6d14a08322a47134f59e2b6ecdef68cd17` | `008ac9c9f04eae09b580efa4a5ba21cfc2fd36dd` |

GitHub merge-commit parents were checked as exactly `[base/main, final source head]`.
PR merge checkouts are not source-head commits or production-authorized main releases.
Scope evidence identifies event source heads; build markers identify the merge checkout.
Neither identity is substituted for the other.

## Actual run results

Every run below is attempt 1 in `soodoh/websites`, workflow `.github/workflows/ci.yml`.
Every successful case has successful detect, root and `CI gate` jobs; app job results
and runner labels were checked individually through the attempt-specific jobs API.
Sarabeth/Carolyn use `ubuntu-24.04-arm`; Paul/DiLoreto use `ubuntu-24.04`.

| Case | Run | Selected app suites | Result |
| --- | --- | --- | --- |
| Manual main baseline | [34007139470](https://github.com/soodoh/websites/actions/runs/34007139470) | All four | Success |
| Sarabeth replacement | [34007176580](https://github.com/soodoh/websites/actions/runs/34007176580) | Sarabeth only | Success; other three skipped |
| Carolyn | [34007145990](https://github.com/soodoh/websites/actions/runs/34007145990) | Carolyn only | Success; other three skipped |
| Paul | [34007149087](https://github.com/soodoh/websites/actions/runs/34007149087) | Paul only | Success; other three skipped |
| DiLoreto | [34007151053](https://github.com/soodoh/websites/actions/runs/34007151053) | DiLoreto only | Success; other three skipped |
| Shared input | [34007154199](https://github.com/soodoh/websites/actions/runs/34007154199) | All four | Success |
| Docs only | [34007157223](https://github.com/soodoh/websites/actions/runs/34007157223) | None | All four skipped; root/gate success |
| Superseded Sarabeth | [34007143165](https://github.com/soodoh/websites/actions/runs/34007143165) | Sarabeth only | Expected cancellation; gate failure |

Each final PR's downloaded scope JSON has `complete-git-diff`, exact base/head/diffBase,
exact single changed path and expected four Boolean selections. The manual baseline
has `forced-baseline`, all four true and null diff identities (as designed); its actual
checkout is the independently verified main SHA, not an invented scope head.

Initial Sarabeth head `1820e1b2c35c10b924ae5c0d1146603afe306392` was running when its
replacement was requested. The earlier run was automatically canceled; root and selected
Sarabeth jobs were canceled and gate job `101416456193` failed. Its diagnostics scan and
upload steps still succeeded. No manual workflow-cancel API was used.

The manual main run overlapped this replacement (`2026-09-06T02:41:47Z` through
`2026-09-06T02:51:09Z`) and completed successfully. This demonstrates PR cancellation
isolation from a main-ref dispatch, NOT non-cancellation under two actual main pushes.

## Downloaded artifact verification

All 25 artifacts from the seven successful cases were downloaded into private scratch;
all archive SHA-256 digests matched GitHub. Exact expected artifact-name sets were checked
for each PR, including absence of artifacts for skipped apps. Diagnostics passed the
trusted local scanner and fixture/non-deployable classification checks. Sarabeth's actual
container marker matched its validated checkout for the app-only, shared and manual cases.

All six static artifacts passed the trusted local `scripts/ci/artifact.py` verifier:
externally selected repository/site/workflow/run/build-attempt/event/ref/checkout identity,
metadata schema, ZIP root/routes, checksum sidecar, content scan and embedded marker.
PR refs are `refs/pull/<number>/merge`; the manual ref is `refs/heads/main`.
Every record retains `releaseAuthorized=false`. No downloaded script was executed and
no fixture output is approved for production. No SSR hosting bundle was uploaded.

| Case / site | Static artifact ID | `site.zip` SHA-256 |
| --- | --- | --- |
| Paul PR / paul | `9981356458` | `811726b860db93ded2b2c0f03a442128b469cb2ba8ce39da5c2a4e29ca7d519a` |
| DiLoreto PR / diloreto | `9981361837` | `dfbac877b43be242ed3d8a1875d6deaedb3e2d6a8f9ec7d4d27a98d7733080bd` |
| Shared PR / paul | `9981359623` | `651030b9b2720742a654a4d6a24d4c996407007db634e7503d57e7524f1bfd6a` |
| Shared PR / diloreto | `9981364979` | `1c7cea4016e3fd34b437a8be2c29b6bf090fa2602513ebe97f033b73476b02cc` |
| Manual / paul | `9981421094` | `121ffdd7edac60c7ffec37d24c533096ff0b3ec8b441da90f9c3f1d3f8522d15` |
| Manual / diloreto | `9981358224` | `40381054b0e498b3d703d6d0727c609b5d97ace130d12d58c293e629f56fded1` |

## Retained evidence and remaining decisions

Scratch: `/private/tmp/websites-phase2-acceptance-drnfjw9s/`, restrictive permissions,
not in Git. Contains operation ledger, attempt job/artifact summaries, downloads and
manual/canceled run logs. Scratch is not durable production release retention.

| Evidence file | SHA-256 |
| --- | --- |
| `ledger.json` | `4a28c1f678eb2908751131e12582ca7080c415eaf11151071e0739ff2ac41ee0` |
| `verified-pr-evidence.json` | `dede1f1ac675469db8d65f09d01736e6c9d0895b56c5a4c3b2b8aede5d6a8247` |
| `verified-manual-evidence.json` | `3c0f85562fd1b5a4850d1cc5a4631a1053fbbfe60daeafa5e7d3e9cb634939d6` |
| `34007139470.log` | `b37c81061422e41943640cc39b19d4fef72b9880738ff9a1e86131ab7048f521` |
| `34007143165.log` | `211259a1507ad8ad2bd327add9401721add373c9ba4377cb6c81461fc3c6dd67` |

- The multiple-main-push evidence limitation is explicitly accepted by the user. No further
  main-push test is required for this phase-2 acceptance, and no new main write is authorized.
- Main was inspected as unprotected, with no rulesets; no settings were changed.
  Requiring only stable `CI gate` remains a separately approved settings decision, and
  phase-3 credentialed releases still require review of repository/environment protections.
- Close/delete only these exact temporary PRs/branches after cleanup approval and fresh
  head/state checks. Never merge the markers, delete unrelated refs or change main.
- Phase 2 is accepted for entry into separately authorized phase-3 preparation. The current
  request authorizes documentation only. See `03-execution-plan.md`,
  `03-production-cutover-handoff.md` and `03-fresh-session.md`; no code implementation,
  live inventory, cutover, trust, DNS, source freeze or retirement is implied.
