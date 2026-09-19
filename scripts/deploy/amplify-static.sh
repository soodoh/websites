#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $0 <app-id> <branch> <site.zip>" >&2
  exit 2
fi

app_id=$1
branch=$2
archive=$3
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
response=$(mktemp)
trap 'rm -f "$response"' EXIT

test -f "$archive"
unzip -t "$archive" >/dev/null

aws amplify create-deployment \
  --app-id "$app_id" \
  --branch-name "$branch" \
  --output json >"$response"

job_id=$(jq -er '.jobId' "$response")
upload_url=$(jq -er '.zipUploadUrl' "$response")

curl --fail --silent --show-error \
  --request PUT \
  --header 'Content-Type: application/zip' \
  --upload-file "$archive" \
  "$upload_url" >/dev/null
unset upload_url

aws amplify start-deployment \
  --app-id "$app_id" \
  --branch-name "$branch" \
  --job-id "$job_id" >/dev/null

"$root/scripts/deploy/wait-for-amplify-job.sh" "$app_id" "$branch" "$job_id"
