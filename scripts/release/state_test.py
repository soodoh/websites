import copy
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from state import Aws, State, StateOwnershipError, UnknownOutcome


class Store:
    def __init__(self):
        self.value = dict(schemaVersion=1, repository='soodoh/websites', site='paul', highWatermark='c' * 40, currentRelease={'repository': 'soodoh/portfolio-website', 'commit': 'a' * 40}, generation=1, intent=None)
        self.etag = '"etag-1"'
        self.calls = []
        self.fail = False

    def get_object(self, bucket, key, owner, destination):
        self.calls.append(('get', owner))
        Path(destination).write_text(json.dumps(self.value))
        return dict(ETag=self.etag, ServerSideEncryption='aws:kms', SSEKMSKeyId='fixture-key', VersionId='not-an-etag')

    def call(self, service, operation, **options):
        self.calls.append((operation, options))
        if self.fail or options['if_match'] != self.etag:
            raise UnknownOutcome('412 or 409')
        self.value = json.loads(Path(options['body']).read_text())
        self.etag = '"etag-' + str(self.value['generation']) + '"'
        return {'ETag': self.etag}


class StateTests(unittest.TestCase):
    def fixture(self):
        store = Store()
        state = State(store, dict(stateBucket='fixture', stateKey='state/paul', stateOwner='111111111111'), 'paul')
        state.read()
        return store, state

    def test_owner_etag_encryption_intent_and_separate_current_high_watermark(self):
        store, state = self.fixture()
        state.claim({'commit': 'b' * 40}, 'restore', '10/2')
        self.assertIsNotNone(store.value['intent'])
        state.job('main', '20')
        state.finish({'commit': 'b' * 40}, 'c' * 40)
        self.assertEqual(store.value['highWatermark'], 'c' * 40)
        self.assertEqual(store.value['currentRelease']['commit'], 'b' * 40)
        self.assertIsNone(store.value['intent'])
        for op, args in store.calls[1:]:
            self.assertEqual(args['expected_bucket_owner'], '111111111111')
            self.assertEqual(args['server_side_encryption'], 'aws:kms')
            self.assertEqual(args['ssekms_key_id'], 'fixture-key')
            self.assertNotEqual(args['if_match'], 'not-an-etag')

    def test_restoration_receipt_preserves_all_job_ids_hashes_and_outcome_before_intent_clear(self):
        store, state = self.fixture()
        selected = dict(repository='soodoh/websites', site='paul', commit='b' * 40, runId='10', runAttempt='2', sha256='f' * 64, uploadUrl='https://must-not-retain.invalid')
        previous = dict(repository='soodoh/portfolio-website', site='paul', commit='a' * 40, runId='9', runAttempt='1', sha256='e' * 64)
        state.claim(selected, 'release', '10/2')
        for branch, job in [('candidate', '20'), ('main', '21'), ('main', '22')]: state.job(branch, job)
        state.finish(previous, 'c' * 40, outcome='restored-previous')
        receipt = store.value['lastLifecycleReceipt']
        self.assertEqual([job['jobId'] for job in receipt['jobs']], ['20', '21', '22'])
        self.assertEqual(receipt['requestedRelease']['sha256'], 'f' * 64)
        self.assertEqual(receipt['servingRelease']['sha256'], 'e' * 64)
        self.assertEqual(receipt['restoration'], 'passed')
        self.assertEqual(receipt['outcome'], 'restored-previous')
        self.assertNotIn('uploadUrl', receipt['requestedRelease'])
        self.assertIsNone(store.value['intent'])

    def test_claim_job_finish_conflicts_stop_without_rebase_or_second_write(self):
        for phase in ('claim', 'job', 'finish'):
            store, state = self.fixture()
            if phase != 'claim':
                state.claim({'commit': 'b' * 40}, 'release', '10/2')
            if phase == 'finish':
                state.job('main', '20')
            before = copy.deepcopy(store.value)
            store.fail = True
            count = len(store.calls)
            with self.assertRaises(StateOwnershipError):
                {'claim': lambda: state.claim({'commit': 'd' * 40}, 'release', '10/2'), 'job': lambda: state.job('main', '20'), 'finish': lambda: state.finish({'commit': 'b' * 40}, 'b' * 40)}[phase]()
            self.assertEqual(store.value, before)
            self.assertEqual(len(store.calls), count + 1)

    def test_crash_after_claim_or_deploy_before_persistence_requires_reconciliation(self):
        store, state = self.fixture()
        state.claim({'commit': 'b' * 40}, 'release', '10/2')
        state.job('main', '20')
        resumed = State(store, state.config, 'paul')
        resumed.read()
        with self.assertRaisesRegex(ValueError, 'Unresolved'):
            resumed.claim({'commit': 'd' * 40}, 'release', '11/1')
        self.assertEqual(resumed.value['intent']['jobs'], [{'branch': 'main', 'jobId': '20'}])

    def test_missing_wrong_unencrypted_state_is_not_empty_baseline(self):
        store, state = self.fixture()
        for key, value in [('site', 'diloreto'), ('repository', 'fork/websites'), ('currentRelease', {}), ('highWatermark', 'legacy'), ('intent', 'bad')]:
            original = copy.deepcopy(store.value)
            store.value[key] = value
            if key == 'intent':
                # Non-null intent cannot be claimed, regardless of its content.
                state.read()
                with self.assertRaises(ValueError):
                    state.claim({}, 'release', '1/1')
            else:
                with self.assertRaises(ValueError):
                    state.read()
            store.value = original
        with patch.object(store, 'get_object', side_effect=UnknownOutcome('missing')):
            with self.assertRaises(UnknownOutcome):
                state.read()
        state.read()
        original_get = store.get_object
        def unencrypted(*args):
            metadata = original_get(*args)
            del metadata['ServerSideEncryption']
            return metadata
        with patch.object(store, 'get_object', side_effect=unencrypted):
            with self.assertRaises(ValueError):
                state.read()
        with patch.object(store, 'call', return_value={}):
            with self.assertRaises(StateOwnershipError):
                state.claim({'commit': 'b' * 40}, 'release', '10/2')

    def test_actual_cli_argv_preserves_boolean_switch_and_etag_owner(self):
        class Result:
            returncode = 0
            stdout = b'{}'
        with patch('state.subprocess.run', return_value=Result()) as run:
            Aws('us-west-2').call('ssm', 'put-parameter', name='/fixture/known-good', type='String', value='a' * 40, overwrite=True)
            argv = run.call_args.args[0]
            self.assertIn('--overwrite', argv)
            self.assertNotIn('True', argv)
            self.assertEqual(argv[argv.index('--overwrite') + 1], '--output')
            Aws('us-west-2').call('s3api', 'put-object', bucket='fixture', key='state', if_match='"exact-etag"', expected_bucket_owner='111111111111')
            argv = run.call_args.args[0]
            self.assertEqual(argv[argv.index('--if-match') + 1], '"exact-etag"')
            self.assertEqual(argv[argv.index('--expected-bucket-owner') + 1], '111111111111')

    def test_cli_conditions_feature_check_is_local_and_fail_closed(self):
        class Result:
            stdout = b'{"IfMatch":"", "IfNoneMatch":"", "ExpectedBucketOwner":""}'
        with patch('state.subprocess.run', return_value=Result()) as run:
            Aws('us-east-1').check_conditional_support()
            self.assertIn('--generate-cli-skeleton', run.call_args.args[0])
        Result.stdout = b'{}'
        with patch('state.subprocess.run', return_value=Result()):
            with self.assertRaises(ValueError):
                Aws('us-east-1').check_conditional_support()


if __name__ == '__main__':
    unittest.main()
