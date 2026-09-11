"""Protected public entry with external GitHub/Git/AWS fakes; never OIDC or real HTTP."""
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import paul_recovery as recovery
import paul_recovery_entry as entry
import paul_acceptance as acceptance
import paul_recovery_test as fixtures
from paul_recovery_test import ExternalAws


class EntryTests(unittest.TestCase):
    def setUp(self):
        self.root = Path(self.enterContext(tempfile.TemporaryDirectory()))
        (self.root / 'config').mkdir()
        for name in ('release-policy.json', 'release-runtime.json', 'paul-legacy-recovery.json'):
            (self.root / 'config' / name).write_bytes((entry.ROOT / 'config' / name).read_bytes())
        self.runtime = json.loads((self.root / 'config/release-runtime.json').read_text())
        self.runtime['publicationLocked'] = False
        self.runtime['sites']['paul'].update(bootstrapEnabled=True, rehearsalEnabled=True, sourceWriterDrained=True)
        self.save_runtime()
        self.release = json.dumps(recovery.pinned_release(recovery.recovery_pins()))
        self.floor = dict(commit='a' * 40, runId='100', runAttempt='1')
        self.baseline = json.dumps(self.floor)
        self.repo = dict(full_name='soodoh/websites', id=1358469291, owner=dict(id=18269267))
        self.env = dict(GITHUB_REPOSITORY='soodoh/websites', GITHUB_REPOSITORY_ID='1358469291',
            GITHUB_REPOSITORY_OWNER_ID='18269267', GITHUB_REF='refs/heads/main',
            GITHUB_EVENT_NAME='workflow_dispatch', RELEASE_ENVIRONMENT='production-portfolio',
            GITHUB_WORKFLOW_REF='soodoh/websites/.github/workflows/restore-static.yml@refs/heads/main',
            GITHUB_RUN_ID='200', GITHUB_RUN_ATTEMPT='1', GITHUB_WORKFLOW_SHA='a' * 40, GITHUB_SHA='a' * 40,
            GITHUB_EVENT_PATH=str(self.root / 'event.json'), **entry.SAFE_AWS)
        self.event = dict(repository=self.repo, ref='refs/heads/main', inputs=dict(site='paul', operation='bootstrap',
            release=self.release, baseline=self.baseline))
        self.save_event()
        self.execution = dict(id=200, run_attempt=1, workflow_id=351776221, path=entry.WORKFLOW,
            head_repository=self.repo, head_sha='a' * 40, head_branch='main', event='workflow_dispatch',
            status='in_progress', conclusion=None)
        self.ci = dict(id=100, run_attempt=1, workflow_id=351279106, path=entry.CI, head_repository=self.repo,
            head_sha='a' * 40, head_branch='main', event='push', status='completed', conclusion='success', check_suite_id=300)
        self.suite = dict(id=300, head_sha='a' * 40, head_branch='main', app=dict(id=15368), status='completed', conclusion='success')
        self.jobs = [dict(id=n, name=name, run_id=100, run_attempt=1, head_sha='a' * 40,
            status='completed', conclusion='success', check_run_url=f'https://api.github.com/repos/soodoh/websites/check-runs/{n}')
            for n, name in enumerate(('root', 'paul / paul fixture verification', 'CI gate'), 401)]
        self.checks = {str(j['id']): dict(id=j['id'], check_suite=dict(id=300), app=dict(id=15368),
            name=j['name'], head_sha='a' * 40, status='completed', conclusion='success') for j in self.jobs}
        self.calls = []
        self.enterContext(patch.object(entry, 'ROOT', self.root))
        self.enterContext(patch.object(entry, 'gh', self.gh))
        self.enterContext(patch.object(entry.subprocess, 'check_output', self.git))
        self.process = self.enterContext(patch.object(entry.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0)))
        self.aws = self.enterContext(patch.object(entry, 'Aws', side_effect=AssertionError('unexpected AWS construction')))
        self.enterContext(patch('socket.socket', side_effect=AssertionError('real network forbidden')))

    def save_runtime(self):
        (self.root / 'config/release-runtime.json').write_text(json.dumps(self.runtime))

    def save_event(self):
        (self.root / 'event.json').write_text(json.dumps(self.event))

    def gh(self, path):
        self.calls.append(path)
        if path == 'repos/soodoh/websites': return copy.deepcopy(self.repo)
        if '/runs/200/attempts/1' in path: return copy.deepcopy(self.execution)
        if '/jobs?' in path: return dict(jobs=copy.deepcopy(self.jobs))
        if '/runs/100/attempts/1' in path: return copy.deepcopy(self.ci)
        if '/check-suites/300' in path: return copy.deepcopy(self.suite)
        if '/check-runs/' in path: return copy.deepcopy(self.checks[path.rsplit('/', 1)[1]])
        if '/git/ref/heads/main' in path: return dict(object=dict(sha='b' * 40))
        raise AssertionError(path)

    def git(self, args, **kwargs):
        self.calls.append(args)
        if args == ['git', 'rev-parse', 'HEAD']: return 'a' * 40
        if args == ['git', 'rev-parse', '--is-shallow-repository']: return 'false'
        if args[:2] in (['git', 'diff'], ['git', 'fetch'], ['git', 'merge-base']): return ''
        raise AssertionError(args)

    def run_entry(self, command='check'):
        return entry.run(command, 'bootstrap', self.release, self.baseline, self.env)

    def test_proposal_effect_free_and_baseline_distinct(self):
        result = self.run_entry('proposal')
        self.assertEqual(result['highWatermark'], 'a' * 40)
        self.assertEqual(result['currentRelease']['commit'], recovery.recovery_pins()['commit'])
        self.assertEqual(self.calls, [])
        self.aws.assert_not_called()

    def test_check_binds_actual_run_suite_jobs_and_scope_before_credentials(self):
        result = self.run_entry()
        self.assertEqual(result['account'], recovery.OWNER)
        self.aws.assert_not_called()
        self.assertEqual(self.process.call_count, 2)
        self.assertIn(['git', 'fetch', '--no-tags', 'origin', 'b' * 40], self.calls)
        self.assertIn(['git', 'merge-base', '--is-ancestor', 'a' * 40, 'b' * 40], self.calls)
        self.assertEqual(self.process.call_args.args[0][-2:], ['a' * 40, 'b' * 40])

    def test_every_lock_denies_before_external_observation(self):
        for key in ('publicationLocked', 'bootstrapEnabled', 'sourceWriterDrained'):
            original = copy.deepcopy(self.runtime)
            if key == 'publicationLocked': self.runtime[key] = True
            else: self.runtime['sites']['paul'][key] = False
            self.save_runtime()
            with self.subTest(key=key), self.assertRaises(ValueError): self.run_entry()
            self.assertEqual(self.calls, [])
            self.runtime = original
        self.save_runtime()

    def test_wrong_protected_context_denied(self):
        for key in self.env:
            if key in entry.SAFE_AWS or key == 'GITHUB_EVENT_PATH': continue
            original = self.env[key]; self.env[key] = 'wrong'
            with self.subTest(key=key), self.assertRaises(ValueError): self.run_entry()
            self.env[key] = original
        self.aws.assert_not_called()

    def test_untrusted_dispatch_inputs_denied(self):
        for key in ('site', 'operation', 'release', 'baseline'):
            original = self.event['inputs'][key]; self.event['inputs'][key] = 'wrong'
            self.save_event()
            with self.subTest(key=key), self.assertRaises(ValueError): self.run_entry()
            self.event['inputs'][key] = original
        self.save_event()

    def test_wrong_execution_and_baseline_identities_denied(self):
        for document in (self.execution, self.ci):
            for key in ('id', 'run_attempt', 'workflow_id', 'path', 'head_repository', 'head_sha', 'head_branch', 'event', 'status', 'conclusion'):
                original = document[key]; document[key] = {} if key == 'head_repository' else 'wrong'
                with self.subTest(key=key), self.assertRaises(ValueError): self.run_entry()
                document[key] = original
        self.aws.assert_not_called()

    def test_missing_duplicate_failed_and_wrong_attempt_job_denied(self):
        original = copy.deepcopy(self.jobs)
        for jobs in (original[1:], original + [original[0]], [dict(j, run_attempt=2) for j in original],
                     [dict(j, conclusion='failure') for j in original]):
            self.jobs = jobs
            with self.assertRaises(ValueError): self.run_entry()
        self.jobs = original
        for key, value in [('app', dict(id=1)), ('check_suite', dict(id=999)), ('head_sha', 'c' * 40)]:
            original = self.checks['401'][key]; self.checks['401'][key] = value
            with self.assertRaises(ValueError): self.run_entry()
            self.checks['401'][key] = original

    def test_superseded_scope_and_nonancestor_fail_closed(self):
        self.process.side_effect = subprocess.CalledProcessError(1, ['node'])
        with self.assertRaises(subprocess.CalledProcessError): self.run_entry()
        self.aws.assert_not_called()
        self.process.side_effect = None
        with patch.object(entry, 'git', side_effect=subprocess.CalledProcessError(1, ['git'])):
            with self.assertRaises(subprocess.CalledProcessError): self.run_entry()

    def test_execute_bootstrap_real_create_only_state_with_actual_identity_fakes(self):
        storage = ExternalAws(recovery.recovery_pins(), {})
        hosting = HostingTests()
        hosting.setUp()
        storage_call = storage.call
        storage.call = lambda service, operation, **options: (storage_call(service, operation, **options)
            if service == 's3api' else hosting.call(service, operation, **options))
        storage.check_conditional_support = lambda: None
        self.aws.side_effect = None
        self.aws.return_value = storage
        result = self.run_entry('execute')
        self.assertEqual(result['bootstrapInvocation'], '200/1')
        self.assertEqual(result['highWatermark'], self.floor['commit'])
        self.assertEqual(storage.write_count, 1)
        with self.assertRaises(recovery.UnknownOutcome): self.run_entry('execute')
        self.assertEqual(storage.value, result)

    def test_execute_denies_endpoint_override_before_aws(self):
        self.env['AWS_ENDPOINT_URL'] = 'https://foreign.invalid'
        with self.assertRaisesRegex(ValueError, 'endpoint'): self.run_entry('execute')
        self.aws.assert_not_called()

    def test_exact_input_schema_and_duplicate_json_denied(self):
        for release in ('{}', self.release.replace('"paul"', '"diloreto"'), self.release[:-1] + ',"site":"paul"}'):
            with self.assertRaises(ValueError): entry.inputs('bootstrap', release, self.baseline)
        for operation in ('restore', 'release', 'diloreto', ''):
            with self.assertRaises(ValueError): entry.inputs(operation, self.release, self.baseline)
        for floor in ('{}', json.dumps(dict(self.floor, reviewed=True)), json.dumps(dict(self.floor, commit=recovery.recovery_pins()['commit']))):
            with self.assertRaises(ValueError): entry.inputs('bootstrap', self.release, floor)


class HostingTests(unittest.TestCase):
    def setUp(self):
        self.responses = {
            'get-caller-identity': dict(Account=recovery.OWNER, Arn=f'arn:aws:sts::{recovery.OWNER}:assumed-role/pauldiloreto-amplify-hosting-GitHubDeploymentRole-JPjJmwTE3kcw/paul-recovery-200-1'),
            'get-app': dict(app=dict(appId=recovery.APP, appArn=entry.APP_ARN, platform='WEB', defaultDomain=f'{recovery.APP}.amplifyapp.com', enableBranchAutoBuild=False)),
            'list-jobs': dict(jobSummaries=[]),
            'list-domain-associations': dict(domainAssociations=[dict(domainName='pauldiloreto.com')]),
            'get-domain-association': dict(domainAssociation=dict(domainAssociationArn=entry.APP_ARN+'/domains/pauldiloreto.com', domainName='pauldiloreto.com', domainStatus='AVAILABLE', enableAutoSubDomain=False,
                subDomains=[dict(verified=bool(prefix), subDomainSetting=dict(prefix=prefix, branchName='main')) for prefix in ('', 'www')])),
        }
    def call(self, service, operation, **options):
        if operation == 'get-branch':
            branch = options['branch_name']
            return dict(branch=dict(branchArn=f'{entry.APP_ARN}/branches/{branch}', branchName=branch,
                stage='BETA' if branch == 'candidate' else 'PRODUCTION', enableAutoBuild=False, enablePullRequestPreview=False))
        return copy.deepcopy(self.responses[operation])
    def test_actual_role_app_main_domain_mapping_and_own_job(self):
        entry.hosting(self, '200/1')
        self.responses['list-jobs']['jobSummaries'] = [dict(jobId='9', status='RUNNING')]
        with self.assertRaisesRegex(ValueError, 'writer'): entry.hosting(self, '200/1')
    def test_wrong_actual_resources_and_domain_mapping_denied(self):
        cases = [('get-caller-identity', 'Account', '000000000000'), ('get-caller-identity', 'Arn', 'wrong'),
                 ('get-app', 'app', {}), ('list-domain-associations', 'domainAssociations', []),
                 ('list-domain-associations', 'nextToken', 'more'), ('get-domain-association', 'domainAssociation', {})]
        for operation, key, value in cases:
            original = copy.deepcopy(self.responses)
            self.responses[operation][key] = value
            with self.subTest(operation=operation, key=key), self.assertRaises(ValueError): entry.hosting(self, '200/1')
            self.responses = original
        self.responses['get-domain-association']['domainAssociation']['subDomains'][0]['subDomainSetting']['branchName'] = 'candidate'
        with self.assertRaises(ValueError): entry.hosting(self, '200/1')
    def test_container_has_no_credentials_mount_or_socket_argv(self):
        args = acceptance.container_args('sha256:'+'a'*64, dict(commit='b'*40, runId='1', runAttempt='1'))
        self.assertNotIn('--volume', args)
        self.assertNotIn('--mount', args)
        self.assertNotIn('host', args)
        self.assertIn('bridge', args)
        self.assertNotIn('fixture', args)
        self.assertFalse(any('AWS_' in v or 'GH_TOKEN' in v or 'docker.sock' in v for v in args))
        for image in ('tag:latest', '', 'sha256:no'):
            with self.assertRaises(ValueError): acceptance.container_args(image, {})
        for path in ('test-results', 'playwright-report', '.lighthouseci'):
            self.assertIn('/work/apps/paul/' + path + ':rw,nosuid,nodev,uid=1000,gid=1000,mode=0700', args)

    def test_actual_container_inspection_denies_credentials_network_and_writable_path_drift(self):
        image = 'sha256:' + 'a' * 64
        value = dict(Image=image, Mounts=[], Config=dict(User='1000:1000', Env=[
            'PATH=/usr/bin:/bin', 'LANG=C.UTF-8', 'LC_ALL=C.UTF-8', 'CI=1', 'HOME=/tmp/home',
            'PLAYWRIGHT_BROWSERS_PATH=/ms-playwright', 'PAUL_ACCEPTANCE_MODE=fixture']),
            HostConfig=dict(ReadonlyRootfs=True, Privileged=False, IpcMode='private',
                CapDrop=['ALL'], SecurityOpt=['no-new-privileges'], NetworkMode='none',
                Tmpfs={'/tmp': 'rw,nosuid,nodev', **{'/work/apps/paul/' + path:
                    'rw,nosuid,nodev,uid=1000,gid=1000,mode=0700'
                    for path in ('test-results', 'playwright-report', '.lighthouseci')}}))
        def inspect(document, fixture=True):
            with patch.object(acceptance, 'docker', return_value=json.dumps([document])):
                acceptance.inspect_container('owned', image, fixture=fixture)
        inspect(value)
        with self.assertRaises(ValueError): inspect(value, fixture=False)
        for field, wrong in [('ReadonlyRootfs', False), ('Privileged', True), ('NetworkMode', 'host'),
                             ('Tmpfs', {'/work': 'rw'}), ('Binds', ['/host:/work']), ('Devices', ['/dev/a'])]:
            changed = copy.deepcopy(value); changed['HostConfig'][field] = wrong
            with self.subTest(field=field), self.assertRaises(ValueError): inspect(changed)
        for credential in ('AWS_ACCESS_KEY_ID=fixture', 'GH_TOKEN=fixture', 'HTTP_PROXY=http://foreign.invalid'):
            changed = copy.deepcopy(value); changed['Config']['Env'].append(credential)
            with self.subTest(credential=credential), self.assertRaises(ValueError): inspect(changed)


class ProtectedCallableTests(unittest.TestCase):
    setUp = fixtures.PaulRecoveryTests.setUp
    make_objects = fixtures.PaulRecoveryTests.make_objects
    update_object_pins = fixtures.PaulRecoveryTests.update_object_pins
    save_pins = fixtures.PaulRecoveryTests.save_pins
    http = fixtures.PaulRecoveryTests.http

    def test_full_acceptance_callback_freshness_and_production_preservation(self):
        self.aws = ExternalAws(self.pins, self.objects, recovery.bootstrap_proposal(self.policy, self.runtime, self.baseline))
        checks, accepted = [], []
        before = copy.deepcopy(self.aws.value)
        receipt = recovery.rehearse_candidate(self.aws, self.policy, self.runtime, self.release, '200/1',
            recheck=lambda job=None: checks.append(job), acceptance=lambda release: accepted.append(release))
        self.assertEqual(accepted, [self.release])
        self.assertIn('12', checks)
        self.assertIn('hosting-browser-lighthouse', receipt['verification'])
        self.assertEqual(self.aws.value['currentRelease'], before['currentRelease'])
        self.assertEqual(self.aws.value['highWatermark'], before['highWatermark'])

    def test_acceptance_failure_retains_intent_without_production_compensation(self):
        self.aws = ExternalAws(self.pins, self.objects, recovery.bootstrap_proposal(self.policy, self.runtime, self.baseline))
        def fail(_): raise ValueError('isolated browser failure')
        with self.assertRaisesRegex(ValueError, 'browser'):
            recovery.rehearse_candidate(self.aws, self.policy, self.runtime, self.release, '200/1',
                recheck=lambda job=None: None, acceptance=fail)
        self.assertIsNotNone(self.aws.value['intent'])
        self.assertFalse(any(call[0] == 'stop-job' for call in self.aws.calls))


if __name__ == '__main__':
    unittest.main()
