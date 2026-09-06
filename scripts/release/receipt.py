"""Allowlisted, scanned completion evidence retained with serving state, not upload URLs."""
import json
import re

import artifact
from state import require


def lifecycle_receipt(site, intent, current, outcome):
    require(outcome in ('accepted', 'restored-previous'), 'Invalid lifecycle outcome')
    fields = ('repository', 'site', 'workflow', 'workflowSha', 'commit', 'runId', 'runAttempt', 'sha256', 'amplifyJobId')
    identity = lambda release: {key: release[key] for key in fields if key in release}
    jobs = []
    for job in intent['jobs']:
        require(all(isinstance(job.get(k), str) and re.fullmatch(r'[A-Za-z0-9_-]+', job[k]) for k in ('branch', 'jobId')), 'Invalid job receipt identity')
        jobs.append({key: job[key] for key in ('branch', 'jobId')})
    receipt = dict(schemaVersion=1, site=site, invocation=intent['invocation'], operation=intent['operation'], requestedRelease=identity(intent['release']), servingRelease=identity(current), jobs=jobs, outcome=outcome, servingAcceptance='passed', candidateAcceptance='passed' if site == 'paul' else 'not-applicable', restoration='passed' if outcome == 'restored-previous' else 'not-required')
    artifact.ci.scan('lifecycle-receipt.json', json.dumps(receipt).encode())
    return receipt
