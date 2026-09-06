import copy
import unittest
from unittest.mock import patch
import static


class ProvenanceTests(unittest.TestCase):
    def test_attempt_specific_jobs_not_downloaded_flags_control_provenance(self):
        release = dict(repository='soodoh/websites', site='paul', commit='a' * 40, workflow='.github/workflows/ci.yml', runId='10', runAttempt='2')
        policy = dict(repositoryId='1', ownerId='2', validationWorkflowIds={'.github/workflows/ci.yml': '3'})
        run = dict(id=10, run_attempt=2, head_repository={'full_name': 'soodoh/websites', 'id': 1}, workflow_id=3, path=release['workflow'], head_branch='main', event='push', head_sha=release['commit'], status='completed')
        jobs = [dict(name=name, status='completed', conclusion='success') for name in ('root', 'paul / paul fixture verification')]
        paths = []
        def api(path):
            paths.append(path)
            if path == 'repos/soodoh/websites':
                return {'id': 1, 'owner': {'id': 2}}
            if '/jobs?' in path:
                return {'jobs': jobs}
            return run
        with patch.object(static, 'gh', side_effect=api):
            static.observe(policy, 'paul', release)
            self.assertTrue(any('/attempts/2/jobs?' in path for path in paths))
            for key, value in [('id', 11), ('run_attempt', 1), ('head_repository', {'full_name': 'fork/websites', 'id': 1}), ('workflow_id', 4), ('path', '.github/workflows/other.yml'), ('head_branch', 'feature'), ('event', 'pull_request'), ('head_sha', 'b' * 40), ('status', 'in_progress')]:
                before = run[key]
                run[key] = value
                with self.assertRaises(ValueError):
                    static.observe(policy, 'paul', release)
                run[key] = before
            for conclusion in ('failure', 'cancelled', 'skipped', None):
                jobs[1]['conclusion'] = conclusion
                with self.assertRaises(ValueError):
                    static.observe(policy, 'paul', release)
            jobs[1]['conclusion'] = 'success'
            jobs.append(copy.deepcopy(jobs[1]))
            with self.assertRaises(ValueError):
                static.observe(policy, 'paul', release)
        with patch.object(static, 'gh') as api:
            with self.assertRaises(ValueError):
                static.observe(policy, 'paul', {**release, 'repository': 'evil/arbitrary'})
            api.assert_not_called()


if __name__ == '__main__':
    unittest.main()
