# Websites

Four independent applications in one Bun 1.4.0 / Node 24.20.0 workspace, orchestrated
by Turborepo 2.10.12. **Local migration candidate — not a production cutover.**

```sh
# Select Node using .nvmrc and Bun using .bun-version first.
bun install --frozen-lockfile
bun run test:workspace
bun run lint
bun run typecheck
bun run verify:sarabeth        # or paul/carolyn/diloreto
bun run ci:verify              # complete gates, one app at a time
```

Complete verification requires Docker (ARM64 for Sarabeth/Carolyn visual baselines),
Go, uv/Python, ShellCheck, and local Chrome for Portfolio Lighthouse. All builds in
verification are fixture/static builds; no production credentials are required.
See [the migration handoff](docs/migration/01-history-and-turborepo-handoff.md) for
actual results, dependency changes, and incomplete acceptance gates.

`bun run dev` uses unique development ports, separate from canonical test ports:

| Current directory / verify alias | Unchanged package / filter name | Workspace dev port | Canonical test port |
| --- | --- | ---: | ---: |
| `apps/sarabeth` / `verify:sarabeth` | sarabeth-studio | 3100 | 3000 |
| `apps/paul` / `verify:paul` | portfolio-website | 3101 | 3000 |
| `apps/carolyn` / `verify:carolyn` | carolyn-portfolio | 3102 | 4000 (artifact contracts also use their own ports) |
| `apps/diloreto` / `verify:diloreto` | diloreto-website | 3103 | 4173 |

CMS-backed development needs development-only configuration. App-local `dev` scripts
retain original behavior/ports. Do not run canonical test servers simultaneously.

Carolyn infrastructure stays under `apps/carolyn/infra`; run
`bun run infra:typecheck`, `infra:test`, and `infra:synth` from the Carolyn app.
Synth is offline (`--no-lookups`). Existing diff/deploy commands are not migration
validation commands and must not be run without separate authorization.

Original histories are preserved through unsquashed subtree imports, except the
[explicitly authorized Portfolio redaction](docs/migration/portfolio-redaction-decision.md).
Source repositories still own all production deployments. No active root workflows
are installed; nested workflows are migration baselines only. **Do not publish this
repository's new history or start phase 2 without the required approval/acceptance.**

New Conventional Commits require one scope: `carolyn`, `paul`, `diloreto`, `sarabeth`,
`repo`, `ci`, or `deps` (for example `chore(repo): update workspace scripts`). Renovate
uses `deps`. The parent separately owns approved all-history message normalization,
including the published initial commit; this rename stage does not rewrite history.
Later publication of that normalized history needs separate non-fast-forward approval.

<!-- Temporary validation-only docs scope marker: 20260906-890d1b. Do not merge. -->
