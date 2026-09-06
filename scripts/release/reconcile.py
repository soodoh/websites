"""Conservative queued-work inventory; never dispatches, authorizes or advances state."""
from datetime import date
import json
import re
from pathlib import Path
import sys
from urllib.parse import quote

from static import gh, require

ENTRY_WORKFLOWS = {f'.github/workflows/{name}.yml' for name in ('release-after-ci', 'release-site', 'redeploy-diloreto', 'restore-static')}


def collect(policy, runtime, since, api=gh):
    date.fromisoformat(since)
    result = dict(schemaVersion=1, since=since, complete=False, scope='At most 1000 runs/workflow and 10 attempts/run, created since supplied date', affectedSite='unknown', possibleSites=['paul', 'diloreto', 'carolyn', 'sarabeth'], work=[], automaticRetry=False,
                  recoveryActions=[f'release-site(site={site}, ref=main)' for site in ('paul', 'diloreto', 'carolyn', 'sarabeth')])
    try:
        workflows = runtime.get('entryWorkflowIds', {})
        require(set(workflows) == ENTRY_WORKFLOWS, 'Incomplete workflow inventory configuration')
        require(all(isinstance(value, str) and re.fullmatch(r'[1-9][0-9]*', value) for value in (policy.get('repositoryId'), policy.get('ownerId'), *workflows.values())) and len(set(workflows.values())) == len(ENTRY_WORKFLOWS), 'Unconfigured inventory')
        repository = api('repos/soodoh/websites')
        require(str(repository['id']) == policy['repositoryId'] and str(repository['owner']['id']) == policy['ownerId'], 'Untrusted repository')
        for workflow, workflow_id in runtime['entryWorkflowIds'].items():
            require(workflow_id, 'Unconfigured workflow ID')
            for page in range(1, 11):
                runs = api(f'repos/soodoh/websites/actions/workflows/{workflow_id}/runs?branch=main&created={quote(">=" + since)}&per_page=100&page={page}')['workflow_runs']
                for run in runs:
                    require(str(run['workflow_id']) == workflow_id and run['path'] == workflow and run['head_repository']['full_name'] == 'soodoh/websites' and run['head_branch'] == 'main' and run['event'] in ('workflow_run', 'workflow_dispatch'), 'Unexpected inventory identity')
                    require(1 <= run['run_attempt'] <= 10, 'Attempt pagination limit exceeded')
                    for attempt in range(1, run['run_attempt'] + 1):
                        observation = api(f"repos/soodoh/websites/actions/runs/{run['id']}/attempts/{attempt}")
                        require(observation['id'] == run['id'] and observation['run_attempt'] == attempt and observation['workflow_id'] == run['workflow_id'] and observation['event'] == run['event'] and observation['head_branch'] == 'main', 'Wrong attempt inventory')
                        jobs = []
                        for job_page in range(1, 11):
                            batch = api(f"repos/soodoh/websites/actions/runs/{run['id']}/attempts/{attempt}/jobs?per_page=100&page={job_page}")['jobs']
                            jobs.extend(batch)
                            if len(batch) < 100:
                                break
                        else:
                            raise ValueError('Job pagination limit exceeded')
                        incomplete = [dict(id=str(job['id']), status=job['status'], conclusion=job['conclusion']) for job in jobs if job['status'] != 'completed' or job['conclusion'] != 'success']
                        if incomplete or observation['status'] != 'completed' or observation['conclusion'] != 'success':
                            result['work'].append(dict(workflow=workflow, repository='soodoh/websites', runId=str(run['id']), runAttempt=str(attempt), event=run['event'], branch='main', status=observation['status'], conclusion=observation['conclusion'], jobs=incomplete, affectedSite='unknown'))
                if len(runs) < 100:
                    break
            else:
                raise ValueError('Run pagination limit exceeded')
        result['complete'] = True
    except Exception:
        result['error'] = 'Inventory incomplete: missing configuration, API/permission/identity or pagination failure; not evidence of no stranded work'
    return result


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[2]
    result = collect(json.loads((root / 'config/release-policy.json').read_text()), json.loads((root / 'config/release-runtime.json').read_text()), sys.argv[1])
    print(json.dumps(result, indent=2))
    sys.exit(0 if result['complete'] else 1)
