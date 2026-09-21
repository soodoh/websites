#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/*.yml

tofu fmt -check -recursive infra apps
scripts/infra/validate-opentofu.sh

scripts=(
  scripts/ci/*.sh
  scripts/deploy/*.sh
  apps/sarabeth/scripts/playwright-*.sh
  apps/carolyn/scripts/playwright-docker.sh
  apps/paul/scripts/*.sh
  apps/diloreto/scripts/test-playwright-docker.sh
)

for script in "${scripts[@]}"; do
  bash -n "$script"
  shellcheck "$script"
done
