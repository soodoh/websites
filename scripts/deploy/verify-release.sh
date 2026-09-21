#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 && $# -ne 4 ]]; then
  echo "Usage: $0 <production-url> <expected-commit> [expected-run-id expected-run-attempt]" >&2
  exit 2
fi

production_url=${1%/}
expected_commit=$2
expected_run_id=${3:-}
expected_run_attempt=${4:-}

if [[ ! "$expected_commit" =~ ^[a-f0-9]{40}$ ]]; then
  echo "Expected commit must be a 40-character lowercase hexadecimal SHA." >&2
  exit 2
fi

marker_url="${production_url}/__deployment.json?expectedCommit=${expected_commit}"
headers=$(mktemp)
trap 'rm -f "$headers"' EXIT
payload=$(curl --fail --silent --show-error --location \
  --dump-header "$headers" \
  --header 'Cache-Control: no-cache' \
  "$marker_url")

jq -e \
  --arg commit "$expected_commit" \
  --arg runId "$expected_run_id" \
  --arg runAttempt "$expected_run_attempt" \
  'type == "object" and
   .commit == $commit and
   (.runId | type == "string" and test("^[0-9]+$")) and
   (.runAttempt | type == "string" and test("^[0-9]+$")) and
   ($runId == "" or .runId == $runId) and
   ($runAttempt == "" or .runAttempt == $runAttempt)' \
  <<<"$payload" >/dev/null

cache_control=$(awk 'tolower($0) ~ /^cache-control:/ { value = $0 } END { print value }' "$headers" | tr -d '\r')
if [[ "$cache_control" != *"no-store"* ]]; then
  echo "Deployment marker must be served with Cache-Control: no-store; received: ${cache_control:-<missing>}" >&2
  exit 1
fi

echo "Verified deployed commit ${expected_commit} at ${production_url}."
