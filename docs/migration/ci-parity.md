# CI parity — phase 2 local implementation

Every historical job and step is enumerated below. Sources were read with normalized
`importCommit:targetPrefix/.github/workflows/<file>`; current nested files are inert,
not root workflows and not safe monorepo deployment entry points. No old source was edited.
Phase 3 responsibilities below are **not executed or authorized** by phase 2.

## Current validation coverage

| Site | Root command / unchanged package filter | Runner | Coverage |
| --- | --- | --- | --- |
| sarabeth | `verify:sarabeth` / `sarabeth-studio` | ubuntu-24.04-arm | lint, actionlint, types, real production-provider graph with external boundaries replaced, Amplify fixture prepare/validate, deterministic browser target, shell helper/provenance tests, canonical Docker Playwright, cfn-lint1.53.0, actual successful container manifest equality |
| carolyn | `verify:carolyn` / `carolyn-portfolio` | ubuntu-24.04-arm | full validate (lint/unit/auth/types/fixture and hermetic-production artifact/prerender checks), infra types/unit/offline synth, production-shaped visual suite |
| paul | `verify:paul` / `portfolio-website` | ubuntu-24.04 | lint/types/ShellCheck/bash/actionlint/cfn-lint1.42.0, static build/output, functional/visual Docker Playwright, local Chrome152.0.7977.77 Lighthouse, deterministic validated zip/checksum/metadata |
| diloreto | `verify:diloreto` / `diloreto-website` | ubuntu-24.04 | lint/types, genealogy, cfn-lint1.53.0, static output, Docker Playwright, validated deterministic zip/checksum/metadata |

Root `test:workspace`, `test:ci`, `scripts/ci/lint.sh` always run. Installs are root frozen
Bun1.4.0/Node24.20.0; no old app/infra locks. Composite setup uses the exact immutable
Actions SHAs already reviewed in the imported workflows, Go1.27.1, Python3.14.6,
uv0.12.9 and shellcheck-py0.11.0.1 (ShellCheck0.11.0). Existing browser Dockerfiles retain
Playwright1.62.1 and their original tag/digest/architecture contracts; no screenshots change.
Paul/DiLoreto retain daemon-default browser architecture (GitHub x64, local ARM64).

## Retention and production continuity

- Sarabeth fixture test diagnostics: 14 days. Production mobile/desktop Lighthouse and
  30-day reports, baseline enforcement without automatic rollback, non-sending smoke,
  matching Amplify job and durable SSM last-known-good state remain phase 3.
- Carolyn fixture Playwright diagnostics: 14 days. Exact production ref promotion,
  account/environment trust, matching Amplify job and deployed smoke remain phase 3.
- Paul static artifact and fixture reports: 90 days. Durable verified S3 storage retains
  its existing production policy (no new expiration imposed); candidate hosting/browser/
  Lighthouse acceptance, identical zip promotion, terminal-job reconciliation, exact
  marker checks, previous-artifact retrieval, automatic/manual rollback and recovery
  evidence remain phase 3, including allowlisted legacy repository/workflow provenance.
- DiLoreto zip/metadata: 1 day; diagnostics: 7 days (now always, not just on failure).
  An expired zip must be rebuilt from the same selected immutable SHA with the current
  trusted verification harness, full site validation, and a NEW recorded run/build attempt
  and checksum; never substitute arbitrary bytes. Deployment origin/CloudFront edge
  equality, route/404/header/cache/asset checks and browser smoke remain phase 3.
- Every upload has site/run/build-attempt identity; reports are scanned, fixture-labelled,
  and SSR hosting bundles/auth manifests are not upload roots. PR and generic dispatch
  artifacts explicitly have `releaseAuthorized: false`; integrity alone is never authority.

## Legacy versus active contract tests

Sarabeth's `tests/contract/{amplify-source-policy,amplify-redirects,domain-infrastructure,
ci-production-provider}.spec.ts` retain all existing legacy deployment/IaC assertions.
The provider spec adds an active root reusable-workflow and complete package-task check.
Carolyn's `tests/unit/deployment-workflow.unit.ts` keeps legacy production ownership,
account, SHA and OIDC assertions; its fixture CI assertion now reads the active root
reusable workflow through import-meta repository-relative paths. Both Docker contexts
include root `.github` for those tests, never `.git`. Root `scripts/ci/workflows.test.mjs`
checks all active workflows, tools, privileges, paths, gate and cancellation contracts.
DiLoreto legacy SC2329 has a narrow documented trap-function suppression only; original
trap bodies and all origin/edge assertions remain. Root actionlint now checks it too.

DiLoreto's future trusted harness checkout stays `ref: github.workflow_sha`,
`path: verification-harness`. Phase 3 must install at
`$GITHUB_WORKSPACE/verification-harness` and execute scripts in
`$GITHUB_WORKSPACE/verification-harness/apps/diloreto`; uses paths need explicit prefixes.
The old `working-directory: verification-harness` deployment step remains deliberately
legacy-only and MUST NOT be activated unchanged. Root CI neither downloads releases nor
checks out arbitrary user refs or this privileged verification harness.

## Exhaustive historical job / step ledger

For validation jobs below, checkout/tool/bootstrap steps map to root checkout and
`.github/actions/ci-tools`; app operations map to the complete serial root command.
No app task runs concurrently against the same outputs. For phase-3 jobs **every step**,
including their checkout/bootstrap, remains a separate protected production responsibility.
The row labels retain the exact old semantic task; no omitted unnamed steps exist.

### sarabeth: `infrastructure.yaml`

Historical source: `db5ead5cc697df2c0606d6b48a75ebfc8b98f750:apps/sarabeth-studio/.github/workflows/infrastructure.yaml`.

| Old job / step | Exact old step name | New coverage / responsibility |
| --- | --- | --- |
| **cloudformation** | **Job boundary (230 min legacy timeout)** | Phase 3: protected infrastructure/domain/Netlify rollback; retain timeout and non-canceling app-specific critical section |
| cloudformation / 1 | Check out repository | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 2 | Configure protected infrastructure credentials | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 3 | Verify production account | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 4 | Validate CloudFormation templates | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 5 | Verify domain operation | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 6 | Apply hosting stack | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 7 | Validate existing canonical www redirects | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 8 | Apply DNS stack without changing delegation | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 9 | Remove Amplify domain association after DNS rollback | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 10 | Preserve core stacks from accidental deletion | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 11 | Apply approval-gated domain association and DNS | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 12 | Validate canonical www redirects after activation | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 13 | Restore Netlify records after domain failure | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 14 | Remove failed domain association after DNS rollback | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 15 | Preserve domain stack from accidental deletion | Phase 3: protected infrastructure/domain/Netlify rollback |
| cloudformation / 16 | Fail after domain rollback | Phase 3: protected infrastructure/domain/Netlify rollback |

### sarabeth: `ci.yaml`

Historical source: `db5ead5cc697df2c0606d6b48a75ebfc8b98f750:apps/sarabeth-studio/.github/workflows/ci.yaml`.

| Old job / step | Exact old step name | New coverage / responsibility |
| --- | --- | --- |
| **validate-infrastructure** | **Job boundary (default min legacy timeout)** | CI: `bun run verify:sarabeth`; one isolated runner, serial validation |
| validate-infrastructure / 1 | Check out repository | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate-infrastructure / 2 | Set up Go | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate-infrastructure / 3 | Validate GitHub Actions workflows | CI: `bun run verify:sarabeth` |
| validate-infrastructure / 4 | Set up Python | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate-infrastructure / 5 | Install CloudFormation linter | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate-infrastructure / 6 | Validate CloudFormation semantics | CI: `bun run verify:sarabeth` |
| **test** | **Job boundary (default min legacy timeout)** | CI: `bun run verify:sarabeth`; one isolated runner, serial validation |
| test / 1 | Check out repository | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| test / 2 | Set up Node.js | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| test / 3 | Set up Bun | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| test / 4 | Install dependencies | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| test / 5 | Lint | CI: `bun run verify:sarabeth` |
| test / 6 | Type-check | CI: `bun run verify:sarabeth` |
| test / 7 | Build production data-provider graph | CI: `bun run verify:sarabeth` |
| test / 8 | Build and validate deterministic Amplify bundle | CI: `bun run verify:sarabeth` |
| test / 9 | Build deterministic Playwright target | CI: `bun run verify:sarabeth` |
| test / 10 | Run Playwright tests | CI: `bun run verify:sarabeth` |
| test / 11 | Upload Playwright diagnostics | CI: scanned `ci-artifacts/sarabeth/` upload; retention above |
| **deploy** | **Job boundary (120 min legacy timeout)** | Phase 3: protected deployment/promotion/recovery; retain timeout and non-canceling app-specific critical section |
| deploy / 1 | Check out repository | Phase 3: protected deployment/promotion/recovery |
| deploy / 2 | Set up Node.js | Phase 3: protected deployment/promotion/recovery |
| deploy / 3 | Set up Bun | Phase 3: protected deployment/promotion/recovery |
| deploy / 4 | Install deployment tools | Phase 3: protected deployment/promotion/recovery |
| deploy / 5 | Check whether this commit was superseded | Phase 3: protected deployment/promotion/recovery |
| deploy / 6 | Configure production AWS credentials | Phase 3: protected deployment/promotion/recovery |
| deploy / 7 | Start Amplify release | Phase 3: protected deployment/promotion/recovery |
| deploy / 8 | Wait for matching Amplify release | Phase 3: protected deployment/promotion/recovery |
| deploy / 9 | Run non-sending functional smoke tests | Phase 3: protected deployment/promotion/recovery |
| deploy / 10 | Persist last-known-good deployment SHA | Phase 3: protected deployment/promotion/recovery |
| deploy / 11 | Stop an active failed release | Phase 3: protected deployment/promotion/recovery |
| deploy / 12 | Fail release validation | Phase 3: protected deployment/promotion/recovery |
| deploy / 13 | Run mobile Lighthouse CI | Phase 3: protected deployment/promotion/recovery |
| deploy / 14 | Run desktop Lighthouse CI | Phase 3: protected deployment/promotion/recovery |
| deploy / 15 | Upload Lighthouse reports | Phase 3: protected deployment/promotion/recovery |
| deploy / 16 | Enforce Lighthouse baseline policy | Phase 3: protected deployment/promotion/recovery |

### paul: `rollback.yml`

Historical source: `e7c9bd9787534d2c2d12a340cefcd981e5c1d8a2:apps/portfolio-website/.github/workflows/rollback.yml`.

| Old job / step | Exact old step name | New coverage / responsibility |
| --- | --- | --- |
| **rollback** | **Job boundary (120 min legacy timeout)** | Phase 3: protected artifact rollback; retain timeout and non-canceling app-specific critical section |
| rollback / 1 | Check out repository | Phase 3: protected artifact rollback |
| rollback / 2 | Set up Bun | Phase 3: protected artifact rollback |
| rollback / 3 | Install dependencies | Phase 3: protected artifact rollback |
| rollback / 4 | Validate selected workflow run | Phase 3: protected artifact rollback |
| rollback / 5 | Configure AWS credentials through OIDC | Phase 3: protected artifact rollback |
| rollback / 6 | Download selected verified release | Phase 3: protected artifact rollback |
| rollback / 7 | Verify selected artifact integrity | Phase 3: protected artifact rollback |
| rollback / 8 | Deploy selected zip to candidate | Phase 3: protected artifact rollback |
| rollback / 9 | Smoke test candidate hosting | Phase 3: protected artifact rollback |
| rollback / 10 | Run Playwright acceptance against candidate | Phase 3: protected artifact rollback |
| rollback / 11 | Run Lighthouse acceptance against candidate | Phase 3: protected artifact rollback |
| rollback / 12 | Deploy identical selected zip to production | Phase 3: protected artifact rollback |
| rollback / 13 | Verify restored production | Phase 3: protected artifact rollback |
| rollback / 14 | Record rollback evidence | Phase 3: protected artifact rollback |

### paul: `deploy.yml`

Historical source: `e7c9bd9787534d2c2d12a340cefcd981e5c1d8a2:apps/portfolio-website/.github/workflows/deploy.yml`.

| Old job / step | Exact old step name | New coverage / responsibility |
| --- | --- | --- |
| **quality** | **Job boundary (30 min legacy timeout)** | CI: `bun run verify:paul`; one isolated runner, serial validation |
| quality / 1 | Check out repository | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| quality / 2 | Set up Bun | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| quality / 3 | Install dependencies | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| quality / 4 | Run Biome | CI: `bun run verify:paul` |
| quality / 5 | Run TypeScript | CI: `bun run verify:paul` |
| quality / 6 | Validate shell scripts | CI: `bun run verify:paul` |
| quality / 7 | Validate GitHub Actions workflows | CI: `bun run verify:paul` |
| quality / 8 | Validate CloudFormation | CI: `bun run verify:paul` |
| quality / 9 | Build static site | CI: `bun run verify:paul` |
| quality / 10 | Assert static output | CI: `bun run verify:paul` |
| quality / 11 | Run functional and visual Playwright tests | CI: `bun run verify:paul` |
| quality / 12 | Run Lighthouse CI | CI: `bun run verify:paul` |
| quality / 13 | Package verified static artifact | CI: `scripts/ci/artifact.py marker/package paul`; marker before tests, zip after tests |
| quality / 14 | Upload verified artifact and reports | CI: scanned `ci-artifacts/paul/` upload; retention above |
| **deploy** | **Job boundary (120 min legacy timeout)** | Phase 3: protected deployment/promotion/recovery; retain timeout and non-canceling app-specific critical section |
| deploy / 1 | Check out repository | Phase 3: protected deployment/promotion/recovery |
| deploy / 2 | Set up Bun | Phase 3: protected deployment/promotion/recovery |
| deploy / 3 | Install dependencies | Phase 3: protected deployment/promotion/recovery |
| deploy / 4 | Download this run's verified artifact | Phase 3: protected deployment/promotion/recovery |
| deploy / 5 | Verify artifact integrity | Phase 3: protected deployment/promotion/recovery |
| deploy / 6 | Configure AWS credentials through OIDC | Phase 3: protected deployment/promotion/recovery |
| deploy / 7 | Deploy verified zip to candidate | Phase 3: protected deployment/promotion/recovery |
| deploy / 8 | Smoke test candidate hosting | Phase 3: protected deployment/promotion/recovery |
| deploy / 9 | Run Playwright acceptance against candidate | Phase 3: protected deployment/promotion/recovery |
| deploy / 10 | Run Lighthouse acceptance against candidate | Phase 3: protected deployment/promotion/recovery |
| deploy / 11 | Locate currently deployed verified artifact | Phase 3: protected deployment/promotion/recovery |
| deploy / 12 | Store verified release for rollback | Phase 3: protected deployment/promotion/recovery |
| deploy / 13 | Promote identical zip to production branch | Phase 3: protected deployment/promotion/recovery |
| deploy / 14 | Verify production or restore previous artifact | Phase 3: protected deployment/promotion/recovery |

### carolyn: `visual-tests.yml`

Historical source: `432f654a4fca3d22f6fb0f1eb333b3a246cd6cc1:apps/carolyn-portfolio/.github/workflows/visual-tests.yml`.

| Old job / step | Exact old step name | New coverage / responsibility |
| --- | --- | --- |
| **validate** | **Job boundary (10 min legacy timeout)** | CI: `bun run verify:carolyn`; one isolated runner, serial validation |
| validate / 1 | Check out repository | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate / 2 | Set up Bun | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate / 3 | Install dependencies | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate / 4 | Validate application lint, types, build, and prerender output | CI: `bun run verify:carolyn` |
| validate / 5 | Install infrastructure dependencies | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate / 6 | Validate infrastructure types and template | CI: `bun run verify:carolyn` |
| **playwright** | **Job boundary (20 min legacy timeout)** | CI: `bun run verify:carolyn`; one isolated runner, serial validation |
| playwright / 1 | Check out repository | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| playwright / 2 | Set up Bun | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| playwright / 3 | Install dependencies | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| playwright / 4 | Run production-shaped fixture Playwright tests | CI: `bun run verify:carolyn` |
| playwright / 5 | Upload Playwright report | CI: scanned `ci-artifacts/carolyn/` upload; retention above |
| **release-production-ref** | **Job boundary (5 min legacy timeout)** | Phase 3: protected deployment/promotion/recovery; retain timeout and non-canceling app-specific critical section |
| release-production-ref / 1 | Check out tested commit | Phase 3: protected deployment/promotion/recovery |
| release-production-ref / 2 | Advance production source branch | Phase 3: protected deployment/promotion/recovery |
| **deploy-production** | **Job boundary (35 min legacy timeout)** | Phase 3: protected deployment/promotion/recovery; retain timeout and non-canceling app-specific critical section |
| deploy-production / 1 | Confirm deployment is still current | Phase 3: protected deployment/promotion/recovery |
| deploy-production / 2 | Check out tested commit | Phase 3: protected deployment/promotion/recovery |
| deploy-production / 3 | Validate deployment configuration | Phase 3: protected deployment/promotion/recovery |
| deploy-production / 4 | Authenticate to AWS with GitHub OIDC | Phase 3: protected deployment/promotion/recovery |
| deploy-production / 5 | Verify production AWS identity | Phase 3: protected deployment/promotion/recovery |
| deploy-production / 6 | Start and monitor exact Amplify release | Phase 3: protected deployment/promotion/recovery |
| deploy-production / 7 | Run deployed Amplify smoke tests | Phase 3: protected deployment/promotion/recovery |

### diloreto: `deploy.yml`

Historical source: `f0911dee05244794057ebedd01b97f16bc62289e:apps/diloreto-website/.github/workflows/deploy.yml`.

| Old job / step | Exact old step name | New coverage / responsibility |
| --- | --- | --- |
| **validate** | **Job boundary (20 min legacy timeout)** | CI: `bun run verify:diloreto`; one isolated runner, serial validation |
| validate / 1 | Check out requested ref | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate / 2 | Resolve deployment target | CI: immutable checked-out event SHA; manual dispatch validates its checkout, no arbitrary ref input |
| validate / 3 | Check out resolved commit | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate / 4 | Set up Bun | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate / 5 | Install dependencies | CI: root checkout / pinned composite tools / one root frozen install (infra dependencies folded) |
| validate / 6 | Lint | CI: `bun run verify:diloreto` |
| validate / 7 | Type-check | CI: `bun run verify:diloreto` |
| validate / 8 | Lint CloudFormation template | CI: `bun run verify:diloreto` |
| validate / 9 | Build static site | CI: `bun run verify:diloreto` |
| validate / 10 | Assert static output | CI: `bun run verify:diloreto` |
| validate / 11 | Run containerized Playwright tests | CI: `bun run verify:diloreto` |
| validate / 12 | Upload Playwright report on failure | CI: scanned `ci-artifacts/diloreto/` upload; retention above |
| validate / 13 | Package Amplify artifact | CI: `scripts/ci/artifact.py marker/package diloreto`; marker before tests, zip after tests |
| validate / 14 | Upload validated artifact | CI: scanned `ci-artifacts/diloreto/` upload; retention above |
| **deploy** | **Job boundary (25 min legacy timeout)** | Phase 3: protected deployment/promotion/recovery; retain timeout and non-canceling app-specific critical section |
| deploy / 1 | Check out verification harness | Phase 3: protected deployment/promotion/recovery |
| deploy / 2 | Download validated artifact | Phase 3: protected deployment/promotion/recovery |
| deploy / 3 | Validate deployment configuration | Phase 3: protected deployment/promotion/recovery |
| deploy / 4 | Check deployment freshness | Phase 3: protected deployment/promotion/recovery |
| deploy / 5 | Configure temporary AWS credentials | Phase 3: protected deployment/promotion/recovery |
| deploy / 6 | Publish artifact to Amplify | Phase 3: protected deployment/promotion/recovery |
| deploy / 7 | Verify Amplify origin and CloudFront edge | Phase 3: protected deployment/promotion/recovery |
| deploy / 8 | Run deployment-invariant browser smoke tests | Phase 3: protected deployment/promotion/recovery |

