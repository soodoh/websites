import base64
import json
import unittest
from unittest.mock import MagicMock

from oidc import observe_subject


class OidcTests(unittest.TestCase):
    def test_trusted_endpoint_claim_observation_denies_wrong_missing_or_expired_claims(self):
        expected = 'fixture-exact-subject'
        good = dict(iss='https://token.actions.githubusercontent.com', sub=expected, aud='sts.amazonaws.com', nbf=10, exp=30)
        environment = dict(ACTIONS_ID_TOKEN_REQUEST_URL='https://fixture.actions.githubusercontent.com/oidc?api-version=2&audience=wrong', ACTIONS_ID_TOKEN_REQUEST_TOKEN='fixture-request-bearer')
        for change in ({}, {'sub': 'other'}, {'sub': None}, {'aud': 'other'}, {'aud': None}, {'aud': ['sts.amazonaws.com']}, {'iss': 'https://evil.invalid'}, {'exp': 20}, {'nbf': 21}):
            claims = {**good, **change}
            token = 'header.' + base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip('=') + '.signature'
            response = MagicMock()
            response.__enter__.return_value.status = 200
            response.__enter__.return_value.read.return_value = json.dumps({'value': token}).encode()
            opener = MagicMock(return_value=response)
            if change:
                with self.assertRaisesRegex(ValueError, 'OIDC observation denied') as caught:
                    observe_subject(expected, environment, opener, now=20)
                self.assertNotIn(token, str(caught.exception))
            else:
                self.assertIsNone(observe_subject(expected, environment, opener, now=20))
            request = opener.call_args.args[0]
            self.assertIn('audience=sts.amazonaws.com', request.full_url)
            self.assertNotIn('audience=wrong', request.full_url)
            self.assertEqual(request.headers['Authorization'], 'Bearer fixture-request-bearer')

    def test_untrusted_or_missing_endpoint_or_subject_never_requests_token(self):
        for subject, url in ((None, 'https://fixture.actions.githubusercontent.com'), ('*', 'https://fixture.actions.githubusercontent.com'), ('fixture', ''), ('fixture', 'https://evil.invalid'), ('fixture', 'https://fixture.actions.githubusercontent.com.evil.invalid'), ('fixture', 'http://fixture.actions.githubusercontent.com'), ('fixture', 'https://user@fixture.actions.githubusercontent.com')):
            opener = MagicMock()
            with self.assertRaises(ValueError):
                observe_subject(subject, {'ACTIONS_ID_TOKEN_REQUEST_URL': url, 'ACTIONS_ID_TOKEN_REQUEST_TOKEN': 'fixture'}, opener)
            opener.assert_not_called()


if __name__ == '__main__':
    unittest.main()
