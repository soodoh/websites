import json
import os
import unittest
from unittest.mock import MagicMock, patch

import ssr
from state import State, StateOwnershipError


class SsrTests(unittest.TestCase):
    def run_release(self, site, bad_commit=False, bad_marker=False, fail_finish=False):
        selected = dict(site=site, repository='soodoh/websites', commit='b' * 40, runId='10', runAttempt='2', workflow='.github/workflows/ci.yml')
        config = dict(appId='dfixture', branch='sarabeth-production' if site == 'sarabeth' else 'amplify-production', productionUrl='https://fixture.invalid')
        state = MagicMock(spec=State)
        state.value = dict(ssrProductionAccepted=True, currentRelease=dict(repository='soodoh/websites'))
        log = []
        state.claim.side_effect = lambda *a, **kw: log.append('claim')
        state.job.side_effect = lambda *a: log.append('job')
        if fail_finish:
            state.finish.side_effect = StateOwnershipError('412')
        else:
            state.finish.side_effect = lambda *a: log.append('finish')
        def call(service, operation, **values):
            log.append(operation)
            if operation == 'get-app':
                return {'app': {'repository': 'https://github.com/soodoh/websites', 'defaultDomain': 'fixture.amplifyapp.com'}}
            if operation == 'get-branch':
                return {'branch': {'enableAutoBuild': False, 'enablePullRequestPreview': False, 'environmentVariables': {'AMPLIFY_MONOREPO_APP_ROOT': 'apps/' + site}}}
            if operation == 'start-job':
                self.assertEqual(values['commit_message'], 'GitHub Actions release ' + selected['commit'])
                return {'jobSummary': {'jobId': 'owned', 'commitId': ('a' if bad_commit else 'b') * 40}}
            if operation == 'put-parameter':
                self.assertTrue(values['overwrite'])
                self.assertEqual(values['name'], '/sarabeth-studio/production/last-known-good-sha')
                return {}
            raise AssertionError(operation)
        aws = MagicMock()
        aws.call.side_effect = call
        marker = dict(schemaVersion=1, kind='website-ssr-production', site=site, commit=selected['commit'], appId=config['appId'], branch=config['branch'], jobId='wrong' if bad_marker else 'owned')
        with patch.dict(os.environ, {'GITHUB_RUN_ID': '20', 'GITHUB_RUN_ATTEMPT': '1', 'PATH': '/safe', 'HOME': '/empty', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN': 'privileged'}, clear=True), patch.object(ssr, 'observe'), patch.object(ssr, 'ref_sha', side_effect=['a' * 40, 'b' * 40]), patch.object(ssr, 'promote', side_effect=lambda *a: log.append('promote')), patch.object(ssr.Amplify, 'no_active_jobs'), patch.object(ssr.Amplify, 'wait', side_effect=lambda *a: log.append('wait')), patch.object(ssr.Amplify, 'stop') as stop, patch.object(ssr, 'read_url', return_value=(200, {}, json.dumps(marker).encode())), patch.object(ssr, 'command', side_effect=lambda *a: log.append('smoke')) as command:
            error = None
            try:
                ssr.release_ssr(site, aws, config, state, selected, {}, lambda: log.append('recheck'))
            except Exception as caught:
                error = caught
            for call_args in command.call_args_list:
                self.assertNotIn('ACTIONS_ID_TOKEN_REQUEST_TOKEN', call_args.args[2])
            return log, error, state, stop.call_args_list

    def test_both_repository_flows_claim_before_ref_promotion_and_attest_before_finish(self):
        for site in ('carolyn', 'sarabeth'):
            log, error, state, _ = self.run_release(site)
            self.assertIsNone(error)
            self.assertLess(log.index('claim'), log.index('promote'))
            self.assertEqual(state.claim.call_args.kwargs['baseline']['commit'], 'a' * 40)
            self.assertLess(log.index('promote'), log.index('start-job'))
            self.assertLess(log.index('wait'), log.index('smoke'))
            self.assertLess(log.index('smoke'), log.index('finish'))
            if site == 'sarabeth':
                self.assertLess(log.index('smoke'), log.index('put-parameter'))
                self.assertLess(log.index('put-parameter'), log.index('finish'))
            self.assertEqual(state.finish.call_args.args[1], 'b' * 40)

    def test_wrong_job_or_bundle_and_persistence_failure_keep_intent_no_legacy_sha_push(self):
        for option in ('bad_commit', 'bad_marker', 'fail_finish'):
            log, error, state, stops = self.run_release('sarabeth', **{option: True})
            self.assertIsNotNone(error)
            self.assertEqual(log.count('promote'), 1)
            self.assertEqual(stops[0].args, ('sarabeth-production', 'owned'))
            if option != 'fail_finish':
                state.finish.assert_not_called()
                self.assertNotIn('put-parameter', log)


if __name__ == '__main__':
    unittest.main()
