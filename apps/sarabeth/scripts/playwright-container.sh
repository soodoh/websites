#!/usr/bin/env bash
set -euo pipefail

# Build only deterministic providers, at execution time rather than in image cache.
bun run build:amplify:fixture
bun run prepare:amplify
bun run validate:amplify
bun run build:playwright:unchecked
exec "$@"
