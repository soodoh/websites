import { expect, test } from 'bun:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planRelease } from './release-contract.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'carolyn-selection-'));
  const source = join(directory, 'source'), target = join(directory, 'target'), bin = join(directory, 'bin');
  mkdirSync(source); mkdirSync(bin);
  const git = (...args) => execFileSync('git', args, { cwd: source, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_COMMITTER_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid', GIT_COMMITTER_EMAIL: 'fixture@example.invalid' } }).trim();
  git('init', '-b', 'main');
  function commit(path, value) {
    mkdirSync(join(source, path, '..'), { recursive: true });
    writeFileSync(join(source, path), value);
    git('add', '--', path); git('-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'test(carolyn): fixture');
    return git('rev-parse', 'HEAD');
  }
  const legacy = commit('old-layout', 'legacy');
  for (const path of ['bun.lock', 'package.json', 'apps/carolyn/package.json', 'amplify.yml', 'scripts/release/amplify-build.sh']) commit(path, '{}');
  const watermark = git('rev-parse', 'HEAD');
  const candidate = commit('apps/carolyn/input', 'candidate');
  const unrelated = commit('apps/paul/input', 'unrelated');
  git('clone', '--no-hardlinks', source, target);
  const gh = join(bin, 'gh');
  writeFileSync(gh, '#!/bin/sh\nprintf \'{"object":{"sha":"%s"}}\\n\' "$FIXTURE_MAIN"\n'); chmodSync(gh, 0o755);
  function select(overrides = {}) {
    const output = join(directory, 'output'); writeFileSync(output, '');
    const environment = { ...process.env, PATH: `${bin}:${process.env.PATH}`, RELEASE_SITE: 'carolyn', SELECTED_REF: 'main', CAROLYN_OPERATION: 'promote', CAROLYN_CANDIDATE_COMMIT: candidate, GITHUB_WORKFLOW_REF: 'soodoh/websites/.github/workflows/release-site.yml@refs/heads/main', FIXTURE_MAIN: unrelated, GITHUB_OUTPUT: output, ...overrides };
    const result = spawnSync('node', [join(root, 'scripts/release/select.mjs')], { cwd: target, env: environment, encoding: 'utf8' });
    return { ...result, output: readFileSync(output, 'utf8'), environment };
  }
  return { directory, source, target, bin, git, commit, legacy, watermark, candidate, unrelated, select };
}

test('Carolyn exact candidate selection keeps actual main separate and scope comparator permits unrelated advancement only', () => {
  const f = fixture();
  try {
    const result = f.select();
    expect(result.status).toBe(0);
    expect(result.output).toBe(`commit=${f.candidate}\nmain=${f.unrelated}\n`);
    const state = { schemaVersion: 1, repository: 'soodoh/websites', site: 'carolyn', highWatermark: f.watermark };
    const plan = mainSha => planRelease({ cwd: f.source, site: 'carolyn', commit: f.candidate, mainSha, state });
    expect(plan(f.unrelated).decision).toBe('eligible');
    const relevant = f.commit('apps/carolyn/input', 'new unvalidated input');
    expect(plan(relevant).decision).toBe('requires-fresh-validation');
    f.commit('apps/carolyn/input', 'candidate');
    const shared = f.commit('bun.lock', 'shared lock changed');
    expect(plan(shared).decision).toBe('requires-fresh-validation');
  } finally { rmSync(f.directory, { recursive: true, force: true }); }
});

test('missing/malformed/nonancestral/old-layout candidate and wrong operation fail without selection output', () => {
  const f = fixture();
  try {
    f.git('checkout', '--orphan', 'unrelated-history');
    const outside = f.commit('outside', 'not main history');
    const cases = ['', 'b'.repeat(39), '0'.repeat(40), 'main', '../main', outside, f.legacy, 'f'.repeat(40)].map(value => ({ CAROLYN_CANDIDATE_COMMIT: value }));
    cases.push({ RELEASE_SITE: 'paul' }, { CAROLYN_OPERATION: 'candidate' }, { CAROLYN_OPERATION: 'release' }, { SELECTED_REF: 'other' });
    for (const env of cases) {
      const result = f.select(env);
      expect(result.status).not.toBe(0);
      expect(result.output).toBe('');
    }
    const recovery = f.select({ CAROLYN_OPERATION: 'release', CAROLYN_CANDIDATE_COMMIT: '' });
    expect(recovery.status).toBe(0);
    expect(recovery.output).toBe(`commit=${f.unrelated}\nmain=${f.unrelated}\n`);
  } finally { rmSync(f.directory, { recursive: true, force: true }); }
});

test('selected candidate checkout flows through real validation wrapper and request provenance, not workflow main SHA', () => {
  const f = fixture();
  try {
    expect(f.select().status).toBe(0);
    execFileSync('git', ['checkout', '--detach', f.candidate], { cwd: f.target, env: { ...process.env, GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid' } });
    const log = join(f.directory, 'validation-log');
    const bun = join(f.bin, 'bun');
    writeFileSync(bun, '#!/bin/sh\nif [ "$1" = --version ]; then echo 1.4.0; else printf "%s %s\\n" "$(git rev-parse HEAD)" "$*" >> "$VALIDATION_LOG"; fi\n'); chmodSync(bun, 0o755);
    const result = spawnSync('bash', [join(root, 'scripts/release/validate.sh'), 'carolyn', f.target], { env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, VALIDATION_LOG: log } });
    expect(result.status).toBe(0);
    expect(readFileSync(log, 'utf8')).toBe(`${f.candidate} run verify:carolyn\n`);
    const request = join(f.directory, 'request.json');
    const selected = spawnSync('python3', [join(root, 'scripts/release/request.py'), 'carolyn', 'promote', request], { env: { ...process.env, TARGET_SHA: f.candidate, GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_WORKFLOW_REF: 'soodoh/websites/.github/workflows/release-site.yml@refs/heads/main', GITHUB_WORKFLOW_SHA: f.unrelated, GITHUB_RUN_ID: '10', GITHUB_RUN_ATTEMPT: '2' } });
    expect(selected.status).toBe(0);
    expect(JSON.parse(readFileSync(request))).toMatchObject({ commit: f.candidate, workflowSha: f.unrelated, runId: '10', runAttempt: '2', workflow: '.github/workflows/release-site.yml', site: 'carolyn' });
  } finally { rmSync(f.directory, { recursive: true, force: true }); }
});
