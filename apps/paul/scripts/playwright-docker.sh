#!/usr/bin/env bash

set -euo pipefail

app_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly app_root
workspace_root="$(cd "${app_root}/../.." && pwd)"
readonly workspace_root
lock_hash="$(shasum -a 256 "${workspace_root}/bun.lock" | cut -c1-16)"
readonly lock_hash
readonly image="websites-portfolio-playwright:1.62.1-bun1.4.0-${lock_hash}"
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

for argument in "$@"; do
	if [[ "${argument}" == "--update-snapshots" && "${status}" -eq 0 ]]; then
		staging_directory="$(mktemp -d e2e/.screenshots-staging.XXXXXX)"
		backup_directory="e2e/.screenshots-backup"
		docker cp "${container}:/work/apps/paul/e2e/__screenshots__/." "${staging_directory}"
		if ! find "${staging_directory}" -type f -name '*.png' -print -quit | grep -q .; then
			echo "Playwright produced no visual baselines; keeping the existing snapshots." >&2
			rm -rf "${staging_directory}"
			exit 1
		fi

		rm -rf "${backup_directory}"
		mv e2e/__screenshots__ "${backup_directory}"
		if mv "${staging_directory}" e2e/__screenshots__; then
			rm -rf "${backup_directory}"
		else
			mv "${backup_directory}" e2e/__screenshots__
			exit 1
		fi
		break
	fi
done

trap - EXIT
cleanup
exit "${status}"
