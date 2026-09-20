# DiLoreto native Amplify hosting decision

## Decision

Use native AWS Amplify Hosting for the final DiLoreto delivery path:

```text
Route 53 → Amplify domain association → Amplify WEB app/main branch
```

The custom CloudFront distribution is not required for the final architecture. The final-state CloudFormation template keeps the existing Amplify app, branch, GitHub OIDC role, and manual static deployment path; adds an `AWS::Amplify::Domain`; and removes the custom CloudFront distribution, function, cache policy, certificate, and stack-owned alias records.

This conclusion is based on AWS's documented behavior and the offline contract tests. It is **not** authorization to deploy the template. Candidate-domain checks and an approval-gated staged migration are still required.

## Responsibility mapping

| Existing responsibility | Native Amplify replacement |
| --- | --- |
| Custom 404 body with a real 404 status | Final catch-all custom rule `/<*> → /404.html` with status `404`. This intentionally does not use `404-200`. |
| `/areyou` and `/areyou/` | Amplify clean URLs serve `/areyou/index.html` for both forms without changing the address bar. |
| `www.diloreto.com` redirect | Domain-only `301` rule to `https://diloreto.com`. Amplify appends the original path. |
| `paul.diloreto.com` redirect | Domain-only `301` rule to `https://pauldiloreto.com`. Amplify appends the original path. |
| Redirect query strings | Amplify forwards all query parameters for `301` and `302` rules when the source does not match a specific query and the target has no query. Both DiLoreto rules meet those conditions. |
| Asset and document caching | Amplify custom headers make `/assets/*` immutable for one year and make HTML, public non-fingerprinted files, and `release.json` non-storing and revalidating. AWS states that custom `Cache-Control` applies only to successful `200` responses, preventing a shared cached error response. |
| Security headers | Amplify custom headers apply HSTS, `nosniff`, frame denial, referrer policy, and permissions policy to `**`. |
| TLS | Amplify provisions and renews its managed certificate for the associated apex and subdomains. |
| Route 53 aliases | The `AWS::Amplify::Domain` association manages only the apex, `www`, and `paul` mappings listed in `SubDomainSettings`; the hosted zone and unrelated records are not declared or replaced by the final template. |
| Static releases | `.github/workflows/deploy-diloreto.yml` still packages `dist/client` and calls the shared `scripts/deploy/amplify-static.sh` uploader. The post-deploy smoke verifies the release marker and hosting contract through the public domain. |

## Evidence

AWS documents the relevant native behavior:

- [Redirect and rewrite examples](https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html): a `404` rule serves a custom not-found page; domain-only redirect paths are appended automatically; clean URLs serve a directory's `index.html`; and all query parameters are forwarded for ordinary `301`/`302` redirects.
- [Redirect semantics and ordering](https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html): `301` is permanent, `404` is the not-found response, rules are ordered, and the query-forwarding exceptions apply only to query-specific sources or targets containing a query.
- [Amplify `CustomRule` API](https://docs.aws.amazon.com/amplify/latest/APIReference/API_CustomRule.html): `404` and `404-200` are distinct supported statuses. DiLoreto uses `404` to retain the actual status.
- [Custom headers](https://docs.aws.amazon.com/amplify/latest/userguide/setting-custom-headers.html): headers can be set for all responses; Amplify honors origin/custom cache control; and custom cache control is applied only to successful `200` responses so error responses are not cached for other users.
- [`AWS::Amplify::Domain`](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-amplify-domain.html): CloudFormation owns the custom-domain association, its subdomain settings, and managed-certificate lifecycle. For Route 53 domains, Amplify handles the DNS records.
- [Route 53 custom domains](https://docs.aws.amazon.com/amplify/latest/userguide/to-add-a-custom-domain-managed-by-amazon-route-53.html) and [subdomain management](https://docs.aws.amazon.com/amplify/latest/userguide/to-manage-subdomains.html): Amplify can associate the apex and selected subdomains and supports subdomain-only candidate setups.
- [Managed certificates](https://docs.aws.amazon.com/amplify/latest/userguide/using-certificates.html): Amplify-managed certificates cover connected domains, use HTTPS/2, and renew automatically while DNS validation remains intact.

## Offline and deployment checks

`infra/hosting-contract.test.ts` parses the template and guards the final-state contract:

- native domain prefixes and absence of custom edge, certificate, hosted-zone, and record-set resources;
- exact `404` fallback status and custom body artifact;
- both clean-path forms;
- domain-only permanent redirect rules that permit documented path/query forwarding;
- immutable caching only for fingerprinted assets;
- no-store caching for HTML, public non-fingerprinted files, and the release marker;
- security headers; and
- continued use of the shared static uploader and post-deploy release verification.

The local Playwright smoke verifies real static-server behavior for `/`, `/areyou`, `/areyou/`, extensionless missing paths, file-like missing paths, custom 404 body/status, and absence of 404 hydration JavaScript. `scripts/hosting-smoke.mjs` is the candidate/production HTTP check for cache headers, security headers, redirects, and the deployed commit marker.

## Approval-gated migration

Do **not** apply the final-state template directly to the current stack. CloudFront alternate-domain names must be released before Amplify can claim them, and the current Route 53 alias records are stack-owned resources. A direct update would combine alias release, DNS replacement, certificate replacement, and edge deletion in one unverified operation.

Use `amplify-hosting-transition.yml` with the existing stack. It retains every legacy logical ID and adds an explicit four-phase state machine. Advance exactly one phase per reviewed, approval-gated change set; do not create a second stack or IaC owner.

1. **Inventory and change-set gate.** With approval, record the current stack parameters, outputs, CloudFront distribution configuration, certificate ARN/status, Amplify app/branch IDs, domain associations, Route 53 records, and current release marker. Create change sets only; do not execute until each resource replacement/deletion is understood.
2. **`Legacy` — behavior preparation.** Deploy the transition template with its default `MigrationPhase=Legacy`. This keeps the production aliases and stack-owned DNS records on CloudFront, does not create `AmplifyDomain`, and applies the final Amplify rules and headers. Deploy a normal static release and verify the default Amplify branch URL for root, clean paths, both 404 forms, cache/security headers, and the release marker.
3. **`Candidate` — native validation.** In a separately approved update, set `MigrationPhase=Candidate`. This creates the same logical `AmplifyDomain` used by the final template, but maps only `candidate.diloreto.com`; CloudFront continues to own apex, `www`, and `paul`. Wait for `UPDATE_COMPLETE`, then run `HOSTING_BASE_URL=https://candidate.diloreto.com HOSTING_EXPECT_AMPLIFY=1 HOSTING_EXPECT_COMMIT=<commit> node apps/diloreto/scripts/hosting-smoke.mjs`.
4. **`AliasRelease` — cutover gate.** Schedule a rollback window and set `MigrationPhase=AliasRelease` in a separate approved update. This removes the production aliases from the old distribution and deletes only the stack-owned apex/`www`/`paul` records. It retains the distribution, function, cache policy, certificate, and candidate association. Confirm completion before proceeding. A short interruption is possible while the globally unique CloudFront aliases are released.
5. **`Native` — production association.** In another approved update, set `MigrationPhase=Native`. This updates `AmplifyDomain` from candidate-only to apex, `www`, and `paul`; the old edge resources remain available without aliases. Wait for the Amplify domain and update statuses to complete and for all three DNS answers and certificates to converge.
6. **Production validation.** Run `scripts/hosting-smoke.mjs` with `HOSTING_BASE_URL=https://diloreto.com`, `HOSTING_EXPECT_AMPLIFY=1`, `HOSTING_EXPECT_DOMAIN_REDIRECTS=1`, and the expected release commit. Also run the Playwright deployment smoke against production. Validate `/`, both `/areyou` forms, both 404 forms, redirect paths/queries, headers, assets, and release identity.
7. **Soak and cleanup gate.** Keep the transition template at `Native` for an agreed soak. Only after explicit approval, create a change set using final-state `amplify-hosting.yml` with `EnableAmplifyDomain=true`. The `AmplifyDomain`, app, branch, and IAM logical IDs remain stable; the change set should delete only the unused edge resources and obsolete outputs/parameters. Execute only after confirming it will not replace the native domain or delete Amplify-managed DNS records.

## Rollback

Before final cleanup, rollback uses the retained transition resources:

1. Stop further updates and capture the failed domain status and DNS answers.
2. If the stack reached `Native`, update it back to `AliasRelease` and wait until Amplify releases apex, `www`, and `paul`. Do not skip this release phase.
3. Update from `AliasRelease` to `Candidate`. This restores the old CloudFront aliases and stack-owned production DNS records while leaving the validated candidate association available.
4. If candidate behavior itself is defective, update from `Candidate` to `Legacy` to remove `AmplifyDomain` after production is confirmed restored.
5. Verify the release marker, redirects, clean paths, 404 status/body, headers, and assets through the restored public path.

After final cleanup, rollback is slower: apply the transition template at `AliasRelease` to recreate the old edge resources without competing for aliases, move the native association away from production, and only then advance back to `Candidate` to restore CloudFront aliases and records. Review replacement resources and certificate readiness in change sets before every execution. Never let Amplify and CloudFront own the same aliases concurrently.

## Remaining live-validation uncertainties

The documented behavior is sufficient for the final design, but these service-level facts still require the candidate and cutover checks above:

- actual header composition on rewritten 404 responses (AWS explicitly excludes custom `Cache-Control` from non-200 responses, but security headers must be observed);
- exact DNS record transitions performed by `AWS::Amplify::Domain` in this existing Route 53 zone;
- time required for the old CloudFront aliases to become claimable by Amplify;
- managed-certificate issuance for apex, `www`, and `paul` in this account/region;
- exact production `Location` values for both domain redirects, including query preservation; and
- whether any unrecorded production-only header or TLS behavior exists outside the checked contract.
