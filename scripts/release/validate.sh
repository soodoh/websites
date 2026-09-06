#!/usr/bin/env bash
set -euo pipefail
site=${1:?site required}
checkout=${2:?independent selected checkout required}
harness=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$checkout"
test "$(bun --version)" = 1.4.0
test "$(node --version)" = v24.20.0
# Root-only install already completed in an unprivileged validation job.
case "$site" in
  paul)
    cd apps/paul
    bun run lint && bun run lint:workflows && bun run typecheck && bun run lint:shell && bun run infra:lint
    bun run build
    python3 "$harness/scripts/release/artifact.py" marker paul "$checkout"
    bun run test:static && bun run test:e2e:static:prebuilt && bun run lighthouse
    ;;
  diloreto)
    cd apps/diloreto
    bun run lint && bun run typecheck && bun run test:genealogy && bun run infra:lint && bun run build
    python3 "$harness/scripts/release/artifact.py" marker diloreto "$checkout"
    bun run check:output && PLAYWRIGHT_SKIP_BUILD=1 bun run test:playwright
    ;;
  carolyn|sarabeth)
    # These outputs are fixtures only. Production uses separate repository builds.
    bun run "verify:$site"
    ;;
  *) echo 'Unknown site' >&2; exit 2 ;;
esac
if [[ "$site" = paul || "$site" = diloreto ]]; then
  python3 "$harness/scripts/release/artifact.py" package "$site" "$checkout" "$harness/release-output/$site"
fi
