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

## Initial minimums

Scores below are percentages; JSON stores them as fractions. Performance gets five points of measurement headroom below the weakest route's observed median, except Paul, which retains its existing 90-point floor. Other category minimums match the weakest observed route median without an automatic discount.

| Site | Routes | Performance mobile / desktop | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- | --- |
| Paul | `/` | 90 / 90 | 100 | 100 | 100 |
| DiLoreto | `/`, `/areyou` | 87 / 95 | 93 | 100 | 100 |
| Carolyn | `/`, `/projects`, `/photography` | 84 / 95 | 100 | 100 | 100 |
| Sarabeth | `/`, `/about`, `/media` | 95 / 95 | 100 | 96 | 100 |

Known baseline limitations are not fixes: DiLoreto lacks a main landmark and `/areyou` has contrast failures. Sarabeth's local `/media` reaches the unmocked `/api/youtube-playlist` endpoint, which returns 500 without production configuration and lowers best practices to 96. Its Playwright suite supplies a playlist route fixture; Lighthouse currently measures the credential-free fallback instead. Keep these findings visible and ratchet the corresponding minimums upward when they are addressed.

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
