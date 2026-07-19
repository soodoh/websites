# Hosting runbook

## Architecture

`pauldiloreto.com` is a fully static TanStack Start application. The provider-neutral build prerenders `/` and a custom, non-hydrating `404.html`; only `dist/client` is packaged and deployed. The unused TanStack server bundle is never included in the deployment zip.

AWS resources are owned by the `pauldiloreto-amplify-hosting` CloudFormation stack in `us-east-1`:

- an Amplify Hosting `WEB` app named `pauldiloreto-portfolio`
- manual `candidate` and `main` Amplify branches with repository auto-builds and PR previews disabled
- a Route 53 hosted zone for `pauldiloreto.com`
- a repository-scoped GitHub OIDC deployment role
- an optional native Amplify domain association for the apex and `www`

The existing account-level GitHub OIDC provider remains owned by the unrelated `diloreto-amplify-hosting` stack and is only referenced by ARN. No AWS access keys are stored in GitHub.

The custom-domain association is initially disabled. Until DNS cutover is explicitly approved and completed, Netlify remains authoritative and the GitHub `PRODUCTION_DOMAIN_ACTIVE` variable remains `false`.

## Deployment flow

`.github/workflows/deploy.yml` runs for pull requests and pushes to `main`.

1. Install with Bun 1.3.14 and `bun install --frozen-lockfile`.
2. Run Biome, a production build, static-output assertions, Docker-pinned functional/visual Playwright tests, and three-run mobile Lighthouse CI.
3. Add a public `release.json` marker containing the workflow run and commit, normalize file timestamps, and package the contents of `dist/client` at the root of a deterministic zip.
4. Record SHA-256 metadata and retain the verified zip and reports as a GitHub artifact for 30 days.
5. Pull requests stop after local verification and never create Amplify previews.
6. A successful `main` push enters the GitHub `production` environment and assumes the AWS role through OIDC.
7. Upload the exact zip to `candidate`, wait for Amplify, then run hosting smoke checks, full Playwright, and Lighthouse against the candidate URL.
8. Resolve the artifact currently deployed to `main` from its uncached `release.json` marker and retain it for automatic recovery.
9. Promote the unchanged candidate zip to `main` and run default-domain smoke tests. Production-domain tests are added after cutover.
10. If post-promotion checks fail, restore the previously deployed retained zip, verify recovery, and fail the workflow with evidence. On the first deployment there is no prior artifact; Netlify is still live and the workflow reports that rollback is unavailable.

Production deployments are serialized and never cancelled in progress. The deployment helper stops unfinished Amplify jobs when polling times out or receives a termination signal.

## GitHub environment and variables

The `production` environment has no required reviewers. Its deployment branch policy allows only `main`; this is separate from branch protection, and `main` remains unprotected as requested.

Environment variables (none are secrets):

| Variable | Purpose |
| --- | --- |
| `AWS_REGION` | AWS region (`us-east-1`) |
| `AWS_DEPLOY_ROLE_ARN` | CloudFormation deployment-role output |
| `AMPLIFY_APP_ID` | CloudFormation app-ID output |
| `AMPLIFY_PRODUCTION_BRANCH` | `main` |
| `AMPLIFY_CANDIDATE_BRANCH` | `candidate` |
| `AMPLIFY_PRODUCTION_URL` | Default Amplify URL for `main` |
| `AMPLIFY_CANDIDATE_URL` | Default Amplify URL for `candidate` |
| `PRODUCTION_DOMAIN_ACTIVE` | `false` until the nameserver cutover is accepted |

Never add long-lived AWS credentials or presigned Amplify upload URLs to logs, artifacts, variables, or secrets.

## DNS and TLS ownership

Route 53 will become authoritative for `pauldiloreto.com` only after the native Amplify domain association is `AVAILABLE` and the explicit nameserver confirmation gate is approved. Amplify owns CDN delivery and managed TLS for the apex and `www`; there is no additional CloudFront distribution.

The intended routing is:

- apex is canonical
- `https://www.pauldiloreto.com` permanently redirects to the apex and preserves the path/query
- missing paths serve `/404.html` with HTTP 404

The staged cutover is:

1. Update the stack through a reviewed change set with `EnableCustomDomain=true`.
2. Retrieve the Amplify certificate validation CNAME and add it to both the still-authoritative Netlify zone and the new Route 53 zone.
3. Wait for the Amplify association and certificate to become available.
4. Reconcile every authoritative record into Route 53.
5. Show old/new nameservers and the registrar rollback command.
6. Obtain explicit approval before running `route53domains update-domain-nameservers`.
7. Verify authoritative/public DNS, TLS, redirects, content, headers, and the retained rollback artifact.
8. Set `PRODUCTION_DOMAIN_ACTIVE=true` only after full production acceptance.

## CloudFormation operations

Validate locally:

```bash
aws cloudformation validate-template \
  --region us-east-1 \
  --template-body file://infra/amplify-hosting.yaml

uvx --from cfn-lint cfn-lint infra/amplify-hosting.yaml
```

Discover the existing OIDC provider without hard-coding an account identifier:

```bash
OIDC_PROVIDER_ARN="$(aws iam list-open-id-connect-providers \
  --query "OpenIDConnectProviderList[?contains(Arn, 'token.actions.githubusercontent.com')].Arn | [0]" \
  --output text)"
```

Create or update only through a named change set, inspect `describe-change-set`, and then execute it. For the initial create, pass `EnableCustomDomain=false`. For domain staging, use the existing parameter values and change only `EnableCustomDomain=true`. Keep stack termination protection enabled.

```bash
aws cloudformation create-change-set \
  --region us-east-1 \
  --stack-name pauldiloreto-amplify-hosting \
  --change-set-name <descriptive-name> \
  --change-set-type UPDATE \
  --template-body file://infra/amplify-hosting.yaml \
  --parameters \
    ParameterKey=GitHubOidcProviderArn,UsePreviousValue=true \
    ParameterKey=EnableCustomDomain,ParameterValue=true \
  --capabilities CAPABILITY_IAM

aws cloudformation describe-change-set \
  --region us-east-1 \
  --stack-name pauldiloreto-amplify-hosting \
  --change-set-name <descriptive-name>

aws cloudformation execute-change-set \
  --region us-east-1 \
  --stack-name pauldiloreto-amplify-hosting \
  --change-set-name <descriptive-name>
```

## Rollback

Run `.github/workflows/rollback.yml` with the successful `main` deployment run ID whose retained artifact should be restored:

```bash
gh workflow run rollback.yml --ref main -f run_id=<successful-run-id>
```

The workflow validates the selected run identity, branch, commit, artifact checksum, and embedded release marker. It deploys the zip to `candidate`, runs candidate smoke/Playwright/Lighthouse acceptance, deploys the identical zip to `main`, verifies recovery, and records the artifact hash and Amplify job IDs.

## Redacted Netlify archive

The complete redacted inventory is stored at [`netlify-inventory.redacted.json`](./netlify-inventory.redacted.json). It records:

- stale Next.js build settings (`yarn build`, `.next`) and Netlify plugins
- apex, `www`, and the stale `paul.diloreto.com` domain alias
- four authoritative Netlify apex/`www` records and no MX, TXT, or CAA records
- no build hooks or service integrations
- site-specific GitHub status/check hooks
- the last published production deploy and the latest failed production attempt, with identifiers redacted

Do not delete or alter Netlify resources until all AWS production acceptance checks pass and explicit deletion confirmation is obtained. Cleanup must remain site-specific and must not alter account-wide integrations used by other sites.
