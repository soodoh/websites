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
