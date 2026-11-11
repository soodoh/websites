#!/usr/bin/env bash

set -euo pipefail

app_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly app_root
workspace_root="$(cd "${app_root}/../.." && pwd)"
readonly workspace_root
# shellcheck disable=SC1091
source "${workspace_root}/scripts/playwright/docker-runner.sh"
image="$(playwright_docker_image "${workspace_root}" "websites-portfolio-playwright")"
readonly image
cd "${app_root}"
playwright_docker_init

docker build --file "${app_root}/Dockerfile.playwright" --tag "${image}" "${workspace_root}"

docker_arguments=(--ipc=host)
if [[ "${PLAYWRIGHT_STATIC:-}" == "1" ]]; then
	if [[ ! -f dist/client/index.html || ! -f dist/client/404.html ]]; then
		echo "Static Playwright mode requires a completed bun run build." >&2
		exit 1
	fi
fi

for variable in PLAYWRIGHT_BASE_URL PLAYWRIGHT_STATIC; do
	if [[ -n "${!variable:-}" ]]; then
		docker_arguments+=(--env "${variable}=${!variable}")
	fi
done

container=$(
	docker create "${docker_arguments[@]}" "${image}" bun run test:e2e:container "$@"
)
if [[ "${PLAYWRIGHT_STATIC:-}" == "1" ]]; then
	docker cp "${app_root}/dist/client/." "${container}:/work/apps/paul/dist/client"
fi

playwright_docker_run

playwright_copy_reports "${app_root}" /work/apps/paul test-results playwright-report
playwright_docker_finish "${app_root}" "$@"
