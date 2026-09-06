import json
import unittest
from unittest.mock import MagicMock

from sarabeth_transition import parameters, prepare, verify_switch


class SarabethTransitionTests(unittest.TestCase):
    def environment(self, operation='legacy'):
        return dict(MONOREPO_OPERATION=operation, APPLY_DOMAIN='false', ROLLBACK_TO_NETLIFY='false', RETARGET_WEBHOOK='false', TRANSITION_CONFIRMATION='', MONOREPO_SUBJECT='fixture-exact-subject', MONOREPO_STATE_OBJECT='arn:aws:s3:::fixture/state/sarabeth')

    def test_legacy_defaults_and_explicit_prepare_switch_parameters(self):
        self.assertEqual(prepare(self.environment()), ([], []))
        preparation = {**self.environment('prepare-monorepo'), 'TRANSITION_CONFIRMATION': 'APPROVE_MONOREPO_PREPARATION'}
        hosting, domain = prepare(preparation)
        self.assertIn('EnableMonorepoConnection=true', hosting)
        self.assertIn('EnableMonorepoBranch=true', hosting)
        self.assertIn('MonorepoWebhookTarget=false', hosting)
        self.assertEqual(domain, [])
        switch = {**preparation, 'MONOREPO_OPERATION': 'switch-monorepo', 'TRANSITION_CONFIRMATION': 'APPROVE_MONOREPO_SWITCH', 'APPLY_DOMAIN': 'true', 'CUTOVER_CONFIRMATION': 'APPROVAL_GATE_1_CONFIRMED', 'SELECTED_COMMIT': 'a' * 40, 'SELECTED_JOB': '12'}
        hosting, domain = prepare(switch)
        self.assertEqual(domain, ['GitHubBranch=sarabeth-production'])
        self.assertIn('MonorepoWebhookTarget=false', hosting)
        self.assertIn('MonorepoWebhookTarget=true', prepare({**switch, 'RETARGET_WEBHOOK': 'true'})[0])
        for change in ({'TRANSITION_CONFIRMATION': ''}, {'APPLY_DOMAIN': 'false'}, {'CUTOVER_CONFIRMATION': ''}, {'SELECTED_JOB': ''}, {'SELECTED_COMMIT': 'legacy'}, {'ROLLBACK_TO_NETLIFY': 'true'}):
            with self.assertRaises(ValueError): prepare({**switch, **change})
        for change in ({'APPLY_DOMAIN': 'true'}, {'RETARGET_WEBHOOK': 'true'}, {'MONOREPO_SUBJECT': '*'}, {'MONOREPO_STATE_OBJECT': ''}):
            with self.assertRaises(ValueError): prepare({**preparation, **change})
        with self.assertRaises(ValueError): parameters('prepare-monorepo', 'domain')

    def test_candidate_and_domain_bind_repository_source_job_branch_and_serving_marker(self):
        config = dict(appId='dfixture', candidateUrl='https://candidate.invalid', productionUrl='https://production.invalid')
        marker = dict(schemaVersion=1, kind='website-ssr-production', site='sarabeth', commit='a' * 40, appId='dfixture', branch='sarabeth-production', jobId='12')
        def fixtures():
            return {'get-caller-identity': {'Account': '015989770400'}, 'get-app': {'app': {'platform': 'WEB_COMPUTE', 'repository': 'https://github.com/soodoh/websites'}}, 'get-branch': {'branch': {'branchName': 'sarabeth-production', 'enableAutoBuild': False, 'enablePullRequestPreview': False, 'environmentVariables': {'AMPLIFY_MONOREPO_APP_ROOT': 'apps/sarabeth'}}}, 'get-job': {'job': {'summary': {'jobId': '12', 'status': 'SUCCEED', 'commitId': 'a' * 40}}}, 'get-domain-association': {'domainAssociation': {'domainStatus': 'AVAILABLE', 'subDomains': [{'subDomainSetting': {'prefix': prefix, 'branchName': 'sarabeth-production'}} for prefix in ('', 'www')]}}}
        responses = fixtures()
        aws = MagicMock()
        aws.call.side_effect = lambda service, operation, **kwargs: responses[operation]
        read = MagicMock(return_value=(200, {}, json.dumps(marker).encode()))
        verify_switch(aws, config, 'a' * 40, '12', 'candidate', read)
        self.assertIn('https://candidate.invalid/', read.call_args.args[0])
        self.assertNotIn('get-domain-association', [call.args[1] for call in aws.call.call_args_list])
        verify_switch(aws, config, 'a' * 40, '12', 'domain', read)
        self.assertIn('https://production.invalid/', read.call_args.args[0])
        for key in ('account', 'repository', 'branch', 'job', 'association', 'marker'):
            responses = fixtures()
            read.return_value = (200, {}, json.dumps(marker).encode())
            if key == 'account': responses['get-caller-identity']['Account'] = '111111111111'
            if key == 'repository': responses['get-app']['app']['repository'] = 'https://github.com/soodoh/sarabeth-studio'
            if key == 'branch': responses['get-branch']['branch']['enableAutoBuild'] = True
            if key == 'job': responses['get-job']['job']['summary']['commitId'] = 'b' * 40
            if key == 'association': responses['get-domain-association']['domainAssociation']['subDomains'][0]['subDomainSetting']['branchName'] = 'main'
            if key == 'marker': read.return_value = (200, {}, json.dumps({**marker, 'commit': 'b' * 40}).encode())
            with self.assertRaises(ValueError): verify_switch(aws, config, 'a' * 40, '12', 'domain', read)
        self.assertFalse(any(call.args[1] in ('deploy', 'start-job', 'put-parameter') for call in aws.call.call_args_list))


if __name__ == '__main__':
    unittest.main()
