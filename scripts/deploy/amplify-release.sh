#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 5 ]]; then
  echo "Usage: $0 <app-id> <branch> <commit> <run-id> <run-attempt>" >&2
  exit 2
fi

app_id=$1
branch=$2
commit=$3
run_id=$4
run_attempt=$5
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

original_environment=$(aws amplify get-branch \
  --app-id "$app_id" \
  --branch-name "$branch" \
  --query 'branch.environmentVariables' \
  --output json)
original_environment=$(jq -c '. // {}' <<<"$original_environment")
release_environment=$(jq -c \
  --arg runId "$run_id" \
  --arg runAttempt "$run_attempt" \
  '. + {RELEASE_RUN_ID: $runId, RELEASE_RUN_ATTEMPT: $runAttempt}' \
  <<<"$original_environment")

restore_environment() {
  if ! aws amplify update-branch \
    --app-id "$app_id" \
    --branch-name "$branch" \
    --environment-variables "$original_environment" \
    >/dev/null; then
    echo "Warning: failed to restore Amplify branch environment variables." >&2
  fi
}
trap restore_environment EXIT

aws amplify update-branch \
  --app-id "$app_id" \
  --branch-name "$branch" \
  --environment-variables "$release_environment" \
  >/dev/null

summary=$(aws amplify start-job \
  --app-id "$app_id" \
  --branch-name "$branch" \
  --job-type RELEASE \
  --commit-id "$commit" \
  --commit-message "GitHub Actions release $commit" \
  --job-reason "GitHub Actions release $commit" \
  --query jobSummary \
  --output json)

job_id=$(jq -er '.jobId' <<<"$summary")
selected_commit=$(jq -er '.commitId' <<<"$summary")
if [[ "$selected_commit" != "$commit" ]]; then
  echo "Amplify selected $selected_commit; expected $commit." >&2
  exit 1
fi

"$root/scripts/deploy/wait-for-amplify-job.sh" "$app_id" "$branch" "$job_id" "$commit"
