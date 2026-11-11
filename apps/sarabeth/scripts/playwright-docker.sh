#!/usr/bin/env bash
set -euo pipefail

app_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly app_root
workspace_root="$(cd "${app_root}/../.." && pwd)"
readonly workspace_root
release_commit="$(git -C "${workspace_root}" rev-parse HEAD)"
readonly release_commit
# shellcheck disable=SC1091
source "${workspace_root}/scripts/playwright/docker-runner.sh"
image="$(playwright_docker_image "${workspace_root}" "websites-sarabeth-playwright")"
readonly image
playwright_docker_init

docker build --platform linux/arm64 --file "${app_root}/Dockerfile.playwright" --tag "${image}" "${workspace_root}"
container=$(docker create --init --ipc=host --platform linux/arm64 --env "RELEASE_COMMIT=${release_commit}" "${image}" "$@")
playwright_docker_run
playwright_copy_reports "${app_root}" /work/apps/sarabeth test-results
if [[ "${playwright_status}" -eq 0 ]]; then
	mkdir -p "${app_root}/test-results"
	# Read the actual successful container, not a second build or cached image.
	if ! docker cp "${container}:/work/apps/sarabeth/.amplify-hosting/static/__deployment.json" "${app_root}/test-results/container-deployment.json"; then
		playwright_status=1
	elif ! node -e 'const fs = require("node:fs"); if (JSON.parse(fs.readFileSync(process.argv[1])).commit !== process.argv[2]) process.exit(1)' "${app_root}/test-results/container-deployment.json" "${release_commit}"; then
		playwright_status=1
	fi
fi
playwright_docker_finish "${app_root}" "$@"
