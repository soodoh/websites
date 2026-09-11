import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import guard from './paul_acceptance_guard.cjs';
import lighthouseGuard from './paul_lighthouse_guard.cjs';
import lighthouseMetrics from './paul_lighthouse_metrics.cjs';

const target = guard.origin(process.env.PAUL_ACCEPTANCE_MODE);
for (const name of Object.keys(process.env)) {
  if (/^(AWS_|GH_|GITHUB_|LHCI_|PLAYWRIGHT_BASE_URL|HOSTING_BASE_URL|HTTP_PROXY|HTTPS_PROXY|ALL_PROXY|DOCKER_)/.test(name)) throw Error('Unexpected acceptance environment');
}
await mkdir('/tmp/home', { recursive: true });
process.env.HOME = '/tmp/home';
Object.assign(process.env, {
  PAUL_RECOVERY_ORIGIN: target, HOSTING_BASE_URL: target, HOSTING_EXPECT_DOMAIN_REDIRECTS: '0',
  HOSTING_EXPECT_AMPLIFY: process.env.PAUL_ACCEPTANCE_MODE === 'candidate' ? '1' : '0',
  PLAYWRIGHT_EXPECT_STATIC_404: '1',
});
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(Error(`${command} acceptance exited ${code}`)));
  });
}
const proxy = await guard.startProxy(process.env.PAUL_ACCEPTANCE_MODE);
let server, chrome;
try {
  if (process.env.PAUL_ACCEPTANCE_MODE === 'fixture') {
    await run('node', ['/work/scripts/release/paul_guard_probe.mjs']);
    server = spawn('bun', ['scripts/serve-static.mjs'], { stdio: ['ignore', 'pipe', 'inherit'] });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Local fixture server unavailable')), 30000);
      server.once('error', reject);
      server.once('exit', () => reject(Error('Local fixture server failed')));
      server.stdout.on('data', data => { process.stdout.write(data); if (String(data).includes('Serving ')) { clearTimeout(timer); resolve(); } });
    });
  }
  await run('node', ['/work/scripts/release/paul_hosting_guard.mjs']);
  await run('bun', ['x', '--no-install', 'playwright', 'test', '--config', '/work/scripts/release/paul_playwright.config.ts']);
  chrome = spawn('/opt/chrome/chrome-linux64/chrome', [...guard.browserArgs(), '--headless=new',
    '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9222', '--user-data-dir=/tmp/lighthouse-profile', 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe'] });
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Pinned Lighthouse Chrome unavailable')), 30000);
    chrome.once('error', reject);
    chrome.once('exit', () => reject(Error('Pinned Lighthouse Chrome exited')));
    chrome.stderr.on('data', data => {
      const match = String(data).match(/DevTools listening on (ws:\/\/127\.0\.0\.1:9222\/devtools\/browser\/[a-z0-9-]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  await lighthouseGuard({ wsEndpoint: () => endpoint, close: async () => chrome.kill() });
  try {
    await run('bun', ['x', '--no-install', 'lhci', 'autorun', '--config=/work/scripts/release/paul_lighthouse.config.cjs']);
  } finally {
    // Export only sanitized metrics while tmpfs is mounted; never swallow the original failed gate.
    lighthouseMetrics.exportMetrics('/work/apps/paul/.lighthouseci');
  }
  console.log('Isolated candidate hosting/Playwright/Lighthouse accepted; NOT production acceptance.');
} finally {
  chrome?.kill(); server?.kill(); proxy.closeAllConnections(); proxy.close();
}
