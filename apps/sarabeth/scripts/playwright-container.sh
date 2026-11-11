#!/usr/bin/env bash
set -euo pipefail

# Build only deterministic providers, at execution time rather than in image cache.
bun run build:amplify:fixture
bun run prepare:amplify
bun run validate:amplify
bun run build:playwright:unchecked
"$@"
# Keep the SSR/API suite above; separately exercise the packaged Amplify fallback.
# Run last so the SSR runner cannot clear the static traces/report.
exec bun run test:static:prebuilt
