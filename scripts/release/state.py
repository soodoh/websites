"""Conditional S3 state storage. Importing this module makes no AWS requests."""
import copy
import json
from pathlib import Path
import re
import subprocess
import tempfile


def require(value, message):
    if not value:
        raise ValueError(message)


class UnknownOutcome(RuntimeError):
    """No further release/rollback mutation until explicit reconciliation."""


class StateOwnershipError(UnknownOutcome):
    """CAS conflict or ambiguous persistence; never rebase onto another ETag."""


class Aws:
    def __init__(self, region):
        self.region = region

    def call(self, service, operation, **values):
        args = ['aws', '--region', self.region, '--no-cli-pager', service, operation]
        for key, value in values.items():
            if value is False:
                continue
            flag = '--' + key.replace('_', '-')
            args.extend([flag] if value is True else [flag, str(value)])
        # Never emit raw service errors: upload URLs and response metadata can be sensitive.
        result = subprocess.run(args + ['--output', 'json'], capture_output=True, check=False)
        if result.returncode:
            raise UnknownOutcome(f'{service} {operation} failed; STOP and reconcile, no unconditional retry')
        return json.loads(result.stdout or '{}')

    def get_object(self, bucket, key, owner, destination, version_id=None):
        versions = []
        if version_id is not None:
            require(isinstance(version_id, str) and version_id and version_id != 'null', 'Missing immutable object version')
            versions = ['--version-id', version_id]
        result = subprocess.run(['aws', '--region', self.region, '--no-cli-pager', 's3api', 'get-object', '--bucket', bucket, '--key', key, '--expected-bucket-owner', owner, *versions, str(destination), '--output', 'json'], capture_output=True)
        require(result.returncode == 0, 'State/recovery object unavailable; approved bootstrap or reconciliation required')
        return json.loads(result.stdout)

    def check_conditional_support(self):
        # Local service-model introspection; no network or credentials are used by skeleton generation.
        result = subprocess.run(['aws', 's3api', 'put-object', '--generate-cli-skeleton', 'input'], capture_output=True, check=True)
        skeleton = json.loads(result.stdout)
        require({'IfMatch', 'IfNoneMatch', 'ExpectedBucketOwner'}.issubset(skeleton), 'Installed CLI lacks required conditional S3 support')


class State:
    def __init__(self, aws, config, site):
        self.aws, self.config, self.site = aws, config, site
        for key in ('stateBucket', 'stateKey', 'stateOwner'):
            require(isinstance(config.get(key), str) and config[key], f'Missing {key}')
        require(re.fullmatch(r'\d{12}', config['stateOwner']), 'Invalid bucket owner')
        self.etag = None
        self.value = None

    def bootstrap(self, proposed):
        """Create only; caller validates approved source/baseline before this storage boundary."""
        require(self.value is None and self.etag is None, 'Bootstrap cannot reset read state')
        require(proposed.get('schemaVersion') == 1 and proposed.get('repository') == 'soodoh/websites'
                and proposed.get('site') == self.site, 'Wrong bootstrap identity')
        require(type(proposed.get('generation')) is int and proposed['generation'] == 0
                and 'intent' in proposed and proposed['intent'] is None, 'Wrong bootstrap generation/intent')
        require(re.fullmatch(r'[0-9a-f]{40}', proposed.get('highWatermark', ''))
                and isinstance(proposed.get('currentRelease'), dict) and proposed['currentRelease'], 'Missing bootstrap baseline')
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'state.json'
            body = json.dumps(proposed, sort_keys=True).encode()
            path.write_bytes(body)
            try:
                result = self.aws.call('s3api', 'put-object', bucket=self.config['stateBucket'],
                                       key=self.config['stateKey'], expected_bucket_owner=self.config['stateOwner'],
                                       if_none_match='*', server_side_encryption='AES256', body=str(path))
                require(isinstance(result.get('ETag'), str) and result['ETag'], 'Missing create ETag')
                metadata = self.aws.get_object(self.config['stateBucket'], self.config['stateKey'], self.config['stateOwner'], path)
                require(metadata.get('ETag') == result['ETag'] and metadata.get('ServerSideEncryption') == 'AES256'
                        and path.read_bytes() == body, 'Bootstrap readback mismatch')
            except Exception as error:
                raise StateOwnershipError('Bootstrap conflict/unknown outcome; STOP, never reset or retry') from error
        self.value, self.etag = copy.deepcopy(proposed), result['ETag']
        self.encryption, self.kms_key = 'AES256', None
        return copy.deepcopy(proposed)

    def read(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'state.json'
            meta = self.aws.get_object(self.config['stateBucket'], self.config['stateKey'], self.config['stateOwner'], path)
            state = json.loads(path.read_text())
        require(state.get('schemaVersion') == 1 and state.get('repository') == 'soodoh/websites' and state.get('site') == self.site, 'Wrong state identity')
        require(re.fullmatch(r'[0-9a-f]{40}', state.get('highWatermark', '')), 'Missing monorepo high-watermark')
        require(isinstance(state.get('currentRelease'), dict) and state['currentRelease'], 'Missing retained current release')
        require('intent' in state and isinstance(state.get('generation'), int) and state['generation'] >= 0, 'Malformed state generation/intent')
        require(isinstance(meta.get('ETag'), str) and meta['ETag'], 'Missing observed ETag')
        require(meta.get('ServerSideEncryption') in ('AES256', 'aws:kms'), 'Unencrypted state is not accepted')
        self.encryption = meta['ServerSideEncryption']
        self.kms_key = meta.get('SSEKMSKeyId')
        require(self.encryption != 'aws:kms' or self.kms_key, 'Missing state encryption key')
        self.value, self.etag = state, meta['ETag']
        return copy.deepcopy(state)

    def write(self, proposed):
        require(self.etag and self.value, 'State must be read before CAS')
        require(proposed['generation'] == self.value['generation'] + 1, 'Invalid state generation')
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'state.json'
            path.write_text(json.dumps(proposed))
            options = dict(bucket=self.config['stateBucket'], key=self.config['stateKey'], expected_bucket_owner=self.config['stateOwner'], if_match=self.etag, body=str(path), server_side_encryption=self.encryption)
            if self.kms_key:
                options['ssekms_key_id'] = self.kms_key
            # 409, 412, denied or ambiguous writes all STOP. Never reread and rebase this proposal.
            try:
                result = self.aws.call('s3api', 'put-object', **options)
            except Exception as error:
                raise StateOwnershipError('State CAS failed; reread and reconcile, never retry stale proposal') from error
        if not result.get('ETag'):
            raise StateOwnershipError('Ambiguous state write; reconcile before another mutation')
        self.value, self.etag = copy.deepcopy(proposed), result['ETag']

    def assert_owned(self):
        # Observe without adopting a newer ETag. A stale owner can never rebase.
        observed = State(self.aws, self.config, self.site)
        observed.read()
        if observed.etag != self.etag or observed.value != self.value:
            raise StateOwnershipError('State ownership changed; STOP and reconcile')

    def checkpoint(self, phase):
        self.assert_owned()
        proposed = copy.deepcopy(self.value)
        require(proposed['intent'] is not None, 'Missing owned intent')
        proposed['generation'] += 1
        proposed['intent']['phase'] = phase
        self.write(proposed)

    def finish_candidate(self, release, domain, hosting, production_ref=None):
        from receipt import lifecycle_receipt
        self.assert_owned()
        proposed = copy.deepcopy(self.value)
        require(proposed['intent']['operation'] == 'candidate', 'Not candidate intent')
        proposed['generation'] += 1
        proposed['acceptedCandidate'] = dict(
            release=release, domain=domain, hosting=hosting, generation=proposed['generation'],
            previousProduction={key: copy.deepcopy(proposed.get(key)) for key in ('currentRelease', 'highWatermark', 'lastLifecycleReceipt', 'ssrProductionAccepted')},
            receipt=lifecycle_receipt(self.site, proposed['intent'], release, 'accepted'))
        if self.site == 'carolyn':
            require(re.fullmatch(r'[0-9a-f]{40}', production_ref or ''), 'Missing previous production ref')
            proposed['acceptedCandidate']['productionRef'] = production_ref
        proposed['intent'] = None
        self.write(proposed)

    def finish_carolyn_promotion(self, release):
        from receipt import lifecycle_receipt
        self.assert_owned()
        proposed = copy.deepcopy(self.value)
        intent = proposed['intent']
        require(self.site == 'carolyn' and intent['operation'] == 'promote'
                and intent.get('phase') == 'production-verified', 'Unverified Carolyn promotion')
        candidate = proposed['acceptedCandidate']
        require(candidate['release']['commit'] == release['commit'], 'Candidate/promotion SHA mismatch')
        proposed['lastLifecycleReceipt'] = lifecycle_receipt(self.site, intent, release, 'accepted')
        proposed['lastSsrCutover'] = proposed.pop('acceptedCandidate')
        proposed.update(currentRelease=release, highWatermark=release['commit'], ssrProductionAccepted=True,
                        intent=None, generation=proposed['generation'] + 1)
        self.write(proposed)

    def claim(self, release, operation, invocation, baseline=None):
        require(self.value is not None and self.value['intent'] is None, 'Unresolved release intent; reconcile active jobs and serving bytes first')
        proposed = copy.deepcopy(self.value)
        proposed['generation'] += 1
        proposed['intent'] = dict(release=release, operation=operation, invocation=invocation, jobs=[], baseline=baseline)
        self.write(proposed)

    def job(self, branch, job_id):
        proposed = copy.deepcopy(self.value)
        require(proposed['intent'] is not None, 'Missing owned intent')
        proposed['generation'] += 1
        proposed['intent']['jobs'].append(dict(branch=branch, jobId=job_id))
        self.write(proposed)

    def finish(self, current, high_watermark, outcome='accepted', ssr_cutover=False):
        from receipt import lifecycle_receipt
        proposed = copy.deepcopy(self.value)
        require(proposed['intent'] is not None, 'Missing owned intent')
        # Receipt and serving state commit in the SAME CAS that clears intent. A lost
        # CAS never fabricates completion; unresolved jobs remain in the prior intent.
        proposed['lastLifecycleReceipt'] = lifecycle_receipt(self.site, proposed['intent'], current, outcome)
        if ssr_cutover:
            require(proposed['intent']['operation'] == 'switch' and proposed['intent'].get('phase') == 'lkg-written', 'Unverified SSR switch')
            proposed['lastSsrCutover'] = proposed.pop('acceptedCandidate')
            proposed['ssrProductionAccepted'] = True
        proposed.update(currentRelease=current, highWatermark=high_watermark, intent=None, generation=proposed['generation'] + 1)
        self.write(proposed)
