"""Static provenance v2 for fresh release validation; v1 and legacy remain immutable."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('ci_artifact', ROOT / 'scripts/ci/artifact.py')
ci = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ci)
WORKFLOWS = {'.github/workflows/release-site.yml', '.github/workflows/redeploy-diloreto.yml'}


def require(value, message):
    if not value:
        raise ValueError(message)


def marker(site, checkout):
    require(site in ci.SITES, 'Unknown static site')
    commit = subprocess.check_output(['git', '-C', str(checkout), 'rev-parse', 'HEAD'], text=True).strip()
    workflow = os.environ['GITHUB_WORKFLOW_REF'].removeprefix('soodoh/websites/').split('@')[0]
    require(workflow in WORKFLOWS and (workflow != '.github/workflows/redeploy-diloreto.yml' or site == 'diloreto'), 'Untrusted validation workflow')
    require(os.environ['GITHUB_REPOSITORY'] == 'soodoh/websites' and os.environ['GITHUB_REF'] == 'refs/heads/main' and os.environ['GITHUB_EVENT_NAME'] == 'workflow_dispatch', 'Untrusted validation event')
    run, attempt = os.environ['GITHUB_RUN_ID'], os.environ['GITHUB_RUN_ATTEMPT']
    require(all(re.fullmatch(r'[1-9][0-9]*', x) for x in (run, attempt)), 'Invalid run/attempt')
    require(re.fullmatch(r'[0-9a-f]{40}', commit), 'Invalid checkout SHA')
    return dict(schemaVersion=2, kind='website-static-validation', repository='soodoh/websites', site=site,
                commit=commit, workflow=workflow, workflowSha=os.environ['GITHUB_WORKFLOW_SHA'], runId=run,
                runAttempt=attempt, artifactName=f'{site}-{run}-{attempt}-static-v2', releaseId=f'{site}-{run}-{attempt}',
                event='workflow_dispatch', ref='refs/heads/main', releaseAuthorized=False)


def verify(directory, expected):
    metadata = json.loads((directory / 'metadata.json').read_text())
    require(metadata == expected, 'Metadata differs from independently selected identity')
    require(metadata['schemaVersion'] == 2 and metadata['kind'] == 'website-static-validation' and metadata['releaseAuthorized'] is False, 'Invalid v2 schema')
    require(metadata['site'] in ci.SITES and metadata['repository'] == 'soodoh/websites' and metadata['workflow'] in WORKFLOWS, 'Untrusted v2 producer')
    require(metadata['event'] == 'workflow_dispatch' and metadata['ref'] == 'refs/heads/main', 'Untrusted v2 event')
    require(metadata['workflow'] != '.github/workflows/redeploy-diloreto.yml' or metadata['site'] == 'diloreto', 'Wrong redeploy site')
    require(all(re.fullmatch(r'[0-9a-f]{40}', metadata[k]) for k in ('commit', 'workflowSha')), 'Invalid SHA')
    require(all(re.fullmatch(r'[1-9][0-9]*', metadata[k]) for k in ('runId', 'runAttempt')), 'Invalid run/attempt')
    release_id = f"{metadata['site']}-{metadata['runId']}-{metadata['runAttempt']}"
    require(metadata['releaseId'] == release_id and metadata['artifactName'] == release_id + '-static-v2' and metadata['deploymentRoot'] == 'dist/client', 'Invalid artifact name/root')
    data = (directory / 'site.zip').read_bytes()
    checksum = hashlib.sha256(data).hexdigest()
    require(metadata['sha256'] == checksum and (directory / 'site.zip.sha256').read_text() == f'{checksum}  site.zip\n', 'Checksum mismatch')
    with zipfile.ZipFile(directory / 'site.zip') as archive:
        names = archive.namelist()
        require(len(names) == len(set(names)), 'Duplicate ZIP members')
        require({'index.html', '404.html', 'release.json'}.issubset(names), 'Missing routes/marker')
        require(metadata['site'] != 'diloreto' or 'areyou/index.html' in names, 'Missing genealogy route')
        require(not any(n.startswith(('dist/', 'client/', 'apps/')) for n in names), 'Invalid ZIP root')
        for name in names:
            ci.scan(name, archive.read(name))
        require(json.loads(archive.read('release.json')) == {k: v for k, v in metadata.items() if k not in ('sha256', 'deploymentRoot')}, 'Marker mismatch')
    return metadata


def package(site, checkout, destination):
    source = checkout / 'apps' / site / 'dist/client'
    content = ci.files(source)
    identity = marker(site, checkout)
    require(json.loads(content['release.json']) == identity, 'Output was not validated for this invocation')
    destination.mkdir(parents=True, exist_ok=False)
    with zipfile.ZipFile(destination / 'site.zip', 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in content.items():
            info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    checksum = hashlib.sha256((destination / 'site.zip').read_bytes()).hexdigest()
    metadata = {**identity, 'sha256': checksum, 'deploymentRoot': 'dist/client'}
    (destination / 'metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
    (destination / 'site.zip.sha256').write_text(f'{checksum}  site.zip\n')
    verify(destination, metadata)
    require(ci.files(source) == content, 'Validated bytes changed during packaging')


if __name__ == '__main__':
    command, site, checkout = sys.argv[1:4]
    checkout = Path(checkout).resolve()
    if command == 'marker':
        (checkout / 'apps' / site / 'dist/client/release.json').write_text(json.dumps(marker(site, checkout), indent=2) + '\n')
    elif command == 'package':
        package(site, checkout, Path(sys.argv[4]))
    else:
        raise ValueError('Unknown operation')
