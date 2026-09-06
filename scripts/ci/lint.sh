#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/*.yml apps/*/.github/workflows/*
for script in scripts/ci/*.sh scripts/release/*.sh apps/sarabeth/scripts/playwright-*.sh apps/carolyn/scripts/playwright-docker.sh apps/paul/scripts/*.sh apps/diloreto/scripts/test-playwright-docker.sh; do
  bash -n "$script"
  shellcheck "$script"
done
for script in scripts/ci/*.mjs scripts/release/*.mjs; do node --check "$script"; done
python3 -c 'import ast, pathlib; [ast.parse(p.read_text(), filename=str(p)) for p in pathlib.Path("scripts/release").glob("*.py")]'
