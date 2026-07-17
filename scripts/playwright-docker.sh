#!/usr/bin/env bash

set -euo pipefail

readonly image="portfolio-website-playwright:1.61.1"
container=""

cleanup() {
	if [[ -n "${container}" ]]; then
		docker rm --force "${container}" >/dev/null 2>&1 || true
	fi
}

copy_artifacts() {
	rm -rf test-results playwright-report
	docker cp "${container}:/app/test-results" test-results >/dev/null 2>&1 || true
	docker cp "${container}:/app/playwright-report" playwright-report >/dev/null 2>&1 || true
}

trap cleanup EXIT

docker build --file Dockerfile.playwright --tag "${image}" .
container=$(docker create --ipc=host "${image}" bun run test:e2e:container "$@")

set +e
docker start --attach "${container}"
status=$?
set -e

copy_artifacts

for argument in "$@"; do
	if [[ "${argument}" == "--update-snapshots" ]]; then
		rm -rf e2e/__screenshots__
		mkdir -p e2e/__screenshots__
		docker cp "${container}:/app/e2e/__screenshots__/." e2e/__screenshots__
		break
	fi
done

exit "${status}"
