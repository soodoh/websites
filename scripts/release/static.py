"""Real static release adapter; only called behind reviewed, disabled workflow gates."""
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import zipfile

import artifact
from state import require, UnknownOutcome

ROOT = Path(__file__).resolve().parents[2]
LEGACY = 'soodoh/portfolio-website'
LEGACY_DILORETO = 'soodoh/diloreto-website'
TERMINAL = {'SUCCEED', 'FAILED', 'CANCELLED'}


def command(args, cwd=ROOT, env=None):
    subprocess.run(args, cwd=cwd, env=env, check=True)


def gh(path):
    result = subprocess.run(['gh', 'api', path], capture_output=True)
    require(result.returncode == 0, 'Trusted GitHub evidence unavailable; no cross-repo credential fallback')
    return json.loads(result.stdout)


def observe(policy, site, release):
    repo = release['repository']
    require(repo == 'soodoh/websites' or (site == 'paul' and repo == LEGACY) or (site == 'diloreto' and repo == LEGACY_DILORETO), 'Unallowlisted repository')
    run, attempt = release['runId'], release['runAttempt']
    require(all(re.fullmatch(r'[1-9][0-9]*', x) for x in (run, attempt)), 'Invalid run/attempt')
    legacy_key = 'legacyDiloreto' if repo == LEGACY_DILORETO else 'legacyPortfolio'
    expected_repo_id = policy['repositoryId'] if repo == 'soodoh/websites' else policy.get(legacy_key + 'RepositoryId')
    repository = gh(f'repos/{repo}')
    require(expected_repo_id and str(repository['id']) == expected_repo_id and str(repository['owner']['id']) == policy['ownerId'], 'Repository/owner ID mismatch')
    observed = gh(f'repos/{repo}/actions/runs/{run}/attempts/{attempt}')
    require(str(observed['id']) == run and str(observed['run_attempt']) == attempt and observed['head_repository']['full_name'] == repo and str(observed['head_repository']['id']) == expected_repo_id, 'Run source/attempt mismatch')
    workflow = release['workflow']
    expected_workflow_id = policy.get(legacy_key + 'WorkflowId') if repo != 'soodoh/websites' else policy['validationWorkflowIds'].get(workflow)
    require(expected_workflow_id and str(observed['workflow_id']) == expected_workflow_id and observed['path'] == workflow, 'Workflow mismatch')
    require(observed['head_branch'] == 'main', 'Non-main workflow event')
    if repo == LEGACY_DILORETO:
        require(workflow == '.github/workflows/deploy.yml' and observed['event'] in ('push', 'workflow_dispatch') and observed['event'] == release.get('event'), 'Untrusted legacy DiLoreto event')
        require(observed['status'] == 'completed' and observed['conclusion'] == 'success', 'Legacy deployment incomplete')
        require(observed['head_sha'] == release.get('workflowSha'), 'Legacy invocation SHA mismatch')
        if observed['event'] == 'push':
            require(observed['head_sha'] == release['commit'], 'Legacy push target mismatch')
        # A manual target need not be head_sha: the independently pinned capture
        # manifest binds the actual validated/deployed original target SHA.
    elif workflow == '.github/workflows/ci.yml' or repo == LEGACY:
        require(workflow == ('.github/workflows/deploy.yml' if repo == LEGACY else '.github/workflows/ci.yml') and observed['event'] == 'push' and observed['head_sha'] == release['commit'], 'Not trusted push provenance')
        require(observed['status'] == 'completed', 'Originating run incomplete')
    else:
        require(repo == 'soodoh/websites' and workflow in artifact.WORKFLOWS and observed['event'] == 'workflow_dispatch' and observed['head_sha'] == release['workflowSha'], 'Not trusted fresh validation provenance')
        require(workflow != '.github/workflows/redeploy-diloreto.yml' or site == 'diloreto', 'Wrong selected-ref site')
    jobs = []
    page = 1
    while True:
        batch = gh(f'repos/{repo}/actions/runs/{run}/attempts/{attempt}/jobs?per_page=100&page={page}')['jobs']
        jobs.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    names = ['Build and verify artifact'] if repo == LEGACY else (['root', f'{site} / {site} fixture verification'] if workflow == '.github/workflows/ci.yml' else ['release root validation', f'{site} release validation'])
    if repo == LEGACY_DILORETO:
        names = ['Validate static site', 'Deploy production']
    for name in names:
        matching = [j for j in jobs if j['name'] == name]
        require(len(matching) == 1 and matching[0]['status'] == 'completed' and matching[0]['conclusion'] == 'success', f'Required trusted job not successful: {name}')
    return observed


def verify_release(directory, release, policy, site):
    require(release['site'] == site and re.fullmatch(r'[0-9a-f]{40}', release['commit']) and re.fullmatch(r'[0-9a-f]{64}', release['sha256']), 'Invalid release identity')
    observe(policy, site, release)
    metadata = json.loads((directory / 'metadata.json').read_text())
    if release['repository'] == LEGACY_DILORETO:
        from legacy_diloreto import verify_capture
        verify_capture(directory, release, metadata, policy)
    elif release['repository'] == LEGACY:
        require(site == 'paul' and release['workflow'] == '.github/workflows/deploy.yml', 'Legacy identity not allowlisted')
        for key in ('commit', 'runId', 'runAttempt', 'sha256'):
            require(metadata.get(key) == release[key], f'Legacy metadata mismatch: {key}')
        checksum = hashlib.sha256((directory / 'site.zip').read_bytes()).hexdigest()
        require(checksum == release['sha256'] and (directory / 'site.zip.sha256').read_text() == f'{checksum}  site.zip\n', 'Legacy checksum mismatch')
        with zipfile.ZipFile(directory / 'site.zip') as archive:
            require(len(archive.namelist()) == len(set(archive.namelist())), 'Duplicate legacy members')
            require({'index.html', '404.html', 'release.json'}.issubset(archive.namelist()), 'Missing legacy static routes')
            for name in archive.namelist():
                if not name.endswith('/'):
                    artifact.ci.scan(name, archive.read(name))
            marker = json.loads(archive.read('release.json'))
            require(all(marker.get(k) == release[k] for k in ('commit', 'runId', 'runAttempt')), 'Legacy marker mismatch')
    else:
        for key in ('repository', 'site', 'commit', 'runId', 'runAttempt', 'workflow', 'sha256'):
            require(metadata.get(key) == release.get(key), f'Release metadata mismatch: {key}')
        if metadata.get('schemaVersion') == 1:
            require(metadata['workflow'] == '.github/workflows/ci.yml' and metadata['event'] == 'push' and metadata['ref'] == 'refs/heads/main', 'Not trusted v1 main artifact')
            release_id = f"{site}-{release['runId']}-{release['runAttempt']}"
            expected = {**metadata, 'schemaVersion': 1, 'releaseAuthorized': False, 'artifactName': release_id + '-static', 'releaseId': release_id}
            artifact.ci.verify(directory, expected)
        else:
            require(metadata.get('workflowSha') == release.get('workflowSha'), 'Wrong trusted harness SHA')
            artifact.verify(directory, metadata)
    return metadata


def read_url(url):
    require(url.startswith('https://'), 'HTTPS origin required')
    request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache'})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, dict((k.lower(), v) for k, v in response.headers.items()), response.read()
    except urllib.error.HTTPError as error:
        return error.code, dict((k.lower(), v) for k, v in error.headers.items()), error.read()


def marker_check(url, release, metadata, directory=None):
    if release['repository'] == LEGACY_DILORETO:
        from legacy_diloreto import verify_serving_bytes
        verify_serving_bytes(url, directory, read_url)
        return
    status, _, body = read_url(url.rstrip('/') + '/release.json?release=' + release['runId'] + '-' + release['runAttempt'])
    require(status == 200, 'Current release marker unavailable; never reset baseline')
    marker = json.loads(body)
    expected = {k: metadata[k] for k in ('commit', 'runId', 'runAttempt')} if release['repository'] == LEGACY else {k: v for k, v in metadata.items() if k not in ('sha256', 'deploymentRoot')}
    require(marker == expected, 'Served release marker mismatch')


def artifact_prefix(release):
    if release['repository'] == LEGACY_DILORETO:
        require(release['site'] == 'diloreto' and release['workflow'] == '.github/workflows/deploy.yml', 'Unallowlisted legacy store')
        require(all(re.fullmatch(r'[1-9][0-9]*', release[k]) for k in ('runId', 'runAttempt')), 'Invalid legacy store identity')
        return f"legacy-captures/soodoh-diloreto-website/{release['runId']}/{release['runAttempt']}"
    if release['repository'] == LEGACY:
        require(release['site'] == 'paul' and release['workflow'] == '.github/workflows/deploy.yml', 'Unallowlisted legacy store')
        return f"releases/{release['runId']}/{release['runAttempt']}"
    require(release['repository'] == 'soodoh/websites', 'Unallowlisted release store')
    return f"releases-v2/soodoh-websites/{release['site']}/{release['runId']}/{release['runAttempt']}"


def download_retained(aws, config, release, directory):
    prefix = artifact_prefix(release)
    directory.mkdir()
    for name in ('site.zip', 'site.zip.sha256', 'metadata.json'):
        aws.get_object(config['releaseBucket'], f'{prefix}/{name}', config['releaseOwner'], directory / name)


def retain(aws, config, release, directory):
    for name in ('site.zip', 'site.zip.sha256', 'metadata.json'):
        # Immutable new prefix; do not rewrite old S3 objects or silently overwrite an attempt.
        aws.call('s3api', 'put-object', bucket=config['releaseBucket'], key=f'{artifact_prefix(release)}/{name}', expected_bucket_owner=config['releaseOwner'], if_none_match='*', body=str(directory / name))


def download_ci(release, directory):
    repo = release['repository']
    require(repo == 'soodoh/websites', 'Legacy recovery uses only retained S3 bytes')
    name = f"{release['site']}-{release['runId']}-{release['runAttempt']}-static" + ('-v2' if release['workflow'] != '.github/workflows/ci.yml' else '')
    page, matches = 1, []
    while True:
        batch = gh(f"repos/{repo}/actions/runs/{release['runId']}/artifacts?per_page=100&page={page}")['artifacts']
        matches.extend(a for a in batch if a['name'] == name and not a['expired'])
        if len(batch) < 100:
            break
        page += 1
    require(len(matches) == 1, 'Missing/expired/ambiguous artifact; freshly validate immutable ref')
    selected = matches[0]
    result = subprocess.run(['gh', 'api', f"repos/{repo}/actions/artifacts/{selected['id']}/zip"], capture_output=True, check=True)
    require(selected.get('digest') == 'sha256:' + hashlib.sha256(result.stdout).hexdigest(), 'Downloaded artifact digest mismatch')
    directory.mkdir()
    with zipfile.ZipFile(io.BytesIO(result.stdout)) as archive:
        require(set(archive.namelist()) == {'site.zip', 'site.zip.sha256', 'metadata.json'} and len(archive.namelist()) == 3, 'Unexpected artifact payload')
        for name in archive.namelist():
            (directory / name).write_bytes(archive.read(name))
    metadata = json.loads((directory / 'metadata.json').read_text())
    # Hash comes from the immutable, digest-checked archive, not an arbitrary CLI value.
    release['sha256'] = metadata['sha256']
    return metadata


class Amplify:
    def __init__(self, aws, config, state):
        self.aws, self.config, self.state = aws, config, state
        self.terminal_jobs = set()

    def no_active_jobs(self, branch):
        jobs = self.aws.call('amplify', 'list-jobs', app_id=self.config['appId'], branch_name=branch)['jobSummaries']
        require(all(j['status'] in TERMINAL for j in jobs), 'Active/unknown Amplify job; source/CMS drain and reconciliation required')

    def wait(self, branch, job_id, commit=None, timeout=1800):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            job = self.aws.call('amplify', 'get-job', app_id=self.config['appId'], branch_name=branch, job_id=job_id)['job']['summary']
            if job['status'] in TERMINAL:
                self.terminal_jobs.add((branch, job_id))
            require(commit is None or job['commitId'] == commit, 'Amplify selected another source commit')
            if job['status'] in TERMINAL:
                require(job['status'] == 'SUCCEED', 'Amplify job failed')
                return
            require(job['status'] in {'CREATED', 'PENDING', 'PROVISIONING', 'RUNNING', 'CANCELLING'}, 'Unknown Amplify status')
            time.sleep(10)
        raise TimeoutError('Amplify release timeout')

    def stop(self, branch, job_id):
        if (branch, job_id) in self.terminal_jobs:
            return
        status = self.aws.call('amplify', 'get-job', app_id=self.config['appId'], branch_name=branch, job_id=job_id)['job']['summary']['status']
        if status in TERMINAL:
            self.terminal_jobs.add((branch, job_id))
            return
        try:
            self.aws.call('amplify', 'stop-job', app_id=self.config['appId'], branch_name=branch, job_id=job_id)
        except Exception:
            # A rejected stop is not terminal evidence. Reconcile the exact owned job,
            # even after a stop error; callers retain any original UnknownOutcome.
            pass
        deadline = time.monotonic() + 1200
        while time.monotonic() < deadline:
            status = self.aws.call('amplify', 'get-job', app_id=self.config['appId'], branch_name=branch, job_id=job_id)['job']['summary']['status']
            if status in TERMINAL:
                self.terminal_jobs.add((branch, job_id))
                return
            time.sleep(10)
        raise UnknownOutcome('Cannot certify terminal cleanup; leave intent unresolved')

    def deploy_zip(self, branch, archive, checksum):
        self.no_active_jobs(branch)
        require(hashlib.sha256(archive.read_bytes()).hexdigest() == checksum, 'ZIP bytes changed before upload')
        result = self.aws.call('amplify', 'create-deployment', app_id=self.config['appId'], branch_name=branch)
        job_id = result['jobId']
        try:
            self.state.job(branch, job_id)
            request = urllib.request.Request(result['zipUploadUrl'], data=archive.read_bytes(), method='PUT', headers={'Content-Type': 'application/zip'})
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    require(response.status == 200, 'Upload failed')
            except Exception as error:
                raise UnknownOutcome('Ambiguous upload; reconcile owned job before any recovery') from error
            self.aws.call('amplify', 'start-deployment', app_id=self.config['appId'], branch_name=branch, job_id=job_id)
            self.wait(branch, job_id, timeout=1200)
        except UnknownOutcome:
            # Cleanup only this invocation's exact job. Never convert lost ownership into
            # ordinary rollback eligibility, even if cleanup itself cannot be confirmed.
            try:
                self.stop(branch, job_id)
            except Exception:
                pass
            raise
        except BaseException:
            self.stop(branch, job_id)
            raise
        return job_id


def acceptance(site, url, release, metadata, config, directory):
    marker_check(url, release, metadata, directory)
    # No selected-ref lifecycle executes here. This cwd is the trusted workflow-SHA harness.
    environment = {k: os.environ[k] for k in ('PATH', 'HOME', 'CI', 'CHROME_PATH', 'RUNNER_TEMP') if k in os.environ}
    app = ROOT / 'apps' / site
    if site == 'paul':
        command(['bash', 'scripts/hosting-acceptance.sh', url, release['runId'], release['runAttempt'], release['commit'], '1' if config.get('domainRedirects') and url == config['productionUrl'] else '0'], app, environment)
        command(['bun', 'run', 'test:e2e'], app, {**environment, 'PLAYWRIGHT_BASE_URL': url, 'PLAYWRIGHT_EXPECT_STATIC_404': '1'})
        command(['bun', 'run', 'lighthouse'], app, {**environment, 'LHCI_URL': url})
    else:
        origin = config['originUrl'].rstrip('/')
        if release['repository'] == LEGACY_DILORETO:
            marker_check(origin, release, metadata, directory)
        status, _, origin_body = read_url(origin + '/')
        edge_status, headers, edge_body = read_url(url.rstrip('/') + '/')
        require(status == edge_status == 200 and origin_body == edge_body and b'The DiLoreto Family' in origin_body and b'google-site-verification' in origin_body, 'Origin/edge body mismatch')
        require(b'.netlify' not in edge_body and 'no-cache' in headers.get('cache-control', '') and headers.get('x-content-type-options') == 'nosniff', 'Origin/edge policy mismatch')
        with zipfile.ZipFile(directory / 'site.zip') as archive:
            for path in ('/', '/areyou', '/robots.txt', '/favicon.png', '/apple-touch-icon.png'):
                expected_path = {'/': 'index.html', '/areyou': 'areyou/index.html'}.get(path, path[1:])
                for base in (origin, url.rstrip('/')):
                    code, _, body = read_url(base + path)
                    require(code == 200 and body == archive.read(expected_path), 'Origin/edge bytes differ from retained ZIP')
            asset = re.search(rb'/assets/[^" ]+\.js', origin_body)
            require(asset, 'No JavaScript asset')
            asset_path = asset[0].decode()
            for base in (origin, url.rstrip('/')):
                code, asset_headers, body = read_url(base + asset_path)
                require(code == 200 and body == archive.read(asset_path[1:]) and 'max-age=31536000' in asset_headers.get('cache-control', '') and 'immutable' in asset_headers.get('cache-control', ''), 'Asset/cache mismatch')
                code, _, body = read_url(base + '/not-a-real-route')
                require(code == 404 and b'404: Page Not Found' in body, 'Incorrect static 404')
        command(['bash', 'scripts/test-playwright-docker.sh', 'tests/deployment-smoke.spec.ts', '--project=chromium'], app, {**environment, 'PLAYWRIGHT_BASE_URL': url, 'PLAYWRIGHT_SKIP_BUILD': '1'})
    marker_check(url, release, metadata, directory)


def release_static(site, aws, config, state, selected, policy, operation, recheck):
    before = state.value.copy()
    previous = before['currentRelease']
    with tempfile.TemporaryDirectory() as temporary:
        root = Path(temporary)
        old, new = root / 'previous', root / 'selected'
        download_retained(aws, config, previous, old)
        old_metadata = verify_release(old, previous, policy, site)
        marker_check(config['productionUrl'], previous, old_metadata, old)
        if site == 'diloreto' and previous['repository'] == LEGACY_DILORETO:
            marker_check(config['originUrl'], previous, old_metadata, old)
        if operation == 'restore':
            download_retained(aws, config, selected, new)
        else:
            download_ci(selected, new)
        metadata = verify_release(new, selected, policy, site)
        recheck()
        state.claim(selected, operation, f"{os.environ['GITHUB_RUN_ID']}/{os.environ['GITHUB_RUN_ATTEMPT']}")
        amplify = Amplify(aws, config, state)
        if site == 'paul':
            amplify.deploy_zip(config['candidateBranch'], new / 'site.zip', selected['sha256'])
            acceptance(site, config['candidateUrl'], selected, metadata, config, new)
        if operation != 'restore':
            retain(aws, config, selected, new)
        recheck()  # Candidate acceptance/upload can outlive relevant main changes.
        try:
            amplify.deploy_zip(config['branch'], new / 'site.zip', selected['sha256'])
            acceptance(site, config['productionUrl'], selected, metadata, config, new)
        except UnknownOutcome:
            raise  # No further promotion/rollback after CAS or ambiguous cloud outcome.
        except Exception:
            # Only a reconciled terminal production job may be restored; check again.
            amplify.no_active_jobs(config['branch'])
            amplify.deploy_zip(config['branch'], old / 'site.zip', previous['sha256'])
            acceptance(site, config['productionUrl'], previous, old_metadata, config, old)
            state.finish(previous, before['highWatermark'], outcome='restored-previous')
            raise RuntimeError('Release failed; previous verified bytes restored, this run must fail')
        state.finish(selected, selected['commit'] if operation == 'release' else before['highWatermark'])
