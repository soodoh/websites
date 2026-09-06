"""Explicit disabled-in-workflow Sarabeth transition; no implicit branch/domain switch."""
import json
import os
from pathlib import Path
import re
import sys

from state import Aws, State, require
from static import ROOT, observe, read_url


def parameters(operation, kind, subject='', state_object='', webhook=False):
    require(operation in ('legacy', 'prepare-monorepo', 'switch-monorepo') and kind in ('hosting', 'domain'), 'Unknown infrastructure operation')
    require(not webhook or operation == 'switch-monorepo', 'Webhook retarget requires explicit switch operation')
    if operation == 'legacy':
        return []
    if kind == 'domain':
        require(operation == 'switch-monorepo', 'Preparation must not change domain')
        return ['GitHubBranch=sarabeth-production']
    require(subject and not re.search(r'[\s*?]', subject), 'Exact observed routine subject required')
    require(re.fullmatch(r'arn:aws:s3:::[a-z0-9.-]+/[^\s*?]+', state_object), 'Approved existing state object required')
    return ['EnableMonorepoConnection=true', 'EnableMonorepoBranch=true', 'MonorepoWebhookTarget=' + str(webhook).lower(), 'MonorepoSubject=' + subject, 'MonorepoStateObjectArn=' + state_object]


def prepare(environment):
    operation = environment['MONOREPO_OPERATION']
    apply_domain = environment['APPLY_DOMAIN'] == 'true'
    rollback = environment['ROLLBACK_TO_NETLIFY'] == 'true'
    webhook = environment['RETARGET_WEBHOOK'] == 'true'
    if operation != 'legacy':
        confirmation = {'prepare-monorepo': 'APPROVE_MONOREPO_PREPARATION', 'switch-monorepo': 'APPROVE_MONOREPO_SWITCH'}.get(operation)
        require(confirmation and environment['TRANSITION_CONFIRMATION'] == confirmation and not rollback, 'Explicit transition approval required; no combined rollback')
        require(apply_domain == (operation == 'switch-monorepo'), 'Preparation cannot switch domain; switch requires apply_domain')
    hosting = parameters(operation, 'hosting', environment.get('MONOREPO_SUBJECT', ''), environment.get('MONOREPO_STATE_OBJECT', ''), webhook)
    domain = parameters(operation, 'domain') if operation != 'prepare-monorepo' else []
    if operation == 'switch-monorepo':
        require(re.fullmatch(r'[0-9a-f]{40}', environment.get('SELECTED_COMMIT', '')) and re.fullmatch(r'[1-9][0-9]*', environment.get('SELECTED_JOB', '')), 'Exact independently verified candidate commit/job required')
        require(environment.get('CUTOVER_CONFIRMATION') == 'APPROVAL_GATE_1_CONFIRMED', 'Separate domain approval required')
    return hosting, domain


def verify_switch(aws, config, commit, job_id, phase, read=read_url):
    require(phase in ('candidate', 'domain') and re.fullmatch(r'[0-9a-f]{40}', commit) and re.fullmatch(r'[1-9][0-9]*', job_id), 'Invalid switch evidence')
    require(aws.call('sts', 'get-caller-identity')['Account'] == '015989770400', 'Wrong infrastructure account')
    branch = 'sarabeth-production'
    app_id = config['appId']
    app = aws.call('amplify', 'get-app', app_id=app_id)['app']
    require(app['platform'] == 'WEB_COMPUTE' and app['repository'].removesuffix('.git') == 'https://github.com/soodoh/websites', 'Wrong candidate repository/platform')
    observed_branch = aws.call('amplify', 'get-branch', app_id=app_id, branch_name=branch)['branch']
    require(observed_branch['branchName'] == branch and observed_branch['enableAutoBuild'] is False and observed_branch['enablePullRequestPreview'] is False and observed_branch['environmentVariables']['AMPLIFY_MONOREPO_APP_ROOT'] == 'apps/sarabeth', 'Wrong candidate branch/writer/build root')
    summary = aws.call('amplify', 'get-job', app_id=app_id, branch_name=branch, job_id=job_id)['job']['summary']
    require(summary['jobId'] == job_id and summary['status'] == 'SUCCEED' and summary['commitId'] == commit, 'Candidate source/job not successful')
    if phase == 'domain':
        association = aws.call('amplify', 'get-domain-association', app_id=app_id, domain_name='sarabethbelon.com')['domainAssociation']
        settings = [item['subDomainSetting'] for item in association['subDomains']]
        require(association['domainStatus'] == 'AVAILABLE' and len(settings) == 2 and {item['prefix'] for item in settings} == {'', 'www'} and all(item['branchName'] == branch for item in settings), 'Domain does not serve selected branch')
    url = config['candidateUrl'] if phase == 'candidate' else config['productionUrl']
    status, _, body = read(url.rstrip('/') + '/__release.json?job=' + job_id)
    require(status == 200 and json.loads(body) == dict(schemaVersion=1, kind='website-ssr-production', site='sarabeth', commit=commit, appId=app_id, branch=branch, jobId=job_id), 'Selected branch/serving release mismatch')


if __name__ == '__main__':
    runtime = json.loads((ROOT / 'config/release-runtime.json').read_text())
    require(runtime['publicationLocked'] is False, 'Publication lock: separate reviewed activation required')
    if sys.argv[1] == 'prepare':
        hosting, domain = prepare(os.environ)
        for kind, values in (('hosting', hosting), ('domain', domain)):
            (Path(os.environ['RUNNER_TEMP']) / f'sarabeth-{kind}-parameters').write_text(''.join(value + '\n' for value in values))
    else:
        policy = json.loads((ROOT / 'config/release-policy.json').read_text())
        config = {**policy['sites']['sarabeth'], **runtime['sites']['sarabeth']}
        require(runtime['publicationLocked'] is False and config['sourceWriterDrained'] is True and config['appId'] == os.environ['AMPLIFY_APP_ID'], 'Switch configuration not approved')
        aws = Aws('us-west-2')
        require(aws.call('sts', 'get-caller-identity')['Account'] == '015989770400', 'Wrong infrastructure account')
        state = State(aws, config, 'sarabeth').read()
        selected = state['currentRelease']
        require(state['intent'] is None and selected.get('commit') == os.environ['SELECTED_COMMIT'] and selected.get('amplifyJobId') == os.environ['SELECTED_JOB'], 'Candidate not recorded as accepted; unresolved intent or identity mismatch')
        observe(policy, 'sarabeth', selected)
        verify_switch(aws, config, os.environ['SELECTED_COMMIT'], os.environ['SELECTED_JOB'], sys.argv[1])
