"""Explicit disabled-in-workflow Sarabeth transition; no implicit branch/domain switch."""
import json
import os
from pathlib import Path
import re
import sys

from state import Aws, State, StateOwnershipError, require
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


def domain_snapshot(aws, config):
    association = aws.call('amplify', 'get-domain-association', app_id=config['appId'], domain_name='sarabethbelon.com')['domainAssociation']
    settings = sorted([item['subDomainSetting'] for item in association['subDomains']], key=lambda item: item['prefix'])
    require(association['domainStatus'] == 'AVAILABLE' and len(settings) == 2 and {item['prefix'] for item in settings} == {'', 'www'}, 'Production domain is not stable')
    return dict(status='AVAILABLE', settings=settings)


def candidate_url(config, app):
    url = f"https://sarabeth-production.{app['defaultDomain']}"
    require(config['candidateUrl'] == url and config['productionUrl'].rstrip('/') != url, 'Candidate must be the actual isolated branch default domain')
    return url


def unchanged_candidate_job(aws, config, job_id):
    from static import Amplify
    Amplify(aws, config, None).no_active_jobs('sarabeth-production')
    jobs = aws.call('amplify', 'list-jobs', app_id=config['appId'], branch_name='sarabeth-production', max_results=1)['jobSummaries']
    require(len(jobs) == 1 and jobs[0]['jobId'] == job_id and jobs[0]['status'] == 'SUCCEED', 'Intervening branch writer; reconcile candidate')


def verify_switch(aws, config, commit, job_id, phase, read=None):
    read = read or read_url
    require(phase in ('candidate', 'domain') and re.fullmatch(r'[0-9a-f]{40}', commit) and re.fullmatch(r'[1-9][0-9]*', job_id), 'Invalid switch evidence')
    require(aws.call('sts', 'get-caller-identity')['Account'] == '015989770400', 'Wrong infrastructure account')
    branch = 'sarabeth-production'
    app_id = config['appId']
    app = aws.call('amplify', 'get-app', app_id=app_id)['app']
    require(app['platform'] == 'WEB_COMPUTE' and app['repository'].removesuffix('.git') == 'https://github.com/soodoh/websites', 'Wrong candidate repository/platform')
    candidate_url(config, app)
    observed_branch = aws.call('amplify', 'get-branch', app_id=app_id, branch_name=branch)['branch']
    require(observed_branch['branchName'] == branch and observed_branch['enableAutoBuild'] is False and observed_branch['enablePullRequestPreview'] is False and observed_branch['environmentVariables']['AMPLIFY_MONOREPO_APP_ROOT'] == 'apps/sarabeth', 'Wrong candidate branch/writer/build root')
    summary = aws.call('amplify', 'get-job', app_id=app_id, branch_name=branch, job_id=job_id)['job']['summary']
    require(summary['jobId'] == job_id and summary['status'] == 'SUCCEED' and summary['commitId'] == commit, 'Candidate source/job not successful')
    if phase == 'domain':
        require(all(item['branchName'] == branch for item in domain_snapshot(aws, config)['settings']), 'Domain does not serve selected branch')
    url = config['candidateUrl'] if phase == 'candidate' else config['productionUrl']
    status, _, body = read(url.rstrip('/') + '/__release.json?job=' + job_id)
    require(status == 200 and json.loads(body) == dict(schemaVersion=1, kind='website-ssr-production', site='sarabeth', commit=commit, appId=app_id, branch=branch, jobId=job_id), 'Selected branch/serving release mismatch')


class Switch:
    """One durable intent spans approved domain/DNS writes and post-switch acceptance.

    The workflow carries the exact ETag between steps, never adopts an intervening
    version. Failed/ambiguous mutations leave intent; no automatic Netlify fallback.
    """
    def __init__(self, aws, config, state, policy, invocation, recheck):
        self.aws, self.config, self.state, self.policy = aws, config, state, policy
        self.invocation, self.recheck = invocation, recheck

    def evidence(self, commit, job_id):
        candidate = self.state.value.get('acceptedCandidate')
        require(isinstance(candidate, dict), 'No independently accepted candidate')
        selected = candidate['release']
        require(selected.get('commit') == commit and selected.get('amplifyJobId') == job_id, 'Candidate commit/job mismatch')
        require(candidate['hosting'] == {key: self.config[key] for key in ('appId', 'branch', 'candidateUrl', 'productionUrl')}, 'Candidate hosting configuration changed')
        require(candidate['previousProduction'] == {key: self.state.value.get(key) for key in ('currentRelease', 'highWatermark', 'lastLifecycleReceipt', 'ssrProductionAccepted')}, 'Production recovery state changed')
        observe(self.policy, 'sarabeth', selected)
        from ssr import ref_sha
        require(ref_sha('sarabeth-production') == commit, 'Candidate ref changed')
        unchanged_candidate_job(self.aws, self.config, job_id)
        self.recheck(selected, self.state.value)
        self.state.assert_owned()
        return selected

    def begin(self, commit, job_id):
        require(self.config.get('switchEnabled') is True, 'Switch operation disabled')
        require(self.state.value['intent'] is None, 'Unresolved intent')
        selected = self.evidence(commit, job_id)
        candidate = self.state.value['acceptedCandidate']
        require(candidate['generation'] == self.state.value['generation'], 'Intervening state writer since candidate acceptance')
        require(domain_snapshot(self.aws, self.config) == candidate['domain'], 'Previous production domain changed')
        verify_switch(self.aws, self.config, commit, job_id, 'candidate')
        self.state.claim(selected, 'switch', self.invocation, baseline=candidate['previousProduction'])
        self.state.job('sarabeth-production', job_id)
        self.state.checkpoint('switch-claimed')

    def guard(self, commit, job_id, phase=None):
        intent = self.state.value['intent']
        require(intent and intent['operation'] == 'switch' and intent['invocation'] == self.invocation, 'Not this switch owner')
        require(intent['release'].get('commit') == commit and intent['release'].get('amplifyJobId') == job_id, 'Switch identity mismatch')
        if phase:
            require(intent.get('phase') == phase, 'Wrong switch phase')
        selected = self.evidence(commit, job_id)
        self.state.checkpoint(intent['phase'])
        return selected

    def accept_production(self, commit, job_id):
        self.guard(commit, job_id, 'switch-claimed')
        verify_switch(self.aws, self.config, commit, job_id, 'domain')
        from ssr import smoke
        smoke('sarabeth', self.config, commit, self.config['productionUrl'])
        self.guard(commit, job_id, 'switch-claimed')
        self.state.checkpoint('production-verified')
        # The old LKG remains untouched through candidate and failed production smoke.
        # SSM and S3 cannot be one transaction: any ambiguity keeps reconciliation intent.
        self.aws.call('ssm', 'put-parameter', name='/sarabeth-studio/production/last-known-good-sha', type='String', value=commit, overwrite=True)
        self.state.checkpoint('lkg-written')

    def finish(self, commit, job_id):
        selected = self.guard(commit, job_id, 'lkg-written')
        verify_switch(self.aws, self.config, commit, job_id, 'domain')
        self.state.assert_owned()
        self.state.finish(selected, commit, ssr_cutover=True)


def main():
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
        require(config.get('switchEnabled') is True, 'Switch operation disabled')
        aws.check_conditional_support()
        state = State(aws, config, 'sarabeth')
        state.read()
        invocation = f"{os.environ['GITHUB_RUN_ID']}/{os.environ['GITHUB_RUN_ATTEMPT']}"
        checkpoint = Path(os.environ['RUNNER_TEMP']) / 'sarabeth-switch-owner.json'
        phase = sys.argv[1]
        if phase != 'begin':
            expected = json.loads(checkpoint.read_text())
            if expected != dict(etag=state.etag, invocation=invocation):
                raise StateOwnershipError('Switch ETag changed; STOP and reconcile without rollback')
        from deploy import ordering, pinned_main
        def recheck(selected, observed):
            require(ordering('sarabeth', selected['commit'], pinned_main(), observed) == 'eligible', 'Candidate superseded; freshly validate main')
        switch = Switch(aws, config, state, policy, invocation, recheck)
        commit, job_id = os.environ['SELECTED_COMMIT'], os.environ['SELECTED_JOB']
        if phase == 'begin': switch.begin(commit, job_id)
        elif phase == 'guard': switch.guard(commit, job_id, sys.argv[2] if len(sys.argv) > 2 else 'switch-claimed')
        elif phase == 'domain':
            switch.guard(commit, job_id, 'switch-claimed')
            verify_switch(aws, config, commit, job_id, 'domain')
        elif phase == 'accept': switch.accept_production(commit, job_id)
        elif phase == 'finish': switch.finish(commit, job_id)
        else: raise ValueError('Unknown switch operation')
        checkpoint.write_text(json.dumps(dict(etag=state.etag, invocation=invocation)))


if __name__ == '__main__':
    main()
