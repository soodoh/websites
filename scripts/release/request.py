"""Generate immutable request from trusted job outputs/event, never selected-source scripts."""
import json
import os
from pathlib import Path
import re
import sys

site, operation = sys.argv[1:3]
if site not in ('paul', 'diloreto', 'carolyn', 'sarabeth'):
    raise ValueError('Unknown site')
if operation == 'restore':
    selected = json.loads(os.environ['RESTORE_RELEASE'])
    if selected.get('site') != site:
        raise ValueError('Cross-site restoration')
elif os.environ['GITHUB_EVENT_NAME'] == 'workflow_run':
    event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())['workflow_run']
    selected = dict(repository='soodoh/websites', site=site, commit=event['head_sha'], workflow='.github/workflows/ci.yml', runId=str(event['id']), runAttempt=str(event['run_attempt']))
else:
    selected = dict(repository='soodoh/websites', site=site, commit=os.environ['TARGET_SHA'], workflow=os.environ['GITHUB_WORKFLOW_REF'].removeprefix('soodoh/websites/').split('@')[0], workflowSha=os.environ['GITHUB_WORKFLOW_SHA'], runId=os.environ['GITHUB_RUN_ID'], runAttempt=os.environ['GITHUB_RUN_ATTEMPT'])
if not re.fullmatch(r'[0-9a-f]{40}', selected['commit']):
    raise ValueError('Invalid selected commit')
for key in ('runId', 'runAttempt'):
    if not re.fullmatch(r'[1-9][0-9]*', selected[key]):
        raise ValueError('Invalid selected run/attempt')
Path(sys.argv[3]).write_text(json.dumps(selected))
