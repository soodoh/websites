// Synthetic loopback-only exercise of the same browser guards used by acceptance.
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import guard from './paul_acceptance_guard.cjs';
import lighthouseGuard from './paul_lighthouse_guard.cjs';
import { installRecoveryBrowserGuard } from '../../apps/paul/scripts/recovery-browser-guard.mjs';
const appRequire = createRequire(new URL('../../apps/paul/package.json', import.meta.url));
const { chromium } = appRequire('@playwright/test');
assert.equal(process.env.PAUL_ACCEPTANCE_MODE, 'fixture');
let escaped = 0, foreign = 0, upgrades = 0;
const server = http.createServer((request, response) => {
  if (request.url === '/redirect' || request.url === '/empty-redirect') {
    response.writeHead(302, { Location: request.url === '/redirect' ? '/escaped' : '' }).end(); return;
  }
  if (request.url === '/foreign-redirect') {
    response.writeHead(302, { Location: 'http://127.0.0.1:3001/escaped' }).end(); return;
  }
  if (request.url === '/escaped') escaped++;
  response.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><html><body>synthetic guard control</body></html>');
});
server.on('upgrade', (_request, socket) => { upgrades++; socket.destroy(); });
const other = http.createServer((_request, response) => { foreign++; response.end('forbidden'); });
other.on('upgrade', (_request, socket) => { upgrades++; socket.destroy(); });
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(3000, '127.0.0.1', resolve); });
await new Promise((resolve, reject) => { other.once('error', reject); other.listen(3001, '0.0.0.0', resolve); });
try {
  for (const runner of ['playwright', 'lighthouse']) {
    const browser = await chromium.launch({ headless: true, args: [...guard.browserArgs(), ...(runner === 'lighthouse' ? ['--remote-debugging-port=9222'] : [])],
      ...(runner === 'lighthouse' ? { executablePath: '/opt/chrome/chrome-linux64/chrome' } : {}) });
    try {
      const context = await browser.newContext({ serviceWorkers: 'block' });
      if (runner === 'playwright') await installRecoveryBrowserGuard(context, guard.LOCAL, 'fixture');
      else {
        const endpoint = await (await fetch('http://127.0.0.1:9222/json/version')).json();
        await lighthouseGuard({ wsEndpoint: () => endpoint.webSocketDebuggerUrl, close: () => browser.close() });
      }
      const page = await context.newPage();
      assert.equal((await page.goto(guard.LOCAL)).status(), 200);
      assert.match(await page.textContent('body'), /synthetic guard control/);
      const denied = await page.evaluate(async () => {
        const urls = ['/redirect', '/empty-redirect', '/foreign-redirect',
          'http://127.0.0.1:3001/escaped', 'http://localhost:3001/escaped',
          'http://127.0.0.2:3001/escaped', 'http://2130706433:3001/escaped',
          'http://[::1]:3001/escaped', 'https://foreign.invalid/escaped',
          'https://pauldiloreto.com/escaped'];
        const results = await Promise.all(urls.map(url => fetch(url).then(() => false, () => true)));
        const sockets = await Promise.all(['ws://127.0.0.1:3000/ws', 'ws://127.0.0.1:3001/ws',
          'wss://foreign.invalid/ws'].map(url => new Promise(resolve => {
          const socket = new WebSocket(url);
          socket.onopen = () => { socket.close(); resolve(false); };
          socket.onerror = () => resolve(true);
          socket.onclose = () => resolve(true);
          setTimeout(() => { socket.close(); resolve(true); }, 2000);
        })));
        return [...results, ...sockets];
      });
      assert.deepEqual(denied, Array(13).fill(true));
      assert.equal(escaped, 0); assert.equal(foreign, 0); assert.equal(upgrades, 0);
      console.log(`${runner}: local control + 13 redirect/origin/WebSocket/IP/proxy-bypass denials; zero foreign/escape/upgrade requests`);
    } finally { await browser.close(); }
  }
} finally {
  server.closeAllConnections(); other.closeAllConnections();
  await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => other.close(resolve))]);
}
