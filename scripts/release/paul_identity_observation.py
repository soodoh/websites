"""Decoded GitHub platform observation, not signature verification or federation proof.

Standalone from release adapters. Publication and protected execution need separate approval.
"""
import base64
import json
import math
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


IDENTITY = dict(
    repository='soodoh/websites', repository_id='1358469291',
    repository_owner='soodoh', repository_owner_id='18269267',
    environment='production-portfolio', event_name='workflow_dispatch',
    ref='refs/heads/main',
    workflow_ref='soodoh/websites/.github/workflows/paul-identity-observation.yml@refs/heads/main',
    run_attempt='1',
)
CONTEXT_FIELDS = (*IDENTITY, 'workflow_sha', 'sha', 'run_id')


def require(condition):
    if not condition:
        raise ValueError('Observation denied')


def validate_context(context, checkout_sha):
    require(all(type(context.get(key)) is str and context[key] == value
                for key, value in IDENTITY.items()))
    require(type(checkout_sha) is str and re.fullmatch(r'[0-9a-f]{40}', checkout_sha))
    require(context.get('sha') == context.get('workflow_sha') == checkout_sha)
    run = context.get('run_id')
    require(type(run) is str and re.fullmatch(r'[1-9][0-9]{0,127}', run))
    return {key: context[key] for key in CONTEXT_FIELDS}


def strict_json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            require(key not in result)
            result[key] = value
        return result

    def finite(value):
        number = float(value)
        require(math.isfinite(number))
        return number

    def invalid(_value):
        raise ValueError('Observation denied')

    return json.loads(raw.decode('utf-8'), object_pairs_hook=pairs,
                      parse_constant=invalid, parse_float=finite)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    # Reject before urllib examines Location, including absent/empty headers.
    def http_error_302(self, req, fp, code, msg, headers):
        fp.close()
        raise ValueError('Observation denied')

    http_error_301 = http_error_303 = http_error_307 = http_error_308 = http_error_302


def request_token(environment):
    raw_url = environment.get('ACTIONS_ID_TOKEN_REQUEST_URL')
    require(type(raw_url) is str and 0 < len(raw_url) <= 16384)
    require(all(33 <= ord(c) <= 126 and c not in '\\#' for c in raw_url))
    require(not re.search(r'%(?![0-9A-Fa-f]{2})', raw_url))
    url = urllib.parse.urlsplit(raw_url)
    require(url.scheme == 'https' and url.port in (None, 443))
    require(re.fullmatch(r'(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+'
                         r'actions\.githubusercontent\.com(?::443)?', url.netloc))
    query = urllib.parse.parse_qsl(url.query, keep_blank_values=True, strict_parsing=True, errors='strict')
    require(len({key for key, _ in query}) == len(query))
    for key, value in query:
        require(key and all(c.isprintable() and not c.isspace() for c in key + value))
    query = [(key, value) for key, value in query if key != 'audience']
    query.append(('audience', 'sts.amazonaws.com'))
    bearer = environment.get('ACTIONS_ID_TOKEN_REQUEST_TOKEN')
    require(type(bearer) is str and 0 < len(bearer) <= 16384
            and all(33 <= ord(c) <= 126 for c in bearer))
    request = urllib.request.Request(
        urllib.parse.urlunsplit(url._replace(query=urllib.parse.urlencode(query))),
        headers={'Authorization': 'Bearer ' + bearer}, method='GET')
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    try:
        with opener.open(request, timeout=10) as response:
            require(response.status == 200)
            raw = response.read(65537)
            require(len(raw) <= 65536)
        body = strict_json(raw)
        require(type(body) is dict)
        token = body.get('value')
        require(type(token) is str and 0 < len(token) <= 16384)
        return token
    except urllib.error.HTTPError as error:
        error.close()
        raise ValueError('Observation denied') from None
    except Exception:
        raise ValueError('Observation denied') from None


def project_claims(token, context, now):
    require(type(token) is str and 0 < len(token) <= 16384)
    parts = token.split('.')
    require(len(parts) == 3)
    decoded = []
    for part in parts:
        require(re.fullmatch(r'[A-Za-z0-9_-]+', part) and len(part) % 4 != 1)
        raw = base64.b64decode(part + '=' * (-len(part) % 4), altchars=b'-_', validate=True)
        require(base64.urlsafe_b64encode(raw).decode().rstrip('=') == part)
        decoded.append(raw)
    require(type(strict_json(decoded[0])) is dict)
    claims = strict_json(decoded[1])
    require(type(claims) is dict)
    for key, value in context.items():
        require(type(claims.get(key)) is str and claims[key] == value)
    require(claims.get('iss') == 'https://token.actions.githubusercontent.com')
    require(claims.get('aud') == 'sts.amazonaws.com')
    subject = claims.get('sub')
    require(type(subject) is str and 0 < len(subject.encode('utf-8')) <= 1024)
    require(all(c.isprintable() and not c.isspace() and c not in '*?' for c in subject))
    for key in ('iat', 'nbf', 'exp'):
        value = claims.get(key)
        require(type(value) in (int, float) and math.isfinite(value) and value >= 0)
    require(math.isfinite(now) and claims['iat'] <= now < claims['exp']
            and claims['nbf'] <= now < claims['exp'])
    return {key: claims[key] for key in ('iss', 'sub', 'aud', *CONTEXT_FIELDS, 'iat', 'nbf', 'exp')}


def success_record(claims, checkout_sha):
    record = 'PAUL_IDENTITY_OBSERVATION ' + json.dumps(dict(
        claims=claims, checkout_sha=checkout_sha,
        evidence='decoded-platform-observation-not-signature-or-federation-proof',
    ), ensure_ascii=True, allow_nan=False, separators=(',', ':')) + '\n'
    require(len(record.encode('ascii')) <= 8192)
    return record


def main():
    def expired(_signum, _frame):
        raise TimeoutError('Observation denied')

    try:
        previous = signal.signal(signal.SIGALRM, expired)
        try:
            # POSIX timer also interrupts a trickling response/DNS wait; socket timeout alone cannot.
            signal.setitimer(signal.ITIMER_REAL, 30)
            deadline = time.monotonic() + 30
            context = {key: os.environ.get('OBS_' + key.upper()) for key in CONTEXT_FIELDS}
            checkout = subprocess.run(
                ['git', '-c', 'core.fsmonitor=false', 'rev-parse', '--verify', 'HEAD'],
                cwd=Path(__file__).resolve().parents[2], capture_output=True,
                text=True, timeout=10, check=True,
            ).stdout
            require(re.fullmatch(r'[0-9a-f]{40}\n', checkout))
            checkout_sha = checkout[:-1]
            context = validate_context(context, checkout_sha)
            require(time.monotonic() < deadline)
            # Runtime URL/bearer are not accessed until actual checkout/context admission succeeds.
            claims = project_claims(request_token(os.environ), context, time.time())
            record = success_record(claims, checkout_sha)
            require(time.monotonic() < deadline)
        finally:
            signal.setitimer(signal.ITIMER_REAL, 0)
            signal.signal(signal.SIGALRM, previous)
    except (Exception, KeyboardInterrupt):
        sys.stdout.write('PAUL_IDENTITY_OBSERVATION_DENIED\n')
        return 1
    sys.stdout.write(record)
    return 0


if __name__ == '__main__':
    sys.exit(main())
