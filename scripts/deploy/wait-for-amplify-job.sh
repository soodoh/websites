#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 || $# -gt 5 ]]; then
  echo "Usage: $0 <app-id> <branch> <job-id> [expected-commit] [timeout-seconds]" >&2
  exit 2
fi

app_id=$1
branch=$2
job_id=$3
expected_commit=${4:-}
timeout_seconds=${5:-1800}
started_at=$(date +%s)

while true; do
  job=$(aws amplify get-job \
    --app-id "$app_id" \
    --branch-name "$branch" \
    --job-id "$job_id" \
    --output json)
  status=$(jq -er '.job.summary.status' <<<"$job")
  commit=$(jq -r '.job.summary.commitId // ""' <<<"$job")

  if [[ -n "$expected_commit" && -n "$commit" && "$commit" != "$expected_commit" ]]; then
    echo "Amplify job $job_id selected $commit; expected $expected_commit." >&2
    exit 1
  fi

  case "$status" in
    SUCCEED)
      echo "Amplify job $job_id succeeded."
      exit 0
      ;;
    FAILED | CANCELLED)
      echo "Amplify job $job_id ended with $status." >&2
      exit 1
      ;;
  esac

  if (( $(date +%s) - started_at >= timeout_seconds )); then
    echo "Timed out waiting for Amplify job $job_id; last status: $status." >&2
    exit 1
  fi

  echo "Amplify job $job_id: $status"
  sleep 10
done
