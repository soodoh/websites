"""Run only the prepared immutable candidate image; never pass cloud/GitHub credentials."""
import json
import os
import re
import subprocess

from state import require
from paul_recovery import pinned_release, recovery_pins


def docker(*args):
    return subprocess.check_output(['docker', *args], text=True).strip()


def container_args(image, release, *, fixture=False):
    require(isinstance(image, str) and re.fullmatch(r'sha256:[0-9a-f]{64}', image), 'Prepared immutable image ID required')
    for key, pattern in [('commit', r'[0-9a-f]{40}'), ('runId', r'[1-9][0-9]*'), ('runAttempt', r'[1-9][0-9]*')]:
        require(isinstance(release.get(key), str) and re.fullmatch(pattern, release[key]), 'Invalid nonsecret acceptance identity')
    return ['create', '--platform', 'linux/amd64', '--network', 'none' if fixture else 'bridge', '--ipc', 'private', '--user', '1000:1000',
            '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--read-only',
            '--tmpfs', '/tmp:rw,nosuid,nodev',
            '--tmpfs', '/work/apps/paul/test-results:rw,nosuid,nodev,uid=1000,gid=1000,mode=0700',
            '--tmpfs', '/work/apps/paul/playwright-report:rw,nosuid,nodev,uid=1000,gid=1000,mode=0700',
            '--tmpfs', '/work/apps/paul/.lighthouseci:rw,nosuid,nodev,uid=1000,gid=1000,mode=0700',
            '--env', 'PAUL_ACCEPTANCE_MODE=' + ('fixture' if fixture else 'candidate'),
            '--env', 'HOSTING_EXPECT_COMMIT=' + release['commit'],
            '--env', 'HOSTING_EXPECT_RUN_ID=' + release['runId'],
            '--env', 'HOSTING_EXPECT_RUN_ATTEMPT=' + release['runAttempt'],
            image]


def inspect_container(container, image, *, fixture=False):
    value = json.loads(docker('inspect', container))[0]
    require(value['Image'] == image and value['Mounts'] == [], 'Wrong image or forbidden acceptance mounts')
    host = value['HostConfig']
    require(host['ReadonlyRootfs'] is True and host['Privileged'] is False and host['IpcMode'] == 'private'
            and not host.get('Binds') and not host.get('Devices') and not host.get('PortBindings')
            and host['CapDrop'] == ['ALL'] and host['SecurityOpt'] == ['no-new-privileges'], 'Unsafe acceptance container')
    require(value['Config']['User'] == '1000:1000', 'Acceptance must be unprivileged')
    require(host['NetworkMode'] == ('none' if fixture else 'bridge'), 'Wrong acceptance network')
    expected_tmpfs = {'/tmp': 'rw,nosuid,nodev', **{
        '/work/apps/paul/' + path: 'rw,nosuid,nodev,uid=1000,gid=1000,mode=0700'
        for path in ('test-results', 'playwright-report', '.lighthouseci')}}
    require(host.get('Tmpfs') == expected_tmpfs, 'Unexpected acceptance writable paths')
    allowed = {'PATH', 'LANG', 'LC_ALL', 'CI', 'HOME', 'PLAYWRIGHT_BROWSERS_PATH', 'PAUL_ACCEPTANCE_MODE',
               'HOSTING_EXPECT_COMMIT', 'HOSTING_EXPECT_RUN_ID', 'HOSTING_EXPECT_RUN_ATTEMPT'}
    require(all(item.split('=', 1)[0] in allowed for item in value['Config']['Env']), 'Unexpected environment in isolated acceptance')
    env = dict(item.split('=', 1) for item in value['Config']['Env'])
    require(env.get('PAUL_ACCEPTANCE_MODE') == ('fixture' if fixture else 'candidate')
            and env.get('HOME') == '/tmp/home' and env.get('CI') == '1'
            and env.get('PLAYWRIGHT_BROWSERS_PATH') == '/ms-playwright', 'Wrong acceptance mode or home')


def accept_candidate(release):
    require(release == pinned_release(recovery_pins()), 'Exact retained candidate identity required')
    image = os.environ.get('PAUL_ACCEPTANCE_IMAGE')
    container = docker(*container_args(image, release))
    require(re.fullmatch(r'[0-9a-f]{64}', container), 'Missing owned acceptance container ID')
    print('Paul candidate acceptance container: ' + container, flush=True)
    inspect_container(container, image)
    # Failure retains this invocation-created object for diagnostics/reconciliation, never blind retry.
    subprocess.run(['docker', 'start', '--attach', container], check=True)
    result = json.loads(docker('inspect', container))[0]
    require(result['State']['Status'] == 'exited' and result['State']['ExitCode'] == 0, 'Candidate acceptance failed')
    docker('rm', container)
