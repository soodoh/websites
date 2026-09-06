import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


class AmplifyBuildTests(unittest.TestCase):
    def run_build(self, site, overrides=None, gitless=False, candidate=None):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            scripts = root / 'scripts/release'
            scripts.mkdir(parents=True)
            shutil.copy(Path(__file__).with_name('amplify-build.sh'), scripts / 'amplify-build.sh')
            (root / 'config').mkdir()
            (root / 'config/release-runtime.json').write_text(json.dumps({'sites': {'carolyn': {'candidateBranch': candidate}}}))
            app = root / 'apps' / site
            (app / '.amplify-hosting/static').mkdir(parents=True)
            (app / 'lib').mkdir()
            (app / 'lib/project-auth-manifest.json').write_text('fixture private manifest')
            bin = root / 'bin'
            bin.mkdir()
            node = shutil.which('node')
            mocks = {
                'git': '#!/bin/sh\n' + ('exit 1\n' if gitless else 'printf "%s\\n" "' + 'b' * 40 + '"\n'),
                'bun': '#!/bin/sh\nif [ "$1" = --version ]; then echo 1.4.0; else printf "%s\\n" "$*" >> "$BUILD_LOG"; fi\n',
                'node': '#!/bin/sh\nif [ "$1" = --version ]; then echo v24.20.0; else exec "' + node + '" "$@"; fi\n',
                'aws': '''#!/bin/sh
if [ "$1" = sts ]; then echo "$FIXTURE_ACCOUNT";
elif [ "$1" = amplify ]; then printf '%s' "$FIXTURE_JOB";
elif echo "$*" | grep -q Parameter.Type; then echo SecureString;
else echo fixture-cms-token; fi
''',
            }
            for name, content in mocks.items():
                (bin / name).write_text(content)
                (bin / name).chmod(0o755)
            branch = 'sarabeth-production' if site == 'sarabeth' else 'amplify-production'
            environment = dict(PATH=str(bin) + ':' + os.environ['PATH'], HOME=str(root), BUILD_LOG=str(root / 'build.log'), AMPLIFY_MONOREPO_APP_ROOT='apps/' + site, AWS_BRANCH=branch, AWS_APP_ID='dfixture', AWS_JOB_ID='10', FIXTURE_ACCOUNT='015989770400' if site == 'sarabeth' else '725669362139', FIXTURE_JOB=json.dumps({'job': {'summary': {'jobId': '10', 'jobType': 'RELEASE', 'commitId': 'b' * 40, 'commitMessage': 'GitHub Actions release ' + 'b' * 40}}}), CONTENTFUL_ACCESS_TOKEN_PARAMETER='/sarabeth-studio/production/contentful/access-token', CONTENTFUL_SPACE_ID='fixture', RELEASE_COMMIT='a' * 40)
            environment.update(overrides or {})
            result = subprocess.run(['bash', str(scripts / 'amplify-build.sh'), site], env=environment, capture_output=True)
            marker_path = app / '.amplify-hosting/static/__release.json'
            marker = json.loads(marker_path.read_text()) if marker_path.exists() else None
            log_path = root / 'build.log'
            return result, marker, log_path.read_text() if log_path.exists() else ''

    def test_actual_shell_production_marker_uses_verified_git_job_not_inherited_sha(self):
        for site in ('carolyn', 'sarabeth'):
            result, marker, log = self.run_build(site)
            self.assertEqual(result.returncode, 0, result.stderr.decode())
            self.assertEqual(marker['commit'], 'b' * 40)
            self.assertEqual(marker['jobId'], '10')
            self.assertEqual(marker['kind'], 'website-ssr-production')
            self.assertIn('run build', log)
            if site == 'sarabeth':
                self.assertLess(log.index('scripts/verify-amplify-source.ts'), log.index('run build'))
                self.assertIn('run validate:amplify', log)
            else:
                self.assertIn('run verify:prerender', log)

    def test_candidate_requires_exact_checkout_and_branch_allowlist_and_release_job(self):
        env = {'AWS_BRANCH': 'fixture-candidate', 'CAROLYN_CANDIDATE_BRANCH': 'fixture-candidate'}
        result, marker, log = self.run_build('carolyn', env, candidate='fixture-candidate')
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        self.assertEqual(marker['branch'], 'fixture-candidate')
        self.assertIn('run verify:prerender', log)
        for candidate, override in [(None, {}), ('other-candidate', {}), ('*', {}), ('fixture-candidate', {'CAROLYN_CANDIDATE_BRANCH': 'other'}), ('fixture-candidate', {'PLAYWRIGHT_TEST': 'true'})]:
            result, marker, log = self.run_build('carolyn', {**env, **override}, candidate=candidate)
            self.assertNotEqual(result.returncode, 0)
            self.assertIsNone(marker)
            self.assertNotIn('run build', log)
        for field, value in [('jobType', 'WEB_HOOK'), ('jobId', '99'), ('commitId', 'a' * 40)]:
            summary = dict(jobId='10', jobType='RELEASE', commitId='b' * 40, commitMessage='GitHub Actions release ' + 'b' * 40)
            summary[field] = value
            result, marker, log = self.run_build('carolyn', {**env, 'FIXTURE_JOB': json.dumps({'job': {'summary': summary}})}, candidate='fixture-candidate')
            self.assertNotEqual(result.returncode, 0)
            self.assertIsNone(marker)
            self.assertNotIn('run build', log)

    def test_wrong_account_branch_fixture_or_missing_git_stops_before_build(self):
        for overrides in ({'FIXTURE_ACCOUNT': '111111111111'}, {'AWS_BRANCH': 'main'}, {'PLAYWRIGHT_TEST': 'true'}, {'AMPLIFY_MONOREPO_APP_ROOT': 'apps/sarabeth'}):
            result, marker, log = self.run_build('carolyn', overrides)
            self.assertNotEqual(result.returncode, 0)
            self.assertIsNone(marker)
            self.assertNotIn('run build', log)
        result, marker, log = self.run_build('carolyn', gitless=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIsNone(marker)
        result, marker, log = self.run_build('carolyn', {'FIXTURE_JOB': json.dumps({'job': {'summary': {'commitId': 'a' * 40, 'commitMessage': 'GitHub Actions release ' + 'a' * 40}}})})
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('run build', log)


if __name__ == '__main__':
    unittest.main()
