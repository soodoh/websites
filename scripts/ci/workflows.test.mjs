import { expect, test } from 'bun:test';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { apps, config } from './affected.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const read = path => readFileSync(resolve(root, path), 'utf8');
const yaml = path => Bun.YAML.parse(read(path));
const ci = yaml('.github/workflows/ci.yml');
test('stable always gate, unrestricted required triggers and pinned-event history', () => {
  expect(Object.keys(ci.on).sort()).toEqual(['pull_request', 'push', 'workflow_dispatch']);
  for (const event of ['pull_request', 'push']) { expect(ci.on[event].branches).toEqual(['main']); expect(ci.on[event].paths).toBeUndefined(); expect(ci.on[event]['paths-ignore']).toBeUndefined(); }
  expect(ci.jobs.gate.name).toBe('CI gate'); expect(ci.jobs.gate.if).toBe('always()');
  expect(ci.jobs.gate.needs).toEqual(['detect', 'root', ...apps]);
  expect(ci.jobs.detect.steps[0].with['fetch-depth']).toBe(0);
  expect(ci.jobs.detect.steps.find(step => step.id === 'scope').run).toContain('scripts/ci/affected.mjs');
  expect(ci.jobs.gate.steps.at(-1).run).toBe('node scripts/ci/gate.mjs');
  expect(ci.jobs.root.steps.at(-1).run).toContain('bun run test:ci');
});
test('main has per-run concurrency; PR cancellation cannot cancel main', () => {
  expect(ci.concurrency['cancel-in-progress']).toBe("${{ github.event_name == 'pull_request' }}");
  expect(ci.concurrency.group).toBe("${{ github.workflow }}-${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || github.run_id }}");
  const group = (event, pr, run) => `CI-${event === 'pull_request' ? `pr-${pr}` : run}`;
  expect(group('push', null, 1)).not.toBe(group('push', null, 2));
  expect(group('pull_request', 1, 3)).not.toBe(group('push', null, 1));
  expect(group('pull_request', 1, 3)).toBe(group('pull_request', 1, 4));
});
test('all active workflows unprivileged, no deployment paths, actions immutable, safe uses paths', () => {
  expect(readdirSync(resolve(root, '.github/workflows')).sort()).toEqual(['_carolyn-ci.yml', '_diloreto-ci.yml', '_paul-ci.yml', '_sarabeth-ci.yml', 'ci.yml']);
  for (const filename of readdirSync(resolve(root, '.github/workflows'))) {
    const text = read(`.github/workflows/${filename}`), workflow = yaml(`.github/workflows/${filename}`);
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(text).not.toMatch(/pull_request_target|id-token|secrets:|environment:|configure-aws|aws (amplify|ssm|sts)|git push|cdk deploy|amplify-production/);
    for (const job of Object.values(workflow.jobs)) {
      expect(job.permissions).toBeUndefined(); expect(job.environment).toBeUndefined(); expect(job.strategy).toBeUndefined();
      for (const step of job.steps ?? []) {
        if (step.uses?.startsWith('./')) expect(existsSync(resolve(root, step.uses))).toBe(true);
        else if (step.uses) expect(step.uses).toMatch(/@[0-9a-f]{40}$/);
        if (step.uses?.startsWith('actions/checkout')) expect(step.with['persist-credentials']).toBe(false);
        if (step.run) expect(step.run).not.toMatch(/\$\{\{.*(?:head_ref|title|body|inputs.ref)/);
        if (step.uses?.startsWith('actions/upload-artifact')) { expect(step.with.name).toContain('${{ github.run_id }}'); expect(step.with.name).toContain('${{ github.run_attempt }}'); }
      }
    }
  }
});
test('explicit app filters, canonical runners, serial verification and scanned diagnostics', () => {
  for (const app of apps) {
    const workflow = yaml(config.apps[app].workflow), job = workflow.jobs.verify;
    expect(Object.keys(workflow.on)).toEqual(['workflow_call']);
    expect(ci.jobs[app].if).toBe(`needs.detect.outputs.${app} == 'true'`);
    expect(ci.jobs[app].uses).toBe(`./${config.apps[app].workflow}`);
    expect(job['runs-on']).toBe(['sarabeth', 'carolyn'].includes(app) ? 'ubuntu-24.04-arm' : 'ubuntu-24.04');
    expect(job.steps.find(step => step.run === `bun run verify:${app}`).run).toBe(`bun run verify:${app}`);
    expect(job.steps.find(step => step.id === 'diagnostics').if).toBe('always()');
    expect(job.steps.at(-1).if).toContain("steps.diagnostics.outcome == 'success'");
    expect(job.steps.at(-1).with.path).toBe(`ci-artifacts/${app}/diagnostics/`);
    if (['sarabeth', 'carolyn'].includes(app)) expect(read(config.apps[app].workflow)).not.toContain('/static/');
    const rootManifest = JSON.parse(read('package.json'));
    expect(rootManifest.scripts[`verify:${app}`]).toContain(`--filter=${config.apps[app].package} --concurrency=1`);
  }
  expect(read('.github/actions/ci-tools/action.yml')).toContain('bun install --frozen-lockfile');
  expect(yaml('.github/actions/ci-tools/action.yml').runs.steps[0].with['node-version-file']).toBe('.nvmrc');
});
test('marker precedes static/browser assertions; genealogy and immutable packaging retained', () => {
  for (const app of ['paul', 'diloreto']) {
    const chain = JSON.parse(read(`apps/${app}/package.json`)).scripts['ci:verify'];
    expect(chain.indexOf('artifact.py marker')).toBeGreaterThan(chain.indexOf('bun run build'));
    expect(chain.indexOf('artifact.py marker')).toBeLessThan(chain.indexOf(app === 'paul' ? 'bun run test:static' : 'bun run check:output'));
  }
  expect(JSON.parse(read('apps/diloreto/package.json')).scripts['ci:verify']).toContain('bun run test:genealogy');
});
test('phase3 verification harness is explicitly inert and retains trusted checkout contract', () => {
  const legacy = read('apps/diloreto/.github/workflows/deploy.yml');
  expect(legacy).toContain('ref: ${{ github.workflow_sha }}');
  expect(legacy).toContain('path: verification-harness');
  expect(legacy).toContain('working-directory: verification-harness');
  // Phase3 must install at harness root and run inside apps/diloreto, not run this baseline.
  expect(resolve(root, 'verification-harness/apps/diloreto')).toBe(`${root.replace(/\/$/, '')}/verification-harness/apps/diloreto`);
  expect(read('.github/workflows/ci.yml')).not.toContain('verification-harness');
});
test('Sarabeth successful-container provenance failure is a gate failure; failure status retained', () => {
  const wrapper = read('apps/sarabeth/scripts/playwright-docker.sh');
  expect(wrapper).toContain('if [[ "${status}" -eq 0 ]]');
  expect(wrapper).toContain('${container}:/work/apps/sarabeth/.amplify-hosting/static/__deployment.json');
  expect(wrapper).toContain('JSON.parse(fs.readFileSync(process.argv[1])).commit !== process.argv[2]');
  expect(wrapper).toContain('status=1');
  expect(wrapper).toContain('exit "${status}"');
});
