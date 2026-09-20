# Deployment and rollback

## Design

Every site owns one workflow. The workflow validates the current commit, then deploys that same commit in a protected environment. There is no cross-workflow artifact lookup, release database, custom queue reconciliation, or committed run evidence.

| Site | Workflow | Environment | AWS mechanism |
| --- | --- | --- | --- |
| Paul | `deploy-paul.yml` | `production-portfolio` | verified static ZIP uploaded to Amplify |
| DiLoreto | `deploy-diloreto.yml` | `production-diloreto` | verified static ZIP uploaded to Amplify |
| Carolyn | `deploy-carolyn.yml` | `production-carolyn` | repository-connected Amplify release |
| Sarabeth | `deploy-sarabeth.yml` | `production-sarabeth` | repository-connected Amplify release |

GitHub's environment protection is the approval seam for source releases. AWS access uses short-lived OIDC credentials. Each site has its own non-canceling concurrency group. Carolyn and Sarabeth additionally accept separate infrastructure-managed Contentful webhooks that rebuild the already-connected `main` revision after a production content publish; those content releases do not grant permission to select or change source code.

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

For Carolyn and Sarabeth, configure the existing Amplify app to use this repository, the intended monorepo branch, the root `amplify.yml`, and the matching `AMPLIFY_MONOREPO_APP_ROOT` (`apps/carolyn` or `apps/sarabeth`). Automatic repository builds should remain off because GitHub Actions starts source releases after validation. The incoming Contentful webhooks are the only additional build triggers.

### Contentful build webhooks

Carolyn and Sarabeth each own a distinct Amplify incoming webhook in their existing infrastructure stack. Both stacks expose its sensitive URL as `ContentfulWebhookUrl`. Never commit, log, or reuse these URLs between sites.

After deploying reviewed infrastructure changes, run:

```sh
scripts/setup-contentful-webhooks.sh
```

The wizard configures one webhook in each site's Contentful space. Each webhook is restricted to the `master` environment and to entry/asset publish and unpublish events. The optional final wizard stage directly invokes each Amplify webhook, which starts a real production build and deploy; use that stage only with explicit production approval.

A Contentful-triggered build checks out the repository-connected `main` branch and runs the root `amplify.yml`. It cannot choose a different source revision, but it also does not pass through the GitHub workflow or protected GitHub Environment. Treat publishing production Contentful content as a production deployment action. Prefer Contentful Releases for coordinated multi-entry changes so one logical update does not produce avoidable successive builds.

To rotate a compromised or exposed URL, increment `WebhookRotationVersion` for that site's stack and deploy the reviewed update. The custom resource creates the replacement before CloudFormation deletes the old webhook. Promptly replace the URL in Contentful, then verify one controlled build. Carolyn currently uses rotation version `2`; Sarabeth retains its independently managed version.

### Carolyn repository authorization

The existing Carolyn Amplify app uses its installed GitHub App connection; routine builds and stack updates do not need a GitHub token. `GitHubAccessTokenSecretArn` is an optional CDK parameter only for creating a replacement repository-connected app. AWS documents that the access token authorizes the GitHub App during app creation and is not stored by Amplify.

For disaster recovery, create a short-lived Secrets Manager secret with a `token` field using secure input, pass its ARN only for the replacement app's initial stack deployment, then redeploy with `GitHubAccessTokenSecretArn` empty and delete the temporary secret. Never put the token in an Amplify environment variable, shell argument, repository file, or deployment log. Confirm a repository-connected build succeeds before removing the temporary secret.

### Carolyn runtime secrets

Carolyn reads exactly these Standard-tier SSM `SecureString` parameters:

- `/carolyn-portfolio/prod/contentful-access-token`
- `/carolyn-portfolio/prod/project-auth-secret`

They use the AWS-managed `alias/aws/ssm` key. The Amplify build/service role and SSR compute role receive `ssm:GetParameter` only for those two parameter ARNs; they do not need an explicit `kms:Decrypt` grant for the AWS-managed SSM key.

Before the first deployment of the infrastructure definition that removes Carolyn's dedicated KMS key, update both parameters in place to `alias/aws/ssm` without writing plaintext to disk, arguments, or logs. Verify parameter metadata, a repository-connected Amplify build, and runtime secret retrieval first. Keep the old key enabled during verification. If retrieval fails before the stack update, update both parameters back to the old key through the same in-memory/pipe-only process.

Removing the key from CDK does not delete it because its removal policy is `RETAIN`; it only removes the key from stack ownership and deletes the stack-owned alias. If rollback is needed after that update, do not restore the old `Key` construct, which would create a replacement key. Temporarily import the retained key by ARN, restore the two parameter-scoped decrypt statements, deploy, and then re-encrypt the parameters back to that key. Scheduling the retained key for deletion is a separate destructive operation. Do it only with explicit approval after confirming no resources use the key, and use a safe waiting period.

## Production operation

All four sites are owned by this monorepo. Their legacy deployment writers are disabled and their AWS roles trust only the matching monorepo environment.

For an intentional source deployment, merge a reviewed change whose paths select the site or manually dispatch the site's workflow from `main`. Approve the protected production environment, then verify the workflow smoke check and public site.

For Carolyn or Sarabeth content-only changes, publish or unpublish through the configured production Contentful space. Confirm the corresponding Amplify webhook build succeeds before considering the content release complete. A failed content build leaves the previously successful deployment serving production.

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

The current CloudFormation/CDK stacks remain the owners of existing resources during the deployment migration. Native Amplify domain associations and their service-managed DNS records remain owned through those stacks. Do not let a second IaC tool manage the same resource.

OpenTofu is a separate follow-up:

1. create an encrypted remote S3 backend with locking;
2. model one site's resources;
3. import existing resources and verify a no-change plan;
4. remove those resources from the old stack without deleting them;
5. repeat site by site.

This avoids combining deployment cutover risk with IaC state migration risk.
