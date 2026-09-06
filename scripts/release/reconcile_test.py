import unittest
from unittest.mock import MagicMock
from reconcile import collect


class ReconciliationTests(unittest.TestCase):
    def test_successful_overall_run_cannot_hide_unsuccessful_attempt_jobs_or_infer_site(self):
        run = dict(id=10, run_attempt=1, workflow_id=3, path='.github/workflows/release-site.yml', head_repository={'full_name': 'soodoh/websites'}, head_branch='main', event='workflow_dispatch', status='completed', conclusion='success')
        def api(path):
            if path == 'repos/soodoh/websites':
                return {'id': 1, 'owner': {'id': 2}}
            if '/jobs?' in path:
                return {'jobs': [{'id': 4, 'status': 'completed', 'conclusion': 'skipped'}]}
            if '/attempts/' in path:
                return run
            return {'workflow_runs': [run]}
        report = collect({'repositoryId': '1', 'ownerId': '2'}, {'entryWorkflowIds': {run['path']: '3'}}, '2026-09-01', api)
        self.assertTrue(report['complete'])
        self.assertEqual(len(report['work']), 1)
        self.assertEqual(report['affectedSite'], 'unknown')
        self.assertEqual(report['work'][0]['affectedSite'], 'unknown')
        self.assertEqual(len(report['recoveryActions']), 4)
        self.assertFalse(report['automaticRetry'])
        report = collect({'repositoryId': '1', 'ownerId': '2'}, {'entryWorkflowIds': {run['path']: '3'}}, '2026-09-01', MagicMock(side_effect=RuntimeError('denied')))
        self.assertFalse(report['complete'])
        self.assertIn('Inventory incomplete', report['error'])

    def test_missing_ids_stop_without_api_or_false_empty_inventory(self):
        api = MagicMock()
        report = collect({'repositoryId': None, 'ownerId': None}, {'entryWorkflowIds': {'release-site': None}}, '2026-09-01', api)
        api.assert_not_called()
        self.assertFalse(report['complete'])


if __name__ == '__main__':
    unittest.main()
