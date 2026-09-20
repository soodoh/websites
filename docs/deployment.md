# Deployment and rollback

## Design

Every site owns one workflow. The workflow validates the current commit, then deploys that same commit in a protected environment. There is no cross-workflow artifact lookup, release database, custom queue reconciliation, or committed run evidence.

| Site | Workflow | Environment | AWS mechanism |
| --- | --- | --- | --- |
| Paul | `deploy-paul.yml` | `production-portfolio` | verified static ZIP uploaded to Amplify |
| DiLoreto | `deploy-diloreto.yml` | `production-diloreto` | verified static ZIP uploaded to Amplify |
| Carolyn | `deploy-carolyn.yml` | `production-carolyn` | repository-connected Amplify release |
| Sarabeth | `deploy-sarabeth.yml` | `production-sarabeth` | repository-connected Amplify release |

GitHub's environment protection is the approval seam. AWS access uses short-lived OIDC credentials. Each site has its own non-canceling concurrency group.

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

For Carolyn and Sarabeth, configure the existing Amplify app to use this repository, the intended monorepo branch, the root `amplify.yml`, and the matching `AMPLIFY_MONOREPO_APP_ROOT` (`apps/carolyn` or `apps/sarabeth`). Automatic Amplify builds should remain off because GitHub Actions starts the release after validation.

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

For an intentional deployment, merge a reviewed change whose paths select the site or manually dispatch the site's workflow from `main`. Approve the protected production environment, then verify the workflow smoke check and public site.

## Rollback

Rollback is source-driven:

1. Revert the faulty site change on `main` (or apply a forward fix).
2. Merge through the normal pull-request CI gate.
3. The site's path-filtered workflow validates and deploys the resulting commit.
4. For an urgent rerun of unchanged `main`, dispatch the site's deployment workflow manually.

Static workflows package and deploy the output built in that workflow run. GitHub artifacts are diagnostics and handoff between jobs, not a permanent release store. If byte-for-byte long-term static rollback is required later, use an AWS-native versioned S3 release bucket rather than committed repository evidence.

DiLoreto's CloudFront-to-Amplify migration is currently paused at `Candidate`: production remains on the retained custom CloudFront distribution, and `candidate.diloreto.com` exercises the native Amplify association. Its deployment smoke checks the public release marker, clean paths, custom 404 status/body, caching, security headers, and domain redirects. During the staged migration it accepts the retained edge's direct custom `404`; when Amplify's native `301` clean-URL canonicalization is observed, it also validates the canonical location and final custom `404`. Continue using `apps/diloreto/infra/amplify-hosting-transition.yml` and follow the `Legacy`, `Candidate`, `AliasRelease`, `Native`, soak, and rollback gates in [`../apps/diloreto/infra/hosting-architecture.md`](../apps/diloreto/infra/hosting-architecture.md); never apply the final-state template directly to the legacy stack as a one-step cutover.

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
