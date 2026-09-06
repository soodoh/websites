import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { git, apps } from '../ci/affected.mjs';

// This runs in the trusted workflow checkout BEFORE any selected-source lifecycle.
const site = process.env.RELEASE_SITE;
const ref = process.env.SELECTED_REF;
if (!apps.includes(site)) throw Error('Unknown site');
const redeploy = process.env.GITHUB_WORKFLOW_REF?.startsWith('soodoh/websites/.github/workflows/redeploy-diloreto.yml@');
if (!redeploy && ref !== 'main') throw Error('release-site recovery selects main only');
if (redeploy && site !== 'diloreto') throw Error('Wrong redeploy site');
if (!ref || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(ref) || ref.includes('..') || ref.startsWith('refs/pull/')) throw Error('Invalid ref selector');
const cwd = process.cwd();
const main = JSON.parse(execFileSync('gh', ['api', 'repos/soodoh/websites/git/ref/heads/main'], { encoding: 'utf8' })).object.sha;
if (!/^[0-9a-f]{40}$/.test(main)) throw Error('Invalid trusted main SHA');
git(cwd, 'fetch', '--no-tags', 'origin', main);
let commit = main;
if (ref !== 'main') {
  // Remote branch/tag ambiguity is rejected instead of relying on Git's precedence.
  const refs = git(cwd, 'ls-remote', 'origin', `refs/heads/${ref}`, `refs/tags/${ref}`, ref).split('\n').filter(Boolean);
  if (!/^[0-9a-f]{40}$/.test(ref) && refs.length !== 1) throw Error('Missing/ambiguous ref');
  git(cwd, 'fetch', '--no-tags', 'origin', ref);
  commit = git(cwd, 'rev-parse', '--verify', 'FETCH_HEAD^{commit}');
}
git(cwd, 'merge-base', '--is-ancestor', commit, main);
for (const path of ['bun.lock', 'package.json', `apps/${site}/package.json`]) git(cwd, 'cat-file', '-e', `${commit}:${path}`);
appendFileSync(process.env.GITHUB_OUTPUT, `commit=${commit}\nmain=${main}\n`);
