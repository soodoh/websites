"""Pure/fake external-boundary contracts; never launch Docker, builds or browsers."""
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import paul_native_fixture as fixture

SHA = 'a' * 40
IMAGE = 'sha256:' + 'b' * 64
CONTAINER = 'c' * 64
MILESTONES = dict(guardDenials=26, hostingPassed=True, playwrightPassed=56, playwrightSkipped=4)


def environment():
    return dict(GITHUB_ACTIONS='true', GITHUB_EVENT_NAME='workflow_dispatch', GITHUB_REPOSITORY='soodoh/websites',
                GITHUB_REF='refs/heads/main', GITHUB_WORKFLOW_REF=fixture.WORKFLOW, GITHUB_SHA=SHA,
                GITHUB_WORKFLOW_SHA=SHA, GITHUB_RUN_ID='42', GITHUB_RUN_ATTEMPT='1',
                RUNNER_OS='Linux', RUNNER_ARCH='X64', RUNNER_ENVIRONMENT='github-hosted')


def report():
    return dict(lighthouseVersion='12.6.1', chromeVersion='152.0.0.0', performance=0.77,
                metrics={'total-blocking-time': 939.29}, benchmarkIndex=1200, timing={'total': 1234},
                formFactor='mobile', screenEmulation=dict(width=390, height=844, deviceScaleFactor=1),
                throttlingMethod='simulate', throttling={'cpuSlowdownMultiplier': 4})


def metric_lines(count=3):
    return [fixture.METRIC_PREFIX + json.dumps(dict(schemaVersion=1, reports=[report() for _ in range(count)]))]


def image():
    return dict(Id=IMAGE, Os='linux', Architecture='amd64', Config=dict(
        Cmd=fixture.COMMAND, Entrypoint=None, User='1000:1000', WorkingDir='/work/apps/paul',
        Env=[f'{k}={v}' for k, v in fixture.BASE_ENV.items()]))


def container():
    env = dict(fixture.BASE_ENV, PAUL_ACCEPTANCE_MODE='fixture', HOSTING_EXPECT_COMMIT=fixture.SERVING['commit'],
               HOSTING_EXPECT_RUN_ID='1', HOSTING_EXPECT_RUN_ATTEMPT='1')
    return dict(Id=CONTAINER, Image=IMAGE, Mounts=[], Config=dict(image()['Config'], Env=[f'{k}={v}' for k, v in env.items()]),
                State=dict(Status='created', Running=False, ExitCode=0, OOMKilled=False),
                HostConfig=dict(ReadonlyRootfs=True, Privileged=False, IpcMode='private', NetworkMode='none',
                                CapDrop=['ALL'], SecurityOpt=['no-new-privileges'], RestartPolicy={'Name': 'no'},
                                OomKillDisable=False, Tmpfs={'/tmp': 'rw,nosuid,nodev', **{
                                    '/work/apps/paul/' + p: 'rw,nosuid,nodev,uid=1000,gid=1000,mode=0700'
                                    for p in ('test-results', 'playwright-report', '.lighthouseci')}}))


class FakeTools:
    def __init__(self, root, code=0):
        self.root, self.code, self.calls = root, code, []
        self.started = False
        self.image, self.container = image(), container()
        self.lines, self.invalid, self.milestones = metric_lines(), False, dict(MILESTONES)
        self.dirty = ''
        self.daemon_arch = 'x86_64'
        self.after_oom = None

    def call(self, *args, cwd=fixture.ROOT, capture=True):
        self.calls.append(tuple(map(str, args)))
        if args[:3] == ('git', '--no-optional-locks', 'rev-parse'):
            return SHA
        if args[:3] == ('git', '--no-optional-locks', 'status'):
            return self.dirty
        if args[:3] == ('git', '--no-optional-locks', 'ls-files'):
            return 'apps/paul/e2e/home.spec.ts'
        if args[:2] == ('docker', 'info'):
            return json.dumps(dict(OSType='linux', Architecture=self.daemon_arch))
        if args == ('bun', '--version'):
            return '1.4.0'
        if args == ('node', '--version'):
            return 'v24.20.0'
        if args == ('bun', 'run', 'build'):
            assert cwd == self.root / 'apps/paul' and not capture
            dist = cwd / 'dist/client'
            dist.mkdir(parents=True)
            for name in ('index.html', '404.html'):
                (dist / name).write_text('Synthetic public HTML')
            return ''
        if args[:2] == ('docker', 'build'):
            assert '--no-cache' in args and args[args.index('--platform') + 1] == 'linux/amd64'
            Path(args[args.index('--iidfile') + 1]).write_text(IMAGE)
            return ''
        if args[:3] == ('docker', 'image', 'inspect'):
            return json.dumps([self.image])
        if args[:2] == ('docker', 'create'):
            assert list(args[1:]) == fixture.acceptance.container_args(IMAGE, fixture.SERVING, fixture=True)
            return CONTAINER
        if args == ('docker', 'inspect', CONTAINER):
            value = copy.deepcopy(self.container)
            if self.started:
                value['State'].update(Status='exited', ExitCode=self.code)
                value['HostConfig']['OomKillDisable'] = self.after_oom
            return json.dumps([value])
        raise AssertionError('Unexpected external command: ' + repr(args))

    def measure(self, name):
        assert name == CONTAINER and not self.started
        self.calls.append(('measure', name))
        self.started = True
        return self.code, self.lines, self.invalid, self.milestones


class NativeFixtureTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='paul-native-fixture-contract-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'checkout'
        self.directory = Path(self.tmp.name) / 'invocation'
        self.root.mkdir(); self.directory.mkdir()
        for relative in set(fixture.PUBLIC_FILES) | set(fixture.PROTECTED):
            path = self.root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes((fixture.ROOT / relative).read_bytes())
        test = self.root / 'apps/paul/e2e/home.spec.ts'
        test.parent.mkdir(parents=True, exist_ok=True)
        test.write_text('// synthetic test source, never executed\n')
        self.tools = FakeTools(self.root)
        self.evidence = {}
        # Any accidental command escape fails the test before a real tool can run.
        for name in ('run', 'Popen', 'check_output'):
            patcher = patch.object(fixture.subprocess, name, side_effect=AssertionError('Real external command forbidden'))
            patcher.start(); self.addCleanup(patcher.stop)
        for name, value in (('system', 'Linux'), ('machine', 'x86_64')):
            patcher = patch.object(fixture.platform, name, return_value=value)
            patcher.start(); self.addCleanup(patcher.stop)

    def execute(self):
        return fixture.execute(self.tools, environment(), self.directory, self.evidence, root=self.root)

    def test_actual_full_orchestration_retains_reduced_ua_with_fake_boundaries(self):
        self.assertEqual(self.execute(), 0)
        self.assertEqual(self.evidence['source']['checkoutSha'], SHA)
        self.assertEqual(self.evidence['servingIdentity'], fixture.marker())
        self.assertNotEqual(self.evidence['servingIdentity']['commit'], SHA)
        self.assertEqual(len(self.evidence['reports']), 3)
        self.assertEqual([r['chromeVersion'] for r in self.evidence['reports']], ['152.0.0.0'] * 3)
        self.assertEqual([r['metrics']['total-blocking-time'] for r in self.evidence['reports']], [939.29] * 3)
        self.assertNotIn('evidenceError', self.evidence)
        self.assertEqual(self.evidence['milestones'], MILESTONES)
        self.assertEqual(self.evidence['imageId'], IMAGE)
        self.assertIn('apps/paul/dist/client/release.json', self.evidence['inputs'])
        self.assertEqual(sum(c[0] == 'measure' for c in self.tools.calls), 1)
        self.assertFalse(any(any(x in c for x in ('rm', 'prune', 'exec', 'push')) for c in self.tools.calls))

    def test_harness_nonzero_retains_reduced_ua_reports_without_evidence_error_or_retry(self):
        self.tools.code = 7
        self.assertEqual(self.execute(), 7)
        self.assertEqual(self.evidence['harnessExitCode'], 7)
        self.assertEqual(len(self.evidence['reports']), 3)
        self.assertEqual([r['chromeVersion'] for r in self.evidence['reports']], ['152.0.0.0'] * 3)
        self.assertEqual([r['performance'] for r in self.evidence['reports']], [0.77] * 3)
        self.assertNotIn('evidenceError', self.evidence)
        self.assertEqual(sum(c[0] == 'measure' for c in self.tools.calls), 1)

    def test_nonzero_is_not_masked_by_evidence_defect(self):
        self.tools.code = 9
        self.tools.lines = metric_lines() * 2
        self.assertEqual(self.execute(), 9)
        self.assertTrue(self.evidence['evidenceError'])

    def test_success_without_exact_three_reports_fails(self):
        self.tools.lines = metric_lines(2)
        self.assertEqual(self.execute(), 1)
        self.assertTrue(self.evidence['evidenceError'])

    def test_success_without_full_guard_and_playwright_counts_fails(self):
        self.tools.milestones['guardDenials'] = 13
        self.assertEqual(self.execute(), 1)

    def test_early_harness_failure_retains_empty_metrics(self):
        self.tools.code, self.tools.lines, self.tools.milestones = 3, [], {}
        self.assertEqual(self.execute(), 3)
        self.assertEqual(self.evidence['reports'], [])

    def test_oom_metadata_is_recorded_not_normalized_or_compared_for_equality(self):
        self.tools.container['HostConfig']['OomKillDisable'] = None
        self.tools.after_oom = False
        self.assertEqual(self.execute(), 0)
        self.assertIsNone(self.evidence['oomKillDisableBefore'])
        self.assertIs(self.evidence['oomKillDisableAfter'], False)

    def test_wrong_hosted_context_and_checkout_denied(self):
        env = environment()
        self.assertEqual(fixture.context(env, SHA)['runId'], '42')
        for key in env:
            with self.subTest(key=key), self.assertRaises(ValueError):
                fixture.context(dict(env, **{key: 'wrong'}), SHA)
        with self.assertRaises(ValueError): fixture.context(env, 'd' * 40)
        with self.assertRaises(ValueError): fixture.main(['candidate'])

    def test_architecture_spelling_and_native_preflight_denials(self):
        for arch in ('amd64', 'x86_64'):
            self.assertEqual(fixture.native_arch('linux', arch)['architecture'], arch)
        for system, arch in (('linux', 'arm64'), ('linux', 'aarch64'), ('linux', 'x64'),
                             ('linux', 'unknown'), ('darwin', 'x86_64'), ('linux', 'amd64 (emulated)')):
            with self.subTest(arch=arch), self.assertRaises(ValueError): fixture.native_arch(system, arch)
        self.tools.daemon_arch = 'aarch64'
        with self.assertRaises(ValueError): self.execute()
        self.assertFalse(any(c[:3] == ('bun', 'run', 'build') for c in self.tools.calls))

    def test_dirty_checkout_or_prebuilt_dist_stops_before_build(self):
        self.tools.dirty = '?? unexpected.txt'
        with self.assertRaises(ValueError): self.execute()
        self.tools.dirty = ''
        (self.root / 'apps/paul/dist').mkdir()
        with self.assertRaises(ValueError): self.execute()
        self.assertFalse(any(c[:3] == ('bun', 'run', 'build') for c in self.tools.calls))

    def test_explicit_context_excludes_checkout_secrets_dependencies_and_source_ignore(self):
        for relative in ('.git/config', '.env', 'node_modules/private.txt', 'apps/paul/.env',
                         'apps/paul/node_modules/private.txt', '.dockerignore'):
            p = self.root / relative
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text('SYNTHETIC_DO_NOT_COPY')
        self.assertEqual(self.execute(), 0)
        context = self.directory / 'context'
        self.assertNotIn('SYNTHETIC_DO_NOT_COPY', (context / '.dockerignore').read_text())
        self.assertNotIn('**/dist', (context / '.dockerignore').read_text())
        self.assertFalse((context / '.git').exists())
        self.assertFalse((context / 'apps/paul/node_modules').exists())
        self.assertTrue((context / 'apps/paul/dist/client/index.html').is_file())
        self.assertEqual(json.loads((context / 'apps/paul/dist/client/release.json').read_text()), fixture.marker())

    def test_protected_input_byte_change_denied_before_image_build(self):
        (self.root / 'scripts/release/paul_acceptance_runner.mjs').write_text('changed')
        with self.assertRaises(ValueError): self.execute()
        self.assertFalse(any(c[:2] == ('docker', 'build') for c in self.tools.calls))

    def test_reduced_ua_does_not_replace_protected_exact_binary_pin_check(self):
        dockerfile = self.root / 'scripts/release/Dockerfile.paul-acceptance'
        self.assertEqual(fixture.sanitized_metrics(metric_lines())[0]['chromeVersion'], '152.0.0.0')
        original = dockerfile.read_text()
        self.assertIn('/152.0.7977.77/linux64/chrome-linux64.zip', original)
        self.assertIn("chrome --version | grep -E '^Google Chrome for Testing 152\\.0\\.7977\\.77 *$'", original)
        dockerfile.write_text(original.replace('152.0.7977.77', '152.0.0.0'))
        with self.assertRaisesRegex(ValueError, 'Protected input changed'):
            self.execute()
        self.assertFalse(any(c[:2] == ('docker', 'build') for c in self.tools.calls))
        self.assertFalse(self.tools.started)

    def test_copy_rejects_symlinks_hidden_dependencies_and_traversal(self):
        source = self.root / 'public.txt'; source.write_text('public')
        (self.root / 'link.txt').symlink_to(source)
        for path in ('link.txt', '../public.txt', '/public.txt', '.env', 'node_modules/file.txt'):
            with self.subTest(path=path), self.assertRaises(ValueError):
                fixture.copy_public(self.root, self.directory, [path])

    def test_image_defaults_architecture_and_env_exactness(self):
        self.assertEqual(fixture.image_config(image(), IMAGE), image()['Config'])
        mutations = [
            lambda x: x.update(Id='sha256:' + 'd' * 64),
            lambda x: x.update(Architecture='arm64'),
            lambda x: x['Config'].update(Cmd=['true']),
            lambda x: x['Config'].update(Entrypoint=['sh']),
            lambda x: x['Config'].update(User='0'),
            lambda x: x['Config'].update(Volumes={'/work': {}}),
            lambda x: x['Config'].update(Healthcheck={'Test': ['CMD', 'true']}),
            lambda x: x['Config']['Env'].append('AWS_ACCESS_KEY_ID=synthetic'),
            lambda x: x['Config']['Env'].append('HOME=/tmp/home'),
            lambda x: x['Config']['Env'].append('LANG=wrong'),
            lambda x: x['Config']['Env'].__setitem__(0, 'PATH=/tmp/bin'),
        ]
        for mutate in mutations:
            changed = image(); mutate(changed)
            with self.assertRaises(ValueError): fixture.image_config(changed, IMAGE)
        value = image(); value['Config']['Env'].reverse()
        fixture.image_config(value, IMAGE)
        value['Config']['Env'] += ['LANG=C.UTF-8', 'LC_ALL=C.UTF-8']
        fixture.image_config(value, IMAGE)

    def test_real_container_inspection_denies_genuine_safety_and_identity_mismatches(self):
        original = container()
        fixture.inspect_fixture(self.tools, CONTAINER, IMAGE, image()['Config'])
        mutations = [
            lambda x: x.update(Image='sha256:' + 'd' * 64),
            lambda x: x.update(Mounts=[{'Type': 'bind'}]),
            lambda x: x['Config'].update(Cmd=['true']),
            lambda x: x['Config'].update(User='0'),
            lambda x: x['Config']['Env'].append('HOSTING_EXPECT_RUN_ID=1'),
            lambda x: x['Config']['Env'].append('GH_TOKEN=synthetic'),
            lambda x: x['Config']['Env'].__setitem__(0, 'PATH=/tmp/bin'),
            lambda x: x['HostConfig'].update(NetworkMode='bridge'),
            lambda x: x['HostConfig'].update(ReadonlyRootfs=False),
            lambda x: x['HostConfig'].update(Privileged=True),
            lambda x: x['HostConfig'].update(IpcMode='host'),
            lambda x: x['HostConfig'].update(CapAdd=['SYS_ADMIN']),
            lambda x: x['HostConfig'].update(DeviceRequests=[{'Count': -1}]),
            lambda x: x['HostConfig'].update(PortBindings={'3000/tcp': [{}]}),
            lambda x: x['HostConfig'].update(Binds=['/var/run/docker.sock:/socket']),
            lambda x: x['HostConfig'].update(Tmpfs={'/work': 'rw'}),
            lambda x: x['HostConfig'].update(RestartPolicy={'Name': 'always'}),
        ]
        for mutate in mutations:
            self.tools.container = copy.deepcopy(original); mutate(self.tools.container)
            with self.assertRaises(ValueError):
                fixture.inspect_fixture(self.tools, CONTAINER, IMAGE, image()['Config'])
        self.tools.container = copy.deepcopy(original)
        self.tools.container['Config']['Env'].reverse()
        fixture.inspect_fixture(self.tools, CONTAINER, IMAGE, image()['Config'])

    def test_metrics_preserve_explicit_full_ua_compatibility(self):
        value = report()
        value['chromeVersion'] = '152.0.7977.77'
        lines = [fixture.METRIC_PREFIX + json.dumps(dict(schemaVersion=1, reports=[value]))]
        self.assertEqual(fixture.sanitized_metrics(lines)[0]['chromeVersion'], '152.0.7977.77')

    def test_metrics_reject_wrong_malformed_and_missing_ua_versions(self):
        for version in ('151.0.0.0', '153.0.0.0', '152.1.0.0', '152.0.7977.78', '152.0.7978.77',
                        '152.0.0.1', '152', '152.0.0', '152.0.0.0.1', '152.0.0.0suffix',
                        ' 152.0.0.0', '152.0.0.0\n', '', None, 152, [], {}):
            with self.subTest(version=version):
                value = dict(report(), chromeVersion=version)
                lines = [fixture.METRIC_PREFIX + json.dumps(dict(schemaVersion=1, reports=[value]))]
                with self.assertRaisesRegex(ValueError, 'Measurement configuration drift'):
                    fixture.sanitized_metrics(lines)
        value = report(); del value['chromeVersion']
        with self.assertRaisesRegex(ValueError, 'Measurement configuration drift'):
            fixture.sanitized_metrics([fixture.METRIC_PREFIX + json.dumps(dict(schemaVersion=1, reports=[value]))])

    def test_metrics_drop_arbitrary_page_fields_and_reject_configuration_drift(self):
        value = report()
        value.update(url='SYNTHETIC_PRIVATE', warning='SYNTHETIC_PRIVATE')
        line = lambda r: [fixture.METRIC_PREFIX + json.dumps(dict(schemaVersion=1, reports=[r]))]
        self.assertNotIn('SYNTHETIC_PRIVATE', json.dumps(fixture.sanitized_metrics(line(value))))
        for key, wrong in (('chromeVersion', '151.0.0.0'), ('lighthouseVersion', '13.0.0'),
                           ('throttling', {'cpuSlowdownMultiplier': 1}), ('formFactor', 'desktop'),
                           ('throttlingMethod', 'devtools'),
                           ('screenEmulation', dict(width=390, height=844, deviceScaleFactor=2)),
                           ('performance', 'SYNTHETIC_PRIVATE'), ('performance', True),
                           ('performance', float('nan')), ('performance', float('inf'))):
            with self.subTest(key=key), self.assertRaises(ValueError):
                fixture.sanitized_metrics(line(dict(value, **{key: wrong})))
        with self.assertRaises(ValueError): fixture.sanitized_metrics([fixture.METRIC_PREFIX + ' ' * 16385])
        with self.assertRaises(ValueError): fixture.sanitized_metrics(metric_lines(4))
        with self.assertRaises(ValueError): fixture.sanitized_metrics(metric_lines() * 2)
        with self.assertRaises(ValueError): fixture.strict_json('{"a":1,"a":2}')

    def test_bounded_stream_retains_only_metric_line_and_exact_milestones(self):
        text = '\n'.join([*(runner + ': local control + 13 redirect/origin/WebSocket/IP/proxy-bypass denials; '
                            'zero foreign/escape/upgrade requests' for runner in ('playwright', 'lighthouse')),
                          'Hosting smoke checks passed for http://127.0.0.1:3000 (local mode).',
                          '  4 skipped', '  56 passed (1.2m)', 'SYNTHETIC_PRIVATE', *metric_lines()])
        lines, invalid, milestones = fixture.collect_output(io.BytesIO(text.encode()))
        self.assertEqual(milestones, MILESTONES)
        self.assertFalse(invalid)
        self.assertEqual(lines, metric_lines())
        self.assertTrue(fixture.collect_output(io.BytesIO(b'x' * 70000))[1])

    def test_main_writes_diagnostic_evidence_on_setup_failure_without_raw_errors(self):
        env = dict(environment(), RUNNER_TEMP=str(self.directory))
        def fail(tools, env, directory, evidence):
            evidence['stage'] = 'image-build'
            raise ValueError('SYNTHETIC_PRIVATE')
        with patch.dict(fixture.os.environ, env, clear=True), patch.object(fixture, 'ROOT', self.root), \
                patch.object(fixture, 'Tools', return_value=self.tools), patch.object(fixture, 'execute', side_effect=fail):
            self.assertEqual(fixture.main(['run']), 1)
        body = (self.root / 'ci-artifacts/paul-native-fixture/diagnostic.json').read_text()
        self.assertNotIn('SYNTHETIC_PRIVATE', body)
        self.assertEqual(json.loads(body)['exitCode'], 1)
        self.assertTrue(json.loads(body)['diagnostic'])

    def test_tools_do_not_forward_runner_tokens_or_ambient_configuration(self):
        with patch.dict(fixture.os.environ, {'GITHUB_TOKEN': 'synthetic', 'AWS_PROFILE': 'synthetic'}, clear=True), \
                patch.object(fixture.shutil, 'which', side_effect=lambda name: '/usr/bin/' + name):
            tools = fixture.Tools(self.directory)
        self.assertEqual(set(tools.env), {'HOME', 'PATH', 'CI', 'XDG_CACHE_HOME', 'TMPDIR'})
        self.assertNotIn('synthetic', json.dumps(tools.env))
        self.assertEqual(tools.argv(['docker', 'inspect', IMAGE]), ['/usr/bin/docker', 'inspect', IMAGE])


if __name__ == '__main__':
    unittest.main()
