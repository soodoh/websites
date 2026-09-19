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

DiLoreto also needs `AMPLIFY_URL` for the direct Amplify origin.

The OIDC role trust must name the monorepo repository and the matching environment. Keep each role scoped to its site's resources.

Set the following **repository-level** variable to `true` only when the corresponding legacy deployment writer is disabled and the monorepo workflow is ready:

- `PAUL_DEPLOY_ENABLED`
- `DILORETO_DEPLOY_ENABLED`
- `CAROLYN_DEPLOY_ENABLED`
- `SARABETH_DEPLOY_ENABLED`

A missing variable disables deployment while still allowing validation to run.

For Carolyn and Sarabeth, configure the existing Amplify app to use this repository, the intended monorepo branch, the root `amplify.yml`, and the matching `AMPLIFY_MONOREPO_APP_ROOT` (`apps/carolyn` or `apps/sarabeth`). Automatic Amplify builds should remain off because GitHub Actions starts the release after validation.

## Cutover checklist

Cut over one site at a time.

1. Confirm the site's current production URL and a known-good legacy revision.
2. Configure the GitHub Environment variables and OIDC trust.
3. Connect the Amplify app/branch to the monorepo where required.
4. Disable the legacy repository's deployment writer.
5. Set the site's repository enable variable to `true`.
6. Run the site's workflow manually from `main`.
7. Verify the workflow's smoke check and the public site.
8. Leave the legacy repository and infrastructure intact until the rollback window closes.

Do not enable two repositories to deploy the same Amplify app at the same time.

## Rollback

Rollback is source-driven:

1. Revert the faulty site change on `main` (or apply a forward fix).
2. Merge through the normal pull-request CI gate.
3. The site's path-filtered workflow validates and deploys the resulting commit.
4. For an urgent rerun of unchanged `main`, dispatch the site's deployment workflow manually.

Static workflows package and deploy the output built in that workflow run. GitHub artifacts are diagnostics and handoff between jobs, not a permanent release store. If byte-for-byte long-term static rollback is required later, use an AWS-native versioned S3 release bucket rather than committed repository evidence.

## Infrastructure

The current CloudFormation/CDK stacks remain the owners of existing resources during the deployment migration. Do not let a second IaC tool manage the same resource.

OpenTofu is a separate follow-up:

1. create an encrypted remote S3 backend with locking;
2. model one site's resources;
3. import existing resources and verify a no-change plan;
4. remove those resources from the old stack without deleting them;
5. repeat site by site.

This avoids combining deployment cutover risk with IaC state migration risk.
