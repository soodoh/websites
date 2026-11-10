# Shared Lighthouse checks

All four sites run the same Lighthouse policy from `scripts/lighthouse/`:

- Mobile and desktop, using Lighthouse's matching default presets and throttling.
- Three runs per URL/profile, with a median assertion for each category and URL.
- Blocking minimums for performance, accessibility, best practices, and SEO.
- The same root-pinned `@lhci/cli` and Playwright-pinned Chromium, including ARM64 support.
- Local builds only; no production URLs, CMS credentials, report-upload tokens, or public report storage.

`apps/<site>/lighthouse.json` owns only that site's representative routes and minimum category scores (0–1) for each profile. The shared policy validates these files and rejects missing categories, invalid scores, duplicate routes, and external URLs. Baselines are explicit minimums, not targets for automatic updates or permission to ignore individual accessibility failures.

## Local commands

From the repository root, using the pinned Bun and Node versions:

```sh
bun install --frozen-lockfile
bun run lighthouse:install
bun run lighthouse paul
bun run lighthouse diloreto
bun run lighthouse carolyn
bun run lighthouse sarabeth
```

Each command builds the site's output before auditing. Paul/DiLoreto use their static builds; Carolyn uses its production-shaped hermetic Amplify artifact; Sarabeth uses its production-mode deterministic fixture build. These are regression checks for the code and fixture content, not measurements of live CMS content, CDN behavior, or production Core Web Vitals.

To reuse an appropriate existing build, add `--prebuilt`. Every app's `ci:verify` chain does this after its existing build/browser verification. The root's `verify:<site>` and `ci:verify` commands therefore include Lighthouse; install Chromium before running them locally. `CHROME_PATH` can select a local browser for debugging, but CI uses the pinned Chromium by default.

Reports are written under `.lighthouseci/<site>/<mobile|desktop>/`: `reports/` contains browsable HTML/JSON and a manifest, while the nested `.lighthouseci/` contains raw runs and assertion results. Everything stays Git-ignored. GitHub retains the site-specific reports for seven days, even when baseline assertions fail. Both profiles run even if the first profile fails; collection or assertion errors fail the verification job.

Do not run audits concurrently on the same checkout. The runner requires free local ports (Paul/Sarabeth 3000, DiLoreto 4173, Carolyn 4100 plus its compute port 3000) and owns the temporary servers through Lighthouse's lifecycle.

## Current minimums

Scores below are percentages; JSON stores them as fractions. Performance minimums retain deliberate measurement headroom rather than requiring perfect scores. The initial calibration used five points below the weakest route's observed median, except Paul, which retains its existing 90-point floor. Other category minimums match the weakest observed route median without an automatic discount.

| Site     | Routes                           | Performance mobile / desktop | Accessibility | Best practices | SEO |
| -------- | -------------------------------- | ---------------------------- | ------------- | -------------- | --- |
| Paul     | `/`                              | 90 / 90                      | 100           | 100            | 100 |
| DiLoreto | `/`, `/areyou`                   | 87 / 95                      | 100           | 100            | 100 |
| Carolyn  | `/`, `/projects`, `/photography` | 95 / 95                      | 100           | 100            | 100 |
| Sarabeth | `/`, `/about`, `/media`          | 95 / 95                      | 100           | 100            | 100 |

The former accessibility and best-practices exceptions are resolved: DiLoreto has one shared main landmark and accessible text/button contrast, and Sarabeth's fixture build supplies a deterministic playlist response through a build-only server boundary. Its production endpoint still reports configuration/upstream failures, with separate contract and browser error-path coverage. DiLoreto accessibility and Sarabeth best practices are therefore ratcheted to 100 in both profiles.

Carolyn's SSR-stable masonry and self-hosted critical fonts produce 100 performance medians on all configured routes in both profiles, so its mobile performance floor is raised from 84 to 95. Its self-hosted fonts retain the hinted variants served to Linux Chromium to preserve the existing visual baselines.

The 2026-11-09 local follow-up reports show 100 accessibility, best practices, and SEO on every configured route/profile. Performance is 100 except DiLoreto `/areyou` mobile (92, with zero CLS after route-specific critical-font preloads) and Sarabeth `/media` desktop (98). The latter now measures the actual playlist and thumbnail loading rather than the previous API-error fallback; its performance is not directly comparable to the empty fallback. Aggregate scores do not replace review of individual accessibility diagnostics.

The subsequent shared image-pipeline follow-up raises DiLoreto `/areyou` mobile performance to 94 in local three-run medians, with LCP approximately 3.15 seconds (previously 3.38 seconds), zero CLS, and unchanged 100 non-performance scores. The map is now a pixel-preserving approximately 8 KB WebP rather than the former approximately 27 KB encoding. Initial sampled image transfers fall from approximately 236 KB to 152 KB through adaptive formats and responsive candidates. Other route/profile medians remain unchanged. See [responsive image delivery](images.md) for the shared local/Contentful policy and its tradeoffs.

## Application-loading follow-up

The next local follow-up compiles DiLoreto's repository-owned history and biography Markdown at build time, using the same ReactMarkdown renderer, HTML escaping, and safe-URL policy. Browser code receives only compiled markup, not the parser. `/areyou` mobile improves from 94 to 95, with median LCP falling from approximately 3.15 to 3.00 seconds and zero CLS. Sampled initial JavaScript transfers fall from approximately 187 KB to 152 KB; desktop performance remains 100. Existing Linux visual baselines are unchanged.

Sarabeth `/media` now preloads its same-origin playlist request, preconnects to the thumbnail origin, and prioritizes only the featured thumbnail. Browser coverage verifies that the preload is reused rather than producing a duplicate API request, while preserving loading, unavailable, retry, and explicit-playback behavior. Playlist buttons derive their accessible names from their visible duration, number, title, and selection text, with a visually hidden action prefix contained inside the thumbnail. The zero-weight `label-content-name-mismatch` diagnostic, which previously failed, now passes in every mobile and desktop run. Performance remains 100 mobile and 98 desktop, so these hints are not claimed as a category-score improvement.

A prerendered playlist snapshot is deliberately deferred: the current build role can read the Contentful parameter, not the runtime YouTube secret. The thumbnail still depends on hydrated playlist rendering; removing that dependency needs a separately designed public-snapshot boundary rather than silently expanding secret access. Paul and Carolyn remain unchanged. A trial Carolyn mobile-navigation split saved only approximately 3 KiB without a score improvement and was not retained.

## Updating baselines

Collect without enforcing the current minimums:

```sh
bun run lighthouse carolyn --collect-only
# Or reuse its existing hermetic build:
bun run lighthouse carolyn --prebuilt --collect-only
```

Review the HTML reports and category medians **for every configured route**, separately for mobile and desktop. Set each category minimum no higher than its weakest route's stable median. Keep a deliberate performance margin for runner noise; do not apply a blanket discount to deterministic accessibility/SEO audits. Never lower a baseline automatically after a failing run. Record the reason for intentional decreases in the reviewed change, and ratchet minimums upward as issues are fixed.

Initial measurements use local macOS ARM64. GitHub uses ARM64 for Carolyn/Sarabeth and x86-64 for Paul/DiLoreto; inspect the first Linux CI reports to confirm performance calibration rather than silently weakening gates. Paul's previous performance floor of 0.90 and perfect non-performance minimums are retained.

## Workflow structure

`.github/workflows/_site-ci.yml` replaces the four site-specific reusable CI wrappers. PR CI calls it four times and preserves the existing `CI gate`. All four deployment workflows call the same verifier; Paul/DiLoreto additionally request static artifact packaging in that same verification job. The four explicit deployment workflows remain separate because their native path filters, production environments, concurrency groups, and hosting mechanisms are meaningful differences.

Lighthouse policy/baseline changes alone do not select production deployments; PR CI still checks them. Updating checks does not require changing GitHub settings or contacting production.
