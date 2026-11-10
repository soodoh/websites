#!/usr/bin/env bash

set -euo pipefail

app_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly app_root
workspace_root="$(cd "${app_root}/../.." && pwd)"
readonly workspace_root
lock_hash="$(shasum -a 256 "${workspace_root}/bun.lock" | cut -c1-16)"
readonly lock_hash
readonly image="websites-portfolio-playwright:lock-${lock_hash}"
cd "${app_root}"
container=""

cleanup() {
	if [[ -n "${container}" ]]; then
		docker rm --force "${container}" >/dev/null 2>&1 || true
	fi
}

copy_artifacts() {
	rm -rf test-results playwright-report
	docker cp "${container}:/work/apps/paul/test-results" test-results >/dev/null 2>&1 || true
	docker cp "${container}:/work/apps/paul/playwright-report" playwright-report >/dev/null 2>&1 || true
}

trap cleanup EXIT

docker build --file "${app_root}/Dockerfile.playwright" --tag "${image}" "${workspace_root}"

docker_arguments=(--ipc=host)
if [[ "${PLAYWRIGHT_STATIC:-}" == "1" ]]; then
	if [[ ! -f dist/client/index.html || ! -f dist/client/404.html ]]; then
		echo "Static Playwright mode requires a completed bun run build." >&2
		exit 1
	fi
fi

for variable in PLAYWRIGHT_BASE_URL PLAYWRIGHT_EXPECT_STATIC_404 PLAYWRIGHT_STATIC; do
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

set +e
docker start --attach "${container}"
status=$?
set -e

copy_artifacts

if [[ "${status}" -eq 0 ]]; then
	bash "${workspace_root}/scripts/playwright/publish-snapshots.sh" "${container}" "${app_root}" "$@"
fi

trap - EXIT
cleanup
exit "${status}"
