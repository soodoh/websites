"""HELD hosted-only fixture diagnostic; no release, candidate or live-mode entry point."""
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/ci'))
sys.path.insert(0, str(ROOT / 'scripts/release'))
import paul_acceptance as acceptance
from state import require

WORKFLOW = 'soodoh/websites/.github/workflows/paul-native-fixture.yml@refs/heads/main'
SERVING = dict(commit='0' * 40, runId='1', runAttempt='1')
COMMAND = ['node', '/work/scripts/release/paul_acceptance_runner.mjs']
BASE_ENV = dict(PATH='/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
                CI='1', HOME='/tmp/home', PLAYWRIGHT_BROWSERS_PATH='/ms-playwright')
GUARDS = ('paul_acceptance_runner.mjs', 'paul_acceptance_guard.cjs', 'paul_guard_probe.mjs',
          'paul_hosting_guard.mjs', 'paul_lighthouse.config.cjs', 'paul_lighthouse_guard.cjs',
          'paul_lighthouse_metrics.cjs', 'paul_playwright.config.ts')
PUBLIC_FILES = ('package.json', 'bun.lock', 'bunfig.toml',
                *(f'apps/{app}/package.json' for app in ('carolyn', 'diloreto', 'paul', 'sarabeth')),
                'apps/paul/playwright.config.ts', 'apps/paul/lighthouserc.cjs',
                'apps/paul/scripts/serve-static.mjs', 'apps/paul/scripts/hosting-smoke.mjs',
                'apps/paul/scripts/recovery-browser-guard.mjs',
                'scripts/release/Dockerfile.paul-acceptance',
                *(f'scripts/release/{name}' for name in GUARDS))
# Exact reviewed protected inputs, not a future checkout/publication SHA.
PROTECTED = {
    'scripts/release/Dockerfile.paul-acceptance': '141486725b3a3e63350f5f1087e69c20aed2ebc16b325499f0e184a631b6cc85',
    'apps/paul/lighthouserc.cjs': 'e6acbdf27ac1c9075949fc3b041c5f36d1609f93322391734b3fc325f58f6e64',
    'apps/paul/playwright.config.ts': '481f24943118a255878062ad59a2e35ee49e456a00cecc2550d503c2cf885249',
    'apps/paul/package.json': 'c2cac3e4ff8453dbe0f51675a139aca44da482c7bf65829e2a45579bafab228f',
    'bun.lock': '14e1706c369f49ed3e0bd6764d06406326ad3222cde353e1d5056fc8297c42de',
    'scripts/release/paul_acceptance.py': 'ab4a3b2371554cbcd2ce0339b9c90525d270917476534d8129eb0f6358a6ede1',
    'scripts/release/paul_acceptance_runner.mjs': '3d7a3383ebb9a8d0a865b85b98f50e0e04c046e3be008b9028048cd8d7cc24c8',
    'scripts/release/paul_acceptance_guard.cjs': '33e9f142dcafa39d32aabbb7cb44962599026f659f6c40779892ee5725996d1b',
    'scripts/release/paul_guard_probe.mjs': 'be902de989be8b48603a35c8ae4afb1e915918659340f9288f6502a952e96247',
    'scripts/release/paul_hosting_guard.mjs': 'dbc6ae6c9a98aa762c4d8710cd50e5f0441c2063a69ff335cdc999fb45227d52',
    'scripts/release/paul_lighthouse.config.cjs': '177635f8ecd564c9876b5c0348fea7d90878f886178bd14cb61d534969e8f789',
    'scripts/release/paul_lighthouse_guard.cjs': 'e3e50af7026a243dd51e6d79cd4f74acf96989f73fdf6ac357b6003d9e1d807b',
    'scripts/release/paul_lighthouse_metrics.cjs': '40d8c959fd4e8fce78025672e6792d9ba5e045d0bdc14b0185aa91b700927dee',
    'scripts/release/paul_playwright.config.ts': 'eea28c49c05e47abfe8d59d166b4d38e8e1502df947f1c91fc9f4bb5f27eb3b5',
}
METRIC_PREFIX = 'PAUL_ACCEPTANCE_LIGHTHOUSE_METRICS '


def digest(data):
    return hashlib.sha256(data).hexdigest()


def strict_json(text):
    def pairs(items):
        result = {}
        for key, value in items:
            require(key not in result, 'Duplicate JSON key')
            result[key] = value
        return result
    return json.loads(text, object_pairs_hook=pairs,
                      parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Nonfinite JSON')))


def native_arch(os_name, arch):
    require(os_name == 'linux' and arch in ('amd64', 'x86_64'), 'Native Linux amd64 required')
    return dict(os=os_name, architecture=arch)


def context(env, checkout):
    for key, expected in dict(GITHUB_ACTIONS='true', GITHUB_EVENT_NAME='workflow_dispatch',
                              GITHUB_REPOSITORY='soodoh/websites', GITHUB_REF='refs/heads/main',
                              GITHUB_WORKFLOW_REF=WORKFLOW, RUNNER_OS='Linux', RUNNER_ARCH='X64',
                              RUNNER_ENVIRONMENT='github-hosted').items():
        require(env.get(key) == expected, 'Wrong hosted diagnostic context: ' + key)
    sha = env.get('GITHUB_SHA', '')
    require(re.fullmatch('[0-9a-f]{40}', sha) and sha == checkout == env.get('GITHUB_WORKFLOW_SHA'),
            'Checkout/workflow SHA mismatch')
    for key in ('GITHUB_RUN_ID', 'GITHUB_RUN_ATTEMPT'):
        require(re.fullmatch('[1-9][0-9]*', env.get(key, '')), 'Missing diagnostic run identity')
    return dict(repository='soodoh/websites', workflow=WORKFLOW, checkoutSha=sha,
                runId=env['GITHUB_RUN_ID'], runAttempt=env['GITHUB_RUN_ATTEMPT'])


class Tools:
    """Commands receive a new noncredential HOME and only explicit tool paths."""
    def __init__(self, directory):
        home = directory / 'home'
        home.mkdir()
        self.env = dict(HOME=str(home), PATH='/usr/local/bin:/usr/bin:/bin', CI='1',
                        XDG_CACHE_HOME=str(directory / 'cache'), TMPDIR=str(directory))
        self.paths = {}
        for name in ('git', 'docker', 'bun', 'node'):
            path = shutil.which(name)
            if path:
                self.paths[name] = path
        self.env['PATH'] = ':'.join(dict.fromkeys(
            [str(Path(p).parent) for p in self.paths.values()] + ['/usr/local/bin', '/usr/bin', '/bin']))

    def argv(self, args):
        require(args[0] in self.paths, 'Missing pinned tool')
        return [self.paths[args[0]], *map(str, args[1:])]

    def call(self, *args, cwd=ROOT, capture=True):
        result = subprocess.run(self.argv(args), cwd=cwd, env=self.env, check=False,
                                stdout=subprocess.PIPE if capture else subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL, text=True, timeout=1200)
        require(result.returncode == 0, 'Diagnostic tool failed: ' + args[0])
        require(not capture or len(result.stdout) <= 1024 * 1024, 'Oversized tool response')
        return result.stdout.strip() if capture else ''

    def measure(self, container):
        # Drain, but never retain/print raw page, trace, warning or environment output.
        process = subprocess.Popen(self.argv(['docker', 'start', '--attach', container]),
                                   cwd=ROOT, env=self.env, stdout=subprocess.PIPE,
                                   stderr=subprocess.STDOUT)
        lines, invalid, milestones = collect_output(process.stdout)
        code = process.wait()
        process.stdout.close()
        return code, lines, invalid, milestones


def collect_output(stream):
    lines, size, invalid, milestones = [], 0, False, {}
    probes = set()
    while block := stream.readline(65537):
        size += len(block)
        if len(block) > 65536 or size > 2 * 1024 * 1024:
            invalid = True
            continue
        text = re.sub(r'\x1b\[[0-9;]*m', '', block.decode('utf-8', errors='replace')).strip()
        if text.startswith(METRIC_PREFIX):
            if len(lines) < 2:
                lines.append(text)
            else:
                invalid = True
        for runner in ('playwright', 'lighthouse'):
            if text == (runner + ': local control + 13 redirect/origin/WebSocket/IP/proxy-bypass denials; '
                        'zero foreign/escape/upgrade requests'):
                probes.add(runner)
        if text == 'Hosting smoke checks passed for http://127.0.0.1:3000 (local mode).':
            milestones['hostingPassed'] = True
        if re.fullmatch(r'56 passed \([^\n]{1,40}\)', text):
            milestones['playwrightPassed'] = 56
        if text == '4 skipped':
            milestones['playwrightSkipped'] = 4
    milestones['guardDenials'] = 13 * len(probes)
    return lines, invalid, milestones


def preflight(tools, env):
    identity = context(env, tools.call('git', '--no-optional-locks', 'rev-parse', 'HEAD'))
    require(not tools.call('git', '--no-optional-locks', 'status', '--porcelain=v1', '--untracked-files=all'),
            'Diagnostic checkout must be clean')
    runner = native_arch(platform.system().lower(), platform.machine())
    daemon = strict_json(tools.call('docker', 'info', '--format', '{{json .}}'))
    architecture = native_arch(daemon.get('OSType'), daemon.get('Architecture'))
    return dict(source=identity, runner=runner, daemon=architecture)


def marker():
    # Hosting checks require only these three synthetic fields. This is NOT schema-v1 CI provenance.
    return dict(**SERVING, diagnostic=True, releaseAuthorized=False,
                kind='paul-native-fixture-nonrelease')


def copy_public(root, destination, paths):
    records, total = {}, 0
    for relative in sorted(set(paths)):
        parts = Path(relative).parts
        require(not Path(relative).is_absolute() and '..' not in parts, 'Unsafe public path')
        require(all(not p.startswith('.') and p != 'node_modules' for p in parts), 'Private public input')
        source = root / relative
        require(all(not (root.joinpath(*parts[:i])).is_symlink() for i in range(1, len(parts) + 1)),
                'Symlink public input')
        require(source.is_file() and source.stat().st_size <= 32 * 1024 * 1024, 'Invalid public file')
        data = source.read_bytes()
        total += len(data)
        require(total <= 200 * 1024 * 1024 and len(records) < 4096, 'Oversized public context')
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        records[relative] = dict(sha256=digest(data), bytes=len(data))
    return records


def prepare_context(root, destination, tools):
    for relative, expected in PROTECTED.items():
        require(digest((root / relative).read_bytes()) == expected, 'Protected input changed')
    # Only tracked public test source/screenshots; never recursively copy the checkout.
    tests = tools.call('git', '--no-optional-locks', 'ls-files', 'apps/paul/e2e', cwd=root).splitlines()
    require(tests and all(Path(p).suffix in ('.ts', '.png') for p in tests), 'Unexpected e2e input')
    dist = root / 'apps/paul/dist/client'
    require(strict_json((dist / 'release.json').read_text()) == marker(), 'Diagnostic marker mismatch')
    output = []
    for path in dist.rglob('*'):
        require(not path.is_symlink(), 'Symlink fixture output')
        if path.is_file():
            require(path.suffix in ('.html', '.js', '.css', '.json', '.png', '.webp', '.jpg', '.jpeg',
                                   '.svg', '.ico', '.woff', '.woff2', '.txt', '.avif'), 'Nonpublic fixture output')
            output.append(str(path.relative_to(root)))
    require((dist / 'index.html').is_file() and (dist / '404.html').is_file(), 'Missing fresh fixture')
    records = copy_public(root, destination, [*PUBLIC_FILES, *tests, *output])
    # Root source-only .dockerignore excludes **/dist. Do not copy it into this explicit context.
    ignore = b'# Explicit public-only context; prebuilt dist is intentionally included.\n'
    (destination / '.dockerignore').write_bytes(ignore)
    records['.dockerignore'] = dict(sha256=digest(ignore), bytes=len(ignore))
    return records


def unique_env(items):
    require(isinstance(items, list), 'Missing image environment')
    result = {}
    for item in items:
        require(isinstance(item, str) and '=' in item, 'Malformed environment')
        name, value = item.split('=', 1)
        require(name not in result, 'Duplicate environment name')
        result[name] = value
    return result


def image_config(image, image_id):
    require(image.get('Id') == image_id, 'Wrong immutable image')
    native_arch(image.get('Os'), image.get('Architecture'))
    config = image['Config']
    require(config.get('Cmd') == COMMAND and not config.get('Entrypoint')
            and config.get('User') == '1000:1000' and config.get('WorkingDir') == '/work/apps/paul'
            and not config.get('Volumes') and not config.get('ExposedPorts')
            and not config.get('Healthcheck') and not config.get('OnBuild'), 'Wrong guarded image defaults')
    env = unique_env(config['Env'])
    # Base-image locale fields may be absent; if present their exact values are mandatory.
    require({k: v for k, v in env.items() if k not in ('LANG', 'LC_ALL')} == BASE_ENV
            and all(env[k] == 'C.UTF-8' for k in ('LANG', 'LC_ALL') if k in env), 'Unsafe image environment')
    return config


def inspect_fixture(tools, container, image_id, config):
    # Reuse the shipped full harness safety inspection, with the same safe command boundary.
    old = acceptance.docker
    try:
        acceptance.docker = lambda *args: tools.call('docker', *args)
        acceptance.inspect_container(container, image_id, fixture=True)
    finally:
        acceptance.docker = old
    value = strict_json(tools.call('docker', 'inspect', container))[0]
    expected = {**unique_env(config['Env']), 'PAUL_ACCEPTANCE_MODE': 'fixture',
                'HOSTING_EXPECT_COMMIT': SERVING['commit'], 'HOSTING_EXPECT_RUN_ID': SERVING['runId'],
                'HOSTING_EXPECT_RUN_ATTEMPT': SERVING['runAttempt']}
    require(value.get('Id') == container and value['Image'] == image_id
            and value['Config'].get('Cmd') == COMMAND and not value['Config'].get('Entrypoint')
            and value['Config'].get('WorkingDir') == '/work/apps/paul'
            and unique_env(value['Config']['Env']) == expected, 'Container identity/command/environment drift')
    host = value['HostConfig']
    for field in ('VolumesFrom', 'DeviceRequests', 'DeviceCgroupRules', 'CapAdd', 'Links', 'ExtraHosts'):
        require(not host.get(field), 'Forbidden container access')
    require(not host.get('PidMode') and not host.get('UTSMode') and not host.get('PublishAllPorts')
            and host.get('RestartPolicy', {}).get('Name') == 'no', 'Unsafe container lifecycle/namespaces')
    return value


def sanitized_metrics(lines):
    require(len(lines) <= 1, 'Multiple measurement exports')
    if not lines:
        return []
    text = lines[0].removeprefix(METRIC_PREFIX)
    require(len(text.encode()) <= 16384, 'Oversized metric export')
    value = strict_json(text)
    require(value.get('schemaVersion') == 1 and isinstance(value.get('reports'), list)
            and len(value['reports']) <= 3, 'Invalid measurement set')
    def number(value):
        require(value is None or (type(value) in (int, float) and math.isfinite(value)), 'Invalid metric')
        return value
    reports = []
    for report in value['reports']:
        # UA evidence may be reduced; the protected Dockerfile separately checks the exact binary pin.
        chrome_version = report.get('chromeVersion')
        require(report.get('lighthouseVersion') == '12.6.1'
                and chrome_version in ('152.0.0.0', '152.0.7977.77')
                and report.get('formFactor') == 'mobile'
                and report.get('screenEmulation') == dict(width=390, height=844, deviceScaleFactor=1)
                and report.get('throttlingMethod') == 'simulate'
                and report.get('throttling', {}).get('cpuSlowdownMultiplier') == 4, 'Measurement configuration drift')
        reports.append(dict(lighthouseVersion='12.6.1', chromeVersion=chrome_version,
                            performance=number(report.get('performance')),
                            metrics={k: number(report.get('metrics', {}).get(k)) for k in (
                                'first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time',
                                'cumulative-layout-shift', 'speed-index')},
                            benchmarkIndex=number(report.get('benchmarkIndex')),
                            durationMs=number(report.get('timing', {}).get('total')),
                            formFactor='mobile', screenEmulation=dict(width=390, height=844, deviceScaleFactor=1),
                            throttlingMethod='simulate', cpuSlowdownMultiplier=4))
    return reports


def execute(tools, env, directory, evidence, root=ROOT):
    evidence.update(preflight(tools, env))
    require(tools.call('bun', '--version') == '1.4.0' and tools.call('node', '--version') == 'v24.20.0',
            'Wrong pinned build tools')
    require(not (root / 'apps/paul/dist').exists(), 'Fresh runner must not contain prebuilt dist')
    evidence['stage'] = 'fixture-build'
    tools.call('bun', 'run', 'build', cwd=root / 'apps/paul', capture=False)
    dist = root / 'apps/paul/dist/client'
    require(not (dist / 'release.json').exists(), 'Unexpected preexisting release marker')
    (dist / 'release.json').write_text(json.dumps(marker()) + '\n')
    destination = directory / 'context'
    destination.mkdir()
    evidence['inputs'] = prepare_context(root, destination, tools)
    evidence['protectedInputs'] = PROTECTED
    evidence['servingIdentity'] = marker()
    evidence['stage'] = 'image-build'
    iid = directory / 'image-id'
    tools.call('docker', 'build', '--platform', 'linux/amd64', '--no-cache', '--iidfile', iid,
               '-f', destination / 'scripts/release/Dockerfile.paul-acceptance', destination, capture=False)
    image_id = iid.read_text().strip()
    require(re.fullmatch('sha256:[0-9a-f]{64}', image_id), 'Missing immutable image ID')
    evidence['imageId'] = image_id
    image = strict_json(tools.call('docker', 'image', 'inspect', image_id))[0]
    config = image_config(image, image_id)
    evidence['imagePlatform'] = native_arch(image['Os'], image['Architecture'])
    container = tools.call('docker', *acceptance.container_args(image_id, SERVING, fixture=True))
    require(re.fullmatch('[0-9a-f]{64}', container), 'Missing invocation container ID')
    evidence['containerId'] = container
    before = inspect_fixture(tools, container, image_id, config)
    require(before['State']['Status'] == 'created' and not before['State']['Running'], 'Container already started')
    evidence['oomKillDisableBefore'] = before['HostConfig'].get('OomKillDisable')
    evidence['stage'] = 'full-guarded-fixture'
    code, lines, invalid, milestones = tools.measure(container)  # Exactly one start; never rerun on failure.
    evidence['milestones'] = milestones
    evidence['attachExitCode'] = code
    evidence['harnessExitCode'] = None
    try:
        after = inspect_fixture(tools, container, image_id, config)
        evidence['oomKillDisableAfter'] = after['HostConfig'].get('OomKillDisable')
        state = after['State']
        require(state['Status'] == 'exited' and state['Running'] is False
                and type(state['ExitCode']) is int, 'Harness did not reach terminal state')
        evidence['harnessExitCode'] = state['ExitCode']
        evidence['oomKilled'] = state.get('OOMKilled')
        evidence['reports'] = sanitized_metrics(lines)
        require(not invalid, 'Oversized measurement output')
        require(code == state['ExitCode'], 'Attach/container exit mismatch')
        if code == 0:
            require(len(evidence['reports']) == 3 and milestones == dict(
                guardDenials=26, hostingPassed=True, playwrightPassed=56, playwrightSkipped=4),
                'Successful harness missing full guarded measurement evidence')
    except (ValueError, KeyError, TypeError, subprocess.SubprocessError):
        evidence['evidenceError'] = True
        return code if code > 0 else (evidence['harnessExitCode'] or 1)
    evidence['stage'] = 'complete'
    return code


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    require(args in (['preflight'], ['run']), 'Only hosted fixture preflight/run supported')
    # No fallback to a private HOME or local scratch when this is invoked outside hosted context.
    context(os.environ, os.environ.get('GITHUB_SHA', ''))
    base = Path(os.environ['RUNNER_TEMP'])
    directory = Path(tempfile.mkdtemp(prefix='paul-native-fixture-', dir=base))
    tools = Tools(directory)
    if args == ['preflight']:
        output = ROOT / 'ci-artifacts/paul-native-fixture/preflight.json'
        output.parent.mkdir(parents=True, exist_ok=True)
        require(not output.exists(), 'Do not overwrite preflight evidence')
        evidence = dict(diagnostic=True, releaseAuthorized=False, physicalHardwareAttestation=False)
        code = 1
        try:
            evidence.update(preflight(tools, os.environ))
            code = 0
        except (ValueError, KeyError, TypeError, OSError, subprocess.SubprocessError):
            evidence['preflightError'] = True
        evidence['exitCode'] = code
        output.write_text(json.dumps(evidence, sort_keys=True) + '\n')
        print('Diagnostic native runner/context preflight exit: ' + str(code) + '; no measurement.')
        return code
    output = ROOT / 'ci-artifacts/paul-native-fixture/diagnostic.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    require(not output.exists(), 'Do not overwrite diagnostic evidence')
    evidence = dict(schemaVersion=1, diagnostic=True, releaseAuthorized=False,
                    stage='preflight', reports=[], physicalHardwareAttestation=False)
    code = 1
    try:
        code = execute(tools, os.environ, directory, evidence)
    except (ValueError, KeyError, TypeError, OSError, subprocess.SubprocessError):
        evidence['setupOrExecutionError'] = True
    finally:
        evidence['exitCode'] = code
        body = json.dumps(evidence, sort_keys=True, allow_nan=False) + '\n'
        require(len(body.encode()) <= 1024 * 1024, 'Oversized diagnostic evidence')
        output.write_text(body)
    print('Diagnostic fixture exit: ' + str(code) + '; not release or production acceptance.')
    # Invocation objects are retained; ephemeral runner teardown owns disposal, not bulk cleanup.
    return code


if __name__ == '__main__':
    sys.exit(main())
