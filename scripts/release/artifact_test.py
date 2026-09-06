import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile
import artifact


class ArtifactTests(unittest.TestCase):
    def test_fresh_v2_is_byte_bound_and_does_not_relabel_v1(self):
        for site in ('paul', 'diloreto'):
            with tempfile.TemporaryDirectory() as temp, patch.dict(os.environ, {'GITHUB_REPOSITORY': 'soodoh/websites', 'GITHUB_REF': 'refs/heads/main', 'GITHUB_EVENT_NAME': 'workflow_dispatch', 'GITHUB_RUN_ID': '10', 'GITHUB_RUN_ATTEMPT': '2', 'GITHUB_WORKFLOW_REF': 'soodoh/websites/.github/workflows/release-site.yml@refs/heads/main', 'GITHUB_WORKFLOW_SHA': 'b' * 40}, clear=True), patch.object(artifact.subprocess, 'check_output', return_value='a' * 40):
                root = Path(temp)
                source = root / 'apps' / site / 'dist/client'
                source.mkdir(parents=True)
                for name in ('index.html', '404.html', 'areyou/index.html'):
                    path = source / name
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_text('fixture')
                marker = artifact.marker(site, root)
                self.assertFalse(marker['releaseAuthorized'])
                self.assertEqual(marker['schemaVersion'], 2)
                (source / 'release.json').write_text(json.dumps(marker))
                before = artifact.ci.files(source)
                artifact.package(site, root, root / 'release')
                metadata = json.loads((root / 'release/metadata.json').read_text())
                artifact.verify(root / 'release', metadata)
                with zipfile.ZipFile(root / 'release/site.zip') as archive:
                    self.assertEqual({name: archive.read(name) for name in archive.namelist()}, before)
                for key, wrong in [('commit', 'c' * 40), ('runAttempt', '3'), ('workflow', '.github/workflows/ci.yml'), ('releaseAuthorized', True), ('site', 'sarabeth')]:
                    mutated = {**metadata, key: wrong}
                    (root / 'release/metadata.json').write_text(json.dumps(mutated))
                    with self.assertRaises(ValueError):
                        artifact.verify(root / 'release', metadata)
                with patch.dict(os.environ, {'GITHUB_EVENT_NAME': 'pull_request'}):
                    with self.assertRaises(ValueError):
                        artifact.marker(site, root)
                with patch.dict(os.environ, {'GITHUB_WORKFLOW_REF': 'soodoh/websites/.github/workflows/ci.yml@refs/heads/main'}):
                    with self.assertRaises(ValueError):
                        artifact.marker(site, root)


if __name__ == '__main__':
    unittest.main()
