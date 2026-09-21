#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

roots=(
  infra/account-foundation
  apps/paul/infra/opentofu
  apps/diloreto/infra/opentofu
  apps/carolyn/infra/opentofu
  apps/sarabeth/infra/opentofu
  apps/carolyn/infra/contentful
  apps/sarabeth/infra/contentful
)

if (( $# > 0 )); then
  roots=("$@")
fi

validation_dir="$(mktemp -d)"
trap 'rm -rf "$validation_dir"' EXIT
export TF_PLUGIN_CACHE_DIR="$validation_dir/plugin-cache"
mkdir -p "$TF_PLUGIN_CACHE_DIR"

for root in "${roots[@]}"; do
  printf 'Validating %s\n' "$root"
  data_dir="$validation_dir/${root//\//-}"
  TF_DATA_DIR="$data_dir" tofu -chdir="$root" init -backend=false -input=false >/dev/null
  TF_DATA_DIR="$data_dir" tofu -chdir="$root" validate
done
