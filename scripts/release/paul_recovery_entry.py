"""Protected restore-static Paul operations; import and proposal are effect-free.

The checked-in workflow and runtime locks must both be separately reviewed for activation.
Legacy pins are owner-reviewed metadata, never a cryptographic CI attestation.
"""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess

import paul_recovery as recovery
from state import Aws, require
from static import gh, TERMINAL

ROOT = recovery.ROOT
WORKFLOW = '.github/workflows/restore-static.yml'
WORKFLOW_ID = '351776221'
CI = '.github/workflows/ci.yml'
APP_ARN = f'arn:aws:amplify:us-east-1:{recovery.OWNER}:apps/{recovery.APP}'
SAFE_AWS = {
    'AWS_EC2_METADATA_DISABLED': 'true', 'AWS_IGNORE_CONFIGURED_ENDPOINT_URLS': 'true',
    'AWS_RETRY_MODE': 'standard', 'AWS_MAX_ATTEMPTS': '1', 'AWS_PAGER': '',
    'AWS_CONFIG_FILE': '/dev/null', 'AWS_SHARED_CREDENTIALS_FILE': '/dev/null',
    'AWS_REGION': 'us-east-1', 'AWS_DEFAULT_REGION': 'us-east-1',
    'AWS_USE_FIPS_ENDPOINT': 'false', 'AWS_USE_DUALSTACK_ENDPOINT': 'false',
}


def matches(value, pattern):
    return isinstance(value, str) and re.fullmatch(pattern, value) is not None


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()


def inputs(operation, release, baseline):
    require(operation in ('bootstrap', 'rehearsal'), 'Paul recovery operation required')
    require(len(release) <= 8192 and len(baseline) <= 8192, 'Oversized immutable input')
    selected = recovery.strict_json(release)
    require(selected == recovery.pinned_release(recovery.recovery_pins()), 'Exact pinned release required')
    floor = recovery.strict_json(baseline)
    require(isinstance(floor, dict) and set(floor) == {'commit', 'runId', 'runAttempt'}, 'Explicit immutable monorepo CI baseline required')
    require(matches(floor['commit'], r'[0-9a-f]{40}') and floor['commit'] != selected['commit'], 'Invalid monorepo baseline')
    require(all(matches(floor[k], r'[1-9][0-9]*') for k in ('runId', 'runAttempt')), 'Invalid baseline run/attempt')
    return selected, floor


def proposal(policy, runtime, floor):
    # This shape is state metadata only. Live ancestry/CI is established separately below.
    return recovery.bootstrap_proposal(policy, runtime, dict(repository=recovery.REPOSITORY,
        repositoryId='1358469291', site='paul', ref='refs/heads/main', commit=floor['commit'], reviewed=True))


def identity(document):
    require(document.get('full_name') == recovery.REPOSITORY and str(document.get('id')) == '1358469291'
            and str(document.get('owner', {}).get('id')) == '18269267', 'Wrong repository/owner identity')


def context(policy, runtime, operation, release, baseline, env):
    config = recovery.admission(policy, runtime, operation)
    require(runtime['entryWorkflowIds'].get(WORKFLOW) == WORKFLOW_ID
            and policy['validationWorkflowIds'].get(CI) == '351279106', 'Wrong trusted workflow IDs')
    expected = {'GITHUB_REPOSITORY': recovery.REPOSITORY, 'GITHUB_REPOSITORY_ID': '1358469291',
                'GITHUB_REPOSITORY_OWNER_ID': '18269267', 'GITHUB_REF': 'refs/heads/main',
                'GITHUB_EVENT_NAME': 'workflow_dispatch', 'RELEASE_ENVIRONMENT': 'production-portfolio',
                'GITHUB_WORKFLOW_REF': f'{recovery.REPOSITORY}/{WORKFLOW}@refs/heads/main',
                'GITHUB_RUN_ATTEMPT': '1'}
    require(all(env.get(k) == v for k, v in expected.items()), 'Untrusted protected execution context')
    run, attempt, sha = (env.get(k) for k in ('GITHUB_RUN_ID', 'GITHUB_RUN_ATTEMPT', 'GITHUB_WORKFLOW_SHA'))
    require(matches(run, r'[1-9][0-9]*') and matches(sha, r'[0-9a-f]{40}') and env.get('GITHUB_SHA') == sha,
            'Invalid invocation/workflow SHA; no reruns')
    event_path = Path(env['GITHUB_EVENT_PATH'])
    require(event_path.stat().st_size <= 1024 * 1024, 'Oversized dispatch event')
    event = recovery.strict_json(event_path.read_bytes())
    identity(event.get('repository', {}))
    require(event.get('ref') == 'refs/heads/main' and event.get('inputs') == dict(site='paul', operation=operation,
            release=release, baseline=baseline), 'Dispatch immutable inputs differ from execution')
    require(git('rev-parse', 'HEAD') == sha and git('rev-parse', '--is-shallow-repository') == 'false', 'Wrong trusted checkout')
    require(not git('diff', 'HEAD', '--'), 'Modified trusted checkout')
    identity(gh('repos/soodoh/websites'))
    observed = gh(f'repos/soodoh/websites/actions/runs/{run}/attempts/{attempt}')
    identity(observed.get('head_repository', {}))
    require(str(observed.get('id')) == run and str(observed.get('run_attempt')) == attempt
            and str(observed.get('workflow_id')) == WORKFLOW_ID and observed.get('path') == WORKFLOW
            and observed.get('head_sha') == sha and observed.get('head_branch') == 'main'
            and observed.get('event') == 'workflow_dispatch' and observed.get('status') == 'in_progress'
            and observed.get('conclusion') is None, 'Wrong actual execution run/attempt/workflow')
    return config, f'{run}/{attempt}', sha


def baseline_evidence(floor, workflow_sha):
    """Observe actual bound CI and compare all Paul inputs, not global latest-main equality."""
    run, attempt, commit = (floor[k] for k in ('runId', 'runAttempt', 'commit'))
    observed = gh(f'repos/soodoh/websites/actions/runs/{run}/attempts/{attempt}')
    identity(observed.get('head_repository', {}))
    require(str(observed.get('id')) == run and str(observed.get('run_attempt')) == attempt
            and str(observed.get('workflow_id')) == '351279106' and observed.get('path') == CI
            and observed.get('head_sha') == commit and observed.get('head_branch') == 'main'
            and observed.get('event') in ('push', 'workflow_dispatch')
            and observed.get('status') == 'completed' and observed.get('conclusion') == 'success', 'Baseline CI failed or mismatched')
    suite_id = str(observed.get('check_suite_id'))
    require(matches(suite_id, r'[1-9][0-9]*'), 'Missing bound check suite')
    suite = gh(f'repos/soodoh/websites/check-suites/{suite_id}')
    require(str(suite.get('id')) == suite_id and suite.get('head_sha') == commit
            and suite.get('head_branch') == 'main' and str(suite.get('app', {}).get('id')) == '15368'
            and suite.get('status') == 'completed' and suite.get('conclusion') == 'success', 'Wrong CI suite/App')
    jobs = []
    for page in range(1, 101):
        batch = gh(f'repos/soodoh/websites/actions/runs/{run}/attempts/{attempt}/jobs?per_page=100&page={page}')['jobs']
        jobs.extend(batch)
        if len(batch) < 100:
            break
    else:
        raise ValueError('Incomplete CI job inventory')
    for name in ('root', 'paul / paul fixture verification', 'CI gate'):
        matching = [j for j in jobs if j.get('name') == name]
        require(len(matching) == 1, 'Missing/ambiguous required baseline job')
        job = matching[0]
        require(job.get('status') == 'completed' and job.get('conclusion') == 'success'
                and job.get('head_sha') == commit and str(job.get('run_id')) == run
                and str(job.get('run_attempt')) == attempt, 'Wrong baseline job/attempt')
        check_url = job.get('check_run_url', '')
        prefix = 'https://api.github.com/repos/soodoh/websites/check-runs/'
        require(check_url.startswith(prefix) and matches(check_url[len(prefix):], r'[1-9][0-9]*'), 'Missing bound check run')
        check = gh(check_url.removeprefix('https://api.github.com/'))
        require(str(check.get('id')) == check_url[len(prefix):] and str(check.get('check_suite', {}).get('id')) == suite_id
                and str(check.get('app', {}).get('id')) == '15368' and check.get('name') == name
                and check.get('head_sha') == commit and check.get('status') == 'completed'
                and check.get('conclusion') == 'success', 'Wrong required CI check identity')
    main = gh('repos/soodoh/websites/git/ref/heads/main')['object']['sha']
    require(matches(main, r'[0-9a-f]{40}'), 'Invalid observed main')
    git('fetch', '--no-tags', 'origin', main)
    for sha in (commit, workflow_sha):
        git('merge-base', '--is-ancestor', sha, main)
    program = "import {releaseInputsDiffer} from './scripts/ci/affected.mjs'; if(releaseInputsDiffer(process.cwd(),'paul',process.argv[1],process.argv[2])) process.exit(1);"
    for sha in (commit, workflow_sha):
        subprocess.run(['node', '--input-type=module', '-e', program, sha, main], cwd=ROOT, check=True)
    return main


def hosting(aws, invocation, own_job=None):
    """Read actual role, app, both branches and complete domain bindings; never alter them."""
    caller = aws.call('sts', 'get-caller-identity')
    session = 'paul-recovery-' + invocation.replace('/', '-')
    role = 'pauldiloreto-amplify-hosting-GitHubDeploymentRole-JPjJmwTE3kcw'
    require(caller.get('Account') == recovery.OWNER and caller.get('Arn') ==
            f'arn:aws:sts::{recovery.OWNER}:assumed-role/{role}/{session}', 'Wrong returned STS role/account/session')
    app = aws.call('amplify', 'get-app', app_id=recovery.APP)['app']
    require(app.get('appId') == recovery.APP and app.get('appArn') == APP_ARN
            and app.get('platform') == 'WEB' and app.get('defaultDomain') == f'{recovery.APP}.amplifyapp.com'
            and not app.get('repository') and app.get('enableBranchAutoBuild') is False, 'Wrong app identity/writer')
    for branch, stage in (('main', 'PRODUCTION'), ('candidate', 'BETA')):
        value = aws.call('amplify', 'get-branch', app_id=recovery.APP, branch_name=branch)['branch']
        require(value.get('branchArn') == f'{APP_ARN}/branches/{branch}' and value.get('branchName') == branch
                and value.get('stage') == stage and value.get('enableAutoBuild') is False
                and value.get('enablePullRequestPreview') is False, 'Wrong branch/writer identity')
        jobs = aws.call('amplify', 'list-jobs', app_id=recovery.APP, branch_name=branch)
        require(not jobs.get('nextToken') and isinstance(jobs.get('jobSummaries'), list), 'Incomplete hosting inventory')
        require(all(j.get('status') in TERMINAL or (branch == 'candidate' and j.get('jobId') == own_job)
                    for j in jobs['jobSummaries']), 'Active/unknown concurrent writer')
    domains = aws.call('amplify', 'list-domain-associations', app_id=recovery.APP)
    require(not domains.get('nextToken') and isinstance(domains.get('domainAssociations'), list), 'Incomplete domain inventory')
    require([d.get('domainName') for d in domains['domainAssociations']] == ['pauldiloreto.com'], 'Unexpected domain associations')
    domain = aws.call('amplify', 'get-domain-association', app_id=recovery.APP, domain_name='pauldiloreto.com')['domainAssociation']
    require(domain.get('domainAssociationArn') == f'{APP_ARN}/domains/pauldiloreto.com'
            and domain.get('domainName') == 'pauldiloreto.com' and domain.get('domainStatus') == 'AVAILABLE'
            and domain.get('enableAutoSubDomain') is False, 'Wrong production domain identity/status')
    mappings = [s.get('subDomainSetting') for s in domain.get('subDomains', [])]
    require(len(mappings) == 2 and all(isinstance(m, dict) for m in mappings)
            and sorted((m.get('prefix'), m.get('branchName')) for m in mappings) == [('', 'main'), ('www', 'main')],
            'Production domains must map only to main; verification flags do not prove isolation')


def run(command, operation, release, baseline, env=None):
    env = os.environ if env is None else env
    policy = recovery.strict_json((ROOT / 'config/release-policy.json').read_bytes())
    runtime = recovery.strict_json((ROOT / 'config/release-runtime.json').read_bytes())
    selected, floor = inputs(operation, release, baseline)
    planned = proposal(policy, runtime, floor)
    if command == 'proposal':
        return planned
    config, invocation, workflow_sha = context(policy, runtime, operation, release, baseline, env)
    baseline_evidence(floor, workflow_sha)
    if command == 'check':
        # All immutable/context/baseline checks precede the normal OIDC credential action.
        return dict(roleArn=config['roleArn'], account=recovery.OWNER, region='us-east-1')
    require(command == 'execute', 'Unknown command')
    require(all(env.get(k) == v for k, v in SAFE_AWS.items()) and not any(
        k.startswith('AWS_ENDPOINT_URL') or k in ('AWS_PROFILE', 'AWS_DEFAULT_PROFILE', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY')
        for k in env), 'Unsafe native AWS endpoint/retry environment')
    aws = Aws('us-east-1')
    aws.check_conditional_support()
    def recheck(own_job=None):
        baseline_evidence(floor, workflow_sha)
        hosting(aws, invocation, own_job)
    recheck()
    if operation == 'bootstrap':
        return recovery.bootstrap_state(aws, policy, runtime, planned['bootstrapBaseline'], invocation)
    from paul_acceptance import accept_candidate
    return recovery.rehearse_candidate(aws, policy, runtime, selected, invocation,
        recheck=recheck, acceptance=accept_candidate)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('proposal', 'check', 'execute'))
    args = parser.parse_args()
    result = run(args.command, os.environ.get('OPERATION', ''), os.environ.get('RESTORE_RELEASE', ''),
                 os.environ.get('PAUL_BASELINE', ''))
    if args.command == 'check' and os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as stream:
            for key, value in result.items():
                stream.write(f'{key}={value}\n')
    print(json.dumps(result, sort_keys=True))


if __name__ == '__main__':
    main()
