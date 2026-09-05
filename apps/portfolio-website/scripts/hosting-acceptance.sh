#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -lt 4 || "$#" -gt 5 ]]; then
	echo "Usage: $0 <base-url> <run-id> <run-attempt> <commit> [expect-domain-redirects]" >&2
	exit 2
fi

HOSTING_BASE_URL="$1" \
	HOSTING_EXPECT_AMPLIFY=1 \
	HOSTING_EXPECT_RUN_ID="$2" \
	HOSTING_EXPECT_RUN_ATTEMPT="$3" \
	HOSTING_EXPECT_COMMIT="$4" \
	HOSTING_EXPECT_DOMAIN_REDIRECTS="${5:-0}" \
	bun run test:hosting
