"""Exercise the real configuration gate without GitHub, OIDC, AWS or network access."""
import copy
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import deploy


class ConfigurationTests(unittest.TestCase):
    def setUp(self):
        self.policy = json.loads((deploy.ROOT / 'config/release-policy.json').read_text())
        self.runtime = json.loads((deploy.ROOT / 'config/release-runtime.json').read_text())
        directory = self.enterContext(tempfile.TemporaryDirectory())
        self.root = Path(directory)
        (self.root / 'config').mkdir()
        self.enterContext(patch.object(deploy, 'ROOT', self.root))
        self.enterContext(patch.dict(os.environ, {
            'GITHUB_REPOSITORY': self.policy['repository'],
            'GITHUB_REPOSITORY_ID': self.policy['repositoryId'],
            'GITHUB_REPOSITORY_OWNER_ID': self.policy['ownerId'],
            'GITHUB_REF': 'refs/heads/main',
            'GITHUB_EVENT_NAME': 'workflow_dispatch',
            'GITHUB_WORKFLOW_REF': 'soodoh/websites/.github/workflows/release-site.yml@refs/heads/main',
            'GITHUB_RUN_ID': '10',
            'GITHUB_RUN_ATTEMPT': '2',
            'RELEASE_ENVIRONMENT': 'production-portfolio',
        }, clear=True))
        self.github = self.enterContext(patch.object(deploy, 'gh', side_effect=AssertionError('GitHub forbidden')))
        self.blocked = [self.enterContext(patch(seam, side_effect=AssertionError(f'{seam} forbidden')))
                        for seam in ('static.gh', 'deploy.Aws', 'oidc.observe_subject',
                                     'subprocess.Popen', 'socket.socket',
                                     'urllib.request.urlopen', 'urllib.request.OpenerDirector.open')]

    def tearDown(self):
        for seam in self.blocked:
            seam.assert_not_called()

    def write_configuration(self, policy, runtime):
        (self.root / 'config/release-policy.json').write_text(json.dumps(policy))
        (self.root / 'config/release-runtime.json').write_text(json.dumps(runtime))

    def unlocked_fixture(self):
        policy, runtime = copy.deepcopy(self.policy), copy.deepcopy(self.runtime)
        policy.update(repositoryId='1', ownerId='2')
        policy['sites']['paul'].update(
            account='000000000001', roleArn='arn:aws:iam::000000000001:role/fixture-only',
            appId='dfixturepaul', oidcSubject='fixture:paul:exact-subject',
            automaticEnabled=True, manualEnabled=True)
        runtime['publicationLocked'] = False
        runtime['entryWorkflowIds']['.github/workflows/release-site.yml'] = '4'
        runtime['sites']['paul'].update(
            sourceWriterDrained=True, productionUrl='https://production.example.invalid',
            candidateUrl='https://candidate.example.invalid', stateBucket='fixture-state',
            stateKey='fixture/paul.json', stateOwner='000000000001',
            releaseBucket='fixture-releases', releaseOwner='000000000001')
        os.environ.update(GITHUB_REPOSITORY_ID='1', GITHUB_REPOSITORY_OWNER_ID='2')
        return policy, runtime

    def allow_fixture_execution_observation(self):
        self.github.side_effect = None
        self.github.return_value = dict(workflow_id=4, path='.github/workflows/release-site.yml', event='workflow_dispatch')

    def test_configured_checked_in_publication_lock_precedes_all_external_operations(self):
        self.assertIs(self.runtime['publicationLocked'], True)
        self.write_configuration(self.policy, self.runtime)
        for site in self.policy['sites']:
            for event in ('workflow_run', 'workflow_dispatch'):
                for operation in ('release', 'restore', 'redeploy', 'candidate', 'promote'):
                    with self.subTest(site=site, event=event, operation=operation):
                        os.environ['GITHUB_EVENT_NAME'] = event
                        with self.assertRaisesRegex(ValueError, '^Publication lock: separate reviewed activation required$'):
                            deploy.configured(site, operation)
                        self.github.assert_not_called()

    def test_configured_publication_lock_alone_denies_fully_bound_enabled_fixture(self):
        policy, runtime = self.unlocked_fixture()
        runtime['publicationLocked'] = True
        self.write_configuration(policy, runtime)
        with self.assertRaisesRegex(ValueError, '^Publication lock: separate reviewed activation required$'):
            deploy.configured('paul', 'release')
        self.github.assert_not_called()

    def test_configured_unlocked_fixture_rejects_each_unknown_subject_state_and_candidate_field(self):
        policy, runtime = self.unlocked_fixture()
        self.allow_fixture_execution_observation()
        for key in ('oidcSubject', 'stateBucket', 'stateKey', 'stateOwner', 'candidateUrl'):
            for missing in (False, True):
                with self.subTest(key=key, missing=missing):
                    p, r = copy.deepcopy(policy), copy.deepcopy(runtime)
                    config = p['sites']['paul'] if key == 'oidcSubject' else r['sites']['paul']
                    if missing:
                        del config[key]
                    else:
                        config[key] = None
                    self.github.reset_mock()
                    self.write_configuration(p, r)
                    with self.assertRaisesRegex(ValueError, f'^Missing/unsafe configuration: {key}$'):
                        deploy.configured('paul', 'release')
                    self.github.assert_called_once_with('repos/soodoh/websites/actions/runs/10/attempts/2')

    def test_configured_complete_unlocked_fixture_returns_only_configuration(self):
        policy, runtime = self.unlocked_fixture()
        self.allow_fixture_execution_observation()
        self.write_configuration(policy, runtime)
        actual_policy, config = deploy.configured('paul', 'release')
        self.assertEqual(actual_policy, policy)
        self.assertEqual(config, {**policy['sites']['paul'], **runtime['sites']['paul']})
        self.github.assert_called_once_with('repos/soodoh/websites/actions/runs/10/attempts/2')


if __name__ == '__main__':
    unittest.main()
