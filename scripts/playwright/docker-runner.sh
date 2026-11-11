#!/usr/bin/env bash
# Sourced by app runners. Build/mode/architecture/provenance decisions stay local.

playwright_docker_image() {
	local runner_workspace=$1 prefix=$2 lock_hash
	lock_hash="$(shasum -a 256 "${runner_workspace}/bun.lock" | cut -c1-16)"
	printf '%s:lock-%s\n' "${prefix}" "${lock_hash}"
}

playwright_docker_cleanup() {
	if [[ -n "${container:-}" ]]; then
		docker rm --force "${container}" >/dev/null 2>&1 || true
	fi
}

playwright_docker_init() {
	container=""
	trap playwright_docker_cleanup EXIT
}

playwright_docker_run() {
	if docker start --attach "${container}"; then
		playwright_status=0
	else
		playwright_status=$?
	fi
}

playwright_copy_reports() {
	local runner_app_root=$1 output_root=$2 report
	shift 2
	for report in "$@"; do
		rm -rf "${runner_app_root:?}/${report}"
		docker cp "${container}:${output_root}/${report}" "${runner_app_root}/${report}" >/dev/null 2>&1 || true
	done
}

# Only call after app-specific verification has finished. EXIT always cleans our container.
playwright_docker_finish() {
	local runner_app_root=$1
	shift
	if [[ "${playwright_status}" -eq 0 ]]; then
		bash "$(dirname "${BASH_SOURCE[0]}")/publish-snapshots.sh" "${container}" "${runner_app_root}" "$@"
	fi
	exit "${playwright_status}"
}
