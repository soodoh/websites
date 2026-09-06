"""Observe claims directly from GitHub's TLS OIDC endpoint before role assumption.

The AWS action subsequently requests its own token with the same immutable job subject
and explicit audience. Tokens are never persisted, returned, or printed here; IAM/STS
still verifies the signature and exact trust on the token used for assumption.
"""
import base64
import json
import os
import re
import time
import urllib.parse
import urllib.request

from state import require


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('OIDC redirects are forbidden')


def observe_subject(expected, environment=None, open_url=None, now=None):
    environment = os.environ if environment is None else environment
    require(isinstance(expected, str) and expected and not re.search(r'[\s*?]', expected), 'Missing/unsafe expected OIDC subject')
    url = urllib.parse.urlsplit(environment.get('ACTIONS_ID_TOKEN_REQUEST_URL', ''))
    require(url.scheme == 'https' and url.hostname and url.hostname.endswith('.actions.githubusercontent.com') and not url.username and not url.password and url.port in (None, 443) and not url.fragment, 'Untrusted OIDC endpoint')
    bearer = environment.get('ACTIONS_ID_TOKEN_REQUEST_TOKEN')
    require(bearer, 'Missing OIDC request authorization')
    query = [(k, v) for k, v in urllib.parse.parse_qsl(url.query) if k != 'audience']
    query.append(('audience', 'sts.amazonaws.com'))
    request = urllib.request.Request(urllib.parse.urlunsplit(url._replace(query=urllib.parse.urlencode(query))), headers={'Authorization': 'Bearer ' + bearer})
    open_url = open_url or urllib.request.build_opener(NoRedirect()).open
    try:
        with open_url(request, timeout=30) as response:
            require(response.status == 200, 'OIDC observation unavailable')
            token = json.loads(response.read())['value']
        parts = token.split('.')
        require(len(parts) == 3, 'Invalid OIDC token')
        claims = json.loads(base64.urlsafe_b64decode(parts[1] + '=' * (-len(parts[1]) % 4)))
        current = time.time() if now is None else now
        require(claims.get('iss') == 'https://token.actions.githubusercontent.com' and claims.get('sub') == expected and claims.get('aud') == 'sts.amazonaws.com', 'OIDC subject/audience mismatch')
        require(claims['nbf'] <= current < claims['exp'], 'OIDC token not current')
    except Exception:
        raise ValueError('OIDC observation denied; no credentials may be assumed') from None


if __name__ == '__main__':
    observe_subject(os.environ.get('EXPECTED_SUBJECT'))
