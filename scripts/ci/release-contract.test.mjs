import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apps, git } from './affected.mjs';
import { releasePolicy, CI_WORKFLOW, RECOVERY_WORKFLOW, checkReleaseAuthorization, validateReleaseEvidence, bindCiArtifact, planRelease, planRecovery, recoveryNotice } from './release-contract.mjs';

const scratch = [];
afterEach(() => { for (const cwd of scratch.splice(0)) rmSync(cwd, { recursive: true, force: true }); });
function repo() {
  const cwd = mkdtempSync(join(tmpdir(), 'release-contract-')); scratch.push(cwd);
  git(cwd, 'init', '-b', 'main'); git(cwd, 'config', 'user.email', 'fixture@example.invalid'); git(cwd, 'config', 'user.name', 'Release fixture');
  return cwd;
}
let serial = 0;
function commit(cwd, path) {
  mkdirSync(join(cwd, path, '..'), { recursive: true }); writeFileSync(join(cwd, path), `fixture ${++serial}\n`);
  git(cwd, 'add', '--', path); git(cwd, '-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'test(ci): release fixture');
  return git(cwd, 'rev-parse', 'HEAD');
}
function policy() {
  const p = structuredClone(releasePolicy);
  p.repositoryId = '1'; p.ownerId = '2';
  p.validationWorkflowIds = { [CI_WORKFLOW]: '3', [RECOVERY_WORKFLOW]: '4' };
  for (const s of apps) Object.assign(p.sites[s], { automaticEnabled: true, manualEnabled: true, roleArn: `arn:aws:iam::${p.sites[s].account}:role/fixture-only`, oidcSubject: `fixture:${s}:exact-subject`, appId: `dfixture${s}` });
  return p;
}
function observation(p, site, sha, workflow = CI_WORKFLOW) {
  return { repository: p.repository, headRepository: p.repository, repositoryId: p.repositoryId, ownerId: p.ownerId, site, workflow, workflowId: p.validationWorkflowIds[workflow], workflowSha: sha, eventHeadSha: sha, checkoutSha: sha, ref: 'refs/heads/main', event: workflow === CI_WORKFLOW ? 'push' : 'workflow_dispatch', runId: '10', runAttempt: '2', status: 'completed', siteResult: 'success', rootResult: 'success', siteSelected: true, ...p.sites[site], audience: 'sts.amazonaws.com' };
}
function fixture(site = 'sarabeth') {
  const cwd = repo(), base = commit(cwd, 'README.md'), a = commit(cwd, `apps/${site}/a`), p = policy();
  const observed = observation(p, site, a);
  const selected = { commit: a, mainSha: a, runId: '10', runAttempt: '2' };
  return { cwd, base, a, policy: p, site, observed, selected };
}
const state = (site, highWatermark) => ({ schemaVersion: 1, repository: 'soodoh/websites', site, highWatermark });

test('checked-in policy cannot activate automatic OR manual credentials on publication', () => {
  expect(releasePolicy.repositoryId).toBe('1358469291'); expect(releasePolicy.ownerId).toBe('18269267');
  expect(releasePolicy.validationWorkflowIds).toEqual({ [CI_WORKFLOW]: '351279106', [RECOVERY_WORKFLOW]: '351776220', '.github/workflows/redeploy-diloreto.yml': null });
  expect(releasePolicy.legacyPortfolioRepositoryId).toBe('81884767'); expect(releasePolicy.legacyPortfolioWorkflowId).toBe('315997019');
  for (const key of ['legacyDiloretoRepositoryId', 'legacyDiloretoWorkflowId', 'legacyDiloretoManifestSha256']) expect(releasePolicy[key]).toBeNull();
  for (const site of apps) {
    const context = observation(policy(), site, 'a'.repeat(40));
    for (const mode of ['automatic', 'manual']) expect(() => checkReleaseAuthorization(releasePolicy, site, mode, context)).toThrow();
    expect(releasePolicy.sites[site].automaticEnabled).toBe(false); expect(releasePolicy.sites[site].manualEnabled).toBe(false);
    expect(releasePolicy.sites[site].oidcSubject).toBeNull();
    if (site === 'paul') {
      expect(releasePolicy.sites[site].roleArn).toBe('arn:aws:iam::658271954302:role/pauldiloreto-amplify-hosting-GitHubDeploymentRole-JPjJmwTE3kcw');
      expect(releasePolicy.sites[site].appId).toBe('d121ux7va6hz6j');
    } else {
      for (const key of ['roleArn', 'appId']) expect(releasePolicy.sites[site][key]).toBeNull();
    }
  }
  expect(releasePolicy.sites.paul.environment).toBe('production-portfolio');
  expect(new Set(apps.map(s => releasePolicy.sites[s].concurrency)).size).toBe(4);
});

test('checked-in runtime binds only reviewed metadata and retains publication and unknown-field locks', () => {
  const runtime = JSON.parse(readFileSync(new URL('../../config/release-runtime.json', import.meta.url)));
  expect(runtime.publicationLocked).toBe(true);
  expect(runtime.entryWorkflowIds).toEqual({
    '.github/workflows/release-after-ci.yml': null,
    '.github/workflows/release-site.yml': '351776220',
    '.github/workflows/redeploy-diloreto.yml': null,
    '.github/workflows/restore-static.yml': '351776221',
  });
  expect(runtime.sites.paul.productionUrl).toBe('https://pauldiloreto.com');
  expect(runtime.sites.paul.releaseBucket).toBe('pauldiloreto-amplify-hosting-verifiedreleasebucket-idabawspxy3s');
  expect(runtime.sites.paul.releaseOwner).toBe('658271954302');
  expect(runtime.sites.paul.domainRedirects).toBe(false);
  for (const site of apps) {
    const config = runtime.sites[site];
    for (const key of ['sourceWriterDrained', 'restoreEnabled', 'redeployEnabled']) expect(config[key]).toBe(false);
    for (const key of ['stateBucket', 'stateKey', 'stateOwner']) expect(config[key]).toBeNull();
    if ('candidateUrl' in config) expect(config.candidateUrl).toBeNull();
    if (site !== 'paul') expect(config.productionUrl).toBeNull();
  }
  for (const key of ['releaseBucket', 'releaseOwner', 'originUrl']) expect(runtime.sites.diloreto[key]).toBeNull();
});

test('authorization checks exact configured site/account/environment/repo/workflow/event/run identities', () => {
  const f = fixture();
  for (const mode of ['automatic', 'manual']) {
    const o = observation(f.policy, f.site, f.a, mode === 'automatic' ? CI_WORKFLOW : RECOVERY_WORKFLOW);
    expect(checkReleaseAuthorization(f.policy, f.site, mode, o).concurrency).toBe('sarabeth-production');
    for (const [key, value] of Object.entries({ site: 'paul', account: '000000000000', region: 'us-east-1', environment: 'production-portfolio', roleArn: 'arn:aws:iam::000000000000:role/other', appId: 'dwrong', oidcSubject: 'wrong', audience: 'wrong', repository: 'fork/websites', headRepository: 'fork/websites', repositoryId: '9', ownerId: '9', workflow: '.github/workflows/evil.yml', workflowId: '9', event: 'pull_request', ref: 'refs/pull/1/merge', workflowSha: '', runId: '0', runAttempt: '0' })) {
      expect(() => checkReleaseAuthorization(f.policy, f.site, mode, { ...o, [key]: value })).toThrow();
    }
    for (const value of [undefined, false, 'true', 1]) {
      const p = structuredClone(f.policy); p.sites[f.site][`${mode}Enabled`] = value;
      expect(() => checkReleaseAuthorization(p, f.site, mode, o)).toThrow();
    }
    for (const key of ['account', 'region', 'environment', 'concurrency', 'roleArn', 'oidcSubject', 'appId']) {
      const p = structuredClone(f.policy); delete p.sites[f.site][key];
      expect(() => checkReleaseAuthorization(p, f.site, mode, o)).toThrow();
    }
    for (const subject of ['repo:*', 'repo:?', '']) {
      const p = structuredClone(f.policy); p.sites[f.site].oidcSubject = subject;
      expect(() => checkReleaseAuthorization(p, f.site, mode, { ...o, oidcSubject: subject })).toThrow();
    }
  }
});

test('attempt-specific required site/root results, not overall all-app success, establish validation receipt', () => {
  const f = fixture(); f.observed.conclusion = 'failure'; // An unrelated app may fail.
  const receipt = validateReleaseEvidence(f);
  expect(receipt.kind).toBe('website-release-validation'); expect(receipt.releaseAuthorized).toBe(false);
  for (const [key, value] of Object.entries({ repository: 'fork/websites', headRepository: 'fork/websites', repositoryId: '9', ownerId: '9', site: 'paul', workflow: '.github/workflows/other.yml', workflowId: '9', checkoutSha: f.base, eventHeadSha: f.base, workflowSha: f.base, runId: '11', runAttempt: '1', status: 'in_progress', siteResult: 'failure', rootResult: 'cancelled', siteSelected: false, event: 'workflow_dispatch', ref: 'refs/tags/main' })) {
    expect(() => validateReleaseEvidence({ ...f, observed: { ...f.observed, [key]: value } })).toThrow();
  }
  for (const key of Object.keys(f.observed).filter(key => !['conclusion', 'audience', ...Object.keys(f.policy.sites[f.site])].includes(key))) {
    const observed = { ...f.observed }; delete observed[key];
    expect(() => validateReleaseEvidence({ ...f, observed })).toThrow();
  }
  for (const value of [null, {}, { ...f.selected, runAttempt: '0' }, { ...f.selected, mainSha: 'f'.repeat(40) }]) expect(() => validateReleaseEvidence({ ...f, selected: value })).toThrow();
});

test('PR source and merge SHAs are both rejected even when later in main ancestry', () => {
  const f = fixture(); git(f.cwd, 'checkout', '-b', 'pr'); const source = commit(f.cwd, 'apps/sarabeth/pr');
  git(f.cwd, 'checkout', 'main'); commit(f.cwd, 'apps/paul/unrelated');
  git(f.cwd, '-c', 'core.hooksPath=/dev/null', 'merge', '--no-ff', 'pr', '-m', 'test(ci): merge');
  const merge = git(f.cwd, 'rev-parse', 'HEAD');
  for (const commit of [source, merge]) {
    const observed = { ...f.observed, event: 'pull_request', eventHeadSha: source, checkoutSha: commit, workflowSha: merge, ref: 'refs/pull/1/merge' };
    expect(() => validateReleaseEvidence({ ...f, observed, selected: { ...f.selected, commit, mainSha: merge } })).toThrow();
  }
  // A mapped or tree-equal identity is not attestation for a different selected commit.
  expect(() => validateReleaseEvidence({ ...f, selected: { ...f.selected, commit: merge, mainSha: merge } })).toThrow();
});

test('v1 metadata is unchanged; separate artifact binding rejects wrong attempt/hash and fixture SSR', () => {
  const f = fixture('paul'), receipt = validateReleaseEvidence(f);
  const metadata = { schemaVersion: 1, repository: receipt.repository, site: 'paul', commit: f.a, workflow: CI_WORKFLOW, runId: '10', runAttempt: '2', event: 'push', ref: 'refs/heads/main', releaseAuthorized: false, releaseId: 'paul-10-2', artifactName: 'paul-10-2-static', deploymentRoot: 'dist/client', sha256: 'a'.repeat(64) };
  const before = JSON.stringify(metadata);
  expect(bindCiArtifact(receipt, metadata).releaseAuthorized).toBe(false); expect(JSON.stringify(metadata)).toBe(before);
  for (const [key, value] of Object.entries({ site: 'diloreto', repository: 'fork/websites', commit: f.base, workflow: RECOVERY_WORKFLOW, event: 'workflow_dispatch', ref: 'refs/pull/1/merge', runId: '11', runAttempt: '3', artifactName: 'other', releaseId: 'other', deploymentRoot: '.amplify-hosting', sha256: '', releaseAuthorized: true, schemaVersion: 2 })) expect(() => bindCiArtifact(receipt, { ...metadata, [key]: value })).toThrow();
  expect(() => bindCiArtifact(receipt, null)).toThrow();
  expect(() => bindCiArtifact({ ...receipt, site: 'sarabeth' }, metadata)).toThrow();
  expect(() => bindCiArtifact({ ...receipt, workflow: RECOVERY_WORKFLOW }, metadata)).toThrow();
  const schema = JSON.parse(readFileSync(new URL('../../config/ci-artifact.schema.json', import.meta.url)));
  expect(schema.properties.workflow.const).toBe(CI_WORKFLOW); expect(schema.properties.releaseAuthorized.const).toBe(false);
});

test('Sarabeth A remains eligible after Portfolio B; relevant C/shared lock require replacement validation', () => {
  const f = fixture(); const b = commit(f.cwd, 'apps/paul/b');
  const args = { cwd: f.cwd, site: f.site, commit: f.a, mainSha: b, state: state(f.site, f.base) };
  expect(planRelease(args).decision).toBe('eligible');
  const c = commit(f.cwd, 'apps/sarabeth/c');
  expect(planRelease({ ...args, mainSha: c }).decision).toBe('requires-fresh-validation');
  const failed = { ...f.observed, checkoutSha: c, eventHeadSha: c, workflowSha: c, siteResult: 'failure' };
  expect(() => validateReleaseEvidence({ ...f, observed: failed, selected: { ...f.selected, commit: c, mainSha: c } })).toThrow();
  expect(planRelease({ ...args, mainSha: c }).decision).toBe('requires-fresh-validation'); // Never fall back to A.
  const shared = commit(f.cwd, 'bun.lock');
  for (const site of apps) expect(planRelease({ ...args, site, commit: c, mainSha: shared, state: state(site, f.base) }).decision).toBe('requires-fresh-validation');
  const docs = commit(f.cwd, 'README.md');
  expect(planRelease({ ...args, commit: shared, mainSha: docs }).decision).toBe('requires-fresh-validation');
});

test('non-FIFO completion and same-SHA retries cannot lower deployed high-watermark', () => {
  const f = fixture(); const b = commit(f.cwd, 'apps/paul/b'); const c = commit(f.cwd, 'apps/sarabeth/c');
  const args = { cwd: f.cwd, site: f.site, commit: c, mainSha: c, state: state(f.site, f.base) };
  expect(planRelease(args).decision).toBe('eligible');
  for (const commit of [f.a, b]) expect(planRelease({ ...args, commit, state: state(f.site, c) }).decision).toBe('obsolete-or-divergent');
  expect(planRelease({ ...args, state: state(f.site, c) }).decision).toBe('already-released');
  // Even identical site inputs at B cannot roll back a newer B watermark to A.
  expect(planRelease({ ...args, commit: f.a, state: state(f.site, b) }).decision).toBe('obsolete-or-divergent');
  for (const s of [null, {}, state('paul', c), state(f.site, '0'.repeat(40))]) expect(() => planRelease({ ...args, state: s })).toThrow();
  git(f.cwd, 'checkout', '-b', 'unmerged', f.base); const unmerged = commit(f.cwd, 'apps/sarabeth/unmerged');
  expect(() => planRelease({ ...args, commit: unmerged })).toThrow();
});

test('explicit recovery ignores last push diff, pins main once and requires fresh same-invocation validation', () => {
  const f = fixture(); const b = commit(f.cwd, 'apps/paul/b');
  const context = observation(f.policy, f.site, f.a, RECOVERY_WORKFLOW);
  const request = { cwd: f.cwd, policy: f.policy, site: f.site, mainSha: b, context };
  const recovery = planRecovery(request);
  expect(recovery.commit).toBe(b); expect(recovery.releaseAuthorized).toBe(false);
  const c = commit(f.cwd, 'apps/sarabeth/c');
  const selected = { ...f.selected, commit: b, mainSha: c };
  const observed = { ...context, checkoutSha: b };
  expect(validateReleaseEvidence({ ...f, selected, observed, recovery }).commit).toBe(b);
  expect(planRelease({ cwd: f.cwd, site: f.site, commit: b, mainSha: c, state: state(f.site, f.base) }).decision).toBe('requires-fresh-validation');
  for (const ref of ['other', f.a, '--help', 'refs/pull/1/merge']) expect(() => planRecovery({ ...request, ref })).toThrow();
  for (const change of [{ runAttempt: '3' }, { runId: '11' }, { commit: c }, { site: 'paul' }, { workflowSha: c }]) expect(() => validateReleaseEvidence({ ...f, selected, observed, recovery: { ...recovery, ...change } })).toThrow();
  expect(() => validateReleaseEvidence({ ...f, selected, observed })).toThrow();
  expect(() => planRecovery({ ...request, context: { ...context, workflowId: '9' } })).toThrow();
});

test('replaced pending, failed and skipped work report exact recovery without automatic queue assumptions', () => {
  const f = fixture();
  const work = ['cancelled', 'skipped', 'failure', 'pending', 'in_progress', 'success'].map((result, n) => ({ site: f.site, commit: f.a, runId: String(n + 1), runAttempt: '1', result }));
  const notice = recoveryNotice(f.site, work);
  expect(notice.incomplete.length).toBe(5); expect(notice.automaticRetry).toBe(false);
  expect(notice.recoveryAction).toBe('release-site(site=sarabeth, ref=main)');
  expect(recoveryNotice(f.site, work.toReversed()).incomplete.length).toBe(5);
  expect(() => recoveryNotice(f.site, [{ ...work[0], site: 'paul' }])).toThrow();
  expect(() => recoveryNotice(f.site, [{}])).toThrow();
});
