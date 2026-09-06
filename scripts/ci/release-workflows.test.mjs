import { expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const read = path => readFileSync(root + path, 'utf8');
const yaml = path => Bun.YAML.parse(read(path));
const deployFiles = ['_carolyn-release.yml', '_diloreto-release.yml', '_paul-release.yml', '_sarabeth-release.yml', 'infrastructure-sarabeth.yml', 'redeploy-diloreto.yml', 'release-after-ci.yml', 'release-site.yml', 'restore-static.yml'];

test('all production jobs/calls have literal false publication lock; no unexpected workflow escapes', () => {
  expect(readdirSync(root + '.github/workflows').sort()).toEqual([...deployFiles, 'ci.yml', '_carolyn-ci.yml', '_diloreto-ci.yml', '_paul-ci.yml', '_sarabeth-ci.yml'].sort());
  const runtime = JSON.parse(read('config/release-runtime.json'));
  expect(runtime.publicationLocked).toBe(true);
  for (const filename of deployFiles) {
    const workflow = yaml('.github/workflows/' + filename);
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(workflow.on.pull_request_target).toBeUndefined();
    for (const job of Object.values(workflow.jobs)) {
      if (job.environment || job.permissions?.['id-token'] || job.permissions?.contents === 'write' || job.uses) expect(job.if).toBe('${{ false }}');
      if (!job.environment && !job.uses) {
        expect(job.permissions?.['id-token']).toBeUndefined();
        expect(job.permissions?.contents).not.toBe('write');
      }
      for (const step of job.steps ?? []) {
        if (step.uses && !step.uses.startsWith('./')) expect(step.uses).toMatch(/@[0-9a-f]{40}$/);
        if (step.uses?.startsWith('actions/checkout')) expect(step.with['persist-credentials']).toBe(false);
      }
    }
  }
});

test('whole deployment and restoration share noncanceling app-specific critical section and trusted harness', () => {
  for (const site of ['paul', 'diloreto', 'carolyn', 'sarabeth']) {
    const workflow = yaml(`.github/workflows/_${site}-release.yml`), job = workflow.jobs.release;
    expect(job.concurrency).toEqual({ group: site === 'paul' ? 'portfolio-production' : `${site}-production`, 'cancel-in-progress': false });
    expect(job.environment).toBe(site === 'paul' ? 'production-portfolio' : `production-${site}`);
    expect(job.steps[0].with.ref).toBe('${{ github.workflow_sha }}');
    expect(job.steps[0].with.path).toBe('verification-harness');
    const install = job.steps.findIndex(step => step.run?.includes('bun install'));
    const config = job.steps.findIndex(step => step.id === 'config');
    const credentials = job.steps.findIndex(step => step.uses?.startsWith('aws-actions/'));
    expect(job.steps[install].run).toBe('bun install --frozen-lockfile --ignore-scripts');
    expect(install).toBeLessThan(config); expect(config).toBeLessThan(credentials);
    expect(job.steps[credentials].with['unset-current-credentials']).toBe(true);
    expect(job.steps[credentials].with['allowed-account-ids']).toMatch(/^\d{12}$/);
    expect(job.steps[credentials + 1].run).toContain(`scripts/release/deploy.py deploy ${site}`);
    expect(job.steps[credentials + 1]['working-directory']).toBe('verification-harness');
  }
  expect(yaml('.github/workflows/infrastructure-sarabeth.yml').jobs.cloudformation.concurrency.group).toBe('sarabeth-production');
});

test('recovery validates immutable selected SHA regardless push scope; DiLoreto manual ref is distinct', () => {
  for (const name of ['release-site.yml', 'redeploy-diloreto.yml']) {
    const workflow = yaml('.github/workflows/' + name);
    expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch']);
    expect(workflow.jobs.resolve.outputs.commit).toBe('${{ steps.select.outputs.commit }}');
    expect(workflow.jobs.root.name).toBe('release root validation');
    for (const [id, job] of Object.entries(workflow.jobs).filter(([id]) => id.endsWith('-validate'))) {
      expect(job.env.AWS_EC2_METADATA_DISABLED).toBe('true');
      expect(job.steps[0].with.ref).toBe('${{ github.workflow_sha }}');
      expect(job.steps[1].with.ref).toBe('${{ needs.resolve.outputs.commit }}');
      expect(job.steps.find(step => step.run?.includes('validate.sh')).run).toContain(id.replace('-validate', ''));
    }
  }
  const selector = read('scripts/release/select.mjs');
  expect(selector).toContain("if (!redeploy && ref !== 'main')");
  expect(selector).toContain("'merge-base', '--is-ancestor', commit, main");
  expect(selector).toContain('Missing/ambiguous ref');
  expect(read('.github/workflows/redeploy-diloreto.yml')).toContain('operation: redeploy');
});

test('SSR monorepo buildspec uses exact short roots, frozen root ignored lifecycles and production-only attestation', () => {
  const spec = yaml('amplify.yml');
  expect(spec.applications.map(app => app.appRoot)).toEqual(['apps/carolyn', 'apps/sarabeth']);
  for (const app of spec.applications) {
    expect(app.frontend.buildPath).toBe('/');
    expect(app.frontend.artifacts.baseDirectory).toBe(`${app.appRoot}/.amplify-hosting`);
    expect(app.frontend.phases.preBuild.commands).toContain('bun install --frozen-lockfile --ignore-scripts');
    expect(app.frontend.phases.preBuild.commands).toContain('nvm install 24.20.0');
    expect(app.frontend.phases.preBuild.commands).toContain('npm install --global bun@1.4.0');
    expect(app.frontend.cache).toBeUndefined();
  }
  const build = read('scripts/release/amplify-build.sh');
  expect(build).toContain('unset RELEASE_COMMIT GITHUB_SHA NODE_OPTIONS');
  expect(build).toContain('bun scripts/verify-amplify-source.ts');
  expect(build).toContain('RELEASE_COMMIT="$actual" AWS_COMMIT_ID="$actual"');
  expect(build).toContain('website-ssr-production');
  expect(build).not.toContain('dns-result-order=ipv4first');
});

test('Sarabeth infrastructure preserves all 16 historical operational steps under root gated scope', () => {
  const legacy = yaml('apps/sarabeth/.github/workflows/infrastructure.yaml').jobs.cloudformation;
  const active = yaml('.github/workflows/infrastructure-sarabeth.yml').jobs.cloudformation;
  expect(active.steps.map(step => step.name).filter(name => name !== 'Fail closed before infrastructure credentials')).toEqual(legacy.steps.map(step => step.name));
  expect(active['timeout-minutes']).toBe(230);
  expect(active.environment).toBe('infrastructure-sarabeth');
  expect(active.defaults.run['working-directory']).toBe('apps/sarabeth');
  for (const step of legacy.steps.filter(step => step.run)) expect(active.steps.find(candidate => candidate.name === step.name).run).toBe(step.run);
});

test('owning IaC keeps old subjects, exact optional new subjects, provider/DNS identities and retained Sarabeth main', () => {
  for (const path of ['apps/paul/infra/amplify-hosting.yaml', 'apps/diloreto/infrastructure/amplify-hosting.yml', 'apps/sarabeth/infrastructure/cloudformation/bootstrap.yaml', 'apps/sarabeth/infrastructure/cloudformation/hosting.yaml']) {
    const template = read(path);
    expect(template).toContain('MonorepoSubject:'); expect(template).toContain('Default: ""');
    expect(template).toContain('HasMonorepoSubject, !Ref MonorepoSubject, !Ref AWS::NoValue');
    expect(template).toContain('token.actions.githubusercontent.com:aud');
    expect(template).not.toContain('repo:soodoh/websites:');
  }
  const hosting = read('apps/sarabeth/infrastructure/cloudformation/hosting.yaml');
  expect(hosting).toContain('  MainBranch:'); expect(hosting).toContain('  MonorepoBranch:');
  expect(hosting).toContain('BranchName: sarabeth-production'); expect(hosting).toContain('Condition: CreateMonorepoBranch');
  expect(hosting).toContain('DeletionPolicy: Retain');
  expect(hosting).toContain('/sarabeth-studio/production/last-known-good-sha');
});
