#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly repository_root
workspace_root="$(cd "${repository_root}/../.." && pwd)"
readonly workspace_root
lock_hash="$(shasum -a 256 "${workspace_root}/bun.lock" | cut -c1-16)"
readonly lock_hash
readonly image_name="websites-diloreto-playwright:1.63.0-bun1.4.2-${lock_hash}"
container=""
cleanup() {
	if [[ -n "${container}" ]]; then
		docker rm --force "${container}" >/dev/null 2>&1 || true
	fi
}
trap cleanup EXIT
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
set +e
docker start --attach "${container}"
status=$?
set -e
for report in playwright-report test-results; do
	rm -rf "${repository_root:?}/${report}"
	docker cp "${container}:/work/apps/diloreto/.playwright-output/${report}" "${repository_root}/${report}" >/dev/null 2>&1 || true
done
if [[ "${status}" -eq 0 ]]; then
	for argument in "$@"; do
		if [[ "${argument}" == "--update-snapshots" || "${argument}" == "--update-snapshots=all" || "${argument}" == "--update-snapshots=changed" || "${argument}" == "--update-snapshots=missing" ]]; then
			staging=$(mktemp -d "${repository_root}/tests/.screenshots-staging.XXXXXX")
			backup="${repository_root}/tests/.screenshots-backup"
			docker cp "${container}:/work/apps/diloreto/tests/__screenshots__/." "${staging}"
			if ! find "${staging}" -type f -name '*.png' -print -quit | grep -q .; then
				echo "Playwright produced no visual baselines; keeping the existing snapshots." >&2
				rm -rf "${staging}"
				exit 1
			fi

			rm -rf "${backup}"
			if [[ -d "${repository_root}/tests/__screenshots__" ]]; then
				mv "${repository_root}/tests/__screenshots__" "${backup}"
			fi
			if mv "${staging}" "${repository_root}/tests/__screenshots__"; then
				rm -rf "${backup}"
			else
				if [[ -d "${backup}" ]]; then
					mv "${backup}" "${repository_root}/tests/__screenshots__"
				fi
				exit 1
			fi
			break
		fi
	done
fi
trap - EXIT
cleanup
exit "${status}"
