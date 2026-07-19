#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -lt 4 || "$#" -gt 5 ]]; then
	echo "Usage: $0 <release-directory> <run-id> <run-attempt> <commit> [expected-sha256]" >&2
	exit 2
fi

readonly release_directory="$1"
readonly expected_run_id="$2"
readonly expected_run_attempt="$3"
readonly expected_commit="$4"
readonly expected_sha256="${5:-}"

(
	cd "${release_directory}"
	sha256sum -c site.zip.sha256
	actual_sha256="$(cut -d ' ' -f 1 site.zip.sha256)"
	if [[ -n "${expected_sha256}" ]]; then
		test "${actual_sha256}" = "${expected_sha256}"
	fi
	test "$(jq -r '.sha256' metadata.json)" = "${actual_sha256}"
	test "$(jq -r '.runId' metadata.json)" = "${expected_run_id}"
	test "$(jq -r '.runAttempt' metadata.json)" = "${expected_run_attempt}"
	test "$(jq -r '.commit' metadata.json)" = "${expected_commit}"
	test "$(unzip -p site.zip release.json | jq -r '.runId')" = "${expected_run_id}"
	test "$(unzip -p site.zip release.json | jq -r '.runAttempt')" = "${expected_run_attempt}"
	test "$(unzip -p site.zip release.json | jq -r '.commit')" = "${expected_commit}"
)
