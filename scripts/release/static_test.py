import copy
import hashlib
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch

import artifact
import static
from state import StateOwnershipError, UnknownOutcome


def identity(repo='soodoh/websites', commit='c', run='10'):
    return dict(repository=repo, site='paul', commit=commit * 40, workflow='.github/workflows/deploy.yml' if repo == static.LEGACY else '.github/workflows/ci.yml', runId=run, runAttempt='2', sha256='a' * 64)


class StaticTests(unittest.TestCase):
    def fixture(self):
        old = identity(static.LEGACY, 'a', '1')
        state = MagicMock()
        state.value = dict(currentRelease=old, highWatermark='c' * 40, intent=None)
        config = dict(candidateBranch='candidate', candidateUrl='https://candidate.invalid', branch='main', productionUrl='https://production.invalid', releaseBucket='fixture', releaseOwner='111111111111')
        return old, state, config

    def run_release(self, site='paul', operation='release', failure=None, selected_override=None):
        old, state, config = self.fixture()
        old['site'] = site
        selected = copy.deepcopy(selected_override) if selected_override else identity(commit='b')
        selected['site'] = site
        log = []
        def download(*args):
            path = args[-1]
            path.mkdir()
            (path / 'site.zip').write_bytes(b'fixture')
        def accept(*args):
            log.append(('accept', args[1], args[2]['commit']))
            if failure == 'smoke' and args[1] == config['productionUrl'] and args[2] == selected:
                raise ValueError('smoke failed')
        def deploy(branch, *args):
            log.append(('deploy', branch))
            if branch == 'main' and failure in ('ownership', 'unknown'):
                raise (StateOwnershipError if failure == 'ownership' else UnknownOutcome)('STOP')
        def recheck():
            log.append(('recheck',))
            if failure == 'superseded' and log.count(('recheck',)) == 2:
                raise ValueError('Relevant inputs advanced during candidate acceptance')
        state.claim.side_effect = lambda *a: log.append(('claim',))
        def finish(current, high_watermark, **kwargs):
            log.append(('finish',))
            state.value.update(currentRelease=current, highWatermark=high_watermark, intent=None)
        state.finish.side_effect = StateOwnershipError('finish conflict') if failure == 'finish' else finish
        with patch.dict(os.environ, {'GITHUB_RUN_ID': '10', 'GITHUB_RUN_ATTEMPT': '2'}, clear=True), patch.object(static, 'download_retained', side_effect=download), patch.object(static, 'download_ci', side_effect=download), patch.object(static, 'verify_release', side_effect=lambda *a: {'fixture': True}), patch.object(static, 'marker_check'), patch.object(static, 'retain', side_effect=lambda *a: log.append(('retain',))), patch.object(static, 'acceptance', side_effect=accept), patch.object(static.Amplify, 'deploy_zip', side_effect=deploy), patch.object(static.Amplify, 'no_active_jobs'):
            try:
                static.release_static(site, MagicMock(), config, state, selected, {}, operation, recheck)
            except Exception as error:
                return log, state, error
        return log, state, None

    def test_candidate_acceptance_precedes_identical_production_and_finish(self):
        log, state, error = self.run_release()
        self.assertIsNone(error)
        self.assertEqual([x[0] for x in log], ['recheck', 'claim', 'deploy', 'accept', 'retain', 'recheck', 'deploy', 'accept', 'finish'])
        self.assertEqual(log[2], ('deploy', 'candidate'))
        self.assertEqual(log[6], ('deploy', 'main'))

    def test_sequential_legacy_new_legacy_restore_new_restores_bytes_at_existing_watermark(self):
        legacy, state, config = self.fixture()
        state.value['highWatermark'] = 'a' * 40
        new = identity(commit='b')
        with patch.object(self, 'fixture', return_value=(legacy, state, config)):
            for operation, selected in [('release', new), ('restore', legacy), ('restore', new)]:
                log, state, error = self.run_release(operation=operation, selected_override=selected)
                self.assertIsNone(error)
                self.assertIn(('deploy', 'main'), log)
                self.assertEqual(state.value['currentRelease'], selected)
                self.assertEqual(state.value['highWatermark'], 'b' * 40)

    def test_legacy_new_legacy_restore_new_preserves_watermark(self):
        for operation in ('restore', 'redeploy'):
            site = 'diloreto' if operation == 'redeploy' else 'paul'
            _, state, error = self.run_release(site, operation)
            self.assertIsNone(error)
            self.assertEqual(state.finish.call_args.args[1], 'c' * 40)
        # Explicit restore at highest SHA is not sent through routine already-released skip.
        _, state, error = self.run_release('paul', 'restore')
        self.assertIsNone(error)
        state.finish.assert_called_once()

    def test_superseded_candidate_never_promotes_and_keeps_unresolved_intent(self):
        log, state, error = self.run_release(failure='superseded')
        self.assertIsInstance(error, ValueError)
        self.assertEqual([x for x in log if x[0] == 'deploy'], [('deploy', 'candidate')])
        state.finish.assert_not_called()

    def test_known_terminal_smoke_failure_restores_previous_bytes_but_fails_run(self):
        log, state, error = self.run_release(failure='smoke')
        self.assertIsInstance(error, RuntimeError)
        self.assertEqual([x for x in log if x[0] == 'deploy'], [('deploy', 'candidate'), ('deploy', 'main'), ('deploy', 'main')])
        self.assertEqual(state.finish.call_args.args[0]['repository'], static.LEGACY)
        self.assertEqual(state.finish.call_args.args[1], 'c' * 40)

    def test_lost_state_or_ambiguous_cloud_outcomes_never_enter_rollback(self):
        for failure in ('ownership', 'unknown', 'finish'):
            log, state, error = self.run_release(failure=failure)
            self.assertIsInstance(error, UnknownOutcome)
            self.assertEqual([x for x in log if x[0] == 'deploy'], [('deploy', 'candidate'), ('deploy', 'main')])
            if failure != 'finish':
                state.finish.assert_not_called()

    def test_job_cas_and_upload_start_faults_only_cleanup_exact_owned_job(self):
        for phase in ('job', 'upload', 'start'):
            with tempfile.TemporaryDirectory() as directory:
                archive = Path(directory) / 'site.zip'
                archive.write_bytes(b'fixture')
                checksum = hashlib.sha256(b'fixture').hexdigest()
                aws, state = MagicMock(), MagicMock()
                def call(service, operation, **kwargs):
                    if operation == 'list-jobs':
                        return {'jobSummaries': []}
                    if operation == 'create-deployment':
                        return {'jobId': 'owned-job', 'zipUploadUrl': 'https://upload.invalid'}
                    if operation == 'start-deployment':
                        raise UnknownOutcome('ambiguous start')
                    raise AssertionError(operation)
                aws.call.side_effect = call
                if phase == 'job':
                    state.job.side_effect = StateOwnershipError('412')
                response = MagicMock()
                response.__enter__.return_value.status = 200
                amplify = static.Amplify(aws, {'appId': 'dfixture'}, state)
                with patch.object(amplify, 'stop') as stop, patch.object(static.urllib.request, 'urlopen', side_effect=OSError('network') if phase == 'upload' else None, return_value=response):
                    with self.assertRaises(UnknownOutcome):
                        amplify.deploy_zip('main', archive, checksum)
                    stop.assert_called_once_with('main', 'owned-job')
                ops = [c.args[1] for c in aws.call.call_args_list]
                self.assertEqual(ops.count('create-deployment'), 1)
                if phase != 'start':
                    self.assertNotIn('start-deployment', ops)

    def test_real_amplify_terminal_failure_never_calls_rejected_stop(self):
        for terminal in ('FAILED', 'CANCELLED'):
            with tempfile.TemporaryDirectory() as directory:
                archive = Path(directory) / 'site.zip'
                archive.write_bytes(b'fixture')
                aws, state = MagicMock(), MagicMock()
                def call(service, operation, **kwargs):
                    if operation == 'list-jobs':
                        return {'jobSummaries': []}
                    if operation == 'create-deployment':
                        return {'jobId': '42', 'zipUploadUrl': 'https://upload.invalid'}
                    if operation == 'start-deployment':
                        return {}
                    if operation == 'get-job':
                        return {'job': {'summary': {'status': terminal}}}
                    if operation == 'stop-job':
                        raise UnknownOutcome('stop rejected')
                    raise AssertionError(operation)
                aws.call.side_effect = call
                response = MagicMock()
                response.__enter__.return_value.status = 200
                with patch.object(static.urllib.request, 'urlopen', return_value=response):
                    with self.assertRaisesRegex(ValueError, 'Amplify job failed'):
                        static.Amplify(aws, {'appId': 'dfixture'}, state).deploy_zip('main', archive, hashlib.sha256(b'fixture').hexdigest())
                self.assertNotIn('stop-job', [c.args[1] for c in aws.call.call_args_list])

    def test_real_cleanup_polls_after_rejected_active_stop_and_preserves_unknown(self):
        aws = MagicMock()
        statuses = iter(['RUNNING', 'CANCELLED'])
        def call(service, operation, **kwargs):
            if operation == 'get-job':
                return {'job': {'summary': {'status': next(statuses)}}}
            if operation == 'stop-job':
                raise UnknownOutcome('stop rejected')
            raise AssertionError(operation)
        aws.call.side_effect = call
        static.Amplify(aws, {'appId': 'dfixture'}, MagicMock()).stop('main', '42')
        self.assertEqual([c.args[1] for c in aws.call.call_args_list], ['get-job', 'stop-job', 'get-job'])
        # Original ambiguous start must stay ambiguous even when cleanup is terminal.
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / 'site.zip'
            archive.write_bytes(b'fixture')
            def ambiguous(service, operation, **kwargs):
                if operation == 'list-jobs': return {'jobSummaries': []}
                if operation == 'create-deployment': return {'jobId': '42', 'zipUploadUrl': 'https://upload.invalid'}
                if operation == 'start-deployment': raise UnknownOutcome('original ambiguous start')
                if operation == 'get-job': return {'job': {'summary': {'status': 'CANCELLED'}}}
                raise AssertionError(operation)
            aws.call.side_effect = ambiguous
            response = MagicMock()
            response.__enter__.return_value.status = 200
            with patch.object(static.urllib.request, 'urlopen', return_value=response):
                with self.assertRaisesRegex(UnknownOutcome, 'original ambiguous start'):
                    static.Amplify(aws, {'appId': 'dfixture'}, MagicMock()).deploy_zip('main', archive, hashlib.sha256(b'fixture').hexdigest())

    def test_browser_children_receive_allowlisted_environment_only(self):
        with patch.dict(os.environ, {'PATH': '/safe', 'HOME': '/empty', 'CI': '1', 'AWS_SECRET_ACCESS_KEY': 'secret', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN': 'secret', 'ACTIONS_ID_TOKEN_REQUEST_URL': 'secret', 'REFERENCE_PROMOTION_TOKEN': 'secret', 'GH_TOKEN': 'secret'}, clear=True), patch.object(static, 'marker_check'), patch.object(static, 'command') as command:
            static.acceptance('paul', 'https://fixture.invalid', identity(), {}, {}, Path('/unused'))
            self.assertEqual(command.call_count, 3)
            for call in command.call_args_list:
                env = call.args[2]
                self.assertEqual(set(env) - {'PLAYWRIGHT_BASE_URL', 'PLAYWRIGHT_EXPECT_STATIC_404', 'LHCI_URL'}, {'PATH', 'HOME', 'CI'})

    def test_legacy_prefix_is_allowlisted_and_never_normalized(self):
        release = identity(static.LEGACY, 'a', '12')
        self.assertEqual(static.artifact_prefix(release), 'releases/12/2')
        for repo in ('evil/repository', 'soodoh/carolyn-portfolio'):
            with self.assertRaises(ValueError):
                static.artifact_prefix({**release, 'repository': repo})
        with self.assertRaises(ValueError):
            static.artifact_prefix({**release, 'site': 'diloreto'})


if __name__ == '__main__':
    unittest.main()
