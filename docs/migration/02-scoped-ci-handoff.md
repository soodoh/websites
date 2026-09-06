# Phase 2 — local scope-aware CI handoff

Status: local implementation and full fresh-clone fixture validation passed at
`304918f0e80fb16590fc510950769b7b9c5a1fdf`; independent review remains pending. External GitHub acceptance is **pending and not authorized**. This is not phase-2
acceptance or phase-3 authority. See `02-execution-plan.md` for the full approved contract.

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

No publication operation was performed. Local origin/main still records the original
published initial `5b236ef3a519759c84ebd3504809d391baf085ea`; it is not normalized initial
`2e6fb629522ff1ced21533bd572aff874bd2db90`. Publication requires a separately approved exact
non-fast-forward strategy, freshly read expected live remote SHA, recovery evidence and
fresh-clone checks. No push/force-push/remote tracking ref falsification is authorized.
GitHub run URLs/results: none. Branch protection/rulesets/settings unchanged; approval
required before adding only stable `CI gate`. Merge queue is unconfigured, not supported.

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

## Production-disabled evidence and next gate

Only one root event workflow and four workflow_call-only CI workflows exist. Permissions
are contents:read only; no id-token, environments, AWS actions, deployment job, source-ref
push, secrets inheritance, production endpoints or arbitrary ref input. Local mocked
shell deployment-helper tests and offline synth do not grant production access. Old
nested workflows remain inert production-contract baselines. No root Amplify buildspec
or production entry point was authored. Sources remain sole production owners.

After local implementation review, publication/execution approvals must precede full
hosted baseline, safe app-only/shared/docs-only PR cases, remote/fresh-clone ancestry,
scoped history and frozen-install checks. Record actual run URLs then; local dry runs
cannot satisfy external acceptance. Stop before phase3/AWS/cutover/archival.
