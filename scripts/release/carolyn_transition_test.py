"""Exercise real deploy routing, observation, state CAS, ref CAS, job and smoke wiring.

Only external AWS/GitHub/Git/HTTP/tool boundaries and immutable main selection are
fixtures. No lifecycle/receipt/state implementation is replaced with a success mock.
"""
import copy
import json
import os
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

import carolyn_transition as transition
import deploy
import ssr
import static
from state import State, StateOwnershipError, UnknownOutcome
from state_test import Store


class CarolynStore(Store):
    def __init__(self):
        super().__init__()
        self.value.update(site='carolyn', highWatermark='a' * 40,
                          currentRelease=dict(repository='soodoh/carolyn-portfolio', commit='c' * 40, recoveryLocation='fixture-original-source'))
        self.refs = {'amplify-production': 'c' * 40, 'fixture-candidate': 'a' * 40}
        self.jobs = {branch: dict(jobId='1', jobArn=f'arn:aws:amplify:us-west-2:725669362139:apps/dfixture/branches/{branch}/jobs/1', status='SUCCEED', commitId=commit, jobType='RELEASE') for branch, commit in self.refs.items()}
        self.log = []
        self.fault = None
        self.repository = 'https://github.com/soodoh/websites'
        self.root = 'apps/carolyn'
        self.domain_branch = 'amplify-production'

    def check_conditional_support(self):
        pass  # Aws CLI skeleton boundary is independently covered in state_test.

    def call(self, service, operation, **options):
        self.log.append(operation)
        if service == 's3api':
            proposed = json.loads(Path(options['body']).read_text())
            phase = 'candidate-cas' if proposed.get('acceptedCandidate') and proposed['intent'] is None else 'finish-cas' if proposed.get('ssrProductionAccepted') else None
            if self.fault == phase and phase:
                raise UnknownOutcome('conditional persistence failed')
            result = super().call(service, operation, **options)
            if self.fault == 'ambiguous-' + str(phase):
                return {}  # Write reached the external store, response outcome lost.
            return result
        if operation == 'get-caller-identity': return {'Account': '725669362139'}
        if operation == 'get-app': return {'app': dict(appId='dfixture', platform='WEB_COMPUTE', repository=self.repository, defaultDomain='dfixture.amplifyapp.com')}
        branch = options.get('branch_name')
        if operation == 'get-branch':
            return {'branch': dict(branchName='wrong' if self.fault == 'branch' else branch,
                                  enableAutoBuild=self.fault == 'auto-build', enablePullRequestPreview=False,
                                  environmentVariables={'AMPLIFY_MONOREPO_APP_ROOT': self.root, 'CAROLYN_CANDIDATE_BRANCH': 'fixture-candidate'})}
        if operation == 'get-domain-association':
            return {'domainAssociation': dict(domainStatus='AVAILABLE', subDomains=[{'subDomainSetting': dict(prefix=prefix, branchName=self.domain_branch)}
                    for prefix in (('', 'www') if options['domain_name'] == 'carolyndiloreto.com' else ('carolyn',))])}
        if operation == 'list-jobs': return {'jobSummaries': [self.jobs[branch]]}
        if operation == 'start-job':
            assert self.value['intent'] is not None
            assert self.refs[branch] == options['commit_id']
            assert options['commit_message'] == 'GitHub Actions release ' + options['commit_id']
            if self.fault == 'start-unknown': raise UnknownOutcome('unknown start')
            job = dict(jobId='1' if self.fault == 'reused-job' else '2', status='SUCCEED', jobType='WEB_HOOK' if self.fault == 'job-type' else 'RELEASE',
                       commitId='d' * 40 if self.fault == 'job-sha' else options['commit_id'])
            job['jobArn'] = f"arn:aws:amplify:us-west-2:725669362139:apps/dfixture/branches/{'wrong' if self.fault == 'job-branch' else branch}/jobs/{job['jobId']}"
            self.jobs[branch] = job
            return {'jobSummary': job}
        if operation == 'get-job': return {'job': {'summary': self.jobs[branch]}}
        if operation == 'stop-job': raise AssertionError('Terminal/lost ownership must not stop a job')
        raise AssertionError((service, operation))


class CarolynTransitionTests(unittest.TestCase):
    def setUp(self):
        self.store = CarolynStore()
        self.config = dict(region='us-west-2', account='725669362139', appId='dfixture', branch='amplify-production',
                           candidateBranch='fixture-candidate', candidateUrl='https://fixture-candidate.dfixture.amplifyapp.com',
                           productionUrl='https://carolyndiloreto.com', candidateEnabled=True, promotionEnabled=True,
                           stateBucket='fixture', stateKey='state/carolyn', stateOwner='725669362139')
        self.selected = dict(repository='soodoh/websites', site='carolyn', commit='b' * 40, workflow='.github/workflows/release-site.yml',
                             workflowSha='b' * 40, runId='10', runAttempt='1')
        self.policy = dict(repositoryId='100', ownerId='200', validationWorkflowIds={self.selected['workflow']: '300'})
        self.previous = copy.deepcopy(self.store.value)
        self.urls, self.commands, self.observations = [], [], []
        self.bad_observation = False
        self.superseded = False
        self.smoke_failure = False
        self.marker_failure = False
        self.lose_smoke_ownership = False
        self.order_calls = 0
        contexts = [patch.dict(os.environ, dict(GITHUB_RUN_ID='20', GITHUB_RUN_ATTEMPT='1', GH_TOKEN='fixture-only', PATH='/safe', HOME='/empty'), clear=True),
                    patch.object(deploy, 'Aws', return_value=self.store), patch.object(deploy, 'pinned_main', return_value='b' * 40),
                    patch.object(deploy, 'ordering', side_effect=self.ordering), patch.object(static, 'gh', side_effect=self.gh),
                    patch.object(ssr, 'gh', side_effect=self.gh), patch.object(ssr.subprocess, 'run', side_effect=self.git),
                    patch.object(ssr, 'command', side_effect=self.command), patch.object(transition, 'read_marker', side_effect=self.read)]
        for context in contexts: context.start()
        self.addCleanup(lambda: [context.stop() for context in reversed(contexts)])

    def ordering(self, site, commit, main, state):
        self.order_calls += 1
        self.assertEqual(site, 'carolyn')
        self.assertEqual(commit, self.selected['commit'])
        self.assertEqual(state['highWatermark'], self.previous['highWatermark'])
        return 'superseded' if self.superseded else 'eligible'

    def gh(self, path):
        self.observations.append(path)
        if '/git/ref/heads/' in path:
            return {'object': {'sha': self.store.refs[path.rsplit('/', 1)[1]]}}
        if path == 'repos/soodoh/websites': return {'id': 100, 'owner': {'id': 200}}
        if '/jobs?' in path:
            return {'jobs': [dict(name=name, status='completed', conclusion='failure' if self.bad_observation else 'success')
                             for name in ('release root validation', 'carolyn release validation')]}
        run_id = int(path.split('/actions/runs/')[1].split('/')[0])
        return dict(id=run_id, run_attempt=1, head_repository={'full_name': 'soodoh/websites', 'id': 100}, workflow_id=300,
                    path=self.selected['workflow'], head_branch='main', event='workflow_dispatch', head_sha=('b' if run_id == 10 else 'd') * 40)

    def git(self, args, **kwargs):
        self.assertEqual(args[:2], ['git', 'push'])
        commit, ref = args[-1].split(':')
        branch = ref.removeprefix('refs/heads/')
        self.assertEqual(args[2], f'--force-with-lease={ref}:{self.store.refs[branch]}')
        self.assertIsNotNone(self.store.value['intent'])
        self.store.refs[branch] = commit
        self.store.log.append('ref-cas')
        return subprocess.CompletedProcess(args, 0)

    def command(self, args, root, env):
        self.assertNotIn('GH_TOKEN', env)
        self.assertNotIn('AWS_SECRET_ACCESS_KEY', env)
        self.commands.append((args, env))
        self.store.log.append('smoke')
        if self.lose_smoke_ownership: self.store.etag = 'other-owner'
        if self.smoke_failure: raise subprocess.CalledProcessError(1, args)

    def read(self, url):
        self.urls.append(url)
        branch = 'fixture-candidate' if url.startswith(self.config['candidateUrl']) else 'amplify-production'
        job = self.store.jobs[branch]
        marker = dict(schemaVersion=1, kind='website-ssr-production', site='carolyn', commit=job['commitId'],
                      appId='dfixture', branch=branch, jobId='999' if self.marker_failure else job['jobId'])
        return 200, json.dumps(marker).encode()

    def run_operation(self, operation):
        deploy.execute('carolyn', operation, self.selected, self.policy, self.config)

    def preserved(self):
        for key in transition.PRODUCTION_FIELDS:
            self.assertEqual(self.store.value.get(key), self.previous.get(key))

    def test_candidate_then_separate_production_rebuild_and_receipts(self):
        self.run_operation('candidate')
        self.preserved()
        self.assertEqual(self.store.refs['amplify-production'], 'c' * 40)
        self.assertTrue(all(url.startswith(self.config['candidateUrl'] + '/') for url in self.urls))
        candidate = copy.deepcopy(self.store.value['acceptedCandidate'])
        self.assertEqual(candidate['productionRef'], 'c' * 40)
        self.assertEqual(candidate['receipt']['servingAcceptance'], 'not-applicable')
        self.assertNotIn('servingRelease', candidate['receipt'])
        self.assertIn('--config=playwright.candidate.config.ts', self.commands[0][0])
        self.assertNotIn('AMPLIFY_DEFAULT_ORIGIN', self.commands[0][1])
        self.assertEqual(self.commands[0][1]['CAROLYN_CANDIDATE_BRANCH'], 'fixture-candidate')
        self.selected = {**self.selected, 'runId': '11', 'workflowSha': 'd' * 40}
        self.run_operation('promote')
        self.assertTrue(any('/runs/11/attempts/1/jobs?' in path for path in self.observations))
        self.assertEqual(self.store.value['currentRelease']['runId'], '11')
        self.assertEqual(self.store.value['lastSsrCutover']['release']['runId'], '10')
        self.assertEqual(self.store.value['lastSsrCutover'], candidate)
        self.assertEqual(self.store.value['currentRelease']['commit'], 'b' * 40)
        self.assertTrue(self.store.value['ssrProductionAccepted'])
        self.assertIsNone(self.store.value['intent'])
        self.assertEqual(self.store.value['lastLifecycleReceipt']['jobs'], [dict(branch='amplify-production', jobId='2')])
        self.assertEqual(self.store.value['lastLifecycleReceipt']['buildAttestation'], 'separate-ssr-rebuild')
        self.assertEqual(self.store.log.count('start-job'), 2)
        self.assertIn('--config=playwright.amplify.config.ts', self.commands[-1][0])
        self.assertEqual(self.commands[-1][1]['AMPLIFY_DEFAULT_ORIGIN'], 'https://amplify-production.dfixture.amplifyapp.com')
        self.assertGreaterEqual(self.order_calls, 8)
        self.assertNotIn('put-parameter', self.store.log)
        for call, options in self.store.calls:
            if call == 'put-object':
                self.assertEqual(options['expected_bucket_owner'], '725669362139')
                self.assertEqual(options['server_side_encryption'], 'aws:kms')
                self.assertIn('if_match', options)

    def test_nullable_unsafe_config_and_independent_flags_deny_before_any_mutation(self):
        cases = [('candidateBranch', value) for value in (None, '', 'main', 'amplify-production', 'sarabeth-production', '*', 'bad/name', '-bad', 'Upper')]
        cases += [('candidateUrl', value) for value in (None, self.config['productionUrl'], 'https://evil.invalid', self.config['candidateUrl'] + '/', self.config['candidateUrl'] + '@evil.invalid')]
        cases += [('candidateEnabled', False)]
        for key, value in cases:
            original = self.config[key]
            self.config[key] = value
            with self.assertRaises(ValueError): self.run_operation('candidate')
            self.config[key] = original
            self.assertIsNone(self.store.value['intent'])
        self.run_operation('candidate')
        self.config['promotionEnabled'] = False
        with self.assertRaisesRegex(ValueError, 'disabled'): self.run_operation('promote')
        self.preserved()

    def test_wrong_repository_branch_root_domain_or_validation_deny(self):
        for failure in ('repository', 'branch', 'root', 'domain', 'validation', 'auto-build'):
            self.store.repository = 'https://github.com/fork/websites' if failure == 'repository' else 'https://github.com/soodoh/websites'
            self.store.root = 'apps/paul' if failure == 'root' else 'apps/carolyn'
            self.store.domain_branch = 'fixture-candidate' if failure == 'domain' else 'amplify-production'
            self.store.fault = failure
            self.bad_observation = failure == 'validation'
            with self.assertRaises(ValueError): self.run_operation('candidate')
            self.assertIsNone(self.store.value['intent'])
        self.assertNotIn('start-job', self.store.log)

    def test_job_bundle_smoke_and_candidate_persistence_faults_preserve_production(self):
        for fault in ('job-sha', 'job-type', 'job-branch', 'reused-job', 'start-unknown', 'marker', 'smoke', 'candidate-cas', 'ambiguous-candidate-cas'):
            with self.subTest(fault=fault):
                self.store = CarolynStore()
                # Aws factory resolves current fixture store, not a lifecycle mock.
                with patch.object(deploy, 'Aws', return_value=self.store):
                    self.store.fault = fault
                    self.marker_failure = fault == 'marker'
                    self.smoke_failure = fault == 'smoke'
                    with self.assertRaises((ValueError, UnknownOutcome, subprocess.CalledProcessError)):
                        self.run_operation('candidate')
                    self.preserved()
                    self.assertEqual(self.store.refs['amplify-production'], 'c' * 40)
                    if fault != 'ambiguous-candidate-cas': self.assertIsNotNone(self.store.value['intent'])
                    self.assertNotIn('stop-job', self.store.log)

    def test_stale_candidate_scope_ref_job_generation_and_recovery_state_deny_promotion(self):
        self.run_operation('candidate')
        accepted = copy.deepcopy(self.store.value)
        for fault in ('missing', 'sha', 'scope', 'candidate-ref', 'production-ref', 'job', 'generation', 'recovery', 'hosting'):
            self.store.value = copy.deepcopy(accepted)
            self.store.refs.update({'fixture-candidate': 'b' * 40, 'amplify-production': 'c' * 40})
            self.store.jobs['fixture-candidate']['jobId'] = '2'
            self.superseded = fault == 'scope'
            if fault == 'missing': self.store.value.pop('acceptedCandidate')
            if fault == 'sha': self.store.value['acceptedCandidate']['release']['commit'] = 'd' * 40
            if fault.endswith('-ref'): self.store.refs['fixture-candidate' if fault == 'candidate-ref' else 'amplify-production'] = 'd' * 40
            if fault == 'job': self.store.jobs['fixture-candidate']['jobId'] = '3'
            if fault == 'generation': self.store.value['generation'] += 1
            if fault == 'recovery': self.store.value['currentRelease']['commit'] = 'd' * 40
            if fault == 'hosting': self.store.value['acceptedCandidate']['hosting']['candidateUrl'] = 'https://evil.invalid'
            with self.assertRaises(ValueError): self.run_operation('promote')
            self.assertIsNone(self.store.value['intent'])
        self.assertEqual(self.store.log.count('start-job'), 1)

    def test_lost_ownership_and_failed_production_serving_retain_intent_without_rollback(self):
        self.run_operation('candidate')
        self.lose_smoke_ownership = True
        with self.assertRaises(StateOwnershipError): self.run_operation('promote')
        self.preserved()
        self.assertEqual(self.store.refs['amplify-production'], 'b' * 40)
        self.assertIsNotNone(self.store.value['intent'])
        self.assertNotIn('stop-job', self.store.log)
        self.assertEqual(self.store.log.count('ref-cas'), 2)

    def test_production_smoke_or_final_cas_failure_never_certifies_success(self):
        for fault in ('smoke', 'finish-cas', 'ambiguous-finish-cas'):
            with self.subTest(fault=fault):
                self.store = CarolynStore()
                with patch.object(deploy, 'Aws', return_value=self.store):
                    self.smoke_failure = False
                    self.run_operation('candidate')
                    self.smoke_failure = fault == 'smoke'
                    self.store.fault = fault
                    with self.assertRaises((UnknownOutcome, subprocess.CalledProcessError)): self.run_operation('promote')
                    if fault != 'ambiguous-finish-cas':
                        self.preserved()
                        self.assertIsNotNone(self.store.value['intent'])
                    else:
                        # External write may have succeeded, but adapter still fails.
                        self.assertTrue(self.store.value['ssrProductionAccepted'])
                    self.assertEqual(self.store.refs['amplify-production'], 'b' * 40)
                    self.assertNotIn('stop-job', self.store.log)

    def test_routine_first_cutover_cannot_bypass_candidate(self):
        with self.assertRaisesRegex(ValueError, 'first-cutover'): self.run_operation('release')
        with self.assertRaisesRegex(ValueError, 'accepted Carolyn candidate'): self.run_operation('promote')
        self.assertNotIn('start-job', self.store.log)

    def test_stale_etag_before_claim_denies_ref_and_job_mutations(self):
        state = State(self.store, self.config, 'carolyn')
        state.read()
        self.store.etag = 'other-owner'
        with self.assertRaises(StateOwnershipError):
            transition.release_carolyn(self.store, self.config, state, self.selected, self.policy, lambda: None, 'candidate')
        self.assertNotIn('ref-cas', self.store.log)
        self.assertNotIn('start-job', self.store.log)

    def test_paginated_active_jobs_or_unknown_inventory_deny_before_claim(self):
        original = self.store.call
        def paginated(service, operation, **options):
            if operation == 'list-jobs':
                if options.get('next_token'):
                    return {'jobSummaries': [dict(jobId='old', status='RUNNING')]}
                return {**original(service, operation, **options), 'nextToken': 'page2'}
            return original(service, operation, **options)
        with patch.object(self.store, 'call', side_effect=paginated):
            with self.assertRaisesRegex(ValueError, 'writer'): self.run_operation('candidate')
        self.assertIsNone(self.store.value['intent'])
        self.assertNotIn('ref-cas', self.store.log)

    def test_marker_redirect_handler_refuses_following_production(self):
        handler = transition.NoRedirect()
        self.assertIsNone(handler.redirect_request(None, None, 302, '', {}, self.config['productionUrl']))


if __name__ == '__main__':
    unittest.main()
