"""Repository-connected SSR releases; never uploads CI/fixture compute bundles."""
import base64
import json
import os
import re
import subprocess

from state import require
from static import Amplify, ROOT, command, gh, observe, read_url


def ref_sha(branch):
    commit = gh(f'repos/soodoh/websites/git/ref/heads/{branch}')['object']['sha']
    require(re.fullmatch(r'[0-9a-f]{40}', commit), 'Missing/unknown production ref metadata')
    return commit


def promote(branch, previous, commit):
    require(branch in ('amplify-production', 'sarabeth-production'), 'Unknown SSR ref')
    # Ref must already exist via separately approved preparation; no implicit create.
    require(ref_sha(branch) == previous, 'Release ref drift before promotion')
    credential = base64.b64encode(('x-access-token:' + os.environ['GH_TOKEN']).encode()).decode()
    environment = {**os.environ, 'GIT_CONFIG_COUNT': '1', 'GIT_CONFIG_KEY_0': 'http.https://github.com/.extraheader', 'GIT_CONFIG_VALUE_0': 'AUTHORIZATION: basic ' + credential}
    result = subprocess.run(['git', 'push', f'--force-with-lease=refs/heads/{branch}:{previous}', 'origin', f'{commit}:refs/heads/{branch}'], cwd=ROOT, env=environment, capture_output=True, timeout=300)
    require(result.returncode == 0, 'Release ref CAS failed; keep intent for reconciliation')
    require(ref_sha(branch) == commit, 'Release ref CAS not confirmed')


def smoke(site, config, commit, url, default_domain=None):
    environment = {k: os.environ[k] for k in ('PATH', 'HOME', 'CI', 'CHROME_PATH', 'RUNNER_TEMP') if k in os.environ}
    app_root = ROOT / 'apps' / site
    if site == 'carolyn':
        command(['bash', 'scripts/playwright-docker.sh', '--config=playwright.amplify.config.ts'], app_root, {**environment, 'AMPLIFY_BASE_URL': url, 'AMPLIFY_DEFAULT_ORIGIN': f"https://{config['branch']}.{default_domain}", 'AMPLIFY_EXPECTED_RELEASE_COMMIT': commit})
    else:
        command(['bun', 'scripts/smoke-deployment.ts', url, commit], app_root, environment)


def lighthouse(url):
    # Retain both checks and the baseline's NO automatic Lighthouse rollback policy.
    environment = {k: os.environ[k] for k in ('PATH', 'HOME', 'CI', 'CHROME_PATH', 'RUNNER_TEMP') if k in os.environ}
    failures = []
    for form in ('mobile', 'desktop'):
        try:
            command(['bun', 'x', '--no-install', 'lhci', 'autorun', '--config=lighthouserc.cjs'], ROOT / 'apps/sarabeth', {**environment, 'LHCI_BASE_URL': url, 'LHCI_FORM_FACTOR': form})
        except subprocess.CalledProcessError:
            failures.append(form)
    require(not failures, 'Lighthouse baseline failed; no automatic rollback')


def release_ssr(site, aws, config, state, selected, policy, recheck, operation='release'):
    require(site in ('carolyn', 'sarabeth') and selected['repository'] == 'soodoh/websites', 'Not monorepo SSR source')
    candidate = operation == 'candidate'
    require(operation in ('candidate', 'release'), 'Unknown SSR operation')
    if candidate:
        require(site == 'sarabeth' and config.get('candidateEnabled') is True, 'Candidate operation disabled or unimplemented')
        require(state.value.get('ssrProductionAccepted') is not True, 'Candidate operation is first-cutover only')
    else:
        require(state.value.get('ssrProductionAccepted') is True and state.value['currentRelease'].get('repository') == 'soodoh/websites', f'{site} first-cutover candidate integration required; routine release denied')
    observe(policy, site, selected)
    app = aws.call('amplify', 'get-app', app_id=config['appId'])['app']
    require(app['repository'].removesuffix('.git').rstrip('/') == 'https://github.com/soodoh/websites', 'Repository reconnection not verified')
    branch = config['branch']
    branch_config = aws.call('amplify', 'get-branch', app_id=config['appId'], branch_name=branch)['branch']
    require(branch_config.get('enableAutoBuild') is False and branch_config.get('enablePullRequestPreview') is False, 'Unexpected automatic writer')
    require(branch_config['environmentVariables']['AMPLIFY_MONOREPO_APP_ROOT'] == f'apps/{site}', 'Wrong Amplify build root')
    domain = None
    if candidate:
        from sarabeth_transition import domain_snapshot, candidate_url
        candidate_url(config, app)
        domain = domain_snapshot(aws, config)
        require(all(item['branchName'] != branch for item in domain['settings']), 'Candidate branch already serves production')
    previous_ref = ref_sha(branch)
    amplify = Amplify(aws, config, state)
    amplify.no_active_jobs(branch)
    recheck()
    state.claim(selected, operation, f"{os.environ['GITHUB_RUN_ID']}/{os.environ['GITHUB_RUN_ATTEMPT']}", baseline=dict(branch=branch, commit=previous_ref))
    promote(branch, previous_ref, selected['commit'])
    amplify.no_active_jobs(branch)
    result = aws.call('amplify', 'start-job', app_id=config['appId'], branch_name=branch, job_type='RELEASE', commit_id=selected['commit'], commit_message='GitHub Actions release ' + selected['commit'], job_reason='GitHub Actions validated ' + selected['commit'])['jobSummary']
    job_id = result['jobId']
    try:
        state.job(branch, job_id)
        require(result['commitId'] == selected['commit'], 'Start-job selected wrong revision')
        amplify.wait(branch, job_id, selected['commit'])
        require(ref_sha(branch) == selected['commit'], 'Source ref changed during build')
        url = config['candidateUrl'] if candidate else config['productionUrl']
        status, _, body = read_url(url.rstrip('/') + '/__release.json?job=' + job_id)
        marker = json.loads(body)
        require(status == 200 and marker == dict(schemaVersion=1, kind='website-ssr-production', site=site, commit=selected['commit'], appId=config['appId'], branch=branch, jobId=job_id), 'Actual production bundle/job attestation mismatch')
        smoke(site, config, selected['commit'], url, app['defaultDomain'])
        if candidate:
            from sarabeth_transition import verify_switch, unchanged_candidate_job
            lighthouse(url)
            verify_switch(aws, config, selected['commit'], job_id, 'candidate')
            unchanged_candidate_job(aws, config, job_id)
            require(domain_snapshot(aws, config) == domain, 'Production domain changed during candidate build')
            recheck()
            state.finish_candidate({**selected, 'amplifyJobId': job_id}, domain, {key: config[key] for key in ('appId', 'branch', 'candidateUrl', 'productionUrl')})
        else:
            state.assert_owned()
            if site == 'sarabeth':
                # Never written during candidate preparation; exact RELEASE needs no LKG.
                aws.call('ssm', 'put-parameter', name='/sarabeth-studio/production/last-known-good-sha', type='String', value=selected['commit'], overwrite=True)
            state.finish({**selected, 'amplifyJobId': job_id}, selected['commit'])
    except BaseException:
        # Preserve intent, ref and legacy recovery facts. RETRY is not an SSR rollback.
        try:
            amplify.stop(branch, job_id)
        except Exception:
            pass
        raise
    if site == 'sarabeth' and not candidate:
        lighthouse(config['productionUrl'])
