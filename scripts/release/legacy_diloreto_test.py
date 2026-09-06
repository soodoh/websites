import hashlib
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from urllib.parse import urlsplit
import zipfile

import static
from state import State


def zip_bytes(files):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, 'w') as archive:
        for name, data in files.items():
            archive.writestr(name, data)
    return stream.getvalue()


def fixture():
    files = {'index.html': b'<title>The DiLoreto Family</title>google-site-verification<script src="/assets/app.js"></script>', 'areyou/index.html': b'family', '404.html': b'404: Page Not Found', 'robots.txt': b'fixture', 'favicon.png': b'png', 'apple-touch-icon.png': b'png', 'assets/app.js': b'fixture-js'}
    old_zip = zip_bytes(files)
    old = dict(repository=static.LEGACY_DILORETO, site='diloreto', workflow='.github/workflows/deploy.yml', workflowSha='d' * 40, event='workflow_dispatch', commit='a' * 40, runId='1', runAttempt='2', sha256=hashlib.sha256(old_zip).hexdigest())
    manifest = json.dumps(dict(**old, schemaVersion=1, kind='legacy-diloreto-capture', sourceArchiveName='amplify-deployment.zip', sourceArtifactName='amplify-static-1', captureEvidenceSha256='e' * 64)).encode()
    marker = dict(schemaVersion=2, kind='website-static-validation', repository='soodoh/websites', site='diloreto', commit='b' * 40, workflow='.github/workflows/release-site.yml', workflowSha='c' * 40, runId='10', runAttempt='2', artifactName='diloreto-10-2-static-v2', releaseId='diloreto-10-2', event='workflow_dispatch', ref='refs/heads/main', releaseAuthorized=False)
    new_zip = zip_bytes({**files, 'areyou/index.html': b'new family', 'release.json': json.dumps(marker).encode()})
    new = {**marker, 'sha256': hashlib.sha256(new_zip).hexdigest()}
    def payload(data, metadata):
        return {'site.zip': data, 'site.zip.sha256': (hashlib.sha256(data).hexdigest() + '  site.zip\n').encode(), 'metadata.json': metadata}
    old_files = payload(old_zip, manifest)
    new_files = payload(new_zip, json.dumps({**new, 'deploymentRoot': 'dist/client'}).encode())
    policy = dict(repositoryId='100', ownerId='200', legacyDiloretoRepositoryId='300', legacyDiloretoWorkflowId='400', legacyDiloretoManifestSha256=hashlib.sha256(manifest).hexdigest(), validationWorkflowIds={marker['workflow']: '500'})
    return old, new, old_files, new_files, policy


def api_for(old, new, outer):
    def api(path):
        release = old if 'repos/' + static.LEGACY_DILORETO in path else new
        repo_id, workflow_id = (300, 400) if release == old else (100, 500)
        if path == 'repos/' + release['repository']:
            return {'id': repo_id, 'owner': {'id': 200}}
        if '/jobs?' in path:
            names = ['Validate static site', 'Deploy production'] if release == old else ['release root validation', 'diloreto release validation']
            return {'jobs': [dict(name=name, status='completed', conclusion='success') for name in names]}
        if '/artifacts?' in path:
            return {'artifacts': [dict(id=600, name=new['artifactName'], expired=False, digest='sha256:' + hashlib.sha256(outer).hexdigest())]}
        return dict(id=int(release['runId']), run_attempt=2, head_repository=dict(full_name=release['repository'], id=repo_id), workflow_id=workflow_id, path=release['workflow'], head_branch='main', event=release['event'], head_sha=release['workflowSha'], status='completed', conclusion='success')
    return api


class LegacyDiloretoTests(unittest.TestCase):
    def test_real_readers_markerless_legacy_new_legacy_roundtrip_and_receipts(self):
        old, new, old_files, new_files, policy = fixture()
        outer = zip_bytes(new_files)
        objects = {static.artifact_prefix(old) + '/' + name: data for name, data in old_files.items()}
        initial = dict(schemaVersion=1, repository='soodoh/websites', site='diloreto', highWatermark='c' * 40, currentRelease=old, generation=1, intent=None)
        objects['state/diloreto'] = json.dumps(initial).encode()
        served = [old_files['site.zip']]
        uploads, deployed, urls = {}, [], []
        def get_object(bucket, key, owner, destination):
            self.assertEqual(owner, '111111111111')
            destination.write_bytes(objects[key])
            return dict(ETag='"fixture-etag"', ServerSideEncryption='AES256')
        def aws_call(service, operation, **options):
            if operation == 'put-object':
                if options['key'] == 'state/diloreto':
                    self.assertEqual(options['if_match'], '"fixture-etag"')
                else:
                    self.assertEqual(options['if_none_match'], '*')
                    self.assertNotIn(options['key'], objects)
                objects[options['key']] = Path(options['body']).read_bytes()
                return {'ETag': '"fixture-etag"'}
            if operation == 'list-jobs': return {'jobSummaries': []}
            if operation == 'create-deployment':
                job = str(len(deployed) + 1)
                return dict(jobId=job, zipUploadUrl='https://upload.invalid/' + job)
            if operation == 'start-deployment':
                served[0] = uploads[options['job_id']]
                deployed.append(served[0])
                return {}
            if operation == 'get-job': return {'job': {'summary': {'status': 'SUCCEED'}}}
            raise AssertionError(operation)
        def upload(request, **kwargs):
            uploads[urlsplit(request.full_url).path[1:]] = request.data
            response = MagicMock()
            response.__enter__.return_value.status = 200
            return response
        def read(url):
            urls.append(url)
            path = urlsplit(url).path
            name = {'/': 'index.html', '/areyou': 'areyou/index.html', '/not-a-real-route': '404.html'}.get(path, path[1:])
            with zipfile.ZipFile(io.BytesIO(served[0])) as archive:
                self.assertIn(name, archive.namelist())
                return (404 if name == '404.html' else 200), {'cache-control': 'no-cache, max-age=31536000, immutable', 'x-content-type-options': 'nosniff'}, archive.read(name)
        aws = MagicMock()
        aws.get_object.side_effect = get_object
        aws.call.side_effect = aws_call
        config = dict(appId='dfixture', branch='main', productionUrl='https://edge.invalid', originUrl='https://origin.invalid', stateBucket='fixture', stateKey='state/diloreto', stateOwner='111111111111', releaseBucket='fixture', releaseOwner='111111111111')
        state = State(aws, config, 'diloreto')
        state.read()
        with patch.dict(os.environ, {'GITHUB_RUN_ID': '10', 'GITHUB_RUN_ATTEMPT': '2'}, clear=True), patch.object(static, 'gh', side_effect=api_for(old, new, outer)), patch.object(static.subprocess, 'run', return_value=MagicMock(stdout=outer)), patch.object(static.urllib.request, 'urlopen', side_effect=upload), patch.object(static, 'read_url', side_effect=read), patch.object(static, 'command') as browser:
            for operation, selected in [('release', new), ('restore', old), ('restore', new)]:
                static.release_static('diloreto', aws, config, state, selected.copy(), policy, operation, lambda: None)
                self.assertEqual(state.value['currentRelease']['commit'], selected['commit'])
                self.assertEqual(state.value['highWatermark'], new['commit'])
                receipt = state.value['lastLifecycleReceipt']
                self.assertEqual(receipt['requestedRelease']['sha256'], selected['sha256'])
                self.assertEqual(receipt['jobs'], [dict(branch='main', jobId=str(len(deployed)))])
                self.assertEqual(receipt['servingAcceptance'], 'passed')
            self.assertEqual(browser.call_count, 3)
        self.assertEqual(deployed, [new_files['site.zip'], old_files['site.zip'], new_files['site.zip']])
        self.assertEqual(objects[static.artifact_prefix(old) + '/site.zip'], old_files['site.zip'])
        self.assertTrue(any(url.startswith('https://origin.invalid/') for url in urls))
        self.assertTrue(any(url.startswith('https://edge.invalid/') for url in urls))

    def test_capture_pin_identity_original_event_and_serving_byte_denials(self):
        old, new, files, _, policy = fixture()
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            for name, data in files.items(): (directory / name).write_bytes(data)
            with patch.object(static, 'gh', side_effect=api_for(old, new, b'')):
                static.verify_release(directory, old, policy, 'diloreto')
                for key, value in [('legacyDiloretoManifestSha256', None), ('legacyDiloretoManifestSha256', 'f' * 64), ('legacyDiloretoRepositoryId', '999'), ('legacyDiloretoWorkflowId', '999')]:
                    with self.assertRaises(ValueError): static.verify_release(directory, old, {**policy, key: value}, 'diloreto')
                for key, value in [('commit', 'f' * 40), ('site', 'paul'), ('event', 'pull_request'), ('runAttempt', '3'), ('repository', static.LEGACY)]:
                    with self.assertRaises((ValueError, KeyError)): static.verify_release(directory, {**old, key: value}, policy, 'diloreto')
                with patch.object(static, 'read_url', return_value=(200, {}, b'wrong')):
                    with self.assertRaisesRegex(ValueError, 'Serving bytes'):
                        static.marker_check('https://edge.invalid', old, {}, directory)
                (directory / 'site.zip').write_bytes(b'changed')
                with self.assertRaisesRegex(ValueError, 'ZIP bytes changed'):
                    static.verify_release(directory, old, policy, 'diloreto')


if __name__ == '__main__':
    unittest.main()
