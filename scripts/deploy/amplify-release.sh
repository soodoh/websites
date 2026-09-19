#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $0 <app-id> <branch> <commit>" >&2
  exit 2
fi

app_id=$1
branch=$2
commit=$3
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

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
