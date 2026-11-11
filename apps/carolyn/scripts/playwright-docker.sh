#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly ROOT_DIR
WORKSPACE_ROOT="$(cd "${ROOT_DIR}/../.." && pwd)"
readonly WORKSPACE_ROOT
# shellcheck disable=SC1091
source "${WORKSPACE_ROOT}/scripts/playwright/docker-runner.sh"
IMAGE_NAME="$(playwright_docker_image "${WORKSPACE_ROOT}" "websites-carolyn-playwright")"
readonly IMAGE_NAME
DOCKER_ARCHITECTURE="$(docker info --format '{{.Architecture}}')"
readonly DOCKER_ARCHITECTURE
playwright_docker_init

if [[ "${DOCKER_ARCHITECTURE}" != "aarch64" && "${DOCKER_ARCHITECTURE}" != "arm64" ]]; then
	echo "Visual snapshots require an ARM64 Docker engine; found ${DOCKER_ARCHITECTURE}." >&2
	exit 1
fi

docker build --file "${ROOT_DIR}/Dockerfile.playwright" --tag "${IMAGE_NAME}" "${WORKSPACE_ROOT}"
# Shared lifecycle functions consume the container handle.
# shellcheck disable=SC2034
container=$(docker create --init --ipc=host \
	--env "CI=${CI:-}" \
	--env AMPLIFY_BASE_URL \
	--env AMPLIFY_DEFAULT_ORIGIN \
	--env AMPLIFY_EXPECTED_RELEASE_COMMIT \
	--env CAROLYN_CANDIDATE_BRANCH \
	--env CAROLYN_CANDIDATE_APP_ID \
	--env EXPECTED_ARTIFACT_MODE \
	--env HERMETIC_ARTIFACT_TEST \
	"${IMAGE_NAME}" bash -c '
		set -euo pipefail
		if [[ -z "${AMPLIFY_BASE_URL:-}" ]]; then
			# Keep Linux localhost preview binding and Node fetch on the same address family.
			case "${EXPECTED_ARTIFACT_MODE:-}" in
				fixture) NODE_OPTIONS=--dns-result-order=ipv4first bun run build:test ;;
				production) NODE_OPTIONS=--dns-result-order=ipv4first bun run build:production:test ;;
				*) echo "Local browser tests require an explicit fixture artifact mode" >&2; exit 1 ;;
			esac
		fi
		bun x --no-install playwright test "$@"
	' bash "$@")
playwright_docker_run
playwright_copy_reports "${ROOT_DIR}" /work/apps/carolyn playwright-report test-results
playwright_docker_finish "${ROOT_DIR}" "$@"
