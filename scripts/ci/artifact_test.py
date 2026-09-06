import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile
import io
import artifact


class ArtifactTests(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory()
        self.root = Path(self.scratch.name)
        self.root_patch = patch.object(artifact, "ROOT", self.root)
        self.root_patch.start()
        self.env = patch.dict(os.environ, {"GITHUB_REPOSITORY": "soodoh/websites", "GITHUB_RUN_ID": "10", "GITHUB_RUN_ATTEMPT": "2", "GITHUB_SHA": "a" * 40, "GITHUB_EVENT_NAME": "push", "GITHUB_REF": "refs/heads/main"}, clear=True)
        self.env.start()
        self.git = patch.object(artifact.subprocess, "check_output", return_value="a" * 40)
        self.git.start()

    def tearDown(self):
        self.git.stop()
        self.env.stop()
        self.root_patch.stop()
        self.scratch.cleanup()

    def prepare(self, site="paul"):
        source = self.root / "apps" / site / "dist/client"
        source.mkdir(parents=True)
        for name in ["index.html", "404.html", "areyou/index.html", "assets/space file.js"]:
            target = source / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text("static fixture")
        expected = artifact.identity(site)
        (source / "release.json").write_text(json.dumps(expected))
        artifact.package(site)
        return self.root / "ci-artifacts" / site / "static", expected

    def test_exact_output_deterministic_zip_root_and_checksum(self):
        for site in artifact.SITES:
            directory, expected = self.prepare(site)
            artifact.verify(directory, expected)
            data = (directory / "site.zip").read_bytes()
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                source = artifact.files(self.root / "apps" / site / "dist/client")
                self.assertEqual({name: archive.read(name) for name in archive.namelist()}, source)
            artifact.shutil.rmtree(directory)
            artifact.package(site)
            self.assertEqual(data, (directory / "site.zip").read_bytes())

    def test_spoofed_metadata_and_marker_and_expected_identity_rejected(self):
        directory, expected = self.prepare()
        metadata = json.loads((directory / "metadata.json").read_text())
        for field, value in [("site", "diloreto"), ("repository", "evil/websites"), ("commit", "b" * 40), ("runAttempt", "3"), ("runId", "11"), ("workflow", ".github/workflows/evil.yml"), ("artifactName", "another"), ("releaseAuthorized", True)]:
            with self.subTest(field=field):
                (directory / "metadata.json").write_text(json.dumps({**metadata, field: value}))
                with self.assertRaises(ValueError):
                    artifact.verify(directory, expected)
        (directory / "metadata.json").write_text(json.dumps(metadata))
        with self.assertRaises(ValueError):
            artifact.verify(directory, {**expected, "sha256": "0" * 64})
        with zipfile.ZipFile(directory / "site.zip") as archive:
            content = {name: archive.read(name) for name in archive.namelist()}
        for field, value in [("site", "diloreto"), ("repository", "evil/websites"), ("commit", "b" * 40), ("runAttempt", "3")]:
            with self.subTest(marker_field=field):
                content["release.json"] = json.dumps({**expected, field: value}).encode()
                with zipfile.ZipFile(directory / "site.zip", "w") as archive:
                    for name, data in content.items():
                        archive.writestr(name, data)
                checksum = artifact.digest((directory / "site.zip").read_bytes())
                (directory / "metadata.json").write_text(json.dumps({**metadata, "sha256": checksum}))
                (directory / "site.zip.sha256").write_text(f"{checksum}  site.zip\n")
                with self.assertRaisesRegex(ValueError, "^Release marker mismatch$"):
                    artifact.verify(directory, expected)

    def test_pr_and_manual_dispatch_never_authorize_release(self):
        for event in ["push", "pull_request", "workflow_dispatch"]:
            os.environ["GITHUB_EVENT_NAME"] = event
            self.assertFalse(artifact.identity("paul")["releaseAuthorized"])
        os.environ["GITHUB_REPOSITORY"] = "fork/websites"
        self.assertFalse(artifact.identity("paul")["releaseAuthorized"])
        os.environ["GITHUB_SHA"] = "b" * 40
        with self.assertRaises(ValueError):
            artifact.identity("paul")

    def test_scan_forbidden_paths_symlinks_types_secrets_and_archives(self):
        for name in [".env", "lib/project-auth-manifest.json", "node_modules/x.js", "../../leak.txt", "a.pem", "secret.exe"]:
            with self.assertRaises(ValueError):
                artifact.scan(name, b"fixture")
        os.environ["CONTENTFUL_ACCESS_TOKEN"] = "fixture-sensitive-value"
        with self.assertRaises(ValueError):
            artifact.scan("report.html", b"fixture-sensitive-value")
        with self.assertRaises(ValueError):
            artifact.scan("report.txt", b"-----BEGIN PRIVATE KEY-----")
        data = io.BytesIO()
        with zipfile.ZipFile(data, "w") as archive:
            archive.writestr(".env", "x")
        with self.assertRaises(ValueError):
            artifact.scan("trace.zip", data.getvalue())
        (self.root / "link.html").symlink_to("/etc/passwd")
        with self.assertRaises(ValueError):
            artifact.files(self.root)

    def test_archive_scanning_normalizes_outer_and_nested_zip_suffixes(self):
        def archive_bytes(name, data):
            output = io.BytesIO()
            with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                archive.writestr(name, data)
            return output.getvalue()

        harmless = archive_bytes("report.txt", b"harmless fixture")
        forbidden = archive_bytes("project-auth-manifest.json", b"harmless fixture")
        for outer in ["trace.zip", "trace.ZIP", "trace.ZiP"]:
            with self.subTest(outer=outer):
                artifact.scan(outer, harmless)
                with self.assertRaisesRegex(ValueError, "^Forbidden artifact path$"):
                    artifact.scan(outer, forbidden)
                for nested in ["nested.zip", "nested.ZIP", "nested.zIp"]:
                    with self.subTest(nested=nested):
                        with self.assertRaisesRegex(ValueError, "^Nested diagnostic archive$"):
                            artifact.scan(outer, archive_bytes(nested, harmless))

    def test_diagnostics_exclude_ssr_bundles_and_reject_auth_manifest(self):
        source = self.root / "apps/sarabeth/test-results"
        source.mkdir(parents=True)
        (source / "result.png").write_bytes(b"fixture")
        bundle = self.root / "apps/sarabeth/.amplify-hosting"
        bundle.mkdir()
        (bundle / "secret.json").write_text("not a report")
        artifact.diagnostics("sarabeth")
        output = self.root / "ci-artifacts/sarabeth/diagnostics"
        self.assertFalse((output / ".amplify-hosting").exists())
        self.assertTrue((output / "test-results/result.png").exists())
        artifact.shutil.rmtree(output)
        (source / "project-auth-manifest.json").write_text("private")
        with self.assertRaises(ValueError):
            artifact.diagnostics("sarabeth")


if __name__ == "__main__":
    unittest.main()
