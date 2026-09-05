#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -ne 4 ]]; then
	echo "Usage: $0 <bucket> <run-id> <run-attempt> <destination>" >&2
	exit 2
fi

readonly bucket="$1"
readonly run_id="$2"
readonly run_attempt="$3"
readonly destination="$4"
readonly release_prefix="releases/${run_id}/${run_attempt}"
readonly files=(site.zip site.zip.sha256 metadata.json)
missing_count=0

rm -rf "${destination}"
mkdir -p "${destination}"

for file in "${files[@]}"; do
	error_output="$(mktemp)"
	if aws s3api head-object \
		--bucket "${bucket}" \
		--key "${release_prefix}/${file}" \
		>/dev/null 2>"${error_output}"; then
		rm -f "${error_output}"
		aws s3 cp \
			"s3://${bucket}/${release_prefix}/${file}" \
			"${destination}/${file}"
	elif grep -Eq 'An error occurred \((404|NoSuchKey|NotFound)\)' "${error_output}"; then
		rm -f "${error_output}"
		missing_count=$((missing_count + 1))
	else
		cat "${error_output}" >&2
		rm -f "${error_output}"
		exit 1
	fi
done

if [[ "${missing_count}" -eq "${#files[@]}" ]]; then
	rm -rf "${destination}"
	exit 3
fi

if [[ "${missing_count}" -ne 0 ]]; then
	echo "Verified release ${run_id}/${run_attempt} is incomplete in ${bucket}." >&2
	exit 1
fi
