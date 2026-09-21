# DiLoreto native Amplify hosting decision

## Decision

Use native AWS Amplify Hosting for the DiLoreto delivery path:

```text
Route 53 → Amplify domain association → Amplify WEB app/main branch
```

`infra/opentofu/` is the sole active AWS definition. It owns the Amplify app, branch, native domain association, deployment role, and alarm. The retired custom CloudFront distribution and CloudFormation transition templates are gone.

## Responsibility mapping

| Responsibility | Native Amplify implementation |
| --- | --- |
| Custom 404 body with HTTP 404 | Final catch-all `/<*> → /404.html` rule with Amplify's `404-200` rewrite status. |
| `/areyou` and `/areyou/` | The static artifact emits matching `.html` and directory-index documents. |
| `www.diloreto.com` | Domain-only `301` to `https://diloreto.com`; Amplify appends the original path. |
| `paul.diloreto.com` | Domain-only `301` to `https://pauldiloreto.com`; Amplify appends the original path. |
| Caching | `/assets/*` is immutable for one year; HTML, public non-fingerprinted files, and `/__deployment.json` are non-storing and revalidating. |
| Security headers | Amplify applies HSTS, `nosniff`, frame denial, referrer policy, and permissions policy to all responses. |
| TLS and DNS | Amplify provisions the managed certificate and the domain association's apex, `www`, and `paul` mappings. |
| Static releases | `.github/workflows/deploy-diloreto.yml` packages `dist/client`, invokes `scripts/deploy/amplify-static.sh`, and verifies the public release marker and hosting contract. |

## Evidence

AWS documents the relevant behavior:

- [Redirect and rewrite examples](https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html)
- [Redirect semantics and ordering](https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html)
- [Amplify `CustomRule` API](https://docs.aws.amazon.com/amplify/latest/APIReference/API_CustomRule.html)
- [Custom headers](https://docs.aws.amazon.com/amplify/latest/userguide/setting-custom-headers.html)
- [Route 53 custom domains](https://docs.aws.amazon.com/amplify/latest/userguide/to-add-a-custom-domain-managed-by-amazon-route-53.html)
- [Managed certificates](https://docs.aws.amazon.com/amplify/latest/userguide/using-certificates.html)

`infra/hosting-contract.test.ts` checks the OpenTofu definition, canonical custom-header document, static artifact behavior, deployment workflow, and production smoke contract. Playwright verifies both clean-path forms and the hydration-free custom 404. `scripts/hosting-smoke.mjs` checks cache/security headers, domain redirects, and the deployed commit marker.

## Completed transition

The approval-gated transition completed on 2026-09-20:

1. A candidate Amplify subdomain proved clean paths, custom 404 behavior, headers, and the existing branch without moving production traffic.
2. CloudFront released the production aliases and stack-owned DNS records.
3. The native Amplify association adopted apex, `www`, and `paul`.
4. Production smoke verified redirects, cache/security headers, assets, and the exact release marker.
5. The obsolete CloudFront distribution, function, cache policy, and ACM certificate were deleted.
6. The final resources were imported into OpenTofu without changing physical IDs, CloudFormation relinquished ownership, and the empty stack was deleted.

Amplify canonicalizes an extensionless missing path with `301` to its trailing-slash form before returning the custom HTTP 404. This documented behavior was explicitly accepted after the candidate probe.

## Recovery

Rollback is source- and OpenTofu-driven. Revert or fix the application/configuration on `main`, review the OpenTofu plan when infrastructure changes are required, and deploy through the normal workflow. Reintroducing the former CloudFront architecture would be a new reviewed migration, not a legacy stack update. It must use new configuration and imports without allowing Amplify and CloudFront to own the same aliases concurrently.

Monitor Amplify domain status, production smoke checks, alarms, and managed-certificate renewal as normal operations. The Amplify API may continue to report per-subdomain `verified=false` even when the association is available, service-managed DNS is present, TLS succeeds, and public checks pass.
