# Hosting runbook

## Architecture

`pauldiloreto.com` is a fully static TanStack Start application. The provider-neutral build prerenders `/` and a custom, non-hydrating `404.html`; only `dist/client` is packaged and deployed. The unused TanStack server bundle is never included in the deployment zip.

AWS resources are owned by the `pauldiloreto-amplify-hosting` CloudFormation stack in `us-east-1`:

- an Amplify Hosting `WEB` app named `pauldiloreto-portfolio`
- manual `candidate` and `main` Amplify branches with repository auto-builds and PR previews disabled
- a Route 53 hosted zone for `pauldiloreto.com`
- a private, versioned S3 store for every successfully promoted release
- a repository-scoped GitHub OIDC deployment role
- a native Amplify domain association for the apex and `www`

The existing account-level GitHub OIDC provider remains owned by the `diloreto-amplify-hosting` stack and is only referenced by ARN. No AWS access keys are stored in GitHub.

The legacy `paul.diloreto.com` hostname is intentionally not added to this stack's Amplify domain association. The separate `diloreto-amplify-hosting` stack owns the shared `diloreto.com` Route 53 zone, exact `paul` CloudFront alias, TLS SAN, and permanent redirect to this site's apex. This keeps every source hostname with its authoritative-zone owner and prevents either portfolio stack from changing the `diloreto.com` apex, `www`, mail, or the cross-account `carolyn` records.

The custom-domain association is enabled, Route 53 is authoritative, and the GitHub `PRODUCTION_DOMAIN_ACTIVE` variable is `true`. The former Netlify deployment is retained only as the redacted historical archive described below.

## Deployment flow

`.github/workflows/deploy.yml` runs for pull requests and pushes to `main`.

1. Install with Bun 1.3.14 and `bun install --frozen-lockfile`.
2. Run Biome, TypeScript, ShellCheck, actionlint, cfn-lint, a production build, static-output assertions, Docker-pinned functional/visual Playwright tests, and three-run mobile Lighthouse CI.
3. Add a public `release.json` marker containing the workflow run, attempt, and commit, normalize file timestamps, and package the contents of `dist/client` at the root of a deterministic zip.
4. Record SHA-256 metadata and retain the verified zip and reports as a GitHub artifact for 90 days.
5. Pull requests stop after local verification and never create Amplify previews.
6. A successful `main` push enters the GitHub `production` environment and assumes the AWS role through OIDC.
7. Upload the exact zip to `candidate`, wait for Amplify, then run hosting smoke checks, full Playwright, and Lighthouse against the candidate URL.
8. Resolve the artifact currently deployed to `main` from its uncached `release.json` marker and download it from the private verified-release store for automatic recovery.
9. Persist the candidate-verified release under its immutable run/attempt identity in the private S3 store, promote the unchanged zip to `main`, and verify the exact run, attempt, and commit through `release.json`.
10. If post-promotion checks fail, restore the previously deployed retained zip, verify its exact release identity, and fail the workflow with evidence. The first deployment after introducing the release store may have no stored predecessor; the workflow reports that rollback is unavailable instead of using an unverified artifact.

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
| `AMPLIFY_RELEASE_BUCKET` | CloudFormation verified-release bucket output |
| `PRODUCTION_DOMAIN_ACTIVE` | `true` in the completed Route 53/Amplify production state |

Never add long-lived AWS credentials or presigned Amplify upload URLs to logs, artifacts, variables, or secrets.

## DNS and TLS ownership

Route 53 is authoritative for `pauldiloreto.com`, and the native Amplify domain association is `AVAILABLE`. Amplify owns CDN delivery and managed TLS for the apex and `www`; there is no additional CloudFront distribution for this apex.

The intended routing is:

- apex is canonical
- `https://www.pauldiloreto.com` permanently redirects to the apex and preserves the path/query
- `https://paul.diloreto.com` is terminated and permanently redirected by the `diloreto-amplify-hosting` CloudFront distribution, preserving the path/query
- missing paths serve `/404.html` with HTTP 404

The completed staged cutover was:

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

Run `.github/workflows/rollback.yml` with the deployment run ID and artifact-build attempt recorded in the verified release marker:

```bash
gh workflow run rollback.yml --ref main \
  -f run_id=<successful-run-id> \
  -f run_attempt=<artifact-build-attempt>
```

The workflow validates the selected GitHub run and commit, downloads the matching immutable run/attempt release from the private S3 store, and verifies its checksum and embedded marker. It deploys the zip to `candidate`, runs candidate smoke/Playwright/Lighthouse acceptance, deploys the identical zip to `main`, verifies the restored release identity, and records the artifact hash and Amplify job IDs.

## Shared `diloreto.com` ownership

AWS account `658271954302` owns `pauldiloreto.com`, the shared `diloreto.com` hosted zone, and the `diloreto-amplify-hosting` CloudFront distribution. That distribution owns only the exact `paul.diloreto.com` redirect in addition to the family site's apex/`www` names.

The Carolyn portfolio runs in AWS account `725669362139`. Its Amplify app owns a separate `diloreto.com` domain association containing only the `carolyn` prefix. Because there is no cross-account IAM trust, the Carolyn account provisions the Amplify certificate/distribution while account `658271954302` supplies only the exact certificate-validation and traffic CNAMEs for `carolyn.diloreto.com`. Exact `paul` and `carolyn` CloudFront aliases do not overlap, and neither project changes the other's records.

## Redacted Netlify archive

The complete redacted inventory is stored at [`netlify-inventory.redacted.json`](./netlify-inventory.redacted.json). It records:

- stale Next.js build settings (`yarn build`, `.next`) and Netlify plugins
- apex, `www`, and the stale `paul.diloreto.com` domain alias
- four authoritative Netlify apex/`www` records and no MX, TXT, or CAA records
- no build hooks or service integrations
- site-specific GitHub status/check hooks
- the last published production deploy and the latest failed production attempt, with identifiers redacted

The Netlify inventory is historical. On 2026-07-20, authenticated Netlify CLI 26.2.0 returned no projects or DNS zones for the account, and the former `pauldiloreto.netlify.app` URL returned 404. There was therefore no remaining site or zone for this migration to delete. Do not recreate those resources or remove account-wide integrations used by unrelated sites.
