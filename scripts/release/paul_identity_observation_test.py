"""Synthetic platform observations only; no live credentials or network."""
import ast
import base64
from contextlib import redirect_stdout, redirect_stderr
import json
import io
import os
from pathlib import Path
import signal
import socket
import subprocess
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request
import urllib.response
from email.message import Message

import paul_identity_observation as observer


SHA = 'a' * 40


def context():
    return dict(repository='soodoh/websites', repository_id='1358469291',
                repository_owner='soodoh', repository_owner_id='18269267',
                environment='production-portfolio', event_name='workflow_dispatch',
                ref='refs/heads/main',
                workflow_ref='soodoh/websites/.github/workflows/paul-identity-observation.yml@refs/heads/main',
                workflow_sha=SHA, sha=SHA, run_id='123456789', run_attempt='1')


class ContextAdmission(unittest.TestCase):
    def test_only_exact_manual_main_first_attempt_and_actual_checkout_are_admitted(self):
        self.assertEqual(observer.validate_context(context(), SHA), context())
        for key in context():
            for invalid in (None, '', 'wrong', 1, True):
                with self.subTest(key=key, invalid=invalid):
                    candidate = context() | {key: invalid}
                    with self.assertRaises(ValueError):
                        observer.validate_context(candidate, SHA)
        for key, invalid in [('run_id', '0'), ('run_id', '-1'), ('run_id', '1.2'),
                             ('run_id', '١'), ('run_id', '01'), ('run_id', '1' * 129),
                             ('run_attempt', '2'), ('sha', SHA.upper()),
                             ('workflow_sha', 'b' * 40), ('sha', 'b' * 40)]:
            with self.subTest(key=key, invalid=invalid), self.assertRaises(ValueError):
                observer.validate_context(context() | {key: invalid}, SHA)
        for checkout in ('b' * 40, SHA.upper(), '', SHA + '\n', None):
            with self.subTest(checkout=checkout), self.assertRaises(ValueError):
                observer.validate_context(context(), checkout)


def claims():
    return context() | dict(iss='https://token.actions.githubusercontent.com',
                            aud='sts.amazonaws.com', sub='repository_id:1358469291:environment:production-portfolio',
                            iat=990, nbf=985, exp=1100)


def segment(value):
    raw = value if isinstance(value, bytes) else json.dumps(value).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip('=')


def token(payload=None):
    return '.'.join((segment({'alg': 'RS256', 'kid': 'HEADER_SENTINEL'}),
                     segment(claims() if payload is None else payload),
                     segment(b'SIGNATURE_SENTINEL')))


class ClaimProjection(unittest.TestCase):
    def test_decodes_only_complete_current_bound_identity_without_guessing_subject(self):
        payload = claims() | {'unknown': 'BODY_SENTINEL', 'actor': 'EXTRA_SENTINEL'}
        self.assertEqual(observer.project_claims(token(payload), context(), 1000), claims())
        payload['sub'] = 'custom:subject:é'
        self.assertEqual(observer.project_claims(token(payload), context(), 1000)['sub'], 'custom:subject:é')
        for key in claims():
            with self.subTest(missing=key), self.assertRaises(ValueError):
                observer.project_claims(token({k: v for k, v in claims().items() if k != key}), context(), 1000)
            for value in (None, True, [], {}, 'wrong'):
                if key == 'sub' and value == 'wrong':
                    continue  # An unfamiliar safe subject is the observation, not a denial.
                with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                    observer.project_claims(token(claims() | {key: value}), context(), 1000)
        for sub in ('', 'a b', 'a\tb', 'a\nb', 'a*b', 'a?b', '\x00', '\x7f', 'é' * 513, 'a' * 1025):
            with self.subTest(sub=repr(sub)), self.assertRaises(ValueError):
                observer.project_claims(token(claims() | {'sub': sub}), context(), 1000)
        for times in ({'iat': 1001}, {'nbf': 1001}, {'exp': 1000}, {'exp': 980},
                      {'iat': float('nan')}, {'nbf': float('inf')}, {'exp': 1e309}, {'iat': -1}):
            with self.subTest(times=times), self.assertRaises(ValueError):
                observer.project_claims(token(claims() | times), context(), 1000)
        bad = ['', 'a.b', 'a.b.c.d', token() + '=', '!' + token(),
               token().replace('.', '..', 1), 'a' * 16385,
               token(b'{"iss":"x","iss":"y"}'), token(b'{"extra":NaN}'),
               token(b'{"extra":1e999}'), token(b'\xff'), token([]),
               '.'.join((segment([]), segment(claims()), segment(b'x'))),
               '.'.join((segment(b'{"a":1,"a":2}'), segment(claims()), segment(b'x'))),
               '.'.join((segment({}), segment(claims()), 'eB'))]
        for jwt in bad:
            with self.subTest(jwt=jwt[:20]), self.assertRaises(ValueError):
                observer.project_claims(jwt, context(), 1000)


URL = 'https://fixture.actions.githubusercontent.com/token?api-version=2&audience=old'
BEARER = 'BEARER_SENTINEL'


def runtime():
    return {'ACTIONS_ID_TOKEN_REQUEST_URL': URL, 'ACTIONS_ID_TOKEN_REQUEST_TOKEN': BEARER}


def response(body, status=200, location=None):
    headers = Message()
    if location is not None:
        headers['Location'] = location
    result = urllib.response.addinfourl(io.BytesIO(body), headers, URL, status)
    result.msg = 'BODY_ERROR_SENTINEL'
    return result


class TokenTransport(unittest.TestCase):
    def test_one_bounded_get_replaces_audience_and_disables_ambient_proxy(self):
        body = json.dumps({'value': token()}).encode()
        reply = response(body)
        with patch.dict('os.environ', {'HTTPS_PROXY': 'http://PROXY_SENTINEL'}, clear=True), \
                patch.object(urllib.request.HTTPSHandler, 'https_open', return_value=reply) as network, \
                patch.object(reply, 'read', wraps=reply.read) as read:
            self.assertEqual(observer.request_token(runtime()), token())
        network.assert_called_once()
        request = network.call_args.args[0]
        self.assertEqual(request.full_url, 'https://fixture.actions.githubusercontent.com/token?api-version=2&audience=sts.amazonaws.com')
        self.assertEqual(request.get_method(), 'GET')
        self.assertEqual(request.headers, {'Authorization': 'Bearer BEARER_SENTINEL'})
        self.assertIsNone(request.data)
        self.assertFalse(request.has_proxy())
        self.assertEqual(request.timeout, 10)
        read.assert_called_once_with(65537)

    def test_untrusted_url_or_bearer_never_reaches_transport(self):
        urls = ['', 'http://fixture.actions.githubusercontent.com/token',
                'https://actions.githubusercontent.com/token', 'https://evil.example/token',
                'https://fixture.actions.githubusercontent.com.evil.example/token',
                'https://user@fixture.actions.githubusercontent.com/token',
                'https://:pass@fixture.actions.githubusercontent.com/token',
                'https://fixture.actions.githubusercontent.com:444/token',
                'https://fixture.actions.githubusercontent.com:/token',
                'https://fixture.actions.githubusercontent.com/token#',
                'https://fixture.actions.githubusercontent.com/token#fragment',
                'https://fixture.actions.githubusercontent.com/token?broken',
                'https://fixture.actions.githubusercontent.com/token?x=%ZZ',
                'https://fixture.actions.githubusercontent.com/token?x=%FF',
                'https://fixture.actions.githubusercontent.com/token?x=1&x=2',
                'https://fixture.actions.githubusercontent.com/token?=value',
                'https://fixture.actions.githubusercontent.com/token?x=%0A',
                'https://fixture.actions.githubusercontent.com/token?x=1&&y=2',
                'https://fixture.actions.githubusercontent.com/\\evil', '\n' + URL]
        with patch.object(urllib.request.HTTPSHandler, 'https_open') as network:
            for url in urls:
                with self.subTest(url=url), self.assertRaises(ValueError):
                    observer.request_token(runtime() | {'ACTIONS_ID_TOKEN_REQUEST_URL': url})
            for bearer in ('', None, 'bad\nbearer', 'bad bearer', 'é', 'x' * 16385):
                with self.subTest(bearer=repr(bearer)[:20]), self.assertRaises(ValueError):
                    observer.request_token(runtime() | {'ACTIONS_ID_TOKEN_REQUEST_TOKEN': bearer})
            network.assert_not_called()

    def test_redirects_even_missing_or_empty_location_never_make_second_request(self):
        for status in (300, 301, 302, 303, 304, 307, 308):
            for location in (None, '', 'https://evil.example/URL_SENTINEL', URL):
                with self.subTest(status=status, location=location), \
                        patch.object(urllib.request.HTTPSHandler, 'https_open',
                                     return_value=response(b'BODY_SENTINEL', status, location)) as network:
                    with self.assertRaises(ValueError):
                        observer.request_token(runtime())
                    network.assert_called_once()

    def test_status_size_json_and_socket_errors_fail_closed(self):
        bodies = [b'x' * 65537, b'BODY_SENTINEL', b'{"value":"a","value":"b"}',
                  b'{"value":NaN}', b'{"value":1e999}', b'[]', b'{}', b'{"value":42}',
                  json.dumps({'value': 'x' * 16385}).encode()]
        for body in bodies:
            with self.subTest(size=len(body)), patch.object(urllib.request.HTTPSHandler, 'https_open', return_value=response(body)):
                with self.assertRaises(ValueError):
                    observer.request_token(runtime())
        for status in (201, 400, 401, 500):
            with self.subTest(status=status), patch.object(urllib.request.HTTPSHandler, 'https_open', return_value=response(b'BODY_SENTINEL', status)) as network:
                with self.assertRaises(ValueError):
                    observer.request_token(runtime())
                network.assert_called_once()
        for error in (socket.timeout('ERROR_SENTINEL'), OSError('ERROR_SENTINEL'),
                      urllib.error.URLError('ERROR_SENTINEL')):
            with self.subTest(error=type(error)), patch.object(urllib.request.HTTPSHandler, 'https_open', side_effect=error) as network:
                with self.assertRaises(ValueError):
                    observer.request_token(runtime())
                network.assert_called_once()
        body = json.dumps({'value': token()}).encode()
        for size in (65536, 65537):
            padded = body + b' ' * (size - len(body))
            with self.subTest(size=size), patch.object(urllib.request.HTTPSHandler, 'https_open', return_value=response(padded)):
                if size == 65536:
                    self.assertEqual(observer.request_token(runtime()), token())
                else:
                    with self.assertRaises(ValueError):
                        observer.request_token(runtime())


class TerminalObservation(unittest.TestCase):
    def invoke(self, *, overrides=None, body=None, status=200, error=None, checkout=SHA + '\n',
               monotonic=None, read_error=None):
        environment = {'OBS_' + key.upper(): value for key, value in context().items()}
        environment.update(runtime())
        environment.update({'GITHUB_OUTPUT': '/ARTIFACT_SENTINEL', 'GITHUB_STEP_SUMMARY': '/STATE_SENTINEL'})
        environment.update(overrides or {})
        accesses = []

        class Environment(dict):
            def get(self, key, default=None):
                accesses.append(key)
                return super().get(key, default)

        def checkout_process(argv, **kwargs):
            self.assertEqual(argv, ['git', '-c', 'core.fsmonitor=false', 'rev-parse', '--verify', 'HEAD'])
            self.assertEqual(kwargs, dict(cwd=Path(observer.__file__).resolve().parents[2],
                                         capture_output=True, text=True, timeout=10, check=True))
            self.assertNotIn('ACTIONS_ID_TOKEN_REQUEST_TOKEN', accesses)
            self.assertNotIn('ACTIONS_ID_TOKEN_REQUEST_URL', accesses)
            return SimpleNamespace(stdout=checkout)

        raw = json.dumps({'value': token(claims() | {'extra': 'EXTRA_SENTINEL'})}).encode() if body is None else body
        reply = response(raw, status)
        stdout, stderr = io.StringIO(), io.StringIO()
        with reply, patch.object(os, 'environ', Environment(environment)), \
                patch.object(subprocess, 'run', side_effect=checkout_process) as process, \
                patch.object(urllib.request.HTTPSHandler, 'https_open', return_value=reply, side_effect=error) as network, \
                patch('time.time', return_value=1000), \
                patch('time.monotonic', side_effect=monotonic or (100, 100, 100)), \
                patch.object(reply, 'read', wraps=reply.read, side_effect=read_error), \
                patch('builtins.open', side_effect=AssertionError('FILE_SENTINEL')), \
                patch('io.open', side_effect=AssertionError('FILE_SENTINEL')), \
                patch('os.open', side_effect=AssertionError('FILE_SENTINEL')), \
                patch('os.system', side_effect=AssertionError('DEPLOY_SENTINEL')), \
                patch('socket.create_connection', side_effect=AssertionError('NETWORK_SENTINEL')), \
                redirect_stdout(stdout), redirect_stderr(stderr):
            result = observer.main()
        output = stdout.getvalue()
        self.assertEqual(stderr.getvalue(), '')
        for secret in (BEARER, URL, token(), raw.decode('utf-8', errors='replace'),
                       'HEADER_SENTINEL', 'SIGNATURE_SENTINEL', 'BODY_SENTINEL', 'ERROR_SENTINEL',
                       'EXTRA_SENTINEL', 'ARTIFACT_SENTINEL', 'STATE_SENTINEL', 'FILE_SENTINEL',
                       'DEPLOY_SENTINEL', 'NETWORK_SENTINEL', 'Traceback', 'Authorization'):
            self.assertNotIn(secret, output)
        self.assertEqual(output.count('\n'), 1)
        self.assertTrue(output.isascii())
        self.assertLessEqual(len(output.encode()), 8192)
        self.assertEqual(process.call_count, 1)
        if result:
            self.assertEqual(result, 1)
            self.assertEqual(output, 'PAUL_IDENTITY_OBSERVATION_DENIED\n')
        return result, output, network.call_count, accesses

    def test_success_has_only_allowlisted_claims_and_labeled_checkout_with_evidence_limit(self):
        result, output, count, accesses = self.invoke()
        self.assertEqual(result, 0)
        self.assertEqual(count, 1)
        self.assertEqual(output.split(' ', 1)[0], 'PAUL_IDENTITY_OBSERVATION')
        self.assertEqual(json.loads(output.split(' ', 1)[1]), {
            'claims': claims(), 'checkout_sha': SHA,
            'evidence': 'decoded-platform-observation-not-signature-or-federation-proof',
        })
        self.assertEqual(accesses.count('ACTIONS_ID_TOKEN_REQUEST_TOKEN'), 1)
        self.assertEqual(accesses.count('ACTIONS_ID_TOKEN_REQUEST_URL'), 1)
        unicode_body = json.dumps({'value': token(claims() | {'sub': 'custom:é'})}).encode()
        self.assertIn('custom:\\u00e9', self.invoke(body=unicode_body)[1])

    def test_invalid_context_or_checkout_never_even_reads_token_runtime_values(self):
        for key in context():
            with self.subTest(key=key):
                result, _, count, accesses = self.invoke(overrides={'OBS_' + key.upper(): 'wrong'})
                self.assertEqual(result, 1)
                self.assertEqual(count, 0)
                self.assertNotIn('ACTIONS_ID_TOKEN_REQUEST_TOKEN', accesses)
                self.assertNotIn('ACTIONS_ID_TOKEN_REQUEST_URL', accesses)
        for checkout in ('b' * 40 + '\n', 'ERROR_SENTINEL', SHA.upper() + '\n'):
            with self.subTest(checkout=checkout):
                result, _, count, accesses = self.invoke(checkout=checkout)
                self.assertEqual((result, count), (1, 0))
                self.assertNotIn('ACTIONS_ID_TOKEN_REQUEST_TOKEN', accesses)

    def test_failures_never_emit_partial_claims_or_sensitive_details(self):
        failures = [dict(status=401, body=b'BODY_SENTINEL'), dict(status=302, body=b'BODY_SENTINEL'),
                    dict(body=b'BODY_SENTINEL'), dict(body=b'x' * 65537),
                    dict(body=json.dumps({'value': token(claims() | {'sha': 'b' * 40})}).encode()),
                    dict(body=json.dumps({'value': token(claims() | {'sub': '::error::\nBODY_SENTINEL'})}).encode()),
                    dict(error=OSError('ERROR_SENTINEL ' + BEARER + URL)),
                    dict(error=subprocess.CalledProcessError(1, 'ERROR_SENTINEL')),
                    dict(read_error=socket.timeout('ERROR_SENTINEL')),
                    dict(overrides={'ACTIONS_ID_TOKEN_REQUEST_URL': 'https://evil.example/URL_SENTINEL'})]
        for failure in failures:
            with self.subTest(failure=list(failure)):
                self.assertEqual(self.invoke(**failure)[0], 1)

    def test_thirty_second_deadline_bounds_checkout_transport_and_slow_read(self):
        for ticks, count in (((100, 130), 0), ((100, 100, 130), 1)):
            with self.subTest(ticks=ticks):
                result, _, requests, _ = self.invoke(monotonic=ticks)
                self.assertEqual((result, requests), (1, count))
        # Mock only timer delivery: run the installed real handler during a network read.
        with patch.object(signal, 'signal', wraps=signal.signal) as install, \
                patch.object(signal, 'setitimer') as timer:
            def alarm_read(_size):
                install.call_args_list[0].args[1](signal.SIGALRM, None)
            self.assertEqual(self.invoke(read_error=alarm_read)[0], 1)
            self.assertEqual(timer.call_args_list[0].args, (signal.ITIMER_REAL, 30))
            self.assertEqual(timer.call_args_list[-1].args, (signal.ITIMER_REAL, 0))
        self.assertEqual(signal.getitimer(signal.ITIMER_REAL), (0.0, 0.0))

    def test_record_is_bounded_before_terminal_write(self):
        self.assertTrue(observer.success_record(claims(), SHA).isascii())
        with self.assertRaises(ValueError):
            observer.success_record(claims() | {'sub': 'x' * 8192}, SHA)

    def test_standalone_source_has_only_reviewed_imports_and_no_state_output_operations(self):
        source = Path(observer.__file__).read_text()
        tree = ast.parse(source)
        imports = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name for alias in node.names)
            elif isinstance(node, ast.ImportFrom):
                imports.add(node.module)
        self.assertEqual(imports, {'base64', 'json', 'math', 'os', 'pathlib', 're', 'signal',
                                  'subprocess', 'sys', 'time', 'urllib.error', 'urllib.parse', 'urllib.request'})
        for forbidden in ('GITHUB_OUTPUT', 'GITHUB_STEP_SUMMARY', 'GITHUB_ENV', 'deploy.py',
                          'boto', 'assume-role', 'urlopen(', 'write_text(', 'write_bytes(',
                          'os.system', 'os.environ[', 'open(', 'setdefault(', 'print(token'):
            if forbidden == 'open(':
                self.assertEqual(source.count('open('), 1)  # Only the bounded HTTPS opener.
            else:
                self.assertNotIn(forbidden, source)


if __name__ == '__main__':
    unittest.main()
