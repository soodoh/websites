"""Paul-only cutover support behind paul_recovery_entry's protected admission.

Pins are trusted checkout inputs, not an attestation supplied by the downloaded ZIP.
Checked-in workflow and runtime activation remain separately locked.
"""
import copy
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import tempfile
import urllib.parse
import urllib.request
import zipfile

from state import State, UnknownOutcome, require
from static import Amplify

ROOT = Path(__file__).resolve().parents[2]
REPOSITORY = 'soodoh/websites'
LEGACY = 'soodoh/portfolio-website'
BUCKET = 'pauldiloreto-amplify-hosting-verifiedreleasebucket-idabawspxy3s'
OWNER = '658271954302'
APP = 'd121ux7va6hz6j'
SUBJECT = 'repo:soodoh@18269267/websites@1358469291:environment:production-portfolio'
CANDIDATE = f'https://candidate.{APP}.amplifyapp.com'
RELEASE_KEYS = ('repository', 'site', 'workflow', 'runId', 'runAttempt', 'commit', 'sha256')


def strict_json(body):
    def pairs(items):
        result = {}
        for key, value in items:
            require(key not in result, 'Duplicate JSON key')
            result[key] = value
        return result
    def invalid(_):
        raise ValueError('Nonfinite JSON value')
    return json.loads(body, object_pairs_hook=pairs, parse_constant=invalid)


def recovery_pins():
    pins = strict_json((ROOT / 'config/paul-legacy-recovery.json').read_bytes())
    expected = dict(schemaVersion=1, site='paul', repository=LEGACY, repositoryId='81884767',
                    ownerId='18269267', workflow='.github/workflows/deploy.yml', workflowId='315997019',
                    event='push', ref='refs/heads/main', deploymentRoot='dist/client',
                    bucket=BUCKET, expectedOwner=OWNER,
                    linkage='manually-reviewed-metadata-not-cryptographic-attestation')
    require(all(pins.get(k) == v for k, v in expected.items()), 'Wrong recovery pin identity/linkage')
    for key, pattern in [('runId', r'[1-9][0-9]*'), ('runAttempt', r'[1-9][0-9]*'),
                         ('commit', r'[0-9a-f]{40}'), ('sha256', r'[0-9a-f]{64}')]:
        require(isinstance(pins.get(key), str) and re.fullmatch(pattern, pins[key]), f'Invalid pin {key}')
    require(set(pins.get('objects', {})) == {'metadata.json', 'site.zip', 'site.zip.sha256'}, 'Missing pinned objects')
    for name, obj in pins['objects'].items():
        require(set(obj) == {'key', 'versionId', 'bytes', 'sha256'}, 'Wrong object pin schema')
        require(obj['key'] == f"releases/{pins['runId']}/{pins['runAttempt']}/{name}", 'Wrong pinned key')
        require(isinstance(obj['versionId'], str) and re.fullmatch(r'[A-Za-z0-9._-]+', obj['versionId'])
                and obj['versionId'] != 'null', 'Missing pinned version')
        require(type(obj['bytes']) is int and 0 < obj['bytes'] <= (8 * 1024 * 1024 if name == 'site.zip' else 65536), 'Unsafe object length')
        require(isinstance(obj['sha256'], str) and re.fullmatch(r'[0-9a-f]{64}', obj['sha256']), 'Invalid object digest')
    require(pins['objects']['site.zip']['sha256'] == pins['sha256'], 'ZIP pin mismatch')
    return pins


def pinned_release(pins):
    return {key: pins[key] for key in RELEASE_KEYS}


def configuration(policy, runtime):
    require(policy.get('schemaVersion') == 1 and runtime.get('schemaVersion') == 1, 'Wrong preparation schema')
    require(policy.get('repository') == REPOSITORY and policy.get('repositoryId') == '1358469291'
            and policy.get('ownerId') == '18269267', 'Wrong monorepo identity')
    config = {**policy['sites']['paul'], **runtime['sites']['paul']}
    expected = dict(account=OWNER, region='us-east-1', appId=APP, oidcSubject=SUBJECT,
                    roleArn=f'arn:aws:iam::{OWNER}:role/pauldiloreto-amplify-hosting-GitHubDeploymentRole-JPjJmwTE3kcw',
                    concurrency='portfolio-production',
                    environment='production-portfolio', branch='main', candidateBranch='candidate',
                    candidateUrl=CANDIDATE, productionUrl='https://pauldiloreto.com',
                    releaseBucket=BUCKET, releaseOwner=OWNER, stateBucket=BUCKET, stateOwner=OWNER,
                    stateKey='release-state/soodoh-websites/paul.json')
    require(all(config.get(k) == v for k, v in expected.items()), 'Wrong Paul preparation binding')
    return config


def admission(policy, runtime, operation):
    require(runtime.get('publicationLocked') is False, 'Publication lock: separate reviewed activation required')
    config = configuration(policy, runtime)
    require(operation in ('bootstrap', 'rehearsal') and config.get(operation + 'Enabled') is True, 'Operation disabled')
    require(config.get('sourceWriterDrained') is True, 'Legacy shared-candidate writer must be frozen/drained')
    return config


def bootstrap_proposal(policy, runtime, baseline):
    """Pure dry-run. Baseline is an explicit reviewed monorepo ordering floor, NOT serving evidence."""
    configuration(policy, runtime)
    pins = recovery_pins()
    require(set(baseline) == {'repository', 'repositoryId', 'site', 'ref', 'commit', 'reviewed'}, 'Explicit monorepo baseline required')
    require(baseline['repository'] == REPOSITORY and baseline['repositoryId'] == '1358469291'
            and baseline['site'] == 'paul' and baseline['ref'] == 'refs/heads/main'
            and baseline['reviewed'] is True, 'Baseline is not reviewed monorepo main')
    require(isinstance(baseline['commit'], str) and re.fullmatch(r'[0-9a-f]{40}', baseline['commit'])
            and baseline['commit'] != pins['commit'], 'Legacy identity cannot be monorepo high-watermark')
    return dict(schemaVersion=1, repository=REPOSITORY, site='paul', generation=0, intent=None,
                currentRelease=pinned_release(pins), highWatermark=baseline['commit'],
                bootstrapBaseline=copy.deepcopy(baseline))


def bootstrap_state(aws, policy, runtime, baseline, invocation=None):
    config = admission(policy, runtime, 'bootstrap')
    proposed = bootstrap_proposal(policy, runtime, baseline)
    if invocation is not None:
        require(isinstance(invocation, str) and re.fullmatch(r'[1-9][0-9]*/1', invocation), 'Invalid bootstrap invocation')
        proposed['bootstrapInvocation'] = invocation
    return State(aws, config, 'paul').bootstrap(proposed)


def download_recovery(aws, config, release, directory):
    """Version-only reads for this reviewed baseline; no GitHub or latest-object fallback."""
    pins = recovery_pins()
    require(release == pinned_release(pins), 'Release differs from approved recovery pin')
    require(config.get('releaseBucket') == pins['bucket'] and config.get('releaseOwner') == pins['expectedOwner'], 'Wrong recovery storage')
    directory.mkdir()
    for name, obj in pins['objects'].items():
        path = directory / name
        meta = aws.get_object(pins['bucket'], obj['key'], pins['expectedOwner'], path, version_id=obj['versionId'])
        require(meta.get('VersionId') == obj['versionId'] and meta.get('ContentLength') == obj['bytes']
                and meta.get('ServerSideEncryption') == 'AES256' and meta.get('ETag'), 'Returned object identity mismatch')
        require(path.stat().st_size == obj['bytes'] and hashlib.sha256(path.read_bytes()).hexdigest() == obj['sha256'], 'Recovery bytes/digest mismatch')
    metadata = strict_json((directory / 'metadata.json').read_bytes())
    require(metadata == {k: pins[k] for k in ('commit', 'runId', 'runAttempt', 'sha256', 'deploymentRoot')}, 'Legacy metadata mismatch')
    require((directory / 'site.zip.sha256').read_bytes() == f"{pins['sha256']}  site.zip\n".encode(), 'Checksum file mismatch')
    verify_archive(directory / 'site.zip', release)
    return metadata


def verify_archive(path, release):
    """Bounded CRC/shape checks before hosting writes; never extract or execute legacy code."""
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        require(0 < len(entries) <= 10000 and len({e.filename for e in entries}) == len(entries), 'Duplicate/excessive ZIP members')
        require(sum(e.file_size for e in entries) <= 128 * 1024 * 1024, 'Excessive archive expansion')
        require({'index.html', '404.html', 'release.json'}.issubset(archive.namelist()), 'Missing static routes')
        for entry in entries:
            name = entry.filename
            parts = name.rstrip('/').split('/')
            require(name and '\\' not in name and ':' not in name and not PurePosixPath(name).is_absolute()
                    and all(part not in ('', '.', '..') for part in parts)
                    and all(ord(c) >= 32 and ord(c) != 127 for c in name), 'Unsafe archive path')
            mode = stat.S_IFMT(entry.external_attr >> 16)
            require(mode in (0, stat.S_IFREG, stat.S_IFDIR) and not entry.flag_bits & 1, 'Unsafe archive type/encryption')
            require(entry.file_size <= 32 * 1024 * 1024, 'Excessive ZIP member')
            with archive.open(entry) as stream:
                total = 0
                while chunk := stream.read(65536):
                    total += len(chunk)
                    require(total <= entry.file_size, 'ZIP length mismatch')
                require(total == entry.file_size, 'ZIP length mismatch')
        require(archive.getinfo('release.json').file_size <= 65536, 'Oversized release marker')
        require(strict_json(archive.read('release.json')) == {k: release[k] for k in ('commit', 'runId', 'runAttempt')}, 'Legacy marker mismatch')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        fp.close()
        raise ValueError('Candidate redirect refused before follow')


def verify_candidate(url, directory):
    """Data-only recovery check; isolated browser/Lighthouse acceptance is a later gate."""
    require(url == CANDIDATE, 'Not the approved isolated candidate origin')
    opener = urllib.request.build_opener(NoRedirect())
    with zipfile.ZipFile(directory / 'site.zip') as archive:
        for route, member in [('/', 'index.html'), ('/release.json', 'release.json'), ('/404.html', '404.html')]:
            expected = archive.read(member)
            request = urllib.request.Request(url + route, headers={'Cache-Control': 'no-cache'})
            with opener.open(request, timeout=30) as response:
                require(response.status == 200 and response.url == url + route, 'Wrong candidate response')
                require(response.read(len(expected) + 1) == expected, 'Candidate bytes mismatch')


class CandidateAws:
    """Constrain the existing Amplify lifecycle, including its failure cleanup, to one branch."""
    def __init__(self, aws, state, recheck=None):
        self.aws, self.state, self.recheck = aws, state, recheck

    def assert_fresh(self):
        self.state.assert_owned()
        if self.recheck:
            jobs = self.state.value['intent']['jobs']
            self.recheck(jobs[-1]['jobId'] if jobs else None)

    def call(self, service, operation, **options):
        require(service == 'amplify' and operation in {'list-jobs', 'get-job', 'create-deployment', 'start-deployment', 'stop-job'}, 'Noncandidate hosting operation')
        require(options.get('app_id') == APP and options.get('branch_name') == 'candidate', 'Production destination forbidden')
        self.assert_fresh()
        return self.aws.call(service, operation, **options)


class CandidateAmplify(Amplify):
    def deploy_zip(self, branch, archive, checksum):
        self.no_active_jobs(branch)
        body = archive.read_bytes()
        require(hashlib.sha256(body).hexdigest() == checksum, 'ZIP bytes changed before upload')
        result = self.aws.call('amplify', 'create-deployment', app_id=APP, branch_name=branch)
        job = result.get('jobId')
        require(isinstance(job, str) and re.fullmatch(r'[1-9][0-9]*', job), 'Unknown candidate job')
        self.state.job(branch, job)
        self.aws.assert_fresh()
        # No automatic compensation, even for candidate: retain intent/job for reconciliation.
        upload = urllib.parse.urlsplit(result.get('zipUploadUrl', ''))
        require(upload.scheme == 'https' and upload.port in (None, 443) and not upload.username
                and not upload.password and not upload.fragment and upload.hostname
                and any(upload.hostname.endswith(suffix) for suffix in ('.s3.amazonaws.com', '.s3.us-east-1.amazonaws.com')),
                'Unsafe candidate S3 upload destination')
        request = urllib.request.Request(result['zipUploadUrl'], data=body, method='PUT', headers={'Content-Type': 'application/zip'})
        try:
            with urllib.request.build_opener(NoRedirect()).open(request, timeout=120) as response:
                require(response.status == 200, 'Upload failed')
        except Exception as error:
            raise UnknownOutcome('Unknown candidate upload outcome; reconcile without retry') from error
        self.aws.call('amplify', 'start-deployment', app_id=APP, branch_name=branch, job_id=job)
        self.wait(branch, job, timeout=1200)
        return job


def rehearse_candidate(aws, policy, runtime, release, invocation, *, recheck=None, acceptance=None):
    """Never promote, restore production, retain artifacts, or change the production watermark."""
    config = admission(policy, runtime, 'rehearsal')
    require(isinstance(invocation, str) and re.fullmatch(r'[1-9][0-9]*/[1-9][0-9]*', invocation), 'Invalid invocation')
    pins = recovery_pins()
    require(release == pinned_release(pins), 'Release differs from approved recovery pin')
    state = State(aws, config, 'paul')
    before = state.read()
    require(type(before['generation']) is int, 'Malformed production state generation')
    current = before['currentRelease']
    require(current.get('site') == 'paul' and current.get('repository') in (REPOSITORY, LEGACY), 'Wrong retained production identity')
    workflows = {'.github/workflows/deploy.yml'} if current['repository'] == LEGACY else {'.github/workflows/ci.yml', '.github/workflows/release-site.yml'}
    require(current.get('workflow') in workflows, 'Wrong retained production workflow')
    for key, pattern in [('commit', r'[0-9a-f]{40}'), ('sha256', r'[0-9a-f]{64}'),
                         ('runId', r'[1-9][0-9]*'), ('runAttempt', r'[1-9][0-9]*')]:
        require(isinstance(current.get(key), str) and re.fullmatch(pattern, current[key]), 'Malformed retained production identity')
    require(before['intent'] is None, 'Unresolved intent; reconcile first')
    with tempfile.TemporaryDirectory() as temporary:
        directory = Path(temporary) / 'recovery'
        download_recovery(aws, config, release, directory)
        branch = aws.call('amplify', 'get-branch', app_id=APP, branch_name='candidate')['branch']
        require(branch.get('branchArn') == f'arn:aws:amplify:us-east-1:{OWNER}:apps/{APP}/branches/candidate'
                and branch.get('branchName') == 'candidate' and branch.get('stage') == 'BETA'
                and branch.get('enableAutoBuild') is False and branch.get('enablePullRequestPreview') is False,
                'Candidate branch is not isolated from production/automatic writers')
        state.assert_owned()
        if recheck:
            recheck()
        state.claim(release, 'candidate-recovery', invocation)
        guarded = CandidateAws(aws, state, recheck)
        amplify = CandidateAmplify(guarded, config, state)
        amplify.deploy_zip('candidate', directory / 'site.zip', release['sha256'])
        guarded.assert_fresh()
        verify_candidate(CANDIDATE, directory)
        if acceptance:
            acceptance(release)
        guarded.assert_fresh()
        proposed = copy.deepcopy(state.value)
        proposed['generation'] += 1
        proposed['lastCandidateRecovery'] = dict(release=release, invocation=invocation,
                                                jobs=copy.deepcopy(proposed['intent']['jobs']),
                                                verification=('isolated-candidate-hosting-browser-lighthouse-not-production'
                                                              if acceptance else 'candidate-bytes-only-not-production-acceptance'))
        proposed['intent'] = None
        require(all(proposed.get(k) == before.get(k) for k in ('currentRelease', 'highWatermark', 'lastLifecycleReceipt')), 'Production state changed')
        state.write(proposed)
        state.assert_owned()
        return copy.deepcopy(state.value['lastCandidateRecovery'])
