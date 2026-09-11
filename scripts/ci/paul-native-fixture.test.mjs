import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const workflow = Bun.YAML.parse(read('.github/workflows/paul-native-fixture.yml'));
const expected = {
  name: 'Paul native fixture diagnostic (HELD)',
  on: { workflow_dispatch: null },
  permissions: { contents: 'read' },
  jobs: { diagnostic: {
    if: '${{ false }}',
    name: 'Held Linux amd64 full guarded fixture',
    'runs-on': 'ubuntu-24.04',
    'timeout-minutes': 45,
    steps: [
      { uses: 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1', with: {
        ref: '${{ github.sha }}', 'persist-credentials': false,
      } },
      { name: 'Assert manual main checkout and native runner before setup',
        run: 'python3 -I -B scripts/ci/paul_native_fixture.py preflight' },
      { uses: './.github/actions/ci-tools' },
      { name: 'Fresh fixture and exactly one full guarded measurement',
        run: 'python3 -I -B scripts/ci/paul_native_fixture.py run' },
      { name: 'Preserve bounded diagnostic evidence even when acceptance fails',
        if: 'always()', uses: 'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
        with: { name: 'paul-native-fixture-diagnostic-${{ github.run_id }}-${{ github.run_attempt }}',
          path: 'ci-artifacts/paul-native-fixture/preflight.json\nci-artifacts/paul-native-fixture/diagnostic.json\n', 'retention-days': 7,
          'if-no-files-found': 'error' } },
    ],
  } },
};

test('paul-native-fixture.yml is exactly one held manual diagnostic, no alternate activation or credential path', () => {
  expect(workflow).toEqual(expected);
  expect(read('.github/workflows/paul-native-fixture.yml')).not.toMatch(/secrets|id-token|environment:|continue-on-error|workflow_call|workflow_run|pull_request|schedule:|push:/);
});

test('native workflow contract rejects enabling, extra jobs/triggers, alternate runner and unsafe evidence changes', () => {
  const changes = [
    w => { w.jobs.diagnostic.if = '${{ true }}'; },
    w => { w.jobs.extra = { if: '${{ false }}', 'runs-on': 'ubuntu-24.04', steps: [] }; },
    w => { w.on.push = {}; },
    w => { w.on.workflow_dispatch = { inputs: { mode: { default: 'candidate' } } }; },
    w => { w.jobs.diagnostic['runs-on'] = 'ubuntu-24.04-arm'; },
    w => { w.jobs.diagnostic.environment = 'production-portfolio'; },
    w => { w.permissions['id-token'] = 'write'; },
    w => { w.jobs.diagnostic.steps[0].with['persist-credentials'] = true; },
    w => { w.jobs.diagnostic.steps[3]['continue-on-error'] = true; },
    w => { w.jobs.diagnostic.steps[4].if = 'success()'; },
    w => { w.jobs.diagnostic.steps[4].with.path = '**/*.json'; },
  ];
  for (const change of changes) {
    const copy = structuredClone(workflow);
    change(copy);
    expect(() => expect(copy).toEqual(expected)).toThrow();
  }
});

test('paul_lighthouse_metrics export survives the native Python consumer with observed reduced Chrome UA', () => {
  const directory = mkdtempSync(join(tmpdir(), 'paul-metrics-contract-'));
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const lhr = {
    lighthouseVersion: '12.6.1',
    environment: { hostUserAgent: 'Mozilla/5.0 Chrome/152.0.0.0 Safari/537.36', benchmarkIndex: 1200 },
    categories: { performance: { score: 0.77 } },
    audits: { 'total-blocking-time': { numericValue: 939.29 } },
    timing: { total: 1234 },
    configSettings: { formFactor: 'mobile', screenEmulation: { width: 390, height: 844, deviceScaleFactor: 1 },
      throttlingMethod: 'simulate', throttling: { cpuSlowdownMultiplier: 4 } },
  };
  try {
    for (let i = 0; i < 3; i++) writeFileSync(join(directory, `lhr-${i}.json`), JSON.stringify(lhr));
    // Only pure JSON serialization subprocesses: no hosted CLI, build, container or browser.
    const producer = spawnSync('node', ['-e',
      'require(process.argv[1]).exportMetrics(process.argv[2])',
      join(root, 'scripts/release/paul_lighthouse_metrics.cjs'), directory], { encoding: 'utf8' });
    expect(producer.error).toBeUndefined();
    expect(producer.status).toBe(0);
    const emitted = JSON.parse(producer.stdout.trim().replace('PAUL_ACCEPTANCE_LIGHTHOUSE_METRICS ', ''));
    expect(emitted.reports.map(report => report.chromeVersion)).toEqual(['152.0.0.0', '152.0.0.0', '152.0.0.0']);
    const consumer = spawnSync('python3', ['-I', '-B', '-c',
      'import json, sys; sys.path.insert(0, sys.argv[1]); import paul_native_fixture; print(json.dumps(paul_native_fixture.sanitized_metrics(sys.stdin.read().splitlines())))',
      join(root, 'scripts/ci')], { input: producer.stdout, encoding: 'utf8' });
    expect(consumer.error).toBeUndefined();
    expect(consumer.stderr).toBe('');
    expect(consumer.status).toBe(0);
    const reports = JSON.parse(consumer.stdout);
    expect(reports).toHaveLength(3);
    for (const report of reports) expect(report).toEqual({
      lighthouseVersion: '12.6.1', chromeVersion: '152.0.0.0', performance: 0.77,
      metrics: { 'first-contentful-paint': null, 'largest-contentful-paint': null, 'total-blocking-time': 939.29,
        'cumulative-layout-shift': null, 'speed-index': null },
      benchmarkIndex: 1200, durationMs: 1234, formFactor: 'mobile',
      screenEmulation: { width: 390, height: 844, deviceScaleFactor: 1 },
      throttlingMethod: 'simulate', cpuSlowdownMultiplier: 4,
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('native diagnostic reuses unchanged full runner and root pinned install rather than release CI marker or bypass', () => {
  const helper = read('scripts/ci/paul_native_fixture.py');
  expect(helper).toContain('acceptance.container_args(image_id, SERVING, fixture=True)');
  expect(helper).toContain('acceptance.inspect_container(container, image_id, fixture=True)');
  expect(helper).not.toMatch(/artifact\.py marker|CI_RELEASE_METADATA|accept_candidate\(|docker.*(?:prune|binfmt)|continue.on.error/);
  expect(read('.github/actions/ci-tools/action.yml')).toContain('bun install --frozen-lockfile');
  expect(read('scripts/release/paul_acceptance_runner.mjs')).toContain("'lhci', 'autorun'");
  expect(read('scripts/release/paul_lighthouse.config.cjs')).toContain('numberOfRuns: baseline.ci.collect.numberOfRuns');
  expect(read('scripts/release/paul_lighthouse.config.cjs')).toContain('assert: baseline.ci.assert');
  const baseline = read('apps/paul/lighthouserc.cjs');
  expect(baseline).toContain('numberOfRuns: 3');
  expect(baseline).toContain('minScore: 0.9');
});
