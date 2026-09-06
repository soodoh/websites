# Phase 2 — scope-aware CI handoff

Status: full fresh-clone fixture validation passed at
`304918f0e80fb16590fc510950769b7b9c5a1fdf`. Independent reviews found two edge-case
defects and test gaps; approved fixes passed targeted validation at
`35855a4eedec5fd015553fbe4a218a01e100eb48`. Final independent review at
`19c46286c071f832c8475fe914cd633370ff05e0` found no remaining issues; the parent accepts
local implementation as complete. See `phase2-final-review.md` for final evidence.
Publication is accepted as verified by explicit user attestation. Hosted main-push and
manual baselines passed at `4a947b3fd724ddfde7e633342095d41aefcbd6d6`. Six scoped PR
cases and real PR replacement/cancellation passed; downloaded scope and artifact evidence
was independently checked. **Phase-2 external acceptance is complete with the user's
explicit main-push evidence exception**: "main push behavior is accepted." No additional
main-push experiment occurred or is required to reopen this acceptance. See
`phase2-hosted-acceptance.md` for exact evidence and limitations. Required-check enforcement
is a separate settings decision. Phase-3 documentation preparation is authorized;
implementation, live inventory and production actions still require explicit scope.

## Baseline and authority

Started clean at `b08ca2c3b4599653ff15be73baabb8815a6699fd`, with accepted implementation
`cb7a15fb23b810285f51432de7efeec05e115a3f` ancestral. Parent rechecked every normalized
imported head/import commit, pristine historical import-prefix tree and normalized starting
SHA. Map is bijective (1,109 entries), SHA256
`d7ffd0daacd01c4220e5de4f790510a174082e1d90fc76beb4a904ea91490c7b`.
Live source mains matched original approvedSha records via read-only ls-remote; local
source main/status matched their recorded identities and were clean. No catch-up needed.
Sources were not installed, tested, fetched into, or modified. Linked target `.git` retained.
No rewrite, squash, rebase, source pipeline change or resource identity change is authorized.

Historical local-completion state: the agent had performed no publication, and local
origin/main recorded original initial `5b236ef3a519759c84ebd3504809d391baf085ea`, not
normalized initial `2e6fb629522ff1ced21533bd572aff874bd2db90`. There were no GitHub run
URLs at that checkpoint. The user subsequently reported pushing local main and explicitly
instructed: "Consider the publication verified." That attestation supersedes the pending
publication status, without inventing an agent-executed publication operation, exact
publication strategy or fresh-clone command results. No main push/force-push is authorized.

After inspection, the user explicitly approved validation-only dispatches and temporary
acceptance branches/PRs, retaining the no-main-merge/settings/production boundary. One
manual baseline, six draft PRs and one non-force PR branch advancement were performed;
all bounded cases passed. Local evidence edits remain authorized, not commits or pushes
of the handoff. No source-repository change or AWS access is authorized.
Main branch protection returns `404 Branch not protected`; the repository ruleset list
(including parents) is empty. Requiring stable `CI gate` needs separate settings approval.
Merge queue remains unconfigured and unsupported. Historical local-only JSON and review
records retain their original checkpoint meaning; this handoff records the later evidence.

## Scope and freshness interface

`config/ci-scopes.json` schema1 maps short keys to current app prefixes, root verify task,
existing package filters, and individual reusable workflows. See `ci-parity.md` table.
Each app subtree (including infra/docs/images/nested contracts) and its reusable workflow
selects that app. Everything unknown/root/shared, including packages/**, selects all.
Only four explicitly named operational docs can skip app suites; root checks still run.
No extension-based docs rule exists. Scope config/detector/root shared workflows select all.

`node scripts/ci/affected.mjs` reads GITHUB_EVENT_PATH/GITHUB_EVENT_NAME and emits schema1
JSON with event, base, head, diffBase, reason, paths and four Boolean selected values;
GITHUB_OUTPUT receives four Booleans, validated selection JSON and immutable base/head.
PR uses the pinned event base/head merge-base-to-head; checkout validation uses GitHub's
merge checkout. Push compares the entire event before..after range. Rename collapsing is
disabled and NUL delimiters preserve whitespace. Invalid/missing/unrelated/shallow/ambiguous
or uninspectable histories and unsupported events select all. Manual CI always selects
all; force_all is validation-only. Initial normalized-history publication selects all
because the original remote history is non-ancestral; force a manual full baseline too.
Git output is bounded to128MiB and overflow/invalid UTF-8/diff failure runs all, never none.

`node scripts/ci/affected.mjs release-inputs <site> <base40hex> <head40hex>` emits schema1
{app,base,head,differs}. Exported `releaseInputsDiffer(cwd,site,base,head)` is tested.
It compares all selected app/root/tooling/shared inputs, with **no CI docs exclusions**;
missing history/errors throw. It does not require ancestry or global latest-main equality.
Phase3 must separately establish trusted provenance, main eligibility, release ordering,
serialization/recovery and selected build attempt. Different unrelated app commits do not
invalidate an app release; any relevant/shared change does. No deployment logic is added.

## Workflow/task and artifact contracts

`.github/workflows/ci.yml`: detect, root, sarabeth/carolyn/paul/diloreto reusable calls,
and final always-running `CI gate`. `scripts/ci/gate.mjs` rejects detector/root failure,
invalid selection, affected failure/cancellation/skip and unexpected unaffected execution.
PR-specific replacement cancellation is allowed; every main run uses a unique run-ID group.
No main workflow is canceled by a later unrelated push. Different app runners may run
concurrently, but each unchanged fixture/offline chain is serial within its isolated runner.
See exhaustive old job/step mapping and retention in `ci-parity.md`.

Bun1.4.0, Node24.20.0, Turbo2.10.12 and Playwright1.62.1 retained; strict environment and
remote-cache-disabled config retained. Root composite installs only frozen root bun.lock.
Ambient local Bun1.4.2 is bypassed using the installed1.4.0 path, no toolchain upgrade.
Sarabeth/Carolyn use ubuntu-24.04-arm; other hosted runners use ubuntu-24.04, retaining
Docker daemon-default architecture. Carolyn IPv4-first remains fixture/hermetic-only.
Sarabeth wrapper injects checked-out40hex SHA at execution time and copies the actual
successful container's manifest for equality assertion; failed diagnostic copy does not
replace an original failing container exit. No .git enters an image.

`config/ci-artifact.schema.json` describes version1 static metadata.
`scripts/ci/artifact.py marker <paul|diloreto>` adds release.json only when
CI_RELEASE_METADATA=1, after build and before static/browser/Lighthouse validation.
`package <site>` packages exactly those bytes, sorted paths, fixed1980 timestamps/modes,
zip root contents (not dist/client parent), then validates checksum, required routes,
metadata and embedded marker. It never rebuilds or rewrites validated output. Output:
`ci-artifacts/<site>/static/{site.zip,site.zip.sha256,metadata.json}`.
Repository/site/source commit/workflow/run/build-attempt/artifact/release identity are
recorded; legacy commit/runId/runAttempt fields retained. Checksum is outside embedded
marker to avoid circularity. `verify <directory> <expected-json>` compares externally
selected identity fields and optional expected sha256 against metadata/marker/zip.

All artifacts set releaseAuthorized=false, including main pushes and manual dispatch.
Phase3 must verify independently trusted soodoh/websites main-push/approved-release
workflow run provenance, expected site/SHA/run/build-attempt and hash; PR/fork/manual CI
success alone never authorizes release. This helper is an integrity check, not a trusted
GitHub provenance oracle or legacy-production rollback reader.
`diagnostics <site>` stages only named report directories after path/type/credential
checks (including trace zip members), rejects symlinks/env/auth/key/node_modules files,
and labels outputs fixture-only. No SSR bundles are uploaded. Upload only occurs after a
successful scan. Scanning is defense-in-depth; CI has no production secrets to begin with.

## Validation ledger (implementation checkpoint)

All commands ran with empty HOME/env and explicit exact Bun/Node/tools PATH. Logs are
scratch under `/tmp/websites-phase2`, not release artifacts or GitHub acceptance.

- Root frozen install: passed; bun.lock unchanged.
- `bun run test:workspace`:24 tests/391 assertions passed.
- `bun run test:ci`:34 scope/gate/workflow tests/256 assertions and5 Python artifact tests passed.
- `bash scripts/ci/lint.sh`: all five active plus six nested workflows pass actionlint1.7.7;
  selected shell scripts pass ShellCheck0.11.0/bash syntax; Node module syntax passes.
- `bun run lint`:4/4 passed after formatting only the two changed test files.
- Full exact-SHA `bun run ci:verify`: passed4/4 uncached, concurrency1,8m34.685s.
  Includes root contracts/scope/gate/workflow/Python/actionlint/shell gates and all chains.
  Carolyn117unit/9infra/3fixture+3hermeticartifact/92visual; Sarabeth197browser/7provenance;
  Paul56browser+4unchangedskips/3Lighthouse; DiLoreto13genealogy/37browser+1unchangedskip.
- Actual post-suite static packaging/checksum/metadata and four diagnostics scans: passed.
  Local fixture runId=1/build-attempt=1 are NOT actual GitHub run provenance.
- Actual successful Sarabeth Gitless container manifest equals the full tested SHA.
- Fresh six-root installed dependency/peer graph byte-equal to phase1; zero version/lock
  or screenshot changes. Full history messages pass commitlint with legacy warnings.
- First full attempt reached3/4 complete chains but Paul Lighthouse failed because a
  scratch launcher PATH replacement also altered CHROME_PATH. Corrected scratch launcher
  and reran the ENTIRE uncached root CI successfully; no app workaround or assertion change.
- Newly added raw-byte-path fixture initially failed on macOS filesystem EILSEQ. The
  forward fix constructs a Git index blob/commit without materializing the filename;
  final regression now exercises actual invalid-UTF8 Git diff fail-safe behavior.
- Docker cleanup left exact before/after image/container/volume identity sets equal.
  Only fresh non-FROM/non-cache build-log-proven image IDs were removed; fresh container
  reference checks and --no-prune/no-force retained. Final available6,937,992KiB (~6.6GiB).
- Durable command/log digests, container proof, static metadata/checksums and cleanup IDs:
  `phase2-local-validation.json`; scratch logs remain under `/tmp/websites-phase2`.
- Code commits: `d9309ef4` (implementation), `82854366` (root gate integration),
  `304918f0` (portable byte-path fixture, exact fully tested implementation). A following
  scoped documentation commit records these results only; identify it with
  `git log -1 --format=%H -- docs/migration/phase2-local-validation.json`.
  It is not relabelled as a new fixture artifact run.
- Docker capacity before builds: Colima `/dev/vdb1` available6,941,180KiB (~6.6GiB),93% used.
  One app/image at a time; no old-image/volume prune, daemon restart/resize or unrelated
  container stop. Only proven invocation-created images may be removed with fresh
  reference checks and `image rm --no-prune` without force.

## Independent review dispositions and targeted follow-up

Both independent reviews inspected the complete baseline diff. The security/parity
review independently matched all 13 jobs and 133 steps to normalized-import originals.
Parent approved the following bounded corrections; no app/browser runtime changed:

| Finding | Disposition / regression |
| --- | --- |
| P1: UTF-8 decoder stripped a BOM belonging to the first Git filename | `ignoreBOM: true` preserves the path. Real Git push/PR/release-input tests cover BOM-prefixed README and app-shaped paths; both tests failed before the correction. |
| P2: uppercase/mixed-case ZIP bypassed recursive scanning | One normalized suffix drives allowlist and archive handling. Compressed forbidden-member and nested-archive tests cover lowercase/uppercase/mixed-case outer and inner names; four subcases failed before the correction. |
| P2: spoofed-marker test stopped at checksum verification | Rebuild a single-marker archive and update metadata/sidecar checksums. Site/repository/commit/attempt spoof cases now require the exact `Release marker mismatch` error. |
| Successful-container manifest behavior lacked executable coverage | Six scratch-only mocked wrapper tests cover matching, copy failure, missing file, malformed JSON, absent commit and mismatched commit. They execute the unchanged wrapper, require exact container identity/cleanup, and retain failure-status contracts. |
| Event/output CLI adapter lacked coverage | Actual Node CLI tests cover entire push ranges, pinned PR refs versus moving checkout, validation-only dispatch, malformed JSON/null event failure without outputs, and missing refs selecting all. |
| Hosted cancellation/bootstrap behavior | Still pending external acceptance; YAML/group assertions are not GitHub scheduler execution. |

The parent independently reproduced both code defects before correction. It also
verified all 13 original recorded log digests, the clean exact tested clone, lock hash,
both static zip/metadata hashes and full byte equality with validated dist/client,
and the extracted Sarabeth manifest. These checks refer to the original full run,
not a new build at the correction SHA.

Forward code/test commit: `35855a4eedec5fd015553fbe4a218a01e100eb48`.
At that exact clean SHA, an empty HOME/env with pinned Bun1.4.0/Node24.20.0 passed:
`test:ci` (40 Bun tests/323 assertions plus 6 Python tests), `test:workspace`
(30 tests/433 assertions), all 11 active/nested actionlint checks, shell/syntax gates,
and serial app lint (4/4 uncached). All 1,116 HEAD-ancestor messages passed scoped
commitlint with the same six preserved legacy warnings. `git diff --check` passed;
status was clean before and after validation. Logs/digests are in the
`reviewFixes` section of `phase2-local-validation.json` and
`/private/tmp/websites-phase2/review-fixes/`.

No Docker/full app rerun was requested for these parser/scanner/test-only changes,
per explicit parent approval. Full browser/build acceptance remains attached to
`304918f0`; it is not relabelled as a run at `35855a4e`. No install, dependency,
screenshot, deployment identity, source-repository or Docker resource changes occurred
in this follow-up. A following documentation-only scoped commit records the review
dispositions; identify it with
`git log -1 --format=%H -- docs/migration/phase2-local-validation.json`.
Final review and parent local acceptance passed; see `phase2-final-review.md`.
The final documentation-only commit records acceptance, not a new fixture run;
resolve it with `git log -1 --format=%H -- docs/migration/phase2-final-review.md`.

## Production-disabled evidence and next gate

Only one root event workflow and four workflow_call-only CI workflows exist. Permissions
are contents:read only; no id-token, environments, AWS actions, deployment job, source-ref
push, secrets inheritance, production endpoints or arbitrary ref input. Local mocked
shell deployment-helper tests and offline synth do not grant production access. Old
nested workflows remain inert production-contract baselines. No root Amplify buildspec
or production entry point was authored. Sources remain sole production owners.

## Hosted inspection checkpoint — first main baseline passed

Publication: user-attested verified; no repeat publication/fresh-clone verification was
performed in this inspection. Local HEAD and the hosted tested SHA are both
`4a947b3fd724ddfde7e633342095d41aefcbd6d6`. This is new hosted evidence at that SHA,
not a relabeling of the earlier full local fixture run or targeted correction run.

- Run: [CI 34005716802, attempt 1](https://github.com/soodoh/websites/actions/runs/34005716802).
  Event `push`, branch `main`, workflow `.github/workflows/ci.yml`; repository and head
  repository both `soodoh/websites` (repository ID `1358469291`). All four referenced
  reusable workflows resolve to the same tested SHA. Completed successfully at
  `2026-09-06T02:14:39Z`.
- All seven jobs passed: detect `101412387867`, root `101412387806`, Sarabeth
  `101412436164`, Carolyn `101412436302`, Paul `101412436226`, DiLoreto `101412436207`,
  and `CI gate` `101413075585`. Sarabeth/Carolyn ran on `ubuntu-24.04-arm`; all others
  on `ubuntu-24.04`. Tool setup, complete app verification, scans and upload steps passed.
- Downloaded scope artifact `9980853504`: base original initial
  `5b236ef3a519759c84ebd3504809d391baf085ea`, head the tested SHA, diffBase null,
  reason `uninspectable-range-run-all`, all four selected true. This proves hosted
  fail-safe selection on initial non-ancestral publication, not ordinary scoped selection.
- All seven downloaded artifact archive hashes matched GitHub's SHA-256 digests.
  Both static artifacts passed the trusted current local `scripts/ci/artifact.py`
  verifier against independently selected repository/site/workflow/SHA/run/attempt/event/ref
  fields: schema, checksum sidecar, ZIP root/routes, content scan and embedded marker.
  Both retain `releaseAuthorized=false`; this is not permission to deploy.
- All four downloaded diagnostics passed content scans and fixture/non-deployable
  classification checks. Sarabeth artifact `9980889956` includes
  `test-results/container-deployment.json` whose actual commit equals the full tested SHA.
  No SSR hosting bundle was uploaded.

| Site | Static artifact ID | `site.zip` SHA-256 | `metadata.json` SHA-256 | GitHub expiry |
| --- | --- | --- | --- | --- |
| paul | `9980901998` | `adc7c02f407fbdaf9afcc6036f3ff94bf5e51e7e6927bd379004404ef5a28c71` | `3c21cd9cbf7c927957c7a8b5b1a9ed61f226706bc04a5ac145a06bdfab1fb085` | `2026-12-05T02:08:48Z` |
| diloreto | `9980910221` | `3f63a963ca6ad73e7c9e40138f6e29072e4386a3ea1bfa71f300f09003973e04` | `315ef64198c89961bbdece162e33137957089e7c327714f9376cf99c8d17812c` | `2026-09-07T02:13:21Z` |

Private scratch downloads, inspection summary and run log are retained at
`/private/tmp/websites-phase2-hosted-zpsfp_jh/`, outside Git with restrictive permissions.
The downloaded `run.log` SHA-256 is
`185f7d4711d6973932e1ea157335cb2bfa300f072131c468cfe72af26ef72c4a`.
Scratch availability is not durable release retention. No downloaded code was executed;
only the trusted local artifact verifier/scanner inspected downloaded bytes.

### Approved hosted acceptance follow-up and next decision

After explicit user approval, the manual main baseline and six temporary PR cases passed.
Actual attempt-1 run/PR URLs, original source heads versus synthetic PR merge checkout SHAs,
app selection/skips, artifact checksums and authority are recorded in
`phase2-hosted-acceptance.md`. The earlier read-only inspection is a historical checkpoint,
not a claim that only one run or no PRs still exist.

The initial Sarabeth PR run was automatically canceled by its replacement, and its
`CI gate` failed as required. The replacement passed. The overlapping main-ref manual
baseline finished successfully, demonstrating isolation from PR cancellation. This is
NOT evidence of behavior under two actual interleaved main pushes, which were not authorized.

All 25 artifacts from these seven successful runs were downloaded and checked; all six
static artifacts passed trusted local identity/checksum/marker verification and remain
`releaseAuthorized=false`. No fixture or PR artifact is authorized for production.
Main remained `4a947b3fd724ddfde7e633342095d41aefcbd6d6`. Draft PRs #1–#6 and exact
`ci/acceptance/20260906-890d1b/{sarabeth,carolyn,paul,diloreto,shared,docs}` branches are
retained, unmerged; cleanup needs approval and fresh state checks.

Final disposition: the user explicitly stated "main push behavior is accepted" and asked
for fresh-session phase-3 preparation. The parent accepts phase 2 as complete with that
specific evidence exception. No multiple-main-push experiment was executed; do not label
it as tested or repeat it merely to clear a stale historical pending statement. This does
not waive phase-3 release ordering, serialization, recovery or interleaving tests.

Required `CI gate` enforcement and exact temporary PR/ref cleanup remain separately
approval-gated operational decisions, not missing phase-2 acceptance. Production security
review must still address the unprotected shared repository before credentialed releases.
Read `03-execution-plan.md`, `03-production-cutover-handoff.md` and
`03-fresh-session.md` for the next stage. Current authority is documentation preparation
only; no phase-3 code, source freeze/catch-up, AWS inventory, cutover or archival is authorized.
