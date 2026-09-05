# Workspace dependency and toolchain decisions

## Selected toolchain

Root pins: **Bun 1.4.0**, **Node 24.20.0**, **Turbo 2.10.12**. Bun 1.4.0 and
Node 24.20.0 already occur in the imported applications; active host Node 26.7.0 was
not used for accepted type/build checks. Commands selected the installed Node
24.20.0 binary through PATH. Turbo's Bun workspace discovery and lockfileVersion 2
parsing were verified by `turbo run ci:verify --dry=json` with all four packages.
No global Turbo installation or toolchain upgrade to Bun 1.4.2 was performed.

Official docs read during implementation:
- https://turborepo.com/docs/getting-started/add-to-existing-repository
- https://turborepo.com/docs/crafting-your-repository/structuring-a-repository
- https://turborepo.com/docs/crafting-your-repository/using-environment-variables
- https://turborepo.com/schema.json
- https://bun.com/docs/pm/workspaces
- https://bun.com/docs/pm/isolated-installs
- https://bun.com/docs/pm/overrides

The current Bun docs describe 1.4.2. Features used were separately exercised on
1.4.0, including a disposable parent/version-scoped override probe that generated
lockfileVersion 3. The final lock has **version 2, no persistent overrides**.
Bun's isolated linker is explicitly selected in `bunfig.toml`, and clean frozen
installs resolve declared app dependencies without relying on sibling packages.

Docker keeps every existing Playwright **1.62.1 noble** image reference/digest and
architecture policy. Carolyn's old Docker Bun 1.3.14 became 1.4.0. The browser image
contains Node 24.18.1, so an explicit Node 24.20.0 bookworm-slim build stage copies
only its Node binary onto the unchanged browser image. A built Carolyn container
reported Bun 1.4.0 / Node v24.20.0 / Playwright 1.62.1. Browser assets were not updated.
Imported Amplify specs/workflows retain old pins as inert deployment baselines;
phase 3 must reconcile their root workspace paths/toolchain before any cutover.

## Deliberate lock construction, not a mass upgrade

`dependency-resolutions-before.json` inventories every locator/resolved version in
all five pristine import locks; `dependency-resolutions-after.json` inventories the
candidate raw lock. **Neither inventory is installed-version evidence.** Bundled
packages can disagree with these metadata locators, as the CDK case below shows.
Exact original direct versions were retained and
made explicit in app manifests; four app names remain unchanged. Shared commitlint
and Lefthook dependencies moved to root. Carolyn's exact original CDK dependencies
moved to its app's devDependencies. Five obsolete locks and the nested infra
manifest were removed only after a root frozen install succeeded.

Two manual-lock experiments were rejected: workspace-prefixed original entries and
a union of original locators. Bun accepted frozen installation, but installed graphs
contained incompatible resolutions; frozen success alone is not proof of correctness.
A fresh normal resolution with exact original direct pins was also rejected as the
final choice because it introduced 126 transitive versions absent from all old locks.
None of these rejected locks is the authoritative committed lock.

Approved constrained experiment:
1. Create disposable storage with the root manifest, `bunfig.toml`, and all app
   manifests; generate a normal Bun lock (ignore lifecycle scripts).
2. Using `scripts/constrain-resolution-candidate.ts <scratch-directory>` from the
   repository root, examine dependency/optional-dependency edges that resolve a
   version absent from the five-lock inventory. Choose the highest version already
   in those locks that satisfies that **parent's declared range**. Add a one-parent,
   exact-parent-version override; never broaden a range or force an incompatible
   peer/dependency. Run `bun install --ignore-scripts --lockfile-only` in scratch.
3. Repeat to account for changed parent graphs. Four passes added 210, 58, 14, and 5
   constraints (287 total). `temporary-resolution-constraints.json` records them;
   these are evidence, NOT ongoing package.json overrides.
4. Remove temporary overrides through a normal Bun install, then use the resulting
   Bun-generated lock for a clean isolated frozen install. The selected package set
   stayed within old resolutions except the CDK schema noted below. No package
   metadata was hand-edited to make a frozen lock appear valid.
5. Audit **actual installed** dependency and peer edges, including each app's direct
   versions and infra's new import location. `scripts/audit-installed-ranges.ts`
   records the current results; `scripts/audit-installed-resolutions.ts` compares
   raw old lock locators AND verified baseline installed versions to candidate
   installed counterparts, in separate fields. These scripts run from root and
   regenerate the corresponding JSON evidence. They do not install,
   access secrets, or mutate source repositories.

To reproduce original runtime/peer evidence, extract only the committed package.json
and bun.lock at each recorded import into disposable `apps/<name>` (plus Carolyn
infra), install each with `bun install --frozen-lockfile --ignore-scripts`, then run:
`bun docs/migration/scripts/audit-installed-ranges.ts <scratch-root> <output-json> --historical-paths`.
The explicit historical flag selects original import prefixes; default audits now use
`source-imports.json` currentPrefix mappings for the renamed directories.
That original five-install audit is `dependency-baseline-peer-evidence.json`.
Original Portfolio/DiLoreto each had a vitefu 1.1.1 peer range that excluded their
Vite 8.2.2; the candidate has no such unsatisfied peer. These are actual scratch
installs, not tests or installs in source worktrees. The range auditor includes the
root manifest whenever present, even with an explicit checkout path; it fails on
missing required direct packages as well as invalid dependency/peer edges.

For installed-to-installed comparisons, use the already-existing pristine scratch
installs (never source installations):
`bun docs/migration/scripts/audit-installed-resolutions.ts <scratch-root> [output-json]`.
The script requires that baseline location explicitly rather than treating raw lock
entries as installed versions. Run from the candidate checkout being inspected;
its optional output path allows clean-checkout comparisons without dirtying that tree.

## Post-rename parity checkpoint

The approved short directory names do not rename package.json package identities.
Bun's supported `bun install --lockfile-only --ignore-scripts` operation changed only
four workspace keys and four workspace locators; frozen reinstallation passed. All
1,245 lock package entries and all other lock metadata are exactly equal after those
path substitutions: **zero resolved-version changes**.

For full installed graph comparison, add `--full-graph` to the range auditor and use
explicit output files. The pre-rename target installation, independent pre-rename
checkout selected with `--historical-paths`, renamed target, and clean renamed checkout
all have identical dependency/peer edges after root-key path mapping. All six locations
have zero missing required edges or incompatible ranges; 3,472 symlinks are valid and
none targets an old workspace path. The historical installed-resolution comparison
also remains exactly unchanged, including the genuine schema change already below.

See `post-rename-validation-evidence.json` for exact lock/graph hashes, counts, command
exits and the clean root-ci source SHA. Full graph captures are under
`/tmp/websites-workspace/rename-validation`; reproduction uses the auditor above and
compares JSON after mapping only top-level location keys. Earlier peer/evidence JSON
captures retain their historical pre-rename location labels; do not globally rewrite
those labels or pristine import prefixes. `targetPrefix`/`importCommit` remain historical;
`currentPrefix` alone selects current app directories. Root complete verification and
all four filters passed after rename with unchanged browser baselines. All-history
message normalization remains a separate parent-owned step, not part of these proofs.

## Remaining resolution differences and acceptance boundary

`dependency-resolution-comparison.json` separates `rawLockLocatorDifferences`
(raw old lock vs candidate installation), `verifiedInstalledVersionDifferences`
(actual pristine baseline vs candidate installations), and
`baselineLockMetadataDiscrepancies` (old raw metadata vs its actual installation).
`via` parent/range metadata comes from the raw original lock, not inferred installed
package metadata. Counts are matched locator/import contexts, **not unique package
counts or a complete graph diff**, and include native subpackages:

| macOS ARM64 | Raw-lock-to-candidate differences | Verified installed-to-installed differences |
| --- | ---: | ---: |
| Sarabeth | 10 | 10 |
| Portfolio | 55 | 55 |
| Carolyn app | 41 | 41 |
| DiLoreto | 52 | 52 |
| Carolyn infra | 3 | **1** |

Every compared locator has a resolved baseline installation (`baselineUnavailable`
is empty); unavailable candidate platform-specific optionals are separately listed
and are **not** passes on those platforms. Identical package versions with different
historical transitive selections are shared/deduplicated in the new graph. Direct
application versions did not change. This candidate was approved only for a LOCAL
commit and independent full validation, not final phase-1 acceptance.

Material cases requiring unchanged-baseline functional/visual validation:
- DiLoreto's `@modelcontextprotocol/sdk@1.26.0` accepts Zod `^3.25 || ^4.0`, now
  4.5.4 rather than 3.25.76. This is in the shadcn tooling graph, not a new app import.
  Router tooling also shares 4.5.4 within its declared `^4.4.3` range.
- `vite-imagetools@12.0.1` requests Sharp `^0.35.3`, now sharing 0.35.4 from the
  CMS apps. Native Sharp packages change from 0.35.3 to 0.35.4 and libvips from 1.3.2
  to 1.3.3. Static output and unchanged screenshots must validate image behavior.
- Runtime isbot and srvx selections consolidate within their declared ranges.
  The complete parent/range records are in the comparison JSON; fixture SSR,
  prerender, and browser tests remain required, not inferred from semver validity.
- Carolyn infra's bundled cloud-assembly-api was **already 2.2.6** in the original
  installation and remains 2.2.6. Its old raw lock entry says 2.3.0; that is metadata
  disagreement, **not a downgrade**. Likewise brace-expansion was already 5.0.9 and
  remains 5.0.9 despite raw lock metadata of 5.0.7. These two discrepancies are not
  installed drift. The genuine infra installed change is the schema below.

The **only novel resolution** beyond the old five-lock union (excluding new Turbo
platform packages) is `@aws-cdk/cloud-assembly-schema@54.22.0`, previously 54.12.0,
requested by unchanged `aws-cdk-lib@2.268.0` as `^54.11.0`. Retaining 54.12.0 with a
temporary exact-parent override was tested, but removing that override makes Bun
resolve this edge to 54.22.0 again. The candidate keeps no permanent override and
records the deviation rather than claiming exact transitive preservation.

Original and candidate offline CDK synth emitted byte-identical whole CloudFormation
templates, with **19 resources** and SHA-256
`d3692bfbbe154221c8ab34133a712c54f97005025ded527437615fddec435002`.
CDK stack/construct IDs, source paths, accounts, resource names, relative imports,
and cdk.json were unchanged. Only infra tsconfig's typeRoots changed from
`./node_modules/@types` to `../node_modules/@types` for the approved manifest fold.
Infra types and all nine unit tests passed; synth used `--no-lookups` and disabled
EC2 metadata. No account lookup or deployment was requested.

Current actual range audit: zero missing required dependencies/peers and zero
unsatisfied ranges across root, four apps, and the separate infra import location.
Peer/direct-edge evidence and checked-edge counts are durable JSON records.
Optional native dependencies are validated only for the installed platform; Docker
Linux browser/build gates remain essential. A type-only string index signature in
Sarabeth's YouTube environment interface accommodates Bun's ProcessEnv declarations
now visible through shared Nitro types; no runtime environment-reading logic changed.
The old standalone Sarabeth typecheck was reproduced successfully before this fix.
