import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { affected, apps, git, releaseInputsDiffer, selectPaths, validateSelection } from './affected.mjs';

const scratch = [];
afterEach(() => { for (const cwd of scratch.splice(0)) rmSync(cwd, { recursive: true, force: true }); });
const selected = (...names) => Object.fromEntries(apps.map(app => [app, names.includes(app)]));
function repo() {
  const cwd = mkdtempSync(join(tmpdir(), 'ci-affected-')); scratch.push(cwd);
  git(cwd, 'init', '-b', 'main'); git(cwd, 'config', 'user.email', 'ci@example.invalid'); git(cwd, 'config', 'user.name', 'CI test');
  return cwd;
}
function commit(cwd, paths) {
  for (const path of paths) { mkdirSync(join(cwd, path, '..'), { recursive: true }); writeFileSync(join(cwd, path), Math.random().toString()); }
  git(cwd, 'add', '-A'); git(cwd, '-c', 'core.hooksPath=/dev/null', 'commit', '--allow-empty', '-m', 'test(ci): fixture');
  return git(cwd, 'rev-parse', 'HEAD');
}
const detect = (cwd, base, head, event = 'push') => affected({ cwd, base, head, event });
for (const app of apps) test(`selects only ${app}, including infra/content/workflow`, () => {
  for (const path of [`apps/${app}/src/a.ts`, `apps/${app}/infrastructure/a.yaml`, `apps/${app}/docs/image.png`, `.github/workflows/_${app}-ci.yml`]) expect(selectPaths([path])).toEqual(selected(app));
});
test('shared/root/unknown/package changes run all; only named operational docs skip', () => {
  for (const path of ['bun.lock', 'package.json', 'turbo.json', '.nvmrc', 'scripts/ci/affected.mjs', 'config/ci-scopes.json', '.github/workflows/ci.yml', '.github/actions/x/action.yml', 'packages/new/a.ts', 'unknown.md', 'apps/portfolio-website/a']) expect(selectPaths([path])).toEqual(selected(...apps));
  expect(selectPaths(['README.md'])).toEqual(selected());
  expect(selectPaths(['README.md'], true)).toEqual(selected(...apps));
  expect(selectPaths(['apps/paul/a', 'apps/diloreto/b'])).toEqual(selected('paul', 'diloreto'));
});
test('entire multi-commit push and merge commit, not HEAD~1', () => {
  const cwd = repo(), base = commit(cwd, ['README.md']);
  commit(cwd, ['apps/sarabeth/a']); git(cwd, 'checkout', '-b', 'feature'); commit(cwd, ['apps/carolyn/b']);
  git(cwd, 'checkout', 'main'); commit(cwd, ['README.md']); git(cwd, '-c', 'core.hooksPath=/dev/null', 'merge', '--no-ff', 'feature', '-m', 'test(ci): merge');
  expect(detect(cwd, base, git(cwd, 'rev-parse', 'HEAD')).selected).toEqual(selected('sarabeth', 'carolyn'));
});
test('PR uses pinned base/head merge-base, excludes base-only changes', () => {
  const cwd = repo(), ancestor = commit(cwd, ['README.md']);
  git(cwd, 'checkout', '-b', 'pr'); const head = commit(cwd, ['apps/paul/a']);
  git(cwd, 'checkout', 'main'); const base = commit(cwd, ['apps/sarabeth/b']);
  commit(cwd, ['apps/diloreto/c']);
  const result = detect(cwd, base, head, 'pull_request');
  expect(result.diffBase).toBe(ancestor); expect(result.selected).toEqual(selected('paul'));
});
test('initial, rewritten/nonancestor, missing/no-merge-base, shallow, diff error, unknown fail safe', () => {
  const cwd = repo(), base = commit(cwd, ['README.md']);
  git(cwd, 'checkout', '--orphan', 'rewritten'); git(cwd, 'rm', '-rf', '.'); const head = commit(cwd, ['apps/paul/a']);
  for (const [b, h, event] of [['0'.repeat(40), head, 'push'], [base, head, 'push'], [base, head, 'pull_request'], ['1'.repeat(40), head, 'push'], [undefined, head, 'push'], [base, head, 'merge_group']]) expect(detect(cwd, b, h, event).selected).toEqual(selected(...apps));
  const next = commit(cwd, ['README.md']);
  writeFileSync(join(cwd, '.git/shallow'), `${head}\n`);
  expect(detect(cwd, head, next).reason).toBe('uninspectable-range-run-all');
  expect(detect('/does-not-exist', base, head).selected).toEqual(selected(...apps));
  expect(affected({ cwd, event: 'workflow_dispatch' }).selected).toEqual(selected(...apps));
  expect(affected({ cwd, event: 'push', base, head, forceAll: true }).reason).toBe('forced-baseline');
});
test('cross-app rename, deleted last file, whitespace/newline paths and large full diff', () => {
  const cwd = repo(), base = commit(cwd, ['apps/sarabeth/last file']);
  mkdirSync(join(cwd, 'apps/carolyn'), { recursive: true }); renameSync(join(cwd, 'apps/sarabeth/last file'), join(cwd, 'apps/carolyn/ new\n file '));
  const head = commit(cwd, Array.from({ length: 3500 }, (_, i) => `apps/paul/file ${i}`));
  const result = detect(cwd, base, head);
  expect(result.paths.length).toBe(3502); expect(result.paths).toContain('apps/carolyn/ new\n file ');
  expect(result.selected).toEqual(selected('sarabeth', 'carolyn', 'paul'));
});
test('full history after unrelated-history import; release freshness is site scoped', () => {
  const cwd = repo(), base = commit(cwd, ['README.md']);
  git(cwd, 'checkout', '--orphan', 'import'); git(cwd, 'rm', '-rf', '.'); commit(cwd, ['apps/sarabeth/a']);
  git(cwd, 'checkout', 'main'); git(cwd, '-c', 'core.hooksPath=/dev/null', 'merge', '--allow-unrelated-histories', 'import', '-m', 'test(ci): import');
  const tested = git(cwd, 'rev-parse', 'HEAD');
  expect(detect(cwd, base, tested).selected).toEqual(selected('sarabeth'));
  const unrelated = commit(cwd, ['apps/paul/b']);
  expect(releaseInputsDiffer(cwd, 'sarabeth', tested, unrelated)).toBe(false);
  const relevant = commit(cwd, ['apps/sarabeth/a']);
  expect(releaseInputsDiffer(cwd, 'sarabeth', tested, relevant)).toBe(true);
  const shared = commit(cwd, ['bun.lock']);
  for (const app of apps) expect(releaseInputsDiffer(cwd, app, relevant, shared)).toBe(true);
  const docs = commit(cwd, ['README.md']);
  expect(releaseInputsDiffer(cwd, 'sarabeth', shared, docs)).toBe(true);
  expect(() => releaseInputsDiffer(cwd, 'bad', base, docs)).toThrow();
  expect(() => releaseInputsDiffer(cwd, 'paul', 'missing', docs)).toThrow();
});
test('allowlist rejects absent/string/extra app selection values', () => {
  for (const value of [null, {}, { ...selected(), paul: 'false' }, { ...selected(), other: false }]) expect(() => validateSelection(value)).toThrow();
});
test('actual Git diff failure never reports empty scope', () => {
  const cwd = repo(), base = commit(cwd, ['README.md']), head = commit(cwd, ['apps/paul/a']);
  const bin = join(cwd, 'bin'); mkdirSync(bin);
  const realGit = Bun.spawnSync(['which', 'git']).stdout.toString().trim();
  writeFileSync(join(bin, 'git'), `#!/bin/sh\nif [ "$1" = diff ]; then exit 37; fi\nexec "${realGit}" "$@"\n`, { mode: 0o755 });
  const module = new URL('./affected.mjs', import.meta.url).href;
  const run = Bun.spawnSync(['node', '--input-type=module', '-e', `import {affected} from ${JSON.stringify(module)};console.log(JSON.stringify(affected({cwd:process.cwd(),event:'push',base:'${base}',head:'${head}'})))`], { cwd, env: { PATH: `${bin}:${process.env.PATH}` } });
  expect(run.exitCode).toBe(0); expect(JSON.parse(run.stdout.toString()).selected).toEqual(selected(...apps));
  expect(JSON.parse(run.stdout.toString()).reason).toBe('uninspectable-range-run-all');
});

test('non-UTF8 Git filename fails safely to all', () => {
  const cwd = repo(), base = commit(cwd, ['README.md']);
  // Git index plumbing avoids macOS filesystem UTF-8 restrictions.
  const blob = Bun.spawnSync(['git', 'hash-object', '-w', '--stdin'], {cwd, stdin: Buffer.from('fixture')}).stdout.toString().trim();
  const entry = Buffer.concat([Buffer.from(`100644 ${blob}\tapps/paul/`), Buffer.from([255, 0])]);
  const update = Bun.spawnSync(['git', 'update-index', '-z', '--index-info'], {cwd, stdin: entry});
  expect(update.exitCode).toBe(0);
  const tree = git(cwd, 'write-tree');
  const head = git(cwd, 'commit-tree', tree, '-p', base, '-m', 'test(ci): byte path');
  expect(detect(cwd, base, head).selected).toEqual(selected(...apps));
  expect(detect(cwd, base, head).reason).toBe('uninspectable-range-run-all');
});
