"""Read an approved capture of the ORIGINAL markerless DiLoreto ZIP, never rebuild it."""
import hashlib
import re
from urllib.parse import quote
import zipfile

import artifact
from state import require


def verify_capture(directory, release, metadata, policy):
    pinned = policy.get('legacyDiloretoManifestSha256')
    require(isinstance(pinned, str) and re.fullmatch(r'[0-9a-f]{64}', pinned), 'Legacy capture manifest not independently approved')
    require(hashlib.sha256((directory / 'metadata.json').read_bytes()).hexdigest() == pinned, 'Unapproved legacy capture manifest')
    require(metadata.get('schemaVersion') == 1 and metadata.get('kind') == 'legacy-diloreto-capture' and metadata.get('sourceArchiveName') == 'amplify-deployment.zip', 'Invalid legacy capture format')
    require(metadata.get('sourceArtifactName') == 'amplify-static-' + release['runId'] and isinstance(metadata.get('captureEvidenceSha256'), str) and re.fullmatch(r'[0-9a-f]{64}', metadata['captureEvidenceSha256']), 'Missing independently reviewed capture evidence')
    for key in ('repository', 'site', 'workflow', 'workflowSha', 'event', 'commit', 'runId', 'runAttempt', 'sha256'):
        require(metadata.get(key) == release.get(key) and key in metadata, f'Legacy capture identity mismatch: {key}')
    require(metadata['repository'] == 'soodoh/diloreto-website' and metadata['site'] == 'diloreto' and metadata['workflow'] == '.github/workflows/deploy.yml', 'Wrong original identity')
    checksum = hashlib.sha256((directory / 'site.zip').read_bytes()).hexdigest()
    require(checksum == release['sha256'] and (directory / 'site.zip.sha256').read_text() == f'{checksum}  site.zip\n', 'Legacy ZIP bytes changed')
    with zipfile.ZipFile(directory / 'site.zip') as archive:
        names = archive.namelist()
        require(len(names) == len(set(names)) and {'index.html', 'areyou/index.html', '404.html'}.issubset(names) and 'release.json' not in names, 'Not original markerless static format')
        require(not any(n.startswith(('dist/', 'client/', 'apps/')) for n in names), 'Invalid legacy ZIP root')
        for name in names:
            if not name.endswith('/'):
                artifact.ci.scan(name, archive.read(name))


def verify_serving_bytes(url, directory, read_url):
    require(directory is not None, 'Verified legacy bytes required; cannot invent a marker')
    with zipfile.ZipFile(directory / 'site.zip') as archive:
        for name in archive.namelist():
            if name.endswith('/'):
                continue
            if name == '404.html':
                path, expected_status = '/not-a-real-route', 404
            elif name == 'index.html' or name.endswith('/index.html'):
                path, expected_status = '/' + name.removesuffix('index.html').rstrip('/'), 200
            else:
                path, expected_status = '/' + name, 200
            status, _, body = read_url(url.rstrip('/') + quote(path, safe='/'))
            require(status == expected_status and body == archive.read(name), 'Serving bytes do not match approved legacy capture')
