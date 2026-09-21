# Carolyn Contentful deployment webhook

OpenTofu owns the Contentful webhook that dispatches the Carolyn GitHub Actions deployment workflow. The separate AWS OpenTofu root owns Amplify Hosting and this root's encrypted S3 state bucket.

The webhook listens only for entry/asset publish and unpublish events in the `master` Contentful environment. GitHub Actions verifies `main`, assumes the production AWS role with OIDC, starts an exact-SHA Amplify release, waits for it, and smoke-tests production.

Production applies run through `.github/workflows/configure-contentful-carolyn.yml`. The `production-carolyn` GitHub Environment supplies:

- variable `CONTENTFUL_SPACE_ID`
- secret `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN`
- secret `CONTENTFUL_GITHUB_ACTIONS_TOKEN`

The GitHub token must be a repository-scoped fine-grained token with only **Actions: write** permission. The provider keeps that secret webhook header in OpenTofu state, so state access is production-secret access. The Contentful Management API token is supplied through the environment and is not configured as a resource value.
