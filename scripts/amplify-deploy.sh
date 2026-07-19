#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -ne 3 ]]; then
	echo "Usage: $0 <app-id> <branch-name> <site.zip>" >&2
	exit 2
fi

readonly app_id="$1"
readonly branch_name="$2"
readonly artifact_path="$3"
readonly poll_interval_seconds=10
readonly timeout_seconds=1200

if [[ ! -f "${artifact_path}" ]]; then
	echo "Deployment artifact not found: ${artifact_path}" >&2
	exit 2
fi

export AWS_PAGER=""
deployment_json="$(mktemp)"
job_started=false
job_terminal=false
job_id=""
cleanup() {
	exit_code=$?
	trap - EXIT
	if [[ "${job_started}" == "true" && "${job_terminal}" != "true" ]]; then
		echo "Stopping unfinished Amplify deployment job ${job_id}." >&2
		aws amplify stop-job \
			--app-id "${app_id}" \
			--branch-name "${branch_name}" \
			--job-id "${job_id}" >/dev/null 2>&1 || true
	fi
	rm -f "${deployment_json}"
	exit "${exit_code}"
}
trap cleanup EXIT
trap 'exit 130' INT TERM
chmod 600 "${deployment_json}"

aws amplify create-deployment \
	--app-id "${app_id}" \
	--branch-name "${branch_name}" \
	--output json >"${deployment_json}"

job_id="$(jq -r '.jobId' "${deployment_json}")"
upload_url="$(jq -r '.zipUploadUrl' "${deployment_json}")"
if [[ -z "${job_id}" || "${job_id}" == "null" || -z "${upload_url}" || "${upload_url}" == "null" ]]; then
	echo "Amplify did not return a deployment job and upload URL." >&2
	exit 1
fi

curl --fail --silent --show-error \
	--request PUT \
	--upload-file "${artifact_path}" \
	"${upload_url}" >/dev/null

unset upload_url
aws amplify start-deployment \
	--app-id "${app_id}" \
	--branch-name "${branch_name}" \
	--job-id "${job_id}" >/dev/null
job_started=true

echo "Started Amplify deployment job ${job_id} for branch ${branch_name}."
started_at="$(date +%s)"
while true; do
	status="$(
		aws amplify get-job \
			--app-id "${app_id}" \
			--branch-name "${branch_name}" \
			--job-id "${job_id}" \
			--query 'job.summary.status' \
			--output text
	)"

	case "${status}" in
	SUCCEED)
		job_terminal=true
		echo "Amplify deployment job ${job_id} succeeded for branch ${branch_name}."
		break
		;;
	FAILED | CANCELLED)
		job_terminal=true
		echo "Amplify deployment job ${job_id} ended with status ${status}." >&2
		aws amplify get-job \
			--app-id "${app_id}" \
			--branch-name "${branch_name}" \
			--job-id "${job_id}" \
			--query 'job.{summary:summary.{jobId:jobId,status:status,startTime:startTime,endTime:endTime},steps:steps[].{stepName:stepName,status:status}}' \
			--output json >&2
		exit 1
		;;
	esac

	if (( $(date +%s) - started_at >= timeout_seconds )); then
		echo "Timed out waiting for Amplify deployment job ${job_id}; last status was ${status}." >&2
		exit 1
	fi

	echo "Amplify deployment job ${job_id} status: ${status}"
	sleep "${poll_interval_seconds}"
done

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
	printf 'job-id=%s\n' "${job_id}" >>"${GITHUB_OUTPUT}"
fi
