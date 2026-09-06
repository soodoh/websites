import { execFileSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const config = JSON.parse(readFileSync(new URL('../../config/ci-scopes.json', import.meta.url)));
export const apps = ['sarabeth', 'carolyn', 'paul', 'diloreto'];
if (JSON.stringify(Object.keys(config.apps)) !== JSON.stringify(apps)) throw Error('Invalid scope allowlist');
const shaPattern = /^[0-9a-f]{40}$/;
const all = () => Object.fromEntries(apps.map(app => [app, true]));
export function validateSelection(selection) {
  if (!selection || Object.keys(selection).length !== 4 || apps.some(app => typeof selection[app] !== 'boolean')) throw Error('Invalid app selection');
  return selection;
}
export function selectPaths(paths, release = false) {
  const selected = Object.fromEntries(apps.map(app => [app, false]));
  for (const path of paths) {
    if (!path || path.startsWith('/') || path.split('/').includes('..')) return all();
    const app = apps.find(app => path.startsWith(config.apps[app].prefix) || path === config.apps[app].workflow);
    if (app) selected[app] = true;
    else if (release || !config.ciOnlySafeDocs.includes(path)) return all();
  }
  return selected;
}
export function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd();
}
function checkHistory(cwd, base, head) {
  if (![base, head].every(sha => shaPattern.test(sha) && !/^0+$/.test(sha))) throw Error('Missing or invalid immutable SHA');
  if (git(cwd, 'rev-parse', '--is-shallow-repository') !== 'false') throw Error('Insufficient history');
  for (const sha of [base, head]) git(cwd, 'cat-file', '-e', `${sha}^{commit}`);
}
function pathsBetween(cwd, base, head) {
  // No rename collapsing: a cross-app move is a deletion plus an addition.
  // Do not trim: whitespace is legal in Git paths; the final NUL is mandatory.
  const buffer = execFileSync('git', ['diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--name-only', '-z', base, head, '--'], { cwd, maxBuffer: 128 * 1024 * 1024 });
  if (buffer.length && buffer.at(-1) !== 0) throw Error('Truncated diff');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  return text ? text.slice(0, -1).split('\0') : [];
}
export function affected({ cwd = process.cwd(), event, base, head, forceAll = false }) {
  const result = { schemaVersion: 1, event, base: base ?? null, head: head ?? null, diffBase: null, selected: all(), reason: 'fail-safe', paths: [] };
  try {
    if (forceAll || event === 'workflow_dispatch') { result.reason = 'forced-baseline'; return result; }
    if (!['pull_request', 'push'].includes(event)) throw Error('Unsupported event; merge queue is unconfigured');
    checkHistory(cwd, base, head);
    let diffBase = base;
    if (event === 'push') git(cwd, 'merge-base', '--is-ancestor', base, head);
    else {
      const bases = git(cwd, 'merge-base', '--all', base, head).split('\n');
      if (bases.length !== 1 || !shaPattern.test(bases[0])) throw Error('Missing or ambiguous merge base');
      diffBase = bases[0];
    }
    result.paths = pathsBetween(cwd, diffBase, head);
    result.diffBase = diffBase;
    result.selected = selectPaths(result.paths);
    result.reason = 'complete-git-diff';
  } catch { result.reason = 'uninspectable-range-run-all'; }
  return result;
}
export function releaseInputsDiffer(cwd, app, base, head) {
  if (!apps.includes(app)) throw Error('Unknown site');
  // Freshness is fail-closed, not an authorization decision. No CI docs exclusions.
  checkHistory(cwd, base, head);
  return selectPaths(pathsBetween(cwd, base, head), true)[app];
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'release-inputs') {
    const [, , , app, base, head] = process.argv;
    console.log(JSON.stringify({ schemaVersion: 1, app, base, head, differs: releaseInputsDiffer(process.cwd(), app, base, head) }));
  } else {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const name = process.env.GITHUB_EVENT_NAME;
    const result = affected({ event: name, base: name === 'pull_request' ? event.pull_request?.base?.sha : event.before, head: name === 'pull_request' ? event.pull_request?.head?.sha : event.after, forceAll: process.env.CI_FORCE_ALL === 'true' });
    validateSelection(result.selected);
    console.log(JSON.stringify(result));
    if (process.env.GITHUB_OUTPUT) {
      for (const app of apps) appendFileSync(process.env.GITHUB_OUTPUT, `${app}=${result.selected[app]}\n`);
      appendFileSync(process.env.GITHUB_OUTPUT, `selection=${JSON.stringify(result.selected)}\nbase=${shaPattern.test(result.base ?? '') ? result.base : ''}\nhead=${shaPattern.test(result.head ?? '') ? result.head : ''}\n`);
    }
  }
}
