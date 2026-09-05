#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly ROOT_DIR
WORKSPACE_ROOT="$(cd "${ROOT_DIR}/../.." && pwd)"
readonly WORKSPACE_ROOT
LOCK_HASH="$(shasum -a 256 "${WORKSPACE_ROOT}/bun.lock" | cut -c1-16)"
readonly LOCK_HASH
readonly IMAGE_NAME="websites-carolyn-playwright:1.62.1-bun1.4.0-${LOCK_HASH}"
DOCKER_ARCHITECTURE="$(docker info --format '{{.Architecture}}')"
readonly DOCKER_ARCHITECTURE
container=""
cleanup() {
	if [[ -n "${container}" ]]; then
		docker rm --force "${container}" >/dev/null 2>&1 || true
	fi
}
trap cleanup EXIT

if [[ "${DOCKER_ARCHITECTURE}" != "aarch64" && "${DOCKER_ARCHITECTURE}" != "arm64" ]]; then
	echo "Visual snapshots require an ARM64 Docker engine; found ${DOCKER_ARCHITECTURE}." >&2
	exit 1
fi

docker build --file "${ROOT_DIR}/Dockerfile.playwright" --tag "${IMAGE_NAME}" "${WORKSPACE_ROOT}"
container=$(docker create --init --ipc=host \
	--env "CI=${CI:-}" \
	--env AMPLIFY_BASE_URL \
	--env AMPLIFY_DEFAULT_ORIGIN \
	--env AMPLIFY_EXPECTED_RELEASE_COMMIT \
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
set +e
docker start --attach "${container}"
status=$?
set -e
for report in playwright-report test-results; do
	rm -rf "${ROOT_DIR:?}/${report}"
	docker cp "${container}:/work/apps/carolyn/${report}" "${ROOT_DIR}/${report}" >/dev/null 2>&1 || true
done
if [[ "${status}" -eq 0 ]]; then
	for argument in "$@"; do
		if [[ "${argument}" == "--update-snapshots" || "${argument}" == "--update-snapshots=all" || "${argument}" == "--update-snapshots=changed" || "${argument}" == "--update-snapshots=missing" ]]; then
			staging=$(mktemp -d)
			docker cp "${container}:/work/apps/carolyn/tests/." "${staging}"
			while IFS= read -r -d '' snapshot; do
				relative="${snapshot#"${staging}/"}"
				mkdir -p "$(dirname "${ROOT_DIR}/tests/${relative}")"
				cp "${snapshot}" "${ROOT_DIR}/tests/${relative}"
			done < <(find "${staging}" -path '*-snapshots/*.png' -print0)
			rm -rf "${staging}"
			break
		fi
	done
fi
trap - EXIT
cleanup
exit "${status}"
