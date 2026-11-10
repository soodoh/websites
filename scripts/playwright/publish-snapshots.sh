#!/usr/bin/env bash
set -euo pipefail

# Call only after the container and every site-specific check have succeeded.
container="${1:?Expected the successful container ID}"
app_root="${2:?Expected the absolute app directory}"
shift 2

# Match Playwright's optional mode, including '--update-snapshots none'.
# As with its argument parser, the last explicit update option wins.
update=false
while [[ "$#" -gt 0 ]]; do
	case "$1" in
		test:e2e:update|--update-snapshots=all|--update-snapshots=changed|--update-snapshots=missing|--update-snapshots=default) update=true ;;
		--update-snapshots=none) update=false ;;
		-u|--update-snapshots)
			update=true
			case "${2:-}" in
				none) update=false; shift ;;
				all|changed|missing|default) shift ;;
			esac
			;;
	esac
	shift
done
if [[ "${update}" != true ]]; then
	exit 0
fi

app="$(basename "${app_root}")"
target="${app_root}/tests/__screenshots__"
transaction="$(mktemp -d "${app_root}/tests/.screenshots-staging.XXXXXX")"
staging="${transaction}/next"
backup="${transaction}/previous"
published=false

cleanup() {
	local status=$?
	if [[ "${published}" != true && -e "${backup}" ]]; then
		if [[ -e "${target}" ]] || ! mv "${backup}" "${target}"; then
			echo "Snapshot recovery requires attention; previous baselines retained at ${backup}" >&2
			return 1
		fi
	fi
	rm -rf "${transaction}"
	return "${status}"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

mkdir "${staging}"
docker cp "${container}:/work/apps/${app}/tests/__screenshots__/." "${staging}"
if ! find "${staging}" -type f -name '*.png' -print -quit | grep -q .; then
	echo "Playwright produced no visual baselines; keeping the existing snapshots." >&2
	exit 1
fi

if [[ -e "${target}" ]]; then
	mv "${target}" "${backup}"
fi
mv "${staging}" "${target}"
published=true
