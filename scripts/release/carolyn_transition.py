"""Carolyn isolated first-cutover build, then a separately approved production rebuild.

No branch creation, domain mutation, ZIP promotion or automatic rollback. Candidate
and production attest different jobs at the same SHA, not identical output bytes.
"""
import json
import os
import re
import urllib.error
import urllib.request

from state import require
from static import Amplify, observe

PRODUCTION_FIELDS = ('currentRelease', 'highWatermark', 'lastLifecycleReceipt', 'ssrProductionAccepted')


def candidate_branch(value):
    require(isinstance(value, str) and re.fullmatch(r'[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?', value)
            and value not in ('main', 'amplify-production', 'sarabeth-production'),
            'Exact isolated Carolyn candidate branch required')
    return value


def configuration(config, operation):
    require(operation in ('candidate', 'promote'), 'Unknown Carolyn transition')
    require(config.get('candidateEnabled' if operation == 'candidate' else 'promotionEnabled') is True,
            'Carolyn transition operation disabled')
    candidate_branch(config.get('candidateBranch'))
    require(config.get('branch') == 'amplify-production', 'Wrong Carolyn production branch')
    require(isinstance(config.get('appId'), str) and re.fullmatch(r'd[a-z0-9]+', config['appId']), 'Invalid Carolyn app')
    expected = f"https://{config['candidateBranch']}.{config['appId']}.amplifyapp.com"
    require(config.get('candidateUrl') == expected, 'Candidate must use its exact approved default-domain origin')
    require(config.get('productionUrl') == 'https://carolyndiloreto.com', 'Production acceptance requires original canonical origin')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def read_marker(url):
    # Candidate marker redirects must never probe canonical/legacy production.
    request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache'})
    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=30) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()


def hosting(config):
    return {key: config[key] for key in ('appId', 'branch', 'candidateBranch', 'candidateUrl', 'productionUrl')}


def no_active_jobs(aws, config, branch):
    # A successful newest job does not prove an older queued writer was drained.
    tokens = set()
    token = None
    for _ in range(20):
        options = dict(app_id=config['appId'], branch_name=branch, max_results=50)
        if token is not None:
            options['next_token'] = token
        result = aws.call('amplify', 'list-jobs', **options)
        require(all(job.get('status') in ('SUCCEED', 'FAILED', 'CANCELLED') for job in result['jobSummaries']),
                'Active/unknown Carolyn branch writer')
        token = result.get('nextToken')
        if not token:
            return
        require(isinstance(token, str) and token not in tokens, 'Incomplete Carolyn job inventory')
        tokens.add(token)
    raise ValueError('Carolyn job inventory limit reached; reconcile writers')


def inspect(aws, config):
    app = aws.call('amplify', 'get-app', app_id=config['appId'])['app']
    require(app.get('appId') == config['appId'] and app.get('platform') == 'WEB_COMPUTE'
            and app.get('repository', '').removesuffix('.git').rstrip('/') == 'https://github.com/soodoh/websites'
            and app.get('defaultDomain') == config['appId'] + '.amplifyapp.com', 'Wrong Carolyn app/repository/default domain')
    for name in (config['branch'], config['candidateBranch']):
        branch = aws.call('amplify', 'get-branch', app_id=config['appId'], branch_name=name)['branch']
        require(branch.get('branchName') == name and branch.get('enableAutoBuild') is False
                and branch.get('enablePullRequestPreview') is False, 'Unexpected branch or automatic writer')
        environment = branch.get('environmentVariables', {})
        require(environment.get('AMPLIFY_MONOREPO_APP_ROOT') == 'apps/carolyn', 'Wrong Carolyn build root')
        if name == config['candidateBranch']:
            require(environment.get('CAROLYN_CANDIDATE_BRANCH') == name, 'Candidate build allowlist missing')
        no_active_jobs(aws, config, name)
    domains = {}
    for domain, prefixes in (('carolyndiloreto.com', {'', 'www'}), ('diloreto.com', {'carolyn'})):
        association = aws.call('amplify', 'get-domain-association', app_id=config['appId'], domain_name=domain)['domainAssociation']
        settings = sorted([item['subDomainSetting'] for item in association['subDomains']], key=lambda item: item['prefix'])
        require(association.get('domainStatus') == 'AVAILABLE' and len(settings) == len(prefixes)
                and {item['prefix'] for item in settings} == prefixes
                and all(item['branchName'] == config['branch'] for item in settings), 'Production domain isolation changed')
        domains[domain] = settings
    return domains


def marker(config, commit, branch, job_id, url):
    status, body = read_marker(url + '/__release.json?job=' + job_id)
    require(status == 200 and json.loads(body) == dict(schemaVersion=1, kind='website-ssr-production',
            site='carolyn', commit=commit, appId=config['appId'], branch=branch, jobId=job_id),
            'Carolyn serving source/job marker mismatch')


def job_identity(config, branch, job_id, summary):
    expected = f"arn:aws:amplify:{config['region']}:{config['account']}:apps/{config['appId']}/branches/{branch}/jobs/{job_id}"
    require(summary.get('jobId') == job_id and summary.get('jobArn') == expected, 'Wrong Carolyn job branch/resource identity')


def successful_job(aws, config, branch, job_id, commit):
    require(isinstance(job_id, str) and re.fullmatch(r'[1-9][0-9]*', job_id), 'Invalid Carolyn job ID')
    summary = aws.call('amplify', 'get-job', app_id=config['appId'], branch_name=branch, job_id=job_id)['job']['summary']
    job_identity(config, branch, job_id, summary)
    require(summary.get('status') == 'SUCCEED'
            and summary.get('commitId') == commit and summary.get('jobType') == 'RELEASE', 'Wrong successful Carolyn job/SHA/type')
    no_active_jobs(aws, config, branch)
    jobs = aws.call('amplify', 'list-jobs', app_id=config['appId'], branch_name=branch, max_results=1)['jobSummaries']
    require(len(jobs) == 1 and jobs[0] == summary, 'Intervening Carolyn branch job')


def release_carolyn(aws, config, state, selected, policy, recheck, operation):
    from ssr import promote, ref_sha, smoke
    configuration(config, operation)
    require(selected.get('site') == 'carolyn' and selected.get('repository') == 'soodoh/websites'
            and re.fullmatch(r'[0-9a-f]{40}', selected.get('commit', '')), 'Wrong Carolyn source/SHA')
    require(state.site == 'carolyn' and state.value.get('ssrProductionAccepted') is not True, 'Transition is first-cutover only')
    require(state.value['intent'] is None, 'Unresolved Carolyn intent')
    observe(policy, 'carolyn', selected)
    domains = inspect(aws, config)
    production_ref = ref_sha(config['branch'])
    candidate = state.value.get('acceptedCandidate')

    def evidence():
        require(isinstance(candidate, dict) and candidate['release']['commit'] == selected['commit'], 'Missing/mismatched accepted Carolyn candidate')
        require(candidate['hosting'] == hosting(config) and candidate['domain'] == domains, 'Candidate hosting/domain changed')
        require(candidate['previousProduction'] == {key: state.value.get(key) for key in PRODUCTION_FIELDS}, 'Production recovery state changed')
        require(candidate['productionRef'] == ref_sha(config['branch']), 'Production ref changed since candidate acceptance')
        observe(policy, 'carolyn', candidate['release'])
        require(ref_sha(config['candidateBranch']) == selected['commit'], 'Candidate ref changed')
        successful_job(aws, config, config['candidateBranch'], candidate['release']['amplifyJobId'], selected['commit'])
        marker(config, selected['commit'], config['candidateBranch'], candidate['release']['amplifyJobId'], config['candidateUrl'])

    if operation == 'promote':
        evidence()
        require(candidate['generation'] == state.value['generation'], 'Intervening state writer since candidate acceptance')
    branch = config['candidateBranch'] if operation == 'candidate' else config['branch']
    previous_ref = ref_sha(branch)
    previous_jobs = aws.call('amplify', 'list-jobs', app_id=config['appId'], branch_name=branch, max_results=1)['jobSummaries']
    previous_job_id = previous_jobs[0]['jobId'] if previous_jobs else None
    recheck()
    state.assert_owned()
    state.claim(selected, operation, f"{os.environ['GITHUB_RUN_ID']}/{os.environ['GITHUB_RUN_ATTEMPT']}",
                baseline=dict(branch=branch, commit=previous_ref, productionRef=production_ref, domains=domains))
    amplify = Amplify(aws, config, state)
    job_id = None
    job_owned = False
    try:
        # Claim is durable before the first ref/job mutation, and stale ownership
        # never permits even cleanup mutations. Unknown starts retain that intent.
        state.assert_owned()
        recheck()
        require(inspect(aws, config) == domains, 'Domain changed before ref promotion')
        if operation == 'promote':
            evidence()
        recheck()
        state.assert_owned()
        promote(branch, previous_ref, selected['commit'], candidate_branch=config['candidateBranch'])
        state.assert_owned()
        recheck()
        require(ref_sha(branch) == selected['commit'], 'Ref drift before start')
        no_active_jobs(aws, config, branch)
        recheck()
        state.assert_owned()
        result = aws.call('amplify', 'start-job', app_id=config['appId'], branch_name=branch, job_type='RELEASE',
                          commit_id=selected['commit'], commit_message='GitHub Actions release ' + selected['commit'],
                          job_reason='GitHub Actions validated ' + selected['commit'])['jobSummary']
        # Persist the actual returned job before validating other response fields.
        job_id = result.get('jobId')
        require(isinstance(job_id, str) and re.fullmatch(r'[1-9][0-9]*', job_id), 'Missing new Carolyn job identity')
        state.job(branch, job_id)
        job_identity(config, branch, job_id, result)
        require(job_id != previous_job_id, 'Reused Carolyn job identity')
        job_owned = True
        require(result.get('commitId') == selected['commit']
                and result.get('jobType') == 'RELEASE', 'Wrong Carolyn start SHA/type or reused job')
        amplify.wait(branch, job_id, selected['commit'])
        successful_job(aws, config, branch, job_id, selected['commit'])
        require(ref_sha(branch) == selected['commit'], 'Source ref changed during rebuild')
        url = config['candidateUrl'] if operation == 'candidate' else config['productionUrl']
        marker(config, selected['commit'], branch, job_id, url)
        if operation == 'candidate':
            smoke('carolyn', config, selected['commit'], url, candidate=True)
        else:
            smoke('carolyn', config, selected['commit'], url, config['appId'] + '.amplifyapp.com')
        recheck()
        state.assert_owned()
        require(inspect(aws, config) == domains, 'Domain changed during rebuild')
        successful_job(aws, config, branch, job_id, selected['commit'])
        require(ref_sha(branch) == selected['commit'], 'Ref changed during smoke')
        if operation == 'candidate':
            require(ref_sha(config['branch']) == production_ref, 'Production ref changed during candidate')
            state.finish_candidate({**selected, 'amplifyJobId': job_id}, domains, hosting(config), production_ref=production_ref)
        else:
            # Recheck candidate too; its branch must remain the accepted build.
            require(ref_sha(config['candidateBranch']) == selected['commit'], 'Candidate ref changed during promotion')
            successful_job(aws, config, config['candidateBranch'], candidate['release']['amplifyJobId'], selected['commit'])
            state.checkpoint('production-verified')
            state.finish_carolyn_promotion({**selected, 'amplifyJobId': job_id})
    except BaseException:
        if job_owned:
            try:
                state.assert_owned()
                amplify.stop(branch, job_id)
            except Exception:
                pass
        raise
