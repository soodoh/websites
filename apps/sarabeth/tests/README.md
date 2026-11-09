# Tests

The Playwright server uses the curated Contentful presentation scenario in
`tests/fixtures/contentful.ts` and the public playlist response fixture in
`tests/fixtures/youtube-playlist.json`. The scenario is deliberately not a copy
of the live Contentful space. Four reusable synthetic images cover wide,
landscape, square, and portrait rendering, and one synthetic audio file serves
the two recording scenarios.

The explicit Vite configuration aliases the production Contentful provider,
current-date module, and playlist-response boundary to deterministic test
implementations; canonical production builds exclude fixture code. The fixture
server itself serves `/api/youtube-playlist` without credentials, so Lighthouse
and API-request tests exercise the playlist without Playwright interception.
Browser contexts additionally intercept the playlist for loading/error tests,
Contentful media, YouTube thumbnails, and activated iframes, so the Playwright
suite never contacts Contentful, Google, or SSM. Lighthouse uses the fixed public
YouTube thumbnail URLs from the playlist fixture. Focused Vitest
contract tests run every Contentful fetcher against raw entry-shaped data to
cover the live Contentful boundary independently from visual presentation.

CMS-backed server functions use TanStack's static-function middleware. Their
build-time results are emitted as static assets, so client-side navigation does
not introduce a runtime Contentful dependency. The Playwright launcher gives
build and production-server children an allowlisted environment and binds to
loopback.

Run unit and contract tests locally with `bun run test:unit`. Run browser tests
in the same ARM64 Linux/Chromium environment used by CI:

```sh
RELEASE_COMMIT=$(git rev-parse HEAD) docker compose -f compose.playwright.yaml run --build --rm playwright
```

`bun run test:e2e` uses `--update-snapshots=none` and cannot create or update
baselines. After an intentional, reviewed UI change, the only recording command
is:

```sh
bash scripts/playwright-docker.sh bun run test:e2e:update
```

Change the curated scenario only when a test needs a new layout or behavior
case. Content edits in the live CMS must not be copied into this fixture. Visual
baselines should only be recorded in the container so host font and browser
differences do not enter screenshots.
