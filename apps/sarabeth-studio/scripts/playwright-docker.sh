#!/usr/bin/env bash
set -euo pipefail

app_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly app_root
workspace_root="$(cd "${app_root}/../.." && pwd)"
readonly workspace_root
lock_hash="$(shasum -a 256 "${workspace_root}/bun.lock" | cut -c1-16)"
readonly lock_hash
readonly image="websites-sarabeth-playwright:1.62.1-bun1.4.0-${lock_hash}"
container=""
cleanup() {
	if [[ -n "${container}" ]]; then
		docker rm --force "${container}" >/dev/null 2>&1 || true
	fi
}
trap cleanup EXIT

docker build --platform linux/arm64 --file "${app_root}/Dockerfile.playwright" --tag "${image}" "${workspace_root}"
container=$(docker create --init --ipc=host --platform linux/arm64 "${image}" "$@")
set +e
docker start --attach "${container}"
status=$?
set -e
rm -rf "${app_root:?}/test-results"
docker cp "${container}:/work/apps/sarabeth-studio/test-results" "${app_root}/test-results" >/dev/null 2>&1 || true
trap - EXIT
cleanup
exit "${status}"
