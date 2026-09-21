# Deployment and rollback

## Design

Every site owns one workflow. The workflow validates the current commit, then deploys that same commit in a protected environment. There is no cross-workflow artifact lookup, release database, custom queue reconciliation, or committed run evidence.

| Site | Workflow | Environment | AWS mechanism |
| --- | --- | --- | --- |
| Paul | `deploy-paul.yml` | `production-portfolio` | verified static ZIP uploaded to Amplify |
| DiLoreto | `deploy-diloreto.yml` | `production-diloreto` | verified static ZIP uploaded to Amplify |
| Carolyn | `deploy-carolyn.yml` | `production-carolyn` | repository-connected Amplify release |
| Sarabeth | `deploy-sarabeth.yml` | `production-sarabeth` | repository-connected Amplify release |

Every deployment proceeds automatically after its workflow checks pass. GitHub Environments remain the site-specific trust and secret boundary, but they do not require a human reviewer. AWS access uses short-lived OIDC credentials. Each site has its own non-canceling concurrency group. Carolyn and Sarabeth additionally accept separate OpenTofu-managed Contentful webhooks that dispatch the corresponding GitHub deployment workflow against `main`; content and source releases therefore share the same verification, deployment, and smoke-test path.

## Required configuration

Set these variables on each GitHub Environment:

- `AWS_ACCOUNT_ID`
- `AWS_REGION`
- `AWS_ROLE_ARN`
- `AMPLIFY_APP_ID`
- `AMPLIFY_BRANCH`
- `PRODUCTION_URL`

DiLoreto's public domain is a native Amplify domain association, so it does not require a separate origin URL variable.

The OIDC role trust must name only the monorepo repository and the matching environment. Keep each role scoped to its site's resources.

### AWS account foundation

The OpenTofu account foundation owns the account-level GitHub Actions OIDC provider, one production alarm topic and email subscription, one account-wide monthly budget, and the versioned state bucket. Pass its `github_oidc_provider_arn` and `operational_alarm_topic_arn` outputs to the site roots. A budget is intentionally account-scoped; do not recreate it in an individual site's hosting root or name it as though it measures only one Amplify app.

Each resource has one state owner. Plan an explicit import and state transfer before moving an account-level provider or shared resource between roots.

Every site creates a low-volume 5xx alarm that sends both alarm and recovery notifications to the shared topic. Carolyn and Sarabeth also create latency alarms and retain Amplify compute logs for 30 days. Confirm the SNS email subscription after creating a foundation stack.

For Carolyn and Sarabeth, configure the existing Amplify app to use this repository, the intended monorepo branch, the root `amplify.yml`, and the matching `AMPLIFY_MONOREPO_APP_ROOT` (`apps/carolyn` or `apps/sarabeth`). Automatic repository builds and Amplify incoming webhooks must remain disabled because GitHub Actions is the only production release writer.

Carolyn and Sarabeth deployment roles can temporarily stamp `RELEASE_RUN_ID` and `RELEASE_RUN_ATTEMPT` onto the Amplify branch build environment. The release script restores the prior branch environment after Amplify finishes.

### Contentful deployment webhooks

OpenTofu owns one webhook in each production Contentful space under `apps/<site>/infra/contentful/`. Each webhook is restricted to the `master` environment and entry/asset publish and unpublish events. It calls GitHub's `workflow_dispatch` API for the matching deployment workflow with `ref: main` and `source: contentful`.

The webhooks share one repository-scoped fine-grained token that grants only **Actions: write**. Contentful stores it as a secret `Authorization` header. Each OpenTofu state records that token, so state access is production-secret access. One Contentful Management API token whose owner can manage both spaces is likewise mirrored into the two GitHub Environments.

Set these additional values on `production-carolyn` and `production-sarabeth`:

- variable `CONTENTFUL_SPACE_ID`
- secret `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN`
- secret `CONTENTFUL_GITHUB_ACTIONS_TOKEN`

After the AWS stack has created the site's versioned, encrypted state bucket, run:

```sh
scripts/setup-contentful-github-webhooks.sh
```

The wizard captures one shared Contentful token and one shared GitHub token, writes the same values to both GitHub Environments, and dispatches the OpenTofu configuration workflows. Those workflows plan and apply with OpenTofu 1.12.6 and `registry.terraform.io/cysp/contentful` 0.0.67. Contentful then dispatches the normal site workflow, which validates the current `main` SHA, starts that exact Amplify release through AWS OIDC, waits for it, and smoke-tests production.

Treat publishing production Contentful content as a production deployment action. Prefer Contentful Releases for coordinated multi-entry changes so one logical update does not produce avoidable successive builds. Rotate the shared fine-grained GitHub token by updating both environment secrets and rerunning both OpenTofu workflows.

### Repository authorization

The existing Carolyn and Sarabeth Amplify apps use their installed GitHub App connections; routine builds and OpenTofu updates do not need a GitHub token. AWS documents that a short-lived access token used to authorize the GitHub App during replacement-app creation is not stored by Amplify.

For disaster recovery, authorize a replacement repository-connected app with a short-lived credential supplied through the provider's secure input path, then remove it after the connection succeeds. Never put the credential in an OpenTofu variable file, Amplify environment variable, shell argument, repository file, state, or deployment log. Confirm a repository-connected build succeeds before removing the temporary credential.

### Carolyn build and runtime secrets

Carolyn stores these Standard-tier SSM `SecureString` parameters:

- `/carolyn-portfolio/prod/contentful-access-token`
- `/carolyn-portfolio/prod/project-auth-secret`

They use the AWS-managed `alias/aws/ssm` key. The Amplify build/service role can read both parameters. The build exports the Contentful token only while capturing the release snapshot. The SSR compute role can read only the project-auth secret; production compute has no permission or code path for the Contentful token. Neither role needs an explicit `kms:Decrypt` grant for the AWS-managed SSM key.

Before the first deployment of the infrastructure definition that removes Carolyn's dedicated KMS key, update both parameters in place to `alias/aws/ssm` without writing plaintext to disk, arguments, or logs. Verify parameter metadata, a repository-connected Amplify build, and runtime secret retrieval first. Keep the old key enabled during verification. If retrieval fails before the stack update, update both parameters back to the old key through the same in-memory/pipe-only process.

The completed migration re-encrypted both parameters with `alias/aws/ssm`, removed the former key's alias, and scheduled the disabled dedicated key for deletion on 2026-10-20. If rollback unexpectedly requires that key before deletion, stop and review cancellation, import, policy restoration, and re-encryption as one recovery plan.

## Production operation

All four sites are owned by this monorepo. Their legacy deployment writers are disabled and their AWS roles trust only the matching monorepo environment.

For an intentional source deployment, merge a reviewed change whose paths select the site or manually dispatch the site's workflow from `main`. After the checks pass, deployment proceeds automatically. Every workflow verifies the exact commit through the uncached `/__deployment.json` release marker (`{"commit":"<sha>","runId":"<GitHub run>","runAttempt":"<attempt>"}`) and then exercises representative hosting behavior; verify those checks and the public site.

For Carolyn or Sarabeth content-only changes, publish or unpublish through the configured production Contentful space. Confirm the corresponding GitHub deployment workflow succeeds before considering the content release complete. A failed content build leaves the previously successful deployment serving production.

## Rollback

Rollback is source-driven:

1. Revert the faulty site change on `main` (or apply a forward fix).
2. Merge through the normal pull-request CI gate.
3. The site's path-filtered workflow validates and deploys the resulting commit.
4. For an urgent rerun of unchanged `main`, dispatch the site's deployment workflow manually.

Static workflows package and deploy the output built in that workflow run. GitHub artifacts are diagnostics and handoff between jobs, not a permanent release store. If byte-for-byte long-term static rollback is required later, use an AWS-native versioned S3 release bucket rather than committed repository evidence.

DiLoreto production uses the Amplify-managed apex, `www`, and `paul` mappings. Its deployment smoke checks the public release marker, clean paths, custom 404 status/body, caching, security headers, and domain redirects. When Amplify's native `301` clean-URL canonicalization is observed, it also validates the canonical location and final custom `404`. The former custom CloudFront distribution and supporting resources no longer exist. The completed hosting transition remains documented in [`../apps/diloreto/infra/hosting-architecture.md`](../apps/diloreto/infra/hosting-architecture.md).

Paul deploys directly to its production Amplify branch. Its former candidate branch and verified-release bucket are gone and are not part of the deployment path. Production deployment and rollback remain source-driven. The separate `paul.diloreto.backups` bucket belongs to home-lab recovery, not this repository.

## Infrastructure

OpenTofu is the sole active AWS definition. It is split into one account-foundation root and one root per site:

- `infra/account-foundation`
- `apps/paul/infra/opentofu`
- `apps/diloreto/infra/opentofu`
- `apps/carolyn/infra/opentofu`
- `apps/sarabeth/infra/opentofu`

The AWS roots use separate state keys in a versioned, encrypted account state bucket owned by the account-foundation root. The Contentful roots and their existing state keys remain independent. OpenTofu must never manage one resource from two states.

Sarabeth's root combines its former bootstrap, hosting, domain, and DNS boundaries into one state. Carolyn and Sarabeth use the AWS Cloud Control provider for Amplify branches because branch-scoped compute roles are not represented by the standard AWS provider. The root `amplify.yml` remains the sole repository build specification for both connected Amplify apps.

Follow [`opentofu-migration.md`](opentofu-migration.md) for state boundaries, planning, safety invariants, and recovery. Every AWS write, import, state mutation, apply, and destroy remains approval-gated.
