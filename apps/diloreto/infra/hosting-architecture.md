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
| Custom 404 body with a real 404 status | Final catch-all custom rule `/<*> → /404.html` with Amplify's `404-200` **404 rewrite** status. File-like and slash-terminated missing paths return the custom body directly with HTTP 404. Amplify first canonicalizes an extensionless missing path to its trailing-slash form with a `301`; the canonical URL then returns the custom HTTP 404. This native behavior was explicitly accepted after candidate validation. |
| `/areyou` and `/areyou/` | The static artifact contains identical `/areyou.html` and `/areyou/index.html` documents. Amplify serves the first for `/areyou` without changing the address and the second for `/areyou/`. The build creates the same pair for every directory-index route. |
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

- [Redirect and rewrite examples](https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html): domain-only redirect paths are appended automatically, an extensionless URL serves its matching `.html` file without changing the address, and all query parameters are forwarded for ordinary `301`/`302` redirects. Amplify redirects to a trailing slash when only a directory `index.html` exists, so the DiLoreto build emits both file forms. The documentation's `404` redirect example does not preserve the URL/body contract required here.
- [Redirect semantics and ordering](https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html): `301` is permanent, `404` is the not-found response, rules are ordered, and the query-forwarding exceptions apply only to query-specific sources or targets containing a query.
- [Amplify `CustomRule` API](https://docs.aws.amazon.com/amplify/latest/APIReference/API_CustomRule.html): `404` and `404-200` are distinct supported statuses; AWS identifies `404-200` as the 404 rewrite. The [Amplify Hosting issue that introduced the behavior](https://github.com/aws-amplify/amplify-hosting/issues/70) confirms that `404-200` with `/404.html` returns the custom page with status 404 instead of redirecting to the error document. A Legacy-phase production smoke demonstrated that status `404` instead emits a `302 Location: /404.html`, so DiLoreto uses `404-200`.
- [Custom headers](https://docs.aws.amazon.com/amplify/latest/userguide/setting-custom-headers.html): headers can be set for all responses; Amplify honors origin/custom cache control; and custom cache control is applied only to successful `200` responses so error responses are not cached for other users.
- [`AWS::Amplify::Domain`](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-amplify-domain.html): CloudFormation owns the custom-domain association, its subdomain settings, and managed-certificate lifecycle. For Route 53 domains, Amplify handles the DNS records.
- [Route 53 custom domains](https://docs.aws.amazon.com/amplify/latest/userguide/to-add-a-custom-domain-managed-by-amazon-route-53.html) and [subdomain management](https://docs.aws.amazon.com/amplify/latest/userguide/to-manage-subdomains.html): Amplify can associate the apex and selected subdomains and supports subdomain-only candidate setups.
- [Managed certificates](https://docs.aws.amazon.com/amplify/latest/userguide/using-certificates.html): Amplify-managed certificates cover connected domains, use HTTPS/2, and renew automatically while DNS validation remains intact.

## Offline and deployment checks

`infra/hosting-contract.test.ts` parses the template and guards the final-state contract:

- native domain prefixes and absence of custom edge, certificate, hosted-zone, and record-set resources;
- exact `404-200` rewrite fallback and custom body artifact;
- identical `.html` and directory-index artifacts for both clean-path forms;
- domain-only permanent redirect rules that permit documented path/query forwarding;
- immutable caching only for fingerprinted assets;
- no-store caching for HTML, public non-fingerprinted files, and the release marker;
- security headers; and
- continued use of the shared static uploader and post-deploy release verification.

The local Playwright smoke verifies real static-server behavior for `/`, `/areyou`, `/areyou/`, extensionless missing paths, file-like missing paths, custom 404 body/status, and absence of 404 hydration JavaScript. `scripts/hosting-smoke.mjs` is the candidate/production HTTP check for cache headers, security headers, domain redirects, and the deployed commit marker. It accepts the retained edge's direct extensionless custom `404`; when Amplify's accepted `301` canonicalization is observed, it validates both the canonical location and final custom `404`.

## Candidate validation result

The approved `Candidate` phase was applied on 2026-09-20 without moving production traffic. `candidate.diloreto.com` became `AVAILABLE` and mapped only to the existing `main` branch. Live checks established:

- `/areyou`, `/areyou/`, `/familytree`, and `/familytree/` return `200` without redirects because the artifact contains both clean-URL file forms;
- a file-like missing path returns the hydration-free custom body directly with `404`;
- an extensionless missing path returns `301 Location: <same-path>/`, then the slash-terminated path returns the hydration-free custom body with `404`;
- security headers are present on both the canonicalization response and custom 404; and
- the existing CloudFront production path remains unchanged and passes the full production smoke.

The extensionless `301 → 404` sequence is Amplify's documented clean-URL behavior and was explicitly accepted after this candidate probe. Separate approvals subsequently advanced the stack through `AliasRelease` and `Native`.

## Native cutover result

The approved production cutover completed on 2026-09-20 with the stack at `UPDATE_COMPLETE` and `MigrationPhase=Native`:

- the reviewed `AliasRelease` change set removed only the three CloudFront aliases and five stack-owned production DNS records;
- the old distribution, function, cache policy, and ACM certificate remain available without aliases for rollback;
- the reviewed `Native` change set performed one non-replacement update to `AmplifyDomain`, replacing the candidate prefix with apex and adding `www` and `paul`;
- Amplify reports the domain association as `AVAILABLE` with `UPDATE_COMPLETE`, and its service-managed Route 53 records resolve apex, `www`, and `paul` to the native distribution;
- production root, both clean-path forms, both custom-404 forms, cache/security headers, domain redirects with paths and queries, assets, and release commit `a389668b62238f900661ba768b0b547ed306053f` pass the HTTP smoke; and
- the production Playwright deployment smoke passes for `/` and `/areyou`.

The transition resources remained available at `Native` until the separately approved final cleanup.

## Final cleanup result

The owner explicitly approved skipping the soak and performing final cleanup on 2026-09-20. The reviewed final-state change set:

- retained `AmplifyApp`, `AmplifyBranch`, `AmplifyDomain`, `GitHubDeploymentRole`, and `GitHubOidcProvider` with no replacements;
- changed only the Amplify app description; and
- deleted exactly `EdgeDistribution`, `EdgeRequestFunction`, `EdgeCachePolicy`, and `EdgeCertificate`.

The stack completed successfully using `amplify-hosting.yml` with `EnableAmplifyDomain=true`. Direct AWS reads confirm the four edge resources no longer exist and the stack contains only the five expected Amplify/IAM resources. Production HTTP smoke still passes, and the obsolete GitHub Environment variable `AMPLIFY_URL` was deleted while all six workflow variables were retained.

## Completed approval-gated migration

The migration followed the procedure below. It remains as audit and rollback context; do **not** apply the final-state template directly to any legacy stack because that would combine alias release, DNS replacement, certificate replacement, and edge deletion in one unverified operation.

`amplify-hosting-transition.yml` retained every legacy logical ID and provided the explicit four-phase state machine. Each phase advanced through a separately reviewed, approval-gated change set without creating a second stack or IaC owner.

1. **Inventory and change-set gate.** With approval, record the current stack parameters, outputs, CloudFront distribution configuration, certificate ARN/status, Amplify app/branch IDs, domain associations, Route 53 records, and current release marker. Create change sets only; do not execute until each resource replacement/deletion is understood.
2. **`Legacy` — behavior preparation.** Deploy the transition template with its default `MigrationPhase=Legacy`. This keeps the production aliases and stack-owned DNS records on CloudFront, does not create `AmplifyDomain`, and applies the final Amplify rules and headers. Deploy a normal static release and verify the default Amplify branch URL for root, clean paths, both 404 forms, cache/security headers, and the release marker.
3. **`Candidate` — native validation.** In a separately approved update, set `MigrationPhase=Candidate`. This creates the same logical `AmplifyDomain` used by the final template, but maps only `candidate.diloreto.com`; CloudFront continues to own apex, `www`, and `paul`. Wait for `UPDATE_COMPLETE`, then run `HOSTING_BASE_URL=https://candidate.diloreto.com HOSTING_EXPECT_AMPLIFY=1 HOSTING_EXPECT_COMMIT=<commit> node apps/diloreto/scripts/hosting-smoke.mjs`.
4. **`AliasRelease` — cutover gate.** Schedule a rollback window and set `MigrationPhase=AliasRelease` in a separate approved update. This removes the production aliases from the old distribution and deletes only the stack-owned apex/`www`/`paul` records. It retains the distribution, function, cache policy, certificate, and candidate association. Confirm completion before proceeding. A short interruption is possible while the globally unique CloudFront aliases are released.
5. **`Native` — production association.** In another approved update, set `MigrationPhase=Native`. This updates `AmplifyDomain` from candidate-only to apex, `www`, and `paul`; the old edge resources remain available without aliases. Wait for the Amplify domain and update statuses to complete and for all three DNS answers and certificates to converge.
6. **Production validation.** Run `scripts/hosting-smoke.mjs` with `HOSTING_BASE_URL=https://diloreto.com`, `HOSTING_EXPECT_AMPLIFY=1`, `HOSTING_EXPECT_DOMAIN_REDIRECTS=1`, and the expected release commit. Also run the Playwright deployment smoke against production. Validate `/`, both `/areyou` forms, both 404 forms, redirect paths/queries, headers, assets, and release identity.
7. **Soak and cleanup gate.** Keep the transition template at `Native` for an agreed soak unless the owner explicitly approves skipping it. Only after explicit approval, create a change set using final-state `amplify-hosting.yml` with `EnableAmplifyDomain=true`. The `AmplifyDomain`, app, branch, and IAM logical IDs remain stable; the change set should delete only the unused edge resources and obsolete outputs/parameters. Execute only after confirming it will not replace the native domain or delete Amplify-managed DNS records.

## Rollback

Before final cleanup, rollback uses the retained transition resources:

1. Stop further updates and capture the failed domain status and DNS answers.
2. If the stack reached `Native`, update it back to `AliasRelease` and wait until Amplify releases apex, `www`, and `paul`. Do not skip this release phase.
3. Update from `AliasRelease` to `Candidate`. This restores the old CloudFront aliases and stack-owned production DNS records while leaving the validated candidate association available.
4. If candidate behavior itself is defective, update from `Candidate` to `Legacy` to remove `AmplifyDomain` after production is confirmed restored.
5. Verify the release marker, redirects, clean paths, 404 status/body, headers, and assets through the restored public path.

After final cleanup, rollback is slower: apply the transition template at `AliasRelease` to recreate the old edge resources without competing for aliases, move the native association away from production, and only then advance back to `Candidate` to restore CloudFront aliases and records. Review replacement resources and certificate readiness in change sets before every execution. Never let Amplify and CloudFront own the same aliases concurrently.

## Remaining live-validation uncertainties

The candidate and production checks resolved the routing, certificate, DNS, redirect, cache, and security-header questions. Residual operational risks are:

- the Amplify API's three per-subdomain `verified` fields remained `false` even though the association and update report complete, service-managed DNS is present, TLS succeeds, and all production checks pass;
- sustained behavior and managed-certificate renewal require normal production monitoring because the owner explicitly skipped the planned soak; and
- the slower post-cleanup rollback path has been designed but not exercised in production.
