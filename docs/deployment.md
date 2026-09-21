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

The account foundation owns the account-level GitHub Actions OIDC provider, one production alarm topic and email subscription, one account-wide monthly budget, and the versioned OpenTofu state bucket. Existing accounts still use `infra/aws-account-foundation.yaml` until their live ownership handoff; the target definition is `infra/account-foundation`. Pass its `github_oidc_provider_arn` and `operational_alarm_topic_arn` outputs to the site roots. A budget is intentionally account-scoped; do not recreate it in an individual site's hosting root or name it as though it measures only one Amplify app.

Existing OIDC providers require a staged ownership migration. Import the provider into the account-foundation root and prove a no-change plan before removing it from any site or legacy foundation stack. Never let two states create, update, or delete the same account-level provider. Carolyn and DiLoreto retain their legacy provider resources until this handoff.

Every site creates a low-volume 5xx alarm that sends both alarm and recovery notifications to the shared topic. Carolyn and Sarabeth also create latency alarms and retain Amplify compute logs for 30 days. Confirm the SNS email subscription after creating a foundation stack.

For Carolyn and Sarabeth, configure the existing Amplify app to use this repository, the intended monorepo branch, the root `amplify.yml`, and the matching `AMPLIFY_MONOREPO_APP_ROOT` (`apps/carolyn` or `apps/sarabeth`). Automatic repository builds and Amplify incoming webhooks must remain disabled because GitHub Actions is the only production release writer.

Before enabling the updated deployment workflows, apply the Carolyn site stack and the Sarabeth bootstrap then hosting stacks so their deployment roles can temporarily stamp `RELEASE_RUN_ID` and `RELEASE_RUN_ATTEMPT` onto the Amplify branch build environment. The release script restores the prior branch environment after Amplify finishes.

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

The existing Carolyn and Sarabeth Amplify apps use their installed GitHub App connections; routine builds and stack updates do not need a GitHub token. `GitHubAccessTokenSecretArn` is an optional hosting-stack parameter only for creating a replacement repository-connected app. AWS documents that the access token authorizes the GitHub App during app creation and is not stored by Amplify.

For disaster recovery, create a short-lived Secrets Manager secret with a `token` field using secure input (`sarabeth-amplify-github-*` for Sarabeth), pass its ARN only for the replacement app's initial stack deployment, then redeploy with `GitHubAccessTokenSecretArn` empty and delete the temporary secret. Never put the token in a CloudFormation plaintext parameter, an Amplify environment variable, shell argument, repository file, or deployment log. Confirm a repository-connected build succeeds before removing the temporary secret.

### Carolyn build and runtime secrets

Carolyn stores these Standard-tier SSM `SecureString` parameters:

- `/carolyn-portfolio/prod/contentful-access-token`
- `/carolyn-portfolio/prod/project-auth-secret`

They use the AWS-managed `alias/aws/ssm` key. The Amplify build/service role can read both parameters. The build exports the Contentful token only while capturing the release snapshot. The SSR compute role can read only the project-auth secret; production compute has no permission or code path for the Contentful token. Neither role needs an explicit `kms:Decrypt` grant for the AWS-managed SSM key.

Before the first deployment of the infrastructure definition that removes Carolyn's dedicated KMS key, update both parameters in place to `alias/aws/ssm` without writing plaintext to disk, arguments, or logs. Verify parameter metadata, a repository-connected Amplify build, and runtime secret retrieval first. Keep the old key enabled during verification. If retrieval fails before the stack update, update both parameters back to the old key through the same in-memory/pipe-only process.

Removing the key from CDK does not delete it because its removal policy is `RETAIN`; it only removes the key from stack ownership and deletes the stack-owned alias. If rollback is needed after that update, do not restore the old `Key` construct, which would create a replacement key. Temporarily import the retained key by ARN, restore the two parameter-scoped decrypt statements, deploy, and then re-encrypt the parameters back to that key. Scheduling the retained key for deletion is a separate destructive operation. Do it only with explicit approval after confirming no resources use the key, and use a safe waiting period.

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

DiLoreto production uses the Amplify-managed apex, `www`, and `paul` mappings. Its deployment smoke checks the public release marker, clean paths, custom 404 status/body, caching, security headers, and domain redirects. When Amplify's native `301` clean-URL canonicalization is observed, it also validates the canonical location and final custom `404`. The approved migration and final cleanup are complete; `apps/diloreto/infra/amplify-hosting.yml` is the active stack template, and the former custom CloudFront distribution and supporting resources no longer exist. The slower post-cleanup rollback procedure remains documented in [`../apps/diloreto/infra/hosting-architecture.md`](../apps/diloreto/infra/hosting-architecture.md).

Paul deploys directly to its production Amplify branch. Its former candidate branch and verified-release bucket are not part of the deployment path. Removing those resources from the CloudFormation template deletes the candidate branch, but the bucket's retain policy leaves the bucket and all versions outside stack ownership. Emptying and deleting that retained bucket is a separate approval-gated operation. Production deployment and rollback remain source-driven.

## Infrastructure

OpenTofu is the target AWS definition. It is split into one account-foundation root and one root per site:

- `infra/account-foundation`
- `apps/paul/infra/opentofu`
- `apps/diloreto/infra/opentofu`
- `apps/carolyn/infra/opentofu`
- `apps/sarabeth/infra/opentofu`

CloudFormation/CDK stacks remain the live owners until each root completes the staged import and retention handoff. Do not apply an imported OpenTofu root while its legacy stack still owns the same resources. Paul's retained handoff is complete and its OpenTofu state is the sole infrastructure owner; its empty CloudFormation migration shell owns no resources. Other legacy sources remain in the repository only for their migration windows and must be removed site by site after each live handoff, not in advance.

The AWS roots use separate state keys in a versioned, encrypted account state bucket owned by the account-foundation root. The Contentful roots and their existing state keys remain independent. OpenTofu must never manage one resource from two states.

Sarabeth's target root combines its retained bootstrap, hosting, domain, and DNS resources into one state. Carolyn and Sarabeth use the AWS Cloud Control provider for Amplify branches because branch-scoped compute roles are not represented by the standard AWS provider. The root `amplify.yml` remains the sole repository build specification for both connected Amplify apps.

Follow [`opentofu-migration.md`](opentofu-migration.md) for backend bootstrap, import IDs, required no-change plans, retention-first CloudFormation/CDK removal, rollback, and the final `ManagedBy=OpenTofu` handoff. Every live import, AWS write, legacy stack update, and apply remains approval-gated.
