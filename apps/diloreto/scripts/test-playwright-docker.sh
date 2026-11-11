#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly repository_root
workspace_root="$(cd "${repository_root}/../.." && pwd)"
readonly workspace_root
# shellcheck disable=SC1091
source "${workspace_root}/scripts/playwright/docker-runner.sh"
image_name="$(playwright_docker_image "${workspace_root}" "websites-diloreto-playwright")"
readonly image_name
playwright_docker_init
cd "${repository_root}"
if [[ "${PLAYWRIGHT_SKIP_BUILD:-0}" != "1" ]]; then
	bun run build
	bun run check:output
fi

docker build --file "${repository_root}/Dockerfile.playwright" --tag "${image_name}" "${workspace_root}"
docker_args=(
	--init
	--ipc host
	--tmpfs "/tmp:rw,size=2g,mode=1777"
	--user "$(id -u):$(id -g)"
	--env CI=1
	--env HOME=/tmp/playwright-home
	--env PLAYWRIGHT_OUTPUT_ROOT=/work/apps/diloreto/.playwright-output
)
if [[ -n "${PLAYWRIGHT_BASE_URL:-}" ]]; then
	docker_args+=(--env "PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL}")
elif [[ ! -f dist/client/index.html ]]; then
	echo "Local Playwright tests require a built dist/client artifact" >&2
	exit 1
fi
container=$(docker create "${docker_args[@]}" "${image_name}" bun x --no-install playwright test "$@")
if [[ -z "${PLAYWRIGHT_BASE_URL:-}" ]]; then
	# Preserve invoking user's ownership for the existing non-root test runner.
	docker cp --archive "${repository_root}/dist/client/." "${container}:/work/apps/diloreto/dist/client"
fi
playwright_docker_run
playwright_copy_reports "${repository_root}" /work/apps/diloreto/.playwright-output playwright-report test-results
playwright_docker_finish "${repository_root}" "$@"
