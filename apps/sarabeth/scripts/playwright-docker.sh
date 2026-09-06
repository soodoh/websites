#!/usr/bin/env bash
set -euo pipefail

app_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly app_root
workspace_root="$(cd "${app_root}/../.." && pwd)"
readonly workspace_root
release_commit="$(git -C "${workspace_root}" rev-parse HEAD)"
readonly release_commit
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
container=$(docker create --init --ipc=host --platform linux/arm64 --env "RELEASE_COMMIT=${release_commit}" "${image}" "$@")
set +e
docker start --attach "${container}"
status=$?
set -e
rm -rf "${app_root:?}/test-results"
docker cp "${container}:/work/apps/sarabeth/test-results" "${app_root}/test-results" >/dev/null 2>&1 || true
if [[ "${status}" -eq 0 ]]; then
	mkdir -p "${app_root}/test-results"
	# Read the actual successful container, not a second build or cached image.
	if ! docker cp "${container}:/work/apps/sarabeth/.amplify-hosting/static/__deployment.json" "${app_root}/test-results/container-deployment.json"; then
		status=1
	elif ! node -e 'const fs = require("node:fs"); if (JSON.parse(fs.readFileSync(process.argv[1])).commit !== process.argv[2]) process.exit(1)' "${app_root}/test-results/container-deployment.json" "${release_commit}"; then
		status=1
	fi
fi
trap - EXIT
cleanup
exit "${status}"
