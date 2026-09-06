import unittest
from unittest.mock import MagicMock
from reconcile import collect, ENTRY_WORKFLOWS


class ReconciliationTests(unittest.TestCase):
    def fixture(self):
        workflows = {name: str(index + 3) for index, name in enumerate(sorted(ENTRY_WORKFLOWS))}
        runtime = {'entryWorkflowIds': workflows}
        run = dict(id=10, run_attempt=1, workflow_id=int(workflows['.github/workflows/release-site.yml']), path='.github/workflows/release-site.yml', head_repository={'full_name': 'soodoh/websites'}, head_branch='main', event='workflow_dispatch', status='completed', conclusion='success')
        return runtime, run

    def api(self, runtime, runs):
        def request(path):
            if path == 'repos/soodoh/websites':
                return {'id': 1, 'owner': {'id': 2}}
            if '/jobs?' in path:
                return {'jobs': [{'id': 4, 'status': 'completed', 'conclusion': 'skipped'}]}
            if '/attempts/' in path:
                return next(run for run in runs if f"/runs/{run['id']}/" in path)
            return {'workflow_runs': [run for run in runs if f"/workflows/{run['workflow_id']}/" in path]}
        return request

    def test_successful_overall_run_cannot_hide_unsuccessful_attempt_jobs_or_infer_site(self):
        runtime, run = self.fixture()
        report = collect({'repositoryId': '1', 'ownerId': '2'}, runtime, '2026-09-01', self.api(runtime, [run]))
        self.assertTrue(report['complete'])
        self.assertEqual(len(report['work']), 1)
        self.assertEqual(report['affectedSite'], 'unknown')
        self.assertEqual(report['work'][0]['affectedSite'], 'unknown')
        self.assertEqual(len(report['recoveryActions']), 4)
        self.assertFalse(report['automaticRetry'])
        report = collect({'repositoryId': '1', 'ownerId': '2'}, runtime, '2026-09-01', MagicMock(side_effect=RuntimeError('denied')))
        self.assertFalse(report['complete'])
        self.assertIn('Inventory incomplete', report['error'])

    def test_terminal_snapshot_finds_replacement_and_failure_after_initial_ci_inventory(self):
        runtime, run = self.fixture()
        policy = {'repositoryId': '1', 'ownerId': '2'}
        initial = collect(policy, runtime, '2026-09-01', self.api(runtime, []))
        self.assertTrue(initial['complete'])
        self.assertEqual(initial['work'], [])
        replaced = {**run, 'conclusion': 'cancelled'}
        failed = {**run, 'id': 11, 'path': '.github/workflows/restore-static.yml', 'workflow_id': int(runtime['entryWorkflowIds']['.github/workflows/restore-static.yml']), 'conclusion': 'failure'}
        terminal = collect(policy, runtime, '2026-09-01', self.api(runtime, [replaced, failed]))
        self.assertTrue(terminal['complete'])
        self.assertEqual({(item['runId'], item['conclusion']) for item in terminal['work']}, {('10', 'cancelled'), ('11', 'failure')})
        self.assertIn('release-site(site=diloreto, ref=main)', terminal['recoveryActions'])

    def test_missing_empty_partial_invalid_or_duplicate_ids_stop_before_api(self):
        runtime, _ = self.fixture()
        for workflows in ({}, {'release-site': None}, {'.github/workflows/release-site.yml': '3'}, {name: None for name in ENTRY_WORKFLOWS}, {name: '3' for name in ENTRY_WORKFLOWS}, {**runtime['entryWorkflowIds'], 'unexpected': '99'}):
            api = MagicMock()
            report = collect({'repositoryId': '1', 'ownerId': '2'}, {'entryWorkflowIds': workflows}, '2026-09-01', api)
            api.assert_not_called()
            self.assertFalse(report['complete'])
        api = MagicMock()
        self.assertFalse(collect({'repositoryId': None, 'ownerId': None}, runtime, '2026-09-01', api)['complete'])
        api.assert_not_called()


if __name__ == '__main__':
    unittest.main()
