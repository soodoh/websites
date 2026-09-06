"""Production adapter entry point. Workflows and checked-in policy are publication-locked."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess

from state import Aws, State, require
from static import ROOT, gh, release_static, observe


def configured(site, operation):
    policy = json.loads((ROOT / 'config/release-policy.json').read_text())
    runtime = json.loads((ROOT / 'config/release-runtime.json').read_text())
    require(runtime.get('publicationLocked') is False, 'Publication lock: separate reviewed activation required')
    require(site in policy['sites'], 'Unknown site')
    config = {**policy['sites'][site], **runtime['sites'][site]}
    require(os.environ.get('GITHUB_REPOSITORY') == policy['repository'] == 'soodoh/websites' and os.environ.get('GITHUB_REPOSITORY_ID') == policy['repositoryId'] and os.environ.get('GITHUB_REPOSITORY_OWNER_ID') == policy['ownerId'], 'Execution repository mismatch')
    require(os.environ.get('GITHUB_REF') == 'refs/heads/main', 'Credentialed workflow must run on main')
    event = os.environ.get('GITHUB_EVENT_NAME')
    workflow = os.environ.get('GITHUB_WORKFLOW_REF', '').removeprefix('soodoh/websites/').split('@')[0]
    expected_workflow_id = runtime.get('entryWorkflowIds', {}).get(workflow)
    require(expected_workflow_id, 'Missing trusted entry workflow ID')
    execution = gh(f"repos/soodoh/websites/actions/runs/{os.environ['GITHUB_RUN_ID']}/attempts/{os.environ['GITHUB_RUN_ATTEMPT']}")
    require(str(execution['workflow_id']) == expected_workflow_id and execution['path'] == workflow and execution['event'] == event, 'Execution workflow identity mismatch')
    require(os.environ.get('RELEASE_ENVIRONMENT') == config['environment'], 'Wrong credential environment')
    flag = 'automaticEnabled' if event == 'workflow_run' else 'manualEnabled'
    require(event in ('workflow_run', 'workflow_dispatch') and config.get(flag) is True, 'Release disabled')
    require(operation in ('release', 'restore', 'redeploy'), 'Unknown operation')
    require(operation != 'restore' or site in ('paul', 'diloreto') and config.get('restoreEnabled') is True, 'Explicit static restore not approved')
    require(operation != 'redeploy' or site == 'diloreto' and config.get('redeployEnabled') is True, 'Selected-ref redeploy not approved')
    require(config.get('sourceWriterDrained') is True, 'Source/CMS writers not approved frozen and drained')
    required = ['account', 'region', 'environment', 'roleArn', 'oidcSubject', 'appId', 'branch', 'productionUrl', 'stateBucket', 'stateKey', 'stateOwner']
    if site in ('paul', 'diloreto'):
        required += ['releaseBucket', 'releaseOwner']
    if site == 'paul':
        required += ['candidateBranch', 'candidateUrl']
    if site == 'diloreto':
        required += ['originUrl']
    for key in required:
        require(isinstance(config.get(key), str) and config[key] and not re.search(r'[\s*?]', config[key]), f'Missing/unsafe configuration: {key}')
    require(re.fullmatch(r'\d{12}', config['account']) and config['roleArn'].startswith('arn:aws:iam::' + config['account'] + ':role/'), 'Wrong role account')
    require(re.fullmatch(r'd[a-z0-9]+', config['appId']), 'Invalid app ID')
    require(config['branch'] == {'paul': 'main', 'diloreto': 'main', 'carolyn': 'amplify-production', 'sarabeth': 'sarabeth-production'}[site], 'Unexpected production branch; reviewed mapping required')
    return policy, config


def pinned_main():
    main = gh('repos/soodoh/websites/git/ref/heads/main')['object']['sha']
    require(re.fullmatch(r'[0-9a-f]{40}', main), 'Invalid main observation')
    subprocess.run(['git', 'fetch', '--no-tags', 'origin', main], cwd=ROOT, check=True)
    return main


def ordering(site, commit, main, state):
    program = "import {planRelease} from './scripts/ci/release-contract.mjs'; console.log(JSON.stringify(planRelease(JSON.parse(process.argv[1]))));"
    result = subprocess.check_output(['node', '--input-type=module', '-e', program, json.dumps(dict(cwd=str(ROOT), site=site, commit=commit, mainSha=main, state=state))], cwd=ROOT, text=True)
    return json.loads(result)['decision']


def execute(site, operation, selected, policy, config):
    require(selected.get('site') == site, 'Cross-site release')
    aws = Aws(config['region'])
    aws.check_conditional_support()
    require(aws.call('sts', 'get-caller-identity')['Account'] == config['account'], 'Authenticated account mismatch')
    app = aws.call('amplify', 'get-app', app_id=config['appId'])['app']
    require(app['platform'] == ('WEB' if site in ('paul', 'diloreto') else 'WEB_COMPUTE'), 'Hosting platform mismatch')
    state = State(aws, config, site)
    observed_state = state.read()
    require(observed_state['intent'] is None, 'Unresolved intent: reconcile jobs, current release and ETag before retry')
    main = pinned_main()
    if operation == 'release':
        decision = ordering(site, selected['commit'], main, observed_state)
        require(decision == 'eligible', f'{decision}; recovery action: release-site(site={site}, ref=main)')
    else:
        # An explicit restore can serve older bytes but NEVER lowers routine high-watermark.
        subprocess.run(['git', 'merge-base', '--is-ancestor', observed_state['highWatermark'], main], cwd=ROOT, check=True)
    def recheck():
        fresh_main = pinned_main()
        if operation == 'release':
            require(ordering(site, selected['commit'], fresh_main, observed_state) == 'eligible', f'Relevant inputs superseded; release-site(site={site}, ref=main)')
    if site in ('paul', 'diloreto'):
        release_static(site, aws, config, state, selected, policy, operation, recheck)
    else:
        from ssr import release_ssr
        release_ssr(site, aws, config, state, selected, policy, recheck)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=('check', 'deploy'))
    parser.add_argument('site', choices=('paul', 'diloreto', 'carolyn', 'sarabeth'))
    parser.add_argument('--operation', choices=('release', 'restore', 'redeploy'), default='release')
    parser.add_argument('--selected')
    args = parser.parse_args()
    policy, config = configured(args.site, args.operation)
    if args.command == 'check':
        require(args.selected, 'Immutable selected release required before credentials')
        selected = json.loads(Path(args.selected).read_text())
        require(selected.get('site') == args.site, 'Cross-site request')
        observe(policy, args.site, selected)
        from oidc import observe_subject
        observe_subject(config['oidcSubject'])
        output = os.environ.get('GITHUB_OUTPUT')
        if output:
            with open(output, 'a') as stream:
                for key in ('roleArn', 'account', 'region'):
                    stream.write(f'{key}={config[key]}\n')
    if args.command == 'deploy':
        require(args.selected, 'Immutable selected release required')
        execute(args.site, args.operation, json.loads(Path(args.selected).read_text()), policy, config)
