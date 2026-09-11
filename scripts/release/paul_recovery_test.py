"""Public preparation interfaces with synthetic ZIPs and external S3/Amplify/HTTPS fakes."""
import copy
from email.message import Message
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.response
import zipfile

import paul_recovery as recovery
import static
from state import Aws, State, StateOwnershipError, UnknownOutcome


class ExternalAws:
    def __init__(self, pins, objects, value=None):
        self.pins, self.objects = pins, objects
        self.value = copy.deepcopy(value)
        self.body = json.dumps(value, sort_keys=True).encode() if value else None
        self.etag = '"state-0"'
        self.calls = []
        self.version_fault = None
        self.state_fault = None
        self.host_fault = None
        self.write_count = 0

    def get_object(self, bucket, key, owner, destination, version_id=None):
        self.calls.append(('get', key, version_id))
        assert bucket == recovery.BUCKET and owner == recovery.OWNER
        if key == 'release-state/soodoh-websites/paul.json':
            assert version_id is None
            if self.state_fault == 'read-error':
                raise UnknownOutcome('Unknown read')
            Path(destination).write_bytes(self.body or b'{}')
            return dict(ETag='"foreign"' if self.state_fault == 'etag' else self.etag,
                        ServerSideEncryption='none' if self.state_fault == 'encryption' else 'AES256')
        name = key.split('/')[-1]
        obj = self.pins['objects'][name]
        assert key == obj['key'] and version_id == obj['versionId']
        Path(destination).write_bytes(self.objects[name])
        result = dict(ETag='"object"', VersionId=version_id, ContentLength=obj['bytes'], ServerSideEncryption='AES256')
        if self.version_fault:
            key, value = self.version_fault
            if value is None:
                result.pop(key)
            else:
                result[key] = value
        return result

    def call(self, service, operation, **options):
        self.calls.append((operation, copy.deepcopy(options)))
        if service == 's3api':
            assert operation == 'put-object'
            assert options['bucket'] == recovery.BUCKET and options['expected_bucket_owner'] == recovery.OWNER
            assert options['key'] == 'release-state/soodoh-websites/paul.json'
            assert options['server_side_encryption'] == 'AES256'
            self.write_count += 1
            if self.state_fault == 'conflict' or (options.get('if_none_match') == '*' and self.body is not None):
                raise UnknownOutcome('412 conflict')
            if 'if_match' in options and options['if_match'] != self.etag:
                raise UnknownOutcome('412 stale ETag')
            if 'if_match' not in options:
                assert options['if_none_match'] == '*'
            self.body = Path(options['body']).read_bytes()
            self.value = json.loads(self.body)
            self.etag = f'"state-{self.write_count}"'
            if self.state_fault == 'unknown-write':
                raise UnknownOutcome('write may have succeeded')
            if self.state_fault == 'body':
                self.body += b' '
            return {} if self.state_fault == 'missing-etag' else dict(ETag=self.etag)
        assert service == 'amplify' and options['app_id'] == recovery.APP
        assert options['branch_name'] == 'candidate', 'PRODUCTION MUTATION/READ'
        if operation == self.host_fault:
            raise UnknownOutcome('Unknown hosting outcome')
        if operation == 'get-branch':
            return dict(branch=dict(branchArn=f'arn:aws:amplify:us-east-1:{recovery.OWNER}:apps/{recovery.APP}/branches/candidate', branchName='candidate', stage='BETA', enableAutoBuild=False, enablePullRequestPreview=False))
        if operation == 'list-jobs':
            return dict(jobSummaries=[])
        if operation == 'create-deployment':
            return dict(jobId='12', zipUploadUrl='https://fixture-upload.s3.us-east-1.amazonaws.com/candidate')
        if operation == 'start-deployment':
            return {}
        if operation == 'get-job':
            return dict(job=dict(summary=dict(status='FAILED' if self.host_fault == 'failed-job' else 'SUCCEED')))
        raise AssertionError(f'Unexpected hosting operation {operation}')


class PaulRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.root = Path(self.enterContext(tempfile.TemporaryDirectory()))
        self.policy = json.loads((recovery.ROOT / 'config/release-policy.json').read_text())
        self.runtime = json.loads((recovery.ROOT / 'config/release-runtime.json').read_text())
        self.pins = recovery.recovery_pins()
        # Synthetic small objects keep real source identity, but never consume real recovery bytes.
        self.marker = {k: self.pins[k] for k in ('commit', 'runId', 'runAttempt')}
        self.members = {'index.html': b'<html>synthetic candidate</html>', '404.html': b'fixture 404',
                        'release.json': json.dumps(self.marker).encode()}
        self.objects = {}
        self.make_objects()
        self.enterContext(patch.object(recovery, 'ROOT', self.root))
        (self.root / 'config').mkdir()
        self.save_pins()
        self.baseline = dict(repository='soodoh/websites', repositoryId='1358469291', site='paul',
                             ref='refs/heads/main', commit='c' * 40, reviewed=True)
        self.runtime['publicationLocked'] = False
        self.runtime['sites']['paul'].update(bootstrapEnabled=True, rehearsalEnabled=True, sourceWriterDrained=True)
        self.config = recovery.configuration(self.policy, self.runtime)
        self.release = recovery.pinned_release(self.pins)
        self.aws = ExternalAws(self.pins, self.objects)
        self.requests = []
        self.http_fault = None
        self.http_hook = None
        self.enterContext(patch('urllib.request.HTTPSHandler.https_open', self.http))
        self.enterContext(patch('socket.socket', side_effect=AssertionError('real socket forbidden')))
        self.enterContext(patch('subprocess.Popen', side_effect=AssertionError('real subprocess forbidden')))
        self.enterContext(patch('static.release_static', side_effect=AssertionError('production release forbidden')))

    def make_objects(self):
        stream = io.BytesIO()
        with zipfile.ZipFile(stream, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name, body in self.members.items():
                archive.writestr(name, body)
        self.objects['site.zip'] = stream.getvalue()
        self.pins['sha256'] = hashlib.sha256(stream.getvalue()).hexdigest()
        self.objects['site.zip.sha256'] = f"{self.pins['sha256']}  site.zip\n".encode()
        self.objects['metadata.json'] = json.dumps({k: self.pins[k] for k in ('commit', 'runId', 'runAttempt', 'sha256', 'deploymentRoot')}).encode()
        self.update_object_pins()

    def update_object_pins(self):
        for name, body in self.objects.items():
            self.pins['objects'][name].update(bytes=len(body), sha256=hashlib.sha256(body).hexdigest())

    def save_pins(self):
        (self.root / 'config/paul-legacy-recovery.json').write_text(json.dumps(self.pins))

    def http(self, request):
        self.requests.append((request.get_method(), request.full_url))
        if self.http_hook:
            self.http_hook(request)
        headers = Message()
        code = 200
        if request.get_method() == 'PUT':
            self.assertEqual(request.full_url, 'https://fixture-upload.s3.us-east-1.amazonaws.com/candidate')
            self.assertEqual(request.data, self.objects['site.zip'])
            body = b''
        else:
            self.assertTrue(request.full_url.startswith(recovery.CANDIDATE + '/'))
            member = request.full_url[len(recovery.CANDIDATE) + 1:] or 'index.html'
            body = self.members[member]
        if self.http_fault == 'redirect':
            code = 302
            headers['Location'] = 'https://pauldiloreto.com/'
        elif self.http_fault == 'bytes' and request.get_method() == 'GET':
            body = b'wrong bytes'
        elif self.http_fault == 'upload' and request.get_method() == 'PUT':
            raise OSError('unknown upload outcome')
        response = urllib.response.addinfourl(io.BytesIO(body), headers, request.full_url, code)
        response.msg = 'fixture'
        return response

    def initialize(self):
        self.aws.value = recovery.bootstrap_proposal(self.policy, self.runtime, self.baseline)
        self.aws.body = json.dumps(self.aws.value, sort_keys=True).encode()
        return copy.deepcopy(self.aws.value)

    def rehearse(self):
        return recovery.rehearse_candidate(self.aws, self.policy, self.runtime, self.release, '20/1')

    def test_checked_in_and_partial_admission_denies_before_any_external_effect(self):
        for key, value in [('publicationLocked', True), ('bootstrapEnabled', False), ('sourceWriterDrained', False)]:
            r = copy.deepcopy(self.runtime)
            (r if key == 'publicationLocked' else r['sites']['paul'])[key] = value
            with self.assertRaises(ValueError):
                recovery.bootstrap_state(self.aws, self.policy, r, self.baseline)
        for key, value in [('publicationLocked', True), ('rehearsalEnabled', False), ('rehearsalEnabled', None), ('sourceWriterDrained', False)]:
            r = copy.deepcopy(self.runtime)
            (r if key == 'publicationLocked' else r['sites']['paul'])[key] = value
            with self.assertRaises(ValueError):
                recovery.rehearse_candidate(self.aws, self.policy, r, self.release, '20/1')
        self.assertEqual(self.aws.calls, [])
        self.assertEqual(self.requests, [])

    def test_wrong_config_site_repo_owner_key_and_production_destination_denied(self):
        for key, value in [('candidateBranch', 'main'), ('candidateBranch', 'production'),
                           ('candidateUrl', 'https://pauldiloreto.com'), ('stateKey', 'other/paul'),
                           ('stateOwner', '000000000001'), ('stateBucket', 'foreign')]:
            r = copy.deepcopy(self.runtime)
            r['sites']['paul'][key] = value
            with self.assertRaises(ValueError):
                recovery.rehearse_candidate(self.aws, self.policy, r, self.release, '20/1')
        for key in ('repository', 'repositoryId', 'ownerId'):
            p = copy.deepcopy(self.policy)
            p[key] = 'foreign'
            with self.assertRaises(ValueError):
                recovery.bootstrap_state(self.aws, p, self.runtime, self.baseline)
        self.assertEqual(self.aws.calls, [])

    def test_bootstrap_is_create_only_exact_aes_owner_etag_readback_and_separate_baseline(self):
        proposal = recovery.bootstrap_proposal(self.policy, self.runtime, self.baseline)
        self.assertEqual(self.aws.calls, [])
        self.assertEqual(proposal['currentRelease'], self.release)
        self.assertNotEqual(proposal['highWatermark'], self.release['commit'])
        self.assertEqual(recovery.bootstrap_state(self.aws, self.policy, self.runtime, self.baseline), proposal)
        self.assertEqual([c[0] for c in self.aws.calls], ['put-object', 'get'])
        self.assertEqual(self.aws.calls[0][1]['if_none_match'], '*')
        self.assertEqual(self.aws.value['generation'], 0)
        self.assertIsNone(self.aws.value['intent'])
        for value in (proposal, {'site': 'diloreto'}, {'malformed': True}):
            self.aws.body = json.dumps(value).encode()
            count = len(self.aws.calls)
            with self.assertRaises(StateOwnershipError):
                recovery.bootstrap_state(self.aws, self.policy, self.runtime, self.baseline)
            self.assertEqual(len(self.aws.calls), count + 1)
            self.assertEqual(self.aws.body, json.dumps(value).encode())

    def test_bootstrap_rejects_legacy_implicit_or_unreviewed_watermark_before_write(self):
        for key, value in [('repository', recovery.LEGACY), ('repositoryId', '81884767'),
                           ('site', 'diloreto'), ('ref', 'refs/heads/other'), ('reviewed', False),
                           ('commit', self.release['commit']), ('commit', None)]:
            baseline = {**self.baseline, key: value}
            with self.assertRaises(ValueError):
                recovery.bootstrap_state(self.aws, self.policy, self.runtime, baseline)
        with self.assertRaises(ValueError):
            recovery.bootstrap_state(self.aws, self.policy, self.runtime, {})
        self.assertEqual(self.aws.calls, [])

    def test_bootstrap_conflict_unknown_write_readback_and_etag_stop_without_retry(self):
        for fault in ('conflict', 'unknown-write', 'missing-etag', 'etag', 'body', 'encryption', 'read-error'):
            with self.subTest(fault=fault):
                aws = ExternalAws(self.pins, self.objects)
                aws.state_fault = fault
                with self.assertRaises(StateOwnershipError):
                    recovery.bootstrap_state(aws, self.policy, self.runtime, self.baseline)
                self.assertEqual(aws.write_count, 1)
                self.assertLessEqual(len(aws.calls), 2)
                if fault != 'conflict':
                    self.assertIsNotNone(aws.value)  # Unknown outcome does not mean unchanged storage.

    def test_storage_bootstrap_rejects_malformed_generation_schema_and_intent(self):
        proposal = recovery.bootstrap_proposal(self.policy, self.runtime, self.baseline)
        for key, value in [('schemaVersion', 2), ('site', 'diloreto'), ('repository', 'foreign'),
                           ('generation', True), ('generation', 1), ('intent', {}), ('currentRelease', {}), ('highWatermark', 'legacy')]:
            state = State(self.aws, self.config, 'paul')
            with self.assertRaises(ValueError):
                state.bootstrap({**proposal, key: value})
        self.assertEqual(self.aws.calls, [])

    def test_pin_source_key_version_length_and_digest_mismatches_deny(self):
        original = copy.deepcopy(self.pins)
        for key in ('repository', 'repositoryId', 'ownerId', 'workflow', 'workflowId', 'site', 'deploymentRoot', 'linkage'):
            self.pins[key] = 'wrong'
            self.save_pins()
            with self.assertRaises(ValueError):
                self.rehearse()
            self.pins = copy.deepcopy(original)
        for key, value in [('versionId', None), ('versionId', 'null'), ('key', 'other/site.zip'), ('bytes', 0), ('sha256', 'wrong')]:
            self.pins['objects']['site.zip'][key] = value
            self.save_pins()
            with self.assertRaises(ValueError):
                self.rehearse()
            self.pins = copy.deepcopy(original)
        self.save_pins()
        for key in recovery.RELEASE_KEYS:
            with self.assertRaises(ValueError):
                recovery.rehearse_candidate(self.aws, self.policy, self.runtime, {**self.release, key: 'wrong'}, '20/1')
        self.assertEqual(self.aws.calls, [])

    def test_returned_version_size_encryption_etag_and_corrupt_bytes_rejected_before_hosting(self):
        self.initialize()
        for fault in [('VersionId', None), ('VersionId', 'wrong'), ('ContentLength', 0), ('ServerSideEncryption', 'none'), ('ETag', None)]:
            self.aws.version_fault = fault
            with self.assertRaises(ValueError):
                self.rehearse()
        self.aws.version_fault = None
        for name in self.objects:
            original = self.objects[name]
            self.objects[name] = b'X' + original[1:]
            with self.assertRaises(ValueError):
                self.rehearse()
            self.objects[name] = original
        self.assertFalse(any(c[0] in ('get-branch', 'create-deployment', 'put-object') for c in self.aws.calls))

    def test_corrupt_metadata_checksum_marker_and_unsafe_zip_rejected_even_with_matching_digests(self):
        self.initialize()
        for kind in ('metadata', 'checksum', 'traversal', 'backslash', 'marker', 'symlink', 'duplicate', 'crc'):
            with self.subTest(kind=kind):
                self.members = {'index.html': b'<html>fixture</html>', '404.html': b'404', 'release.json': json.dumps(self.marker).encode()}
                if kind == 'traversal': self.members['../escape'] = b'bad'
                if kind == 'backslash': self.members['a\\b'] = b'bad'
                if kind == 'marker': self.members['release.json'] = b'{}'
                self.make_objects()
                if kind == 'metadata': self.objects['metadata.json'] = b'{"commit":"wrong"}'
                if kind == 'checksum': self.objects['site.zip.sha256'] = b'wrong checksum'
                if kind in ('symlink', 'duplicate'):
                    stream = io.BytesIO(self.objects['site.zip'])
                    with zipfile.ZipFile(stream, 'a') as archive:
                        entry = zipfile.ZipInfo('link' if kind == 'symlink' else 'index.html')
                        entry.external_attr = 0o120777 << 16
                        if kind == 'duplicate':
                            with self.assertWarns(UserWarning): archive.writestr(entry, b'target')
                        else:
                            archive.writestr(entry, b'target')
                    self.objects['site.zip'] = stream.getvalue()
                if kind == 'crc':
                    body = bytearray(self.objects['site.zip'])
                    body[body.index(b'PK\x01\x02') + 16] ^= 1
                    self.objects['site.zip'] = bytes(body)
                if kind in ('symlink', 'duplicate', 'crc'):
                    self.pins['sha256'] = hashlib.sha256(self.objects['site.zip']).hexdigest()
                    self.objects['metadata.json'] = json.dumps({k: self.pins[k] for k in ('commit', 'runId', 'runAttempt', 'sha256', 'deploymentRoot')}).encode()
                    self.objects['site.zip.sha256'] = f"{self.pins['sha256']}  site.zip\n".encode()
                self.update_object_pins()
                self.save_pins()
                self.release = recovery.pinned_release(self.pins)
                self.aws.pins = self.pins
                with self.assertRaises((ValueError, zipfile.BadZipFile)):
                    self.rehearse()
        self.assertFalse(any(c[0] in ('get-branch', 'create-deployment', 'put-object') for c in self.aws.calls))

    def test_existing_release_download_uses_versions_and_never_falls_back(self):
        static.download_retained(self.aws, self.config, self.release, self.root / 'selected')
        self.assertEqual({c[2] for c in self.aws.calls}, {o['versionId'] for o in self.pins['objects'].values()})
        self.aws.version_fault = ('VersionId', None)
        with self.assertRaises(ValueError):
            static.download_retained(self.aws, self.config, self.release, self.root / 'bad')
        with self.assertRaises(ValueError):
            static.download_retained(self.aws, self.config, {**self.release, 'runAttempt': '2'}, self.root / 'wrong')

    def test_candidate_success_changes_only_candidate_receipt_and_generation(self):
        before = self.initialize()
        receipt = self.rehearse()
        self.assertEqual(receipt['jobs'], [dict(branch='candidate', jobId='12')])
        self.assertEqual(receipt['release'], self.release)
        self.assertEqual({k: v for k, v in self.aws.value.items() if k != 'lastCandidateRecovery'}, {**before, 'generation': 3})
        self.assertEqual(self.aws.value['generation'], 3)
        self.assertEqual([c[0] for c in self.aws.calls if c[0] in ('create-deployment', 'start-deployment')], ['create-deployment', 'start-deployment'])
        self.assertEqual(len(self.requests), 4)

    def test_candidate_failures_and_ambiguous_persistence_never_compensate_or_advance_production(self):
        for fault in ('create-deployment', 'start-deployment', 'failed-job', 'upload', 'bytes', 'unknown-write', 'conflict'):
            with self.subTest(fault=fault):
                self.aws = ExternalAws(self.pins, self.objects)
                before = self.initialize()
                self.aws.host_fault = fault
                self.aws.state_fault = fault if fault in ('unknown-write', 'conflict') else None
                self.http_fault = fault
                with self.assertRaises((UnknownOutcome, ValueError)):
                    self.rehearse()
                for key in ('currentRelease', 'highWatermark'):
                    self.assertEqual(self.aws.value[key], before[key])
                self.assertNotIn('lastCandidateRecovery', self.aws.value)
                if fault != 'conflict': self.assertIsNotNone(self.aws.value['intent'])
                self.assertFalse(any(c[0] == 'stop-job' for c in self.aws.calls))

    def test_foreign_malformed_unresolved_state_denies_hosting(self):
        before = self.initialize()
        for key, value in [('site', 'diloreto'), ('repository', 'foreign'), ('highWatermark', 'legacy'),
                           ('generation', True), ('currentRelease', {'bad': True}), ('intent', {})]:
            self.aws.value = {**before, key: value}
            self.aws.body = json.dumps(self.aws.value).encode()
            with self.assertRaises(ValueError): self.rehearse()
        self.assertFalse(any(c[0] == 'create-deployment' for c in self.aws.calls))

    def test_lost_ownership_after_upload_never_starts_or_compensates(self):
        before = self.initialize()
        def lose(_): self.aws.etag = '"other-writer"'
        self.http_hook = lose
        with self.assertRaises(StateOwnershipError): self.rehearse()
        self.assertFalse(any(c[0] in ('start-deployment', 'stop-job') for c in self.aws.calls))
        self.assertEqual(self.aws.value['currentRelease'], before['currentRelease'])
        self.assertEqual(self.aws.value['highWatermark'], before['highWatermark'])
        self.assertIsNotNone(self.aws.value['intent'])

    def test_candidate_read_and_upload_redirects_never_reach_production(self):
        self.initialize()
        self.http_fault = 'redirect'
        with self.assertRaises(UnknownOutcome): self.rehearse()
        self.assertEqual(self.requests, [('PUT', 'https://fixture-upload.s3.us-east-1.amazonaws.com/candidate')])
        self.requests.clear()
        directory = self.root / 'read-redirect'
        recovery.download_recovery(self.aws, self.config, self.release, directory)
        with self.assertRaises(ValueError): recovery.verify_candidate(recovery.CANDIDATE, directory)
        self.assertEqual(self.requests, [('GET', recovery.CANDIDATE + '/')])
        with self.assertRaises(ValueError): recovery.verify_candidate('https://pauldiloreto.com', directory)

    def test_final_cas_conflict_and_unknown_success_remain_reconciliation_obligations(self):
        for fault in ('conflict', 'unknown-write', 'missing-etag'):
            self.aws = ExternalAws(self.pins, self.objects)
            before = self.initialize()
            def fail_after_verify(request):
                if request.full_url.endswith('/404.html'): self.aws.state_fault = fault
            self.http_hook = fail_after_verify
            with self.assertRaises(StateOwnershipError): self.rehearse()
            self.assertEqual(self.aws.value['currentRelease'], before['currentRelease'])
            self.assertEqual(self.aws.value['highWatermark'], before['highWatermark'])
            self.assertEqual(self.aws.write_count, 3)
            if fault == 'conflict': self.assertIsNotNone(self.aws.value['intent'])
            else: self.assertIn('lastCandidateRecovery', self.aws.value)  # May have committed: do not blindly retry.

    def test_candidate_guard_rejects_production_operations_even_in_cleanup(self):
        self.initialize()
        state = State(self.aws, self.config, 'paul')
        state.read()
        guarded = recovery.CandidateAws(self.aws, state)
        count = len(self.aws.calls)
        for operation in ('create-deployment', 'start-deployment', 'stop-job', 'get-job'):
            with self.assertRaises(ValueError):
                guarded.call('amplify', operation, app_id=recovery.APP, branch_name='main')
        with self.assertRaises(ValueError):
            guarded.call('amplify', 'update-branch', app_id=recovery.APP, branch_name='candidate')
        self.assertEqual(len(self.aws.calls), count)

    def test_unisolated_branch_and_production_upload_url_are_rejected(self):
        original = self.aws.call
        for field, value in [('stage', 'PRODUCTION'), ('branchArn', 'foreign'), ('enableAutoBuild', True), ('enablePullRequestPreview', True)]:
            self.initialize()
            def call(service, operation, **options):
                result = original(service, operation, **options)
                if operation == 'get-branch': result['branch'][field] = value
                return result
            with patch.object(self.aws, 'call', side_effect=call):
                with self.assertRaises(ValueError): self.rehearse()
        self.assertFalse(any(c[0] == 'create-deployment' for c in self.aws.calls))
        self.initialize()
        def wrong_upload(service, operation, **options):
            result = original(service, operation, **options)
            if operation == 'create-deployment': result['zipUploadUrl'] = 'https://pauldiloreto.com/upload'
            return result
        with patch.object(self.aws, 'call', side_effect=wrong_upload):
            with self.assertRaises(ValueError): self.rehearse()
        self.assertEqual(self.requests, [])
        self.assertIsNotNone(self.aws.value['intent'])

    def test_job_persistence_conflict_prevents_upload_and_start(self):
        self.initialize()
        original = self.aws.call
        def call(service, operation, **options):
            result = original(service, operation, **options)
            if operation == 'create-deployment': self.aws.state_fault = 'conflict'
            return result
        with patch.object(self.aws, 'call', side_effect=call):
            with self.assertRaises(StateOwnershipError): self.rehearse()
        self.assertEqual(self.requests, [])
        self.assertIsNotNone(self.aws.value['intent'])
        self.assertFalse(any(c[0] in ('start-deployment', 'stop-job') for c in self.aws.calls))

    def test_missing_pin_object_version_and_duplicate_metadata_fail_closed(self):
        original = copy.deepcopy(self.pins)
        del self.pins['objects']['metadata.json']
        self.save_pins()
        with self.assertRaises(ValueError): self.rehearse()
        self.pins = copy.deepcopy(original)
        del self.pins['objects']['metadata.json']['versionId']
        self.save_pins()
        with self.assertRaises(ValueError): self.rehearse()
        self.pins = original
        self.objects['metadata.json'] = b'{"commit":"one","commit":"two"}'
        self.update_object_pins()
        self.save_pins()
        self.aws.pins = self.pins
        self.initialize()
        with self.assertRaisesRegex(ValueError, 'Duplicate JSON'): self.rehearse()
        self.assertFalse(any(c[0] == 'get-branch' for c in self.aws.calls))

    def test_archive_expansion_limit_rejects_before_hosting(self):
        body = bytearray(self.objects['site.zip'])
        central = body.index(b'PK\x01\x02')
        body[central + 24:central + 28] = (33 * 1024 * 1024).to_bytes(4, 'little')
        self.objects['site.zip'] = bytes(body)
        self.pins['sha256'] = hashlib.sha256(body).hexdigest()
        self.objects['metadata.json'] = json.dumps({k: self.pins[k] for k in ('commit', 'runId', 'runAttempt', 'sha256', 'deploymentRoot')}).encode()
        self.objects['site.zip.sha256'] = f"{self.pins['sha256']}  site.zip\n".encode()
        self.update_object_pins()
        self.save_pins()
        self.release = recovery.pinned_release(self.pins)
        self.initialize()
        with self.assertRaisesRegex(ValueError, 'Excessive ZIP member'): self.rehearse()
        self.assertFalse(any(c[0] == 'get-branch' for c in self.aws.calls))

    def test_aws_get_object_public_argv_includes_exact_version_owner_and_no_fallback(self):
        class Result:
            returncode = 0
            stdout = b'{"VersionId":"exact-version"}'
        with patch('state.subprocess.run', return_value=Result()) as run:
            result = Aws('us-east-1').get_object(recovery.BUCKET, 'key', recovery.OWNER, self.root / 'object', version_id='exact-version')
            self.assertEqual(result['VersionId'], 'exact-version')
            argv = run.call_args.args[0]
            self.assertEqual(argv[argv.index('--version-id') + 1], 'exact-version')
            self.assertEqual(argv[argv.index('--expected-bucket-owner') + 1], recovery.OWNER)
            with self.assertRaises(ValueError):
                Aws('us-east-1').get_object(recovery.BUCKET, 'key', recovery.OWNER, self.root / 'object', version_id='')
            self.assertEqual(run.call_count, 1)


if __name__ == '__main__':
    unittest.main()
