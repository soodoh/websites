"""Real candidate/state/switch lifecycle; replace only external APIs, Git, HTTP and tools."""
import copy
import json
import os
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

import sarabeth_transition as transition
import ssr
from state import State, StateOwnershipError, UnknownOutcome
from state_test import Store


class CutoverStore(Store):
    def __init__(self):
        super().__init__()
        self.value.update(site='sarabeth', highWatermark='a' * 40, currentRelease=dict(repository='soodoh/sarabeth-studio', commit='c' * 40, recoveryLocation='fixture-original-source'))
        self.log = []
        self.branch_ref = 'a' * 40
        self.production_branch = 'main'
        self.lkg = 'c' * 40
        self.fail_phase = None
        self.job = dict(jobId='12', status='SUCCEED', commitId='b' * 40)

    def call(self, service, operation, **options):
        self.log.append(operation)
        if service == 's3api':
            proposed = json.loads(Path(options['body']).read_text())
            if self.fail_phase == 'candidate-cas' and proposed.get('acceptedCandidate'):
                raise UnknownOutcome('412')
            if self.fail_phase == 'finish-cas' and proposed.get('ssrProductionAccepted'):
                raise UnknownOutcome('412')
            return super().call(service, operation, **options)
        if operation == 'get-caller-identity': return {'Account': '015989770400'}
        if operation == 'get-app': return {'app': dict(platform='WEB_COMPUTE', repository='https://github.com/soodoh/websites', defaultDomain='dfixture.amplifyapp.com')}
        if operation == 'get-branch': return {'branch': dict(branchName='sarabeth-production', enableAutoBuild=False, enablePullRequestPreview=False, environmentVariables={'AMPLIFY_MONOREPO_APP_ROOT': 'apps/sarabeth'})}
        if operation == 'list-jobs': return {'jobSummaries': [self.job]}
        if operation == 'start-job':
            assert self.value['intent']['operation'] == 'candidate'
            assert options['commit_message'] == 'GitHub Actions release ' + 'b' * 40
            return {'jobSummary': self.job}
        if operation == 'get-job': return {'job': {'summary': self.job}}
        if operation == 'get-domain-association': return {'domainAssociation': dict(domainStatus='AVAILABLE', subDomains=[{'subDomainSetting': dict(prefix=prefix, branchName=self.production_branch)} for prefix in ('', 'www')])}
        if operation == 'put-parameter':
            assert self.value['intent']['phase'] == 'production-verified'
            assert options['name'] == '/sarabeth-studio/production/last-known-good-sha'
            self.lkg = options['value']
            return {}
        raise AssertionError(operation)


class SsrCutoverTests(unittest.TestCase):
    def setUp(self):
        self.store = CutoverStore()
        self.config = dict(appId='dfixture', branch='sarabeth-production', candidateEnabled=True, switchEnabled=True, candidateUrl='https://sarabeth-production.dfixture.amplifyapp.com', productionUrl='https://production.invalid', stateBucket='fixture', stateKey='state/sarabeth', stateOwner='015989770400')
        self.state = State(self.store, self.config, 'sarabeth')
        self.state.read()
        self.previous = copy.deepcopy(self.state.value)
        self.selected = dict(site='sarabeth', repository='soodoh/websites', commit='b' * 40, runId='10', runAttempt='2', workflow='.github/workflows/ci.yml')
        self.marker = dict(schemaVersion=1, kind='website-ssr-production', site='sarabeth', commit='b' * 40, appId='dfixture', branch='sarabeth-production', jobId='12')
        self.urls, self.tools = [], []
        self.fail_check = None
        self.superseded = False
        self.patches = [patch.dict(os.environ, {'GITHUB_RUN_ID': '20', 'GITHUB_RUN_ATTEMPT': '1', 'PATH': '/safe', 'HOME': '/empty', 'AWS_SECRET_ACCESS_KEY': 'denied-child', 'GH_TOKEN': 'denied-child'}, clear=True), patch.object(ssr, 'observe'), patch.object(transition, 'observe'), patch.object(ssr, 'ref_sha', side_effect=lambda branch: self.store.branch_ref), patch.object(ssr, 'promote', side_effect=self.promote), patch.object(ssr, 'read_url', side_effect=self.read), patch.object(transition, 'read_url', side_effect=self.read), patch.object(ssr, 'command', side_effect=self.command)]
        for context in self.patches: context.start()
        self.addCleanup(lambda: [context.stop() for context in reversed(self.patches)])
        self.switch = transition.Switch(self.store, self.config, self.state, {}, '30/1', self.recheck)

    def recheck(self, *args):
        if self.superseded: raise ValueError('Relevant scope superseded')

    def promote(self, branch, previous, commit):
        self.assertIsNotNone(self.store.value['intent'])
        self.assertEqual(self.store.branch_ref, previous)
        self.store.branch_ref = commit

    def read(self, url):
        self.urls.append(url)
        if self.config['productionUrl'] in url:
            self.assertEqual(self.store.production_branch, 'sarabeth-production', 'Old production must never be candidate acceptance')
        marker = {**self.marker, 'commit': 'd' * 40} if self.fail_check == 'marker' else self.marker
        return 200, {}, json.dumps(marker).encode()

    def command(self, argv, root, environment):
        self.assertNotIn('GH_TOKEN', environment)
        self.assertNotIn('AWS_SECRET_ACCESS_KEY', environment)
        self.tools.append((argv, environment))
        self.store.log.append('smoke' if 'scripts/smoke-deployment.ts' in argv else 'lighthouse')
        if self.fail_check == 'smoke' and 'scripts/smoke-deployment.ts' in argv:
            raise subprocess.CalledProcessError(1, argv)
        if self.fail_check == 'lighthouse' and 'lhci' in argv:
            raise subprocess.CalledProcessError(1, argv)

    def candidate(self):
        ssr.release_ssr('sarabeth', self.store, self.config, self.state, self.selected, {}, self.recheck, 'candidate')

    def preserve_production(self):
        for key in ('currentRelease', 'highWatermark', 'lastLifecycleReceipt', 'ssrProductionAccepted'):
            self.assertEqual(self.store.value.get(key), self.previous.get(key))
        self.assertEqual(self.store.lkg, 'c' * 40)

    def domain_mutation(self, fail=False):
        self.switch.guard('b' * 40, '12', 'switch-claimed')
        self.assertEqual(self.store.value['intent']['operation'], 'switch')
        self.store.production_branch = 'sarabeth-production'
        if fail: raise UnknownOutcome('CloudFormation outcome unknown')

    def test_old_production_candidate_approved_switch_then_provenance(self):
        self.candidate()
        self.preserve_production()
        self.assertTrue(all(self.config['candidateUrl'] in url for url in self.urls))
        self.assertEqual([env['LHCI_FORM_FACTOR'] for argv, env in self.tools if 'lhci' in argv], ['mobile', 'desktop'])
        candidate = copy.deepcopy(self.store.value['acceptedCandidate'])
        self.assertIsNone(self.store.value['intent'])
        self.switch.begin('b' * 40, '12')
        self.preserve_production()
        self.domain_mutation()
        self.switch.accept_production('b' * 40, '12')
        self.assertEqual(self.store.value['currentRelease'], self.previous['currentRelease'])
        self.assertEqual(self.store.value['intent']['phase'], 'lkg-written')
        self.switch.finish('b' * 40, '12')
        self.assertEqual(self.store.value['lastSsrCutover'], candidate)
        self.assertEqual(self.store.value['currentRelease']['commit'], 'b' * 40)
        self.assertEqual(self.store.value['highWatermark'], 'b' * 40)
        self.assertTrue(self.store.value['ssrProductionAccepted'])
        self.assertIsNone(self.store.value['intent'])
        self.assertNotIn('acceptedCandidate', self.store.value)
        self.assertEqual(self.store.value['lastLifecycleReceipt']['jobs'], [dict(branch='sarabeth-production', jobId='12')])
        self.assertLess(self.store.log.index('smoke'), self.store.log.index('put-parameter'))

    def test_candidate_marker_smoke_lighthouse_and_cas_failures_never_advance_production(self):
        for failure in ('marker', 'smoke', 'lighthouse', 'candidate-cas'):
            with self.subTest(failure=failure):
                # Reset only the in-memory external store, not any retained production evidence.
                self.store.value = copy.deepcopy(self.previous)
                self.store.etag = '"etag-1"'
                self.store.branch_ref = 'a' * 40
                self.state.read()
                self.fail_check = failure
                self.store.fail_phase = failure
                with self.assertRaises((ValueError, subprocess.CalledProcessError, StateOwnershipError)): self.candidate()
                self.preserve_production()
                self.assertNotIn('acceptedCandidate', self.store.value)
                self.assertIsNotNone(self.store.value['intent'])
                self.assertNotIn('put-parameter', self.store.log)

    def test_candidate_operation_and_routine_first_cutover_are_fail_closed(self):
        self.config['candidateEnabled'] = False
        with self.assertRaisesRegex(ValueError, 'disabled'): self.candidate()
        for site in ('carolyn', 'sarabeth'):
            with self.assertRaisesRegex(ValueError, 'first-cutover'):
                ssr.release_ssr(site, self.store, self.config, self.state, {**self.selected, 'site': site}, {}, self.recheck)
        self.assertEqual(self.store.log, [])

    def test_candidate_drift_wrong_approval_and_intervening_writer_deny_before_switch(self):
        self.candidate()
        for failure in ('disabled', 'identity', 'scope', 'ref', 'domain', 'job', 'etag'):
            with self.subTest(failure=failure):
                self.config['switchEnabled'] = failure != 'disabled'
                self.superseded = failure == 'scope'
                self.store.branch_ref = ('c' if failure == 'ref' else 'b') * 40
                self.store.production_branch = 'other' if failure == 'domain' else 'main'
                self.store.job['jobId'] = '13' if failure == 'job' else '12'
                original_etag = self.store.etag
                if failure == 'etag': self.store.etag = '"intervening"'
                with self.assertRaises((ValueError, StateOwnershipError)):
                    self.switch.begin('d' * 40 if failure == 'identity' else 'b' * 40, '12')
                self.assertIsNone(self.store.value['intent'])
                self.preserve_production()
                self.store.etag = original_etag

    def test_candidate_url_and_switch_claim_conflict_fail_before_domain_mutation(self):
        for url in (None, self.config['productionUrl'], 'https://unapproved.invalid'):
            self.config['candidateUrl'] = url
            with self.assertRaises(ValueError): self.candidate()
            self.assertIsNone(self.store.value['intent'])
        self.config['candidateUrl'] = 'https://sarabeth-production.dfixture.amplifyapp.com'
        self.candidate()
        accepted = copy.deepcopy(self.store.value)
        self.store.fail = True
        with self.assertRaises(StateOwnershipError): self.switch.begin('b' * 40, '12')
        self.assertEqual(self.store.value, accepted)
        self.assertEqual(self.store.production_branch, 'main')
        self.preserve_production()

    def test_ambiguous_switch_or_production_smoke_failure_retains_recovery_intent(self):
        self.candidate()
        self.switch.begin('b' * 40, '12')
        with self.assertRaises(UnknownOutcome): self.domain_mutation(fail=True)
        self.preserve_production()
        self.assertEqual(self.store.value['intent']['phase'], 'switch-claimed')
        self.fail_check = 'smoke'
        with self.assertRaises(subprocess.CalledProcessError): self.switch.accept_production('b' * 40, '12')
        self.preserve_production()
        self.assertNotIn('put-parameter', self.store.log)
        self.assertEqual(self.store.production_branch, 'sarabeth-production')

    def test_lost_ownership_stops_before_ssm_and_final_conflict_retains_intent(self):
        self.candidate()
        self.switch.begin('b' * 40, '12')
        self.domain_mutation()
        original_etag = self.store.etag
        self.store.etag = '"other-owner"'
        with self.assertRaises(StateOwnershipError): self.switch.accept_production('b' * 40, '12')
        self.preserve_production()
        self.assertNotIn('put-parameter', self.store.log)
        # Simulate a distinct fixture case at the unchanged owned checkpoint.
        self.store.etag = original_etag
        self.switch.accept_production('b' * 40, '12')
        self.store.fail_phase = 'finish-cas'
        with self.assertRaises(StateOwnershipError): self.switch.finish('b' * 40, '12')
        self.assertEqual(self.store.value['currentRelease'], self.previous['currentRelease'])
        self.assertEqual(self.store.value['highWatermark'], self.previous['highWatermark'])
        self.assertEqual(self.store.value['intent']['phase'], 'lkg-written')
        self.assertEqual(self.store.lkg, 'b' * 40)
        self.assertEqual(self.store.production_branch, 'sarabeth-production')


if __name__ == '__main__':
    unittest.main()
