# Phase 1 handoff — renamed workspace/scopes verified; history normalization pending

**LOCAL ONLY. Nothing pushed. Phase 1 is not accepted; do not begin phase 2.**

**Latest tested renamed/scoped candidate: `0d7912745c02f1f30e2c36074fd275b7dff46dd6`.**
Root full CI and all four new convenience filters pass. See the post-rename checkpoint
below and `post-rename-validation-evidence.json`. No history was rewritten; the approved
all-history normalization (including published initial commit) remains parent-owned,
and eventual non-fast-forward publication requires separate approval.

Earlier tested PRE-RENAME implementation: `2aecd5bbbec414f43ca50646ff64ed6347276d2c`.
All four individual complete verification filters and root serial `ci:verify` passed.
See the latest checkpoint below and `pre-rename-validation-evidence.json` for exact
commands, versions, exits, images and cleanup disclosure. This does **not** cover
future directory renames, required scopes, or proposed historical-message normalization.

Previously independently reviewed P2-fix candidate:
`271ef39f2a356ef62b14793b57ed8aae4c5f64b7`.
The original reviewed candidate was `ed73a00f698caf39a032d5b7b079400f122d8f41`.
Core integration is `30a60b3c7783678bb6182ab394bea171f238cae5`
(`chore: establish isolated Bun workspace and local verification`);
`cd3f3301e1ff57cf0810c506d8deb8370675b373` adds root Renovate config to Sarabeth's
Docker context and a regression assertion; `7fc0034c` adds actionlint update tracking.
The subsequent
documentation commit contains this handoff/evidence; find it with `git log --format=
'%H %s' -- docs/migration/01-history-and-turborepo-handoff.md`. A completed migration
SHA remains null in `source-imports.json` until full validation/review succeeds.

## Implemented

- Private root Bun workspace, four unchanged unique package names, one authoritative
  `bun.lock`, isolated linker, exact Bun 1.4.0 / Node 24.20.0 / Turbo 2.10.12 pins.
- Exact original direct dependency versions retained. Deliberate constrained
  transitive consolidation, rejected experiments, all five old locks, actual old/new
  dependency/peer graphs, and reproduction scripts are documented in
  [workspace-dependency-decisions.md](workspace-dependency-decisions.md).
- Root Lefthook/commitlint own target hooks; no-scope Conventional Commits retained.
  App prepare scripts/hook configs removed; root Renovate covers workspace packages,
  nested baseline Actions, Docker, Bun and offline CloudFormation lint pins.
- Carolyn infra manifest/lock folded into the app; source/layout/cdk.json/IDs/accounts
  and deployed names unchanged. `infra:typecheck`, `infra:test`, `infra:synth`,
  `infra:diff`, `infra:deploy` run from the app; only offline synth was executed.
- Uncached strict-env Turbo tasks and sequential `ci:verify` for each app. Root
  `ci:verify` runs workspace contracts then app chains at concurrency 1. Individual
  commands are `verify:sarabeth-studio`, `verify:portfolio-website`,
  `verify:carolyn-portfolio`, `verify:diloreto-website`. Root lint/typecheck are serial;
  dev is persistent/uncached. Remote cache is explicitly disabled even if tokens exist.
- Root README/AGENTS, unique workspace dev ports 3100/3101/3102/3103 respectively.
  App-local canonical dev/test ports and screenshots unchanged. Root ignored paths
  cover dependencies, auth manifests, output, reports, zip files and Turbo state.
  Tracked generated-output audit found no dependency/dist/Amplify/output/auth-manifest
  files needing removal; source fixtures and route/screenshot baselines were retained.
- Dockerfiles use the root frozen lock and all workspace manifests, own-app source
  only, root .dockerignore, unchanged browser images/architectures, and pinned Node
  binary overlay. Old ambiguous dependency volumes are no longer used.

## Historical Docker assumptions and storage blocker (superseded by latest checkpoint)

The available Docker daemon is ARM64 but **does not share host `/Users/...` paths**.
An initial Carolyn artifact run failed exit 125 on a host bind source not existing
on the daemon. The approved fix removes host bind mounts completely:

- Docker builds upload only filtered root context. `.env*`, credentials, host
  dependencies, generated auth manifests, unrelated artifacts and outputs are excluded.
- Portfolio/DiLoreto copy only allowlisted static `dist/client` artifacts into an
  invocation-owned container. Reports are copied out after capturing test status.
  DiLoreto keeps its non-root invoking UID and archive ownership for copied files.
- Carolyn/Sarabeth generate fixture bundles at **container execution time**, not in
  cached build-output image layers. Carolyn chooses fixture or production-shaped
  hermetic build from the expected mode; deployed-smoke mode remains separate and
  was not invoked. No host production auth artifact is copied into containers.
- Sarabeth's direct compose default remains usable without binds and rebuilds
  deterministic fixture outputs. Its `test:container` wrapper exports diagnostics;
  direct `docker compose run` alone leaves diagnostics inside the container. Phase 2
  should use the wrapper when it needs host report uploads.
- No snapshots are copied back during normal verification; existing explicit update
  commands remain opt-in and were not run. Four mock failure tests prove exit 23
  survives diagnostic-copy failure and cleanup targets only the created container.
- No host dependencies or named test volumes are reused. Image tags include app,
  Playwright/Bun versions and root lock hash; source/context changes still rebuild
  the image. Sarabeth forces linux/arm64 and Carolyn checks ARM64; Portfolio/DiLoreto
  retain their prior daemon-default architecture policy.

A real built container successfully verified Bun 1.4.0 / Node v24.20.0 /
Playwright 1.62.1 and a root frozen install before the final runtime-wrapper changes.
The first runtime fixture build exposed a missing `bunx` executable after copying
only Bun's binary; Dockerfiles now create the standard `bunx` symlink.

**The final image/runtime fix could not complete validation because daemon storage
is exhausted.** Frozen-install layer export failed with `no space left on device`.
Before bounded cleanup, Docker reported images 78.15 GB, containers 4.085 GB, local
volumes 22.37 GB (these are usage totals, not available capacity). Only exact worker-
created image IDs/tags and stopped build containers were removed, without force,
prune, daemon reset, volume deletion, or touching unrelated running services.
A single authorized retry failed again while applying the dependency layer at
`/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/.../lightningcss.linux-arm64-musl.node`.
No further Docker attempts were made. The parent's subsequent read-only diagnosis
found **214 GiB free on the host**, but Colima default has a **separate 100 GiB disk**:
`/dev/vdb1` has **0 available (100% full)**, with inode usage 56%; Docker has 19 running
containers. Host free space does not resolve the guest filesystem exhaustion.
The owner must separately authorize backing-filesystem capacity remediation or an
appropriate daemon before further builds. Exact build headroom is not measured.
**No resize, prune, reset, or further Docker build/retry is authorized.** Do not claim
browser/visual acceptance or change screenshots to bypass this blocker.

## History/provenance and security

Target initial commit `5b236ef3a519759c84ebd3504809d391baf085ea` survives. Live GitHub
heads were checked read-only by the parent; newer Portfolio/DiLoreto revisions were
explicitly approved. No sources were updated. The target remains the existing linked
worktree with common Git directory `/Users/pauldiloreto/Projects/websites/.git` and
public origin `git@github.com:soodoh/websites.git`.

| App | Approved original head | Pristine import commit |
| --- | --- | --- |
| Sarabeth | `dc3e3f956ccbc49a0361cddc0b79b655e46c000d` | `dab13bd3d4769f66567586982cec20ae9cb16205` |
| Portfolio | `15630718474e8b97f7c9150dfc2357825e352adb` | `a2cebdbbe15ec8fdfd311cd2a6cf9be2610c0d84` |
| Carolyn | `8c70afc7748ab4a18e596df597a641c9aad97ad6` | `e05ce97e526c3b8413a8e8443ddce216e635faf6` |
| DiLoreto | `02e49ba0c4229b864659f787493ff24678c93e6c` | `392fb4fe1a6163e23de77bc760134e16ba079147` |

The earlier credential stop is resolved by the user's explicit redaction decision.
Portfolio alone imports sanitized head `af5ac5840aac9126357a7ca22dea0ff753c5a4b3`;
its original commit-ID invariant was explicitly superseded. All 152 commits remain
mapped; 147 IDs changed, six blob versions changed, sixteen signatures were removed.
See `portfolio-redaction-decision.md`, full SHA map and verification evidence. Other
source histories retain original IDs (454 Sarabeth, 357 Carolyn, 123 DiLoreto commits).
No further rewrite was performed during workspace integration.

All imported heads (sanitized head for Portfolio), every reachable imported ancestor,
pristine import trees, and initial target ancestry were reverified after candidate
implementation. `git fsck --full` passed. The parent's exact-value scan of 24,161
reachable target objects found neither redacted value; original Portfolio head was
absent from target object storage (`target-redaction-exact-audit.json`). Current
source trees remain clean; sources remain sole production deployment owners.

Private verified original/sanitized bundles remain outside worktrees at
`/Users/pauldiloreto/Projects/websites-migration-backups/`; never commit/upload them.
Original source histories may still contain flagged material. No credential values
are recorded here, and no production credentials/CMS/email/AWS mutations were used.
No active root workflows were added. Nested workflows remain unchanged inert baselines.
Original CLAUDE.md files are regular text pointers to AGENTS.md, not flattened symlinks.

History navigation: use `git log <imported-head> -- <old-path>` or import refs. Original
paths remain root-relative before subtree boundaries; seamless `--follow apps/...`
is not promised. Unrelated source branches/tags remain outside migration scope.
Never squash/rebase the imports or force-push.

## Validation evidence at candidate 30a60b3c

Clean disposable clone: `/tmp/websites-workspace/clean-checkout`, made with
`git clone --no-local --single-branch --branch main --no-tags` from target. Accepted
clean commands used `env -i PATH=<Node24.20.0 + installed tools> HOME=<empty scratch home>`:
no old ignored source secrets/config/dependencies. Root and clean checkout have no
tracked build dirt. Temporary logs are convenience evidence; this table and the
committed JSON audit files are durable authority. Supporting host tools were Go
1.27.1, ShellCheck 0.11.0, uv 0.12.9, and Chrome 152.0.7977.77.

| Actual command/gate | Result |
| --- | --- |
| Clean `bun install --frozen-lockfile` | exit 0; root prepare installs only that checkout's hooks |
| Clean `bun run test:workspace` at core commit | exit 0; 8 tests, 346 assertions (configuration + mock Docker failure contracts) |
| Target `bun run test:workspace` after Docker-context follow-up | exit 0; 8 tests, 347 assertions |
| Clean `bun run lint` | exit 0; 4/4; existing Biome schema-version info retained |
| Clean `bun run typecheck` | exit 0; 4/4, including Carolyn fixture build and both Portfolio TS configs |
| `turbo run ci:verify --dry=json` / individual lint/typecheck execution | exit 0; correct four package tasks, uncached/strict graph |
| Clean Sarabeth production-provider graph; fixture Amplify build/prepare/validation; deployment-shell tests | all exit 0; 7 page routes/static function caches, isolated API compute, static 404; waiter mocks pass |
| Clean Carolyn fixture prerender verification; unit tests | exit 0; 117 tests / 1082 assertions |
| Clean Carolyn infra types, unit tests, offline synth | all exit 0; 9 tests / 40 assertions; no lookups |
| Original scratch vs candidate offline whole CDK template | byte-identical, 19 resources; SHA-256 in dependency decisions |
| Clean Carolyn production-shaped hermetic fixture build/prerender verification | exit 0; 4 prerendered pages, 4 dynamic protected projects, dynamic resume, 3.5 MiB Node24 compute bundle |
| Clean Portfolio static build/assertions | exit 0; 38 files, server output excluded |
| Clean DiLoreto static build/assertions + genealogy unit tests | exit 0; 4 routes, 396 files / 58.1 MiB; 13 tests |
| Clean Portfolio local Lighthouse (`CHROME_PATH` points to installed Chrome) | exit 0; 3 local runs, unchanged configured thresholds; reports written locally only |
| Portfolio shell syntax for every script + ShellCheck; all changed Docker wrappers/entrypoint ShellCheck | exit 0 |
| Sarabeth/Portfolio/Carolyn explicit nested actionlint | exit 0 |
| Sarabeth cfn-lint 1.53.0; Portfolio 1.42.0; DiLoreto 1.53.0 | exit 0, offline |
| Candidate/clean actual dependency/peer audits, including infra location | zero missing required dependencies/peers and zero incompatible ranges; clean graphs exactly reproduce candidate |
| Docker image/tool versions before final wrapper fix | build exit 0, pinned versions confirmed; not browser acceptance |
| Final Carolyn artifact Docker run / bounded retry | exit 1; daemon disk exhaustion prevents image-layer completion |
| Full Carolyn `validate`, artifact/visual suites, Sarabeth/Portfolio/DiLoreto containerized Playwright | NOT PASSED; Docker-dependent acceptance incomplete |
| Root complete `ci:verify` and full individual `verify:<app>` chains | NOT RUN to completion; do not launch further Docker downloads until storage is resolved |

### Precise remaining baseline/phase-2 note

All six original workflows were read before changes. Required original validation
coverage remains in app chains; no production-policy assertions were weakened.
Sarabeth's Renovate contract now reads the root config (same assertion). An optional
new DiLoreto `lint:workflows` diagnostic finds the **unchanged** nested deploy.yml:190:9
ShellCheck SC2329 (cleanup function invoked only via trap). That workflow never had
an actionlint gate in its original validation contract, so this extra diagnostic is
not in DiLoreto's required `ci:verify` chain. Phase 2 should resolve it when relocating
workflows; do not classify it as a newly introduced app failure or silently weaken
other workflow assertions. No other phase-2-only assertion failures are claimed.

## Accepted P2 review fixes and follow-up validation

The independent review of `d63d1cd1..ed73a00f` found two P2 evidence defects, not a
proven missing installed dependency or an app/runtime failure. Both accepted fixes
are now implemented and independently reviewed with no remaining findings in the fix scope:

1. `143949cd9d849f2cbb5e73dc81929b6c28113908`: range auditor records missing required
   direct dependencies/devDependencies and includes the root manifest even when an
   explicit checkout path is supplied. The former clean report omitted root; the
   regenerated report now includes all six locations. Root checks 73 packages and
   108 edges; all six locations have zero missing required edges or range violations.
2. `271ef39f2a356ef62b14793b57ed8aae4c5f64b7`: comparison auditor distinguishes raw lock
   locators from verified baseline installations. Raw-lock-to-candidate counts are
   S10/P55/C41/D52/infra3; verified installed-to-installed matched-context counts are
   **S10/P55/C41/D52/infra1**, not unique package totals or a complete graph diff.
   Original bundled cloud-assembly-api was already 2.2.6 (not a downgrade from 2.3.0),
   and brace-expansion was already 5.0.9 (not an upgrade from 5.0.7). Both old raw lock
   entries disagreed with their installations. Schema 54.12.0→54.22.0 remains genuine.

Only existing pristine scratch installs were read; all five package.json/bun.lock
pairs byte-match the imported originals. No installation or source-worktree operation
was needed. Current and clean corrected installed comparisons match exactly, including
all baseline matches; native platform unavailability remains explicitly separate.

Actual follow-up commands/results (logs: `/tmp/websites-workspace/review-fixes`):

| Command/check | Actual exit/result |
| --- | --- |
| `bun test docs/migration/scripts/audit-installed-ranges.test.ts` | 0; 5 tests/13 assertions; positive installation and missing dependency/devDependency cases in root and app |
| Same test source against the old `ed73a00f` auditor in disposable scratch | 1, expected; all 5 fail, reproducing missing direct/root defects |
| `bun docs/migration/scripts/audit-installed-ranges.ts` | 0; six current locations, zero missing/violations; current JSON regenerated byte-identically |
| Same auditor with explicit `/tmp/websites-workspace/clean-checkout` and committed clean evidence output | 0 under empty env/HOME; root included, all six groups exactly equal current JSON |
| Same auditor with `/tmp/websites-workspace/original-installs` and scratch output | 1, expected; original Portfolio/DiLoreto vitefu peer violations only; exactly reproduces committed original evidence |
| `bun docs/migration/scripts/audit-installed-resolutions.ts /tmp/websites-workspace/original-installs` | 0; corrected comparison regenerated |
| Same updated comparison script from the clean checkout, scratch output | 0 under empty env/HOME; exact JSON equality with corrected current comparison |
| JSON assertions: infra raw differences3, installed differences1, API baseline2.2.6, schema54.12→54.22 | 0; metadata distinction and genuine schema drift verified |
| Baseline manifest/lock equality assertions against pristine imports | 0; all five pairs equal |
| `bun run test:workspace` | 0; existing 8 tests/347 assertions |
| `git diff --check` | 0 |
| Docker/browser/full per-app/root verification | NOT RUN; no further retry authorized; still BLOCKED |

This follow-up changes only the two accepted audit defects, their regression tests,
and evidence/docs. Earlier app build/lint/types/unit/static/Lighthouse results above
remain historical evidence, not newly rerun full acceptance. The aborted orchestration
was recovered through the existing worker and reviewer. Targeted final review of
`ed73a00f..bb6eb584524d1efecd0f675214261fd8c8600017` found both P2 issues resolved,
no new issue in their blast radius, and approved the targeted fixes only. The full
review is preserved in `targeted-final-review.md`; phase-1 acceptance remains blocked.
The parent separately reran all five audit regression tests (exit 0, 13 assertions)
and reverified all imported heads/ancestors, pristine import trees, and initial
target ancestry at `bb6eb584` (all passed; working tree clean).

## Latest checkpoint — PRE-RENAME full local verification passed

The user authorized exactly eight old unused test/review image removals after parent
read-only inventory/ref checks. Parent removed all eight without force, recovering
6.7 GiB on Colima's separate disk. Safe names/IDs/exits are committed in
`pre-rename-validation-evidence.json`; broad unrelated Docker inventory is not.
This superseded the earlier no-retry prohibition only for required local validation.

Validation used a new `git clone --no-local --single-branch --branch main --no-tags`
of the TARGET at `ff2f6386`, advanced by fast-forward to the two committed fixes below.
The checkout is `/tmp/websites-workspace/resumed-validation/checkout`, with a new
empty HOME and `env -i`, explicit Node24.20.0/tools PATH, CI=1 and only the local
Docker socket passed. Portfolio additionally uses the installed Chrome152.0.7977.77.
Root frozen installs passed at the starting and final implementation revisions.
No source checkout install, old ignored config, production CMS/email/secret/AWS lookup,
active root workflow, publication or deployment was used.

Two real runtime compatibility failures were fixed minimally in forward commits:

- `0b70576e`: Carolyn's Linux fixture preview bound localhost differently from Node
  fetch, causing ECONNREFUSED127.0.0.1:3000. The same image's build passed with
  `NODE_OPTIONS=--dns-result-order=ipv4first`; only the wrapper's fixture and hermetic
  production fixture build subprocesses now receive this option. Failure-contract
  regression assertions cover both modes. Production app code/policy is unchanged.
- `2aecd5bb`: Sarabeth's runtime Amplify preparation/validation required Git metadata
  correctly excluded from images. The approved explicit RELEASE_COMMIT seam accepts
  exactly40 hex characters or retains Git HEAD fallback only when unset; malformed
  or empty explicit values fail. The wrapper derives the actual target SHA using
  `git -C "$workspace_root" rev-parse HEAD`, ignoring arbitrary inherited provenance,
  and passes it at runtime, not in cached layers. Direct compose now requires the
  explicit value; app docs show `RELEASE_COMMIT=$(git rev-parse HEAD)` invocation.
  Seven focused tests cover valid Gitless input, malformed/empty rejection and Git
  fallback. Existing metadata equality assertions remain; both preparation and
  validation use the same resolver. Nested original workflows remain unchanged;
  phase2 adaptation must inject explicit provenance into Gitless container runs.

### Actual final gates and immutable source correspondence

| Gate | Exit/result |
| --- | --- |
| Carolyn original resumed filter before DNS fix | 1; fixture runtime ECONNREFUSED, not a test pass |
| Carolyn complete `bun run verify:carolyn-portfolio` after fix | 0;117 unit,9 infra,3 fixture artifact,3 production artifact,92 visual; full validate/types/synth/workflow checks |
| Sarabeth original resumed filter before provenance fix | 1; Gitless prepare failed, not a test pass |
| Sarabeth complete `bun run verify:sarabeth-studio` after fix | 0;196 canonical Playwright,7 provenance tests, unchanged deployment-shell tests, provider/fixture builds, Amplify prep/validation, types, workflow/CF lint |
| Portfolio complete `bun run verify:portfolio-website` | 0;56 canonical functional/visual tests,4 existing viewport-specific skips;3 Lighthouse runs; static/output, both type configs, shell/workflow/CF lint |
| DiLoreto complete `bun run verify:diloreto-website` | 0;37 canonical tests,1 existing mobile-only skip;13 genealogy tests, static/output/types/CF lint |
| Root `bun run ci:verify` at **2aecd5bbbec414f43ca50646ff64ed6347276d2c** | **0;4/4 tasks,0 cached,concurrency1;8m42.492s**; repeats all four complete chains on the final committed PRE-RENAME code |
| Root workspace/mock contracts | 0;8 tests/351 assertions |
| New Sarabeth provenance + deployment-shell + type checks | 0;7 focused tests plus unchanged shell tests and TypeScript |
| Direct compose config without / with required RELEASE_COMMIT | 1 expected /0 |
| Gitless Sarabeth final-image artifact proof | 0; `__deployment.json.commit` equals **2aecd5bbbec414f43ca50646ff64ed6347276d2c**; no .git copied |
| Final real image tools | ARM64, Bun1.4.0, Node24.20.0, Playwright1.62.1, executable bunx in all four; DiLoreto proof also uses invoking UID501 |

Carolyn's individual filter passed at0b70576e; the full root chain reran its unchanged
app code at2aecd5bb along with all other apps. All browser image/version/platform pairs,
snapshot files, comparison thresholds and original skip predicates are unchanged.
Portfolio's four skips are three mobile-only cases excluded on desktop plus one
viewport-independent desktop-only case excluded on mobile. DiLoreto skips touch drag
on desktop. No screenshot update command ran. The usual Carolyn SSR-stream maximum-
lifetime warning and intentional mocked Sarabeth email failures were nonfatal test
output, not external production calls.

Logs, artifact proofs, image IDs and command exits are under
`/tmp/websites-workspace/resumed-validation`; the committed JSON records log SHA256s
and durable summaries. Both target and clean checkout were Git-clean after root CI.
Per mid-run user steering, **no further validation round** was started after this root
command completed. Existing five-test audit/history proof evidence remains as recorded
above; it was not relabeled as a fresh post-root run.

### Cleanup authorization, deviation and corrected practice

Only one app/image was worked at a time, with read-only disk monitoring and cleanup
of unused invocation-owned resources. Existing reviewed wrappers may force-remove
**only their own exact container ID returned by that invocation's docker create**;
the supervisor explicitly distinguished this interruption-safe cleanup from forbidden
administrative force cleanup of images/pre-existing resources.

**Scope deviation disclosed:** removing selected run-created obsolete images with
Docker's default `image rm` also automatically removed four untagged earlier migration-
cache ancestors: `72b131371591`, `e31751a0d90c`, `d1e8f4265781`, `7c85e839fda4`.
This default parent pruning was unintended and exceeded the current-run-only cleanup
boundary. The worker immediately reported it; the parent authorized continuation with
`image rm --no-prune`, no force, explicit logged current-run creation proof and a fresh
no-container-reference check before each removal. No tagged base image, unrelated
container or volume was removed. Full old cleanup output remains outside Git; exact
IDs and the deviation are preserved in the committed evidence JSON.

All subsequent image cleanup used that corrected rule, including explicitly proven
new intermediate layers; no additional old-image selection, prune command, restart,
resize or volume deletion occurred. Final disk:98G total/87G used/**6.7G available**,
93%; **19 running containers,70 volumes**, unchanged counts. Tagged browser/Bun/Node
bases remain. No rollback/recreation of discarded cache was requested.

## Historical next steps at the PRE-RENAME checkpoint

1. Parent reviews the two new compatibility fixes and this PRE-RENAME checkpoint.
2. In a separate sole-writer stage, implement the approved directory names
   `apps/carolyn`, `apps/paul`, `apps/diloreto`, `apps/sarabeth` and required commit
   scopes `carolyn/paul/diloreto/sarabeth/repo/ci/deps`. None is applied here; current
   hooks still enforce no-scope commits until that policy is changed. Revalidate the
   renamed layout rather than treating this evidence as proof of it.
3. Proposed normalization of historical commit messages is pending parent clarification
   about the published initial target commit and publication/history implications.
   **No history rewrite occurred or is authorized in this worker run.** Historical
   messages, source repositories, imported heads and pristine import prefixes remain
   unchanged here. Parent must resolve that separate direction before any rewrite.
4. Final migration SHA/phase1 acceptance remains pending these requested stages and
   independent review. No push/publication, phase2 or production cutover is authorized.
   Source repositories remain production deployment owners.

## Post-rename checkpoint — complete local gates passed

The separate approved rename/scope stage starts at
`bddc54064ae984280b62ea27181f44aa835fe685`. Implementation is
`92c9079855beea5f2eac5fd8ba002097ce938213`; two follow-up app-documentation commits
end at the exact fully tested candidate **`0d7912745c02f1f30e2c36074fd275b7dff46dd6`**.
All are forward scoped commits, not rewrites of any earlier message or ref history.

| Historical import prefix (unchanged) | Current prefix / convenience command | Unchanged package-name filter |
| --- | --- | --- |
| apps/carolyn-portfolio | apps/carolyn / `verify:carolyn` | carolyn-portfolio |
| apps/portfolio-website | apps/paul / `verify:paul` | portfolio-website |
| apps/diloreto-website | apps/diloreto / `verify:diloreto` | diloreto-website |
| apps/sarabeth-studio | apps/sarabeth / `verify:sarabeth` | sarabeth-studio |

`git mv` retained tracked files/modes and moved current ignored outputs without adding
them to Git. Original source URLs/filesystem paths, `targetPrefix`, `importCommit`,
pristine import trees and all other source metadata are unchanged. `currentPrefix`
was added explicitly for current audit resolution; `--historical-paths` selects old
baseline layout rather than implicitly searching old directories. The standalone
infra manifest remains folded into Carolyn; its import-time manifest is read through
the historical prefix, while dependencies resolve from the current infra location.

Root workspaces remain the non-overlapping `apps/*` pattern. Docker COPY/workdir/report
paths, Sarabeth compose paths, root aliases, tests and instructions now use short current
names. Existing generic ignore patterns and package-name Turbo task filters remain valid.
Carolyn's reviewed DNS fixture seam and Sarabeth's explicit Gitless provenance seam,
canonical ports/platforms/browser images, fixtures, screenshots, app behavior and deployed
CDK/CloudFormation identities were retained. No runtime compatibility fix was needed.

New commit subjects require exactly the approved scope vocabulary:
**carolyn, paul, diloreto, sarabeth, repo, ci, deps**. Commitlint uses scope-empty=never
and that seven-value scope-enum. Tests invoke the actual CLI for all seven positives,
missing/unknown negatives, and Renovate's enabled semantic `deps` default. Root/app
instructions and current examples reflect this policy; original execution-plan text,
historical messages and original nested workflow files remain unchanged. The existing
production-policy assertions were not weakened or removed.

### Dependency/path parity — no re-resolution upgrade

Only supported Bun operations regenerated the lock:
`bun install --lockfile-only --ignore-scripts`, followed by root frozen reinstall.
The resulting diff is exactly **four workspace keys and four workspace locators**.
After those explicit path substitutions, all **1,245 package entries and every other
lock field** are exactly equal to the pre-rename lock. No dependency version changed.

The full actual installed dependency/peer graph was captured before moving directories.
The renamed target, an independent clean renamed checkout, and the existing pre-rename
checkout inspected with `--historical-paths --full-graph` all reproduce that graph exactly
after mapping only top-level root labels. All six roots have zero missing required edges
or incompatible ranges. Both target and clean checkout have **3,472 valid symlinks**, no
broken links and no old-workspace targets. The original-installed-to-candidate comparison
is also unchanged, including the one genuine previously accepted schema deviation.

Exact normalized graph/lock hashes, per-root counts and full capture-file digests are
in `post-rename-validation-evidence.json`; captures and command logs are under
`/tmp/websites-workspace/rename-validation`. Audit reproduction is documented in
`workspace-dependency-decisions.md`. Earlier captured evidence keeps its historical path
labels; current prefixes are not a pretext to rewrite historical provenance.

### Actual clean-checkout validation

A new `git clone --no-local --single-branch --branch main --no-tags` of the TARGET was
installed at the root only, under empty HOME / env-i with Node24.20.0 PATH, CI=1, explicit
local Docker socket and local Chrome path. No old source installs, hidden config,
production credentials/CMS/email/AWS lookup, or deployed-smoke commands were used.

| Command/gate | Exit/result |
| --- | --- |
| Supported lock regeneration; target and clean frozen reinstalls | 0; path-only lock delta |
| Clean root `test:workspace` | 0; **24 tests /391 assertions** across workspace, wrapper, scope-policy and audit regression contracts |
| Full current / clean / explicit pre-rename graph audits and equality assertions | 0; exact six-root full graph/peer parity |
| Historical installed-resolution comparison + equality assertion | 0; unchanged comparison |
| `bun run verify:carolyn` | 0;117 unit,9 infra,3 fixture artifact,3 production artifact,92 visual; full validate/types/workflow/offline synth |
| `bun run verify:sarabeth` | 0;196 canonical tests,7 provenance tests, provider/fixture/Amplify/shell/types/workflow/CF gates |
| `bun run verify:paul` | 0;56 canonical tests,4 unchanged viewport-only skips,3 Lighthouse runs; static/both types/shell/workflow/CF gates |
| `bun run verify:diloreto` | 0;37 canonical tests,1 unchanged mobile-only skip,13 genealogy; static/types/CF gates |
| **Root `bun run ci:verify` at0d791274** | **0;4/4 tasks,0 cached,concurrency1;9m19.174s** |
| Final Gitless Sarabeth artifact proof | 0; __deployment.json exactly identifies **0d7912745c02f1f30e2c36074fd275b7dff46dd6**, in `/work/apps/sarabeth`, with no .git copied |
| Real image tool/path proofs | 0; current short workdirs, ARM64,Bun1.4.0,Node24.20.0,Playwright1.62.1, executable bunx; DiLoreto invoking UID501 retained |
| Carolyn full 19-resource CloudFormation template | SHA256 remains **d3692bfbbe154221c8ab34133a712c54f97005025ded527437615fddec435002**, byte-identical to original/pre-rename |
| Historical source-metadata equality; pre-rename checkpoint ancestry | 0; only added currentPrefix fields; bddc5406 remains ancestor |
| Changed wrappers' ShellCheck and diff checks | 0 |

Carolyn/Sarabeth/Paul individual filters ran at92c90798; DiLoreto ran at0d791274.
The intervening commits change app documentation only. Root CI reran all four complete
chains at0d791274. The same original viewport skip predicates and nonfatal mocked-email /
SSR-stream diagnostics remain; no screenshot update or threshold change occurred.

### Storage and stopping boundary

No further old-image removal was requested or performed in this stage. Only image IDs
positively recorded as freshly created by this run were removed, using **--no-prune**,
no force, and a fresh no-container-reference check before every removal. Creation/ref/
cleanup outputs are preserved; safe IDs/exits are in the committed evidence. Exact
invocation-owned ephemeral test containers use the previously approved trap cleanup.
There was **no new cleanup scope deviation**, broad prune, volume deletion, restart or
resize. All own test images and proven new intermediate layers were cleaned; tagged
bases retained. End state: **6.7 GiB free**,93% usage; **19 running containers,70 volumes**.
Target/index and the tested checkout are clean after verification.

Stop here for parent-owned **all-history message normalization**, which the user has
approved for every local-main reachable commit **including the published initial commit**.
That normalization is not implemented or validated by this rename stage. No rewrite,
source-repository mutation, publication/force-push, deployment, active root workflow or
phase2 action occurred. Rewriting the initial commit precludes ordinary fast-forward
publication; any eventual non-fast-forward publication needs separate approval and fresh
clone checks. Final independent review and overall phase1 acceptance remain pending.
