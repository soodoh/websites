# Playwright testing

All four websites use the shared `@websites/playwright-support` workspace for
browser policy while keeping site behavior local.

## Commands

Each app exposes the same interface:

- `bun run test:browser`: canonical browser suite against production-shaped output.
- `bun run test:browser:update`: rebuild and update reviewed snapshots in Docker.
- `bun run test:browser:local`: local debugging only; never use it to record baselines.

Normal browser commands pass `--update-snapshots=none`. Baselines are recorded
only in the pinned Playwright Docker image.

## Layout

```text
tests/
  browser/
    shared/       # desktop and mobile behavior
    desktop/      # desktop-only behavior
    mobile/       # mobile/touch-only behavior
  visual/         # *.visual.spec.ts screenshot coverage
  support/        # app fixture and domain helpers
  fixtures/       # deterministic test data
```

Use `@desktop-only` or `@mobile-only` only for an exceptional test that belongs
in an otherwise shared spec. Functional tests do not take screenshots. Visual
tests assert readiness and key semantics before capturing a baseline.

## Shared policy

`@websites/playwright-support/config` owns the desktop/mobile viewports,
reporters, traces, retry and flaky-test policy, screenshot tolerance, output
paths, and snapshot naming. App configurations provide only their server,
artifact mode, and intentional overrides.

Every normal spec imports the app's fixture. The app fixture extends
`@websites/playwright-support/test`, which fails on unexpected console errors,
uncaught page errors, failed same-origin critical resources, and critical HTTP
errors. Tests that intentionally exercise an error must allow that exact error
through the `diagnostics` fixture.

The shared visual module contains only stable browser primitives. CMS routing,
authentication, galleries, filters, route inventories, and content assertions
remain app-local.

## Snapshot publication

The four Docker runners retain their own builds, architecture requirements,
artifact modes, and verification checks. They source `scripts/playwright/docker-runner.sh`
for lock-derived image names, owned-container cleanup, exit-status propagation,
report copying, and success-only snapshot publication. Sarabeth verifies the actual
successful container's release marker before calling the shared finish function.

The shared command publishes only for an explicit snapshot-update argument. It
copies snapshots into a private staging directory, requires at least one PNG,
and replaces the reviewed baseline directory with recovery on replacement failure.
Copy/validation failures leave the previous baselines intact; staging is cleaned
on exit. If restoring the previous baselines also fails, the command retains the
recovery copy and reports its location instead of deleting it. Normal verification
with `--update-snapshots=none` never publishes snapshots.

## Local server adapters

Paul and Sarabeth use `@websites/static-site/preview` for packaged static files,
clean-path aliases, GET/HEAD responses, and genuine interactive 404 documents.
It never serves an SPA fallback or invokes compute. Carolyn reuses its safe file
resolution while retaining manifest-directed compute proxying. DiLoreto keeps
its existing `serve` CLI. Do not replace these with a generic preview command
without preserving the app's status, alias, and method contracts.

Carolyn's `test:dev-smoke` uses Playwright `webServer` lifecycle management and a
deterministic fixture provider. Its occupied-compute-port regression lives in
`tests/integration/` and runs in the separate `carolyn-artifact` Vitest project
after a fixture or production-shaped build; ordinary unit tests need no artifact.
Sarabeth's SSR launcher retains an environment allowlist and disables `.env` loading.

## Coverage expectations

For applicable routes and states, cover:

1. HTTP status, core content, hydration, and client navigation.
2. Desktop and mobile layouts and interactions.
3. Keyboard operation, focus restoration, and accessible naming.
4. Reduced-motion behavior.
5. Loading, failure, retry, and stale or out-of-order responses.
6. Critical image and media loading behavior.
7. Production artifact and custom not-found behavior.
8. Desktop/mobile visual baselines for each unique page template and important
   interactive state.

Prefer named semantic states over arbitrary screenshot intervals. Repeated
content should use representative templates rather than one baseline per item.
