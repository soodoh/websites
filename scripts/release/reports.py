"""Scan only named diagnostics; never upload auth manifests, bundles or arbitrary cwd."""
import json
from pathlib import Path
import sys
import artifact

site, source, destination, mode = sys.argv[1:5]
artifact.require(site in ('paul', 'diloreto', 'carolyn', 'sarabeth') and mode in ('fixture', 'production'), 'Invalid diagnostics identity')
source, destination = Path(source), Path(destination)
destination.mkdir(parents=True, exist_ok=False)
for name in ('test-results', 'playwright-report', '.lighthouseci'):
    directory = source / 'apps' / site / name
    if not directory.exists():
        continue
    for relative, data in artifact.ci.files(directory).items():
        target = destination / name.removeprefix('.') / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
(destination / 'classification.json').write_text(json.dumps(dict(site=site, kind=mode + '-diagnostics', deployable=False)) + '\n')
