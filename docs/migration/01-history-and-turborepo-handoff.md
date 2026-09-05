# Phase 1 handoff — BLOCKED before history import

## Status and publication boundary

**LOCAL ONLY. Phase 1 is incomplete. Do not start phase 2 yet.**

Stopped at the required public-history credential gate. No application history was
imported into the target, no workspace dependencies were installed, and no
application/toolchain/Docker/infra code was changed. Only redacted migration records
were added to the target. No push, deployment, AWS operation, source ref update,
source configuration/hook change, or workflow activation was performed.

The target remains the existing linked `main` worktree at
`/Users/pauldiloreto/Projects/websites/main`, common Git directory
`/Users/pauldiloreto/Projects/websites/.git`, origin
`git@github.com:soodoh/websites.git`. GitHub visibility was confirmed **PUBLIC**.
Starting target and live target main: `5b236ef3a519759c84ebd3504809d391baf085ea`.
The documentation commit containing this record is not a completed migration SHA;
locate it with `git log --format='%H %s' -- docs/migration/01-history-and-turborepo-handoff.md`.
All import/final-migration SHA fields remain null intentionally.

## Blocking security findings (values deliberately omitted)

Gitleaks 8.30.1 scanned each approved `main` history in a disposable bare repository
with full redaction and `--ignore-gitleaks-allow`. Portfolio has five findings:

| Rule | Historical file | Commit | Line |
| --- | --- | --- | --- |
| generic-api-key (`accessToken` assignment) | `keys.js` | `2060ce6b7b81c36e0a79bf09a1e3a9c87f055537` | 3 |
| gcp-api-key | `build/index.html` | `bc30bfddd870d6525e58319415b236ebd415b642` | 306 |
| gcp-api-key | `build/index.html` | `44ed89792405382b563e2858cd45084b266595dd` | 273 |
| gcp-api-key | `src/index.html` | `44ed89792405382b563e2858cd45084b266595dd` | 306 |
| gcp-api-key | `src/index.html` | `355431d2a496da66362cad171ecba7e5aa1fab9b` | 198 |

These are findings, not proof that any key is currently active. No credential was
tested, used, printed, or included in these records. API-key restrictions,
revocation, and whether the access token was intended to be public require owner
review. Do not infer permission to republish from existing source visibility.

Sarabeth and Carolyn each have one generic-api-key finding in
`.yarn/releases/yarn-3.6.3.cjs:127`, on a `MismatchedTokenException` code assignment
(commits `08fb3a60a5a2f5b91049a9ffc8814852815feea7` and
`f15ddc06e0eeefa2ab667caaff0321df9c520bcb`, respectively). These look like vendored-code
false positives but have not received formal clearance. DiLoreto has no Gitleaks
history findings. This does **not** establish complete private-content clearance.

**Required owner decision:** review/rotate or confirm revocation/restrictions for
Portfolio's historical credentials, then explicitly decide whether unchanged
history containing those values may be imported. Public publication requires
separate approval. Do not rewrite history or silently suppress findings.

## Provenance and freshness

All root/ancestor `AGENTS.md` locations were checked; none existed for the target.
All four source root `AGENTS.md` files were read completely. Approved revisions'
AGENTS contents match those read locally. No additional tracked nested AGENTS files
were listed in the local mains.

All source worktrees were clean, non-shallow linked worktrees, on `main`, with local
`main == origin/main`. No promisor/partial-clone configuration was detected by the
preflight config query. Source main/origin-main and clean status were rechecked
unchanged after backup/scanning. No source-mutating Git commands, installs, tests,
or hook operations were executed. Production deployment ownership remains with the
source repositories.

Read-only `git ls-remote <github-url> refs/heads/main` found two newer live heads.
The user explicitly selected **Latest GitHub SHAs**. Those two immutable SHAs were
fetched only into scratch repositories; source refs were not updated.

| App | Approved full SHA | Reachable commits | Local main at preflight |
| --- | --- | ---: | --- |
| sarabeth-studio | `dc3e3f956ccbc49a0361cddc0b79b655e46c000d` | 454 | same |
| portfolio-website | `15630718474e8b97f7c9150dfc2357825e352adb` | 152 | `755f12c94dde2412d06d730787ec7b046c62fcd1` (151 commits) |
| carolyn-portfolio | `8c70afc7748ab4a18e596df597a641c9aad97ad6` | 357 | same |
| diloreto-website | `02e49ba0c4229b864659f787493ff24678c93e6c` | 123 | `c4ce9abf6fd69effa24a7ad0e78f90e59e52c58a` (121 commits) |

`source-imports.json` records full tree IDs, prefixes, paths, URLs, bundle hashes,
and actual verification states. All approved histories passed scratch
`git fsck --full` and had zero `?` entries in
`git rev-list --objects --missing=print main`. Approved head trees have no gitlinks.
Historical LFS/submodule/private-content auditing was not completed before the
credential stop; object checks alone do not verify external LFS content.

## Backups and local evidence

Durable, private backup directory outside all worktrees:
`/Users/pauldiloreto/Projects/websites-migration-backups/`.

- `<app>-local-main.bundle`: untouched original local main (four bundles).
- `<app>-approved-main.bundle`: approved revision and its full ancestors (four bundles).
- `websites-start.bundle`: initial target main.
- Approved bundle SHA-256 hashes are in `source-imports.json`.

All bundles were created with `git bundle create <path> main` and verified with
`git bundle verify <path>` (exit 0). Original source and approved bundles were first
verified in `/tmp/websites-migration-backups/`, then copied byte-for-byte to the
durable directory; the target bundle was created/verified directly there.
Bundles contain original history, including flagged material: **keep them private,
do not commit or upload them**. Untouched source repositories are also retained.

Disposable evidence: `/tmp/websites-migration-preflight/<app>.git`,
`<app>-fsck.log`, `<app>-gitleaks.log`, and redacted `<app>-gitleaks.json`.
These are convenience evidence, not the durable authority. No raw scan reports are
committed. Gitleaks was downloaded locally into scratch (no global installation)
and its Darwin ARM64 archive matched the official release checksum. An initial
checksum command exited 1 because the downloaded archive had a shortened filename;
renaming it to its published asset name and rerunning verified successfully.

## Commands/results and unexecuted work

| Command/check | Result |
| --- | --- |
| Source/target `git status --porcelain=v1`, main refs, common Git dirs, shallow/config checks | clean; initial target intact; source main/origin-main unchanged |
| `git ls-remote` for all five GitHub main refs | exit 0; approved newer Portfolio/DiLoreto revisions above |
| `gh repo view soodoh/websites --json visibility,url` | exit 0; PUBLIC |
| `git clone --bare --no-hardlinks --single-branch --branch main --no-tags <source> <scratch>` | exit 0 for all four |
| Scratch `git fetch --no-tags <github-url> <approved-sha>`; scratch-only `update-ref refs/heads/main <sha>` | exit 0 for Portfolio/DiLoreto |
| `git rev-parse main main^{tree}` / `git rev-list --count main` | values recorded in JSON |
| Scratch `git fsck --full` | exit 0 for all four |
| `git rev-list --objects --missing=print main` | zero missing objects for all four |
| `git ls-tree -r main` gitlink count | zero for each approved head |
| `git bundle create` / `git bundle verify` | exit 0 for all source/approved/target bundles |
| Gitleaks history scan (exact arguments in JSON) | Sarabeth 1 / Portfolio 1 / Carolyn 1 / DiLoreto 0; respective finding counts 1 / 5 / 1 / 0 |
| `git --version` | 2.55.0 |
| `bun --version` | 1.4.0 |
| `node --version` | v26.7.0; differs from plan's observed Node 24.20.0 |
| `docker info --format '{{.Architecture}}'` | exit 0; aarch64; browser image/baseline execution NOT tested |

No supported Turbo/Bun/Node combination has been selected or pinned. Official
Bun/Turbo documentation review, five-lock dependency inventory/comparison, root
workspace/lock, task graph, hook ownership, Renovate, environment inventory,
Docker adaptations, unique dev ports, and Carolyn infra integration are **pending**.
No packages were upgraded and no source locks/manifests were removed.

All six workflow files were inventoried but not yet read for coverage extraction:
Sarabeth `ci.yaml` and `infrastructure.yaml`; Portfolio `deploy.yml` and
`rollback.yml`; Carolyn `visual-tests.yml`; DiLoreto `deploy.yml`. They must be read
in full at approved revisions before implementation. No phase-2 contract assertions
were executed, so none are classified as phase-2-only failures.

Every application validation gate remains **NOT RUN**, including clean frozen
install, lint/types, provider graph, fixture Amplify bundle checks, deployment-shell
tests, Carolyn validate/infra types/unit/offline synth, Portfolio ShellCheck/static
assertions/Lighthouse, genealogy unit tests, all Playwright suites, offline
CloudFormation validation, individual Turbo filters, and sequential all-app
verification. No screenshot baselines were modified. No production CMS or email
calls were made. There are no task names/Docker workspace assumptions/infra changes
to hand off as implemented.

## Resume instructions

1. Resolve the credential gate with the owner; retain the explicit SHA approvals.
   Revalidate target/source state and live refs without updating sources.
2. Complete LFS/submodule/object and private-content/current-tree audits. Record
   justified false-positive dispositions without secret values. No publication
   until separately approved.
3. Resume plan 1: `git subtree add` **without `--squash`**, one pristine import
   commit per app. Preserve the target initial commit and this documentation history.
   Verify every approved head/ancestor and original tree at its import commit.
4. Implement the workspace/toolchain/Docker/infra/task changes and run all required
   local validation from a clean disposable target checkout. Update this handoff
   and JSON with evidence; do not claim current blocked work is complete.
5. Phase 2 (`/tmp/websites-plan-2-scoped-ci.md`) is the next phase **only after phase
   1 succeeds**. It owns diff-scoped CI with production disabled. Phase 3 remains a
   separate authorization boundary. Do not begin either implicitly.

Unchanged historical commits retain their original root-relative paths. Navigate
with `git log <approved-source-sha> -- <old-path>` or future import refs; do not
promise seamless `git log --follow apps/...` across subtree boundaries. Unrelated
branches/tags are out of scope and remain in original repositories. Never use a
squash/rebase merge or force-push to publish eventual imports.
