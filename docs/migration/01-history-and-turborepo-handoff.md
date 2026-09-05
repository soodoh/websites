# Phase 1 handoff — local workspace candidate; Docker acceptance BLOCKED

**LOCAL ONLY. Nothing pushed. Phase 1 is not accepted; do not begin phase 2.**

Implementation candidate: `7fc0034c822f7e128237ae5b91ed122ae29c965e`.
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

## Docker assumptions and current blocker

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
No further Docker attempts were made. Owner must provide sufficient daemon backing-
filesystem space (at least several GB of headroom for dependency/build/browser
layers; exact required capacity is not measured) or an approved suitable daemon.
Do not claim browser/visual acceptance or change screenshots to bypass this blocker.

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

## Next steps

1. Independent review of the candidate and dependency/runtime drift. Review is
   required; passing host gates is not final acceptance.
2. Owner resolves Docker daemon disk capacity. Rebuild/validate final remote-safe
   wrappers and unchanged canonical browser baselines; rerun full per-app chains and
   root all-app command from a clean checkout. No screenshot updates, no coverage drops.
3. Update final migration SHA/status and this handoff only after all gates pass or
   record the exact remaining blocker. Publication still needs explicit approval,
   normal push/history-preserving merge, then fresh-clone history/frozen checks.
4. **Phase 2 is next only after phase 1 acceptance**: diff-scoped CI with production
   disabled. Phase 3 environments/IAM/Amplify/cutover remains separately authorized.
