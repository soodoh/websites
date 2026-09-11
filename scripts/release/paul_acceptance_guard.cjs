// Acceptance-only guard, not an AWS/GitHub transport or OS network sandbox.
const http = require('node:http');
const net = require('node:net');
const CANDIDATE = 'https://candidate.d121ux7va6hz6j.amplifyapp.com';
const LOCAL = 'http://127.0.0.1:3000';
function origin(mode) {
  if (mode === 'candidate') return CANDIDATE;
  if (mode === 'fixture') return LOCAL;
  throw Error('Explicit isolated acceptance mode required');
}
function allowed(value, target) {
  try {
    const url = new URL(value);
    return [CANDIDATE, LOCAL].includes(target) && url.origin === target && !url.username && !url.password;
  } catch { return false; }
}
function browserArgs() {
  return ['--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=http://127.0.0.1:3128',
    '--proxy-bypass-list=<-loopback>', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
    '--force-webrtc-ip-handling-policy=disable_non_proxied_udp', '--disable-quic',
    '--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run'];
}
async function startProxy(mode) {
  const target = origin(mode);
  const destination = new URL(target);
  const server = http.createServer((request, response) => {
    if (mode !== 'fixture' || !allowed(request.url, target) || request.method === 'CONNECT') {
      response.writeHead(403).end(); return;
    }
    const url = new URL(request.url);
    const headers = { ...request.headers, host: destination.host };
    delete headers['proxy-authorization'];
    delete headers['proxy-connection'];
    const upstream = http.request({ hostname: destination.hostname, port: 3000,
      path: url.pathname + url.search, method: request.method, headers }, remote => {
      response.writeHead(remote.statusCode, remote.headers); remote.pipe(response);
    });
    upstream.on('error', () => response.destroy());
    request.pipe(upstream);
  });
  server.on('connect', (request, socket, head) => {
    // No localhost exception in candidate mode; no arbitrary ports, userinfo, IP or DNS override.
    if (mode !== 'candidate' || request.url !== `${destination.hostname}:443`) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    const upstream = net.connect(443, destination.hostname, () => {
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) upstream.write(head);
      upstream.pipe(socket); socket.pipe(upstream);
    });
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
    socket.on('close', () => upstream.destroy());
  });
  // WebSocket upgrade requests never tunnel through the cleartext fixture proxy.
  server.on('upgrade', (_request, socket) => socket.destroy());
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(3128, '127.0.0.1', resolve); });
  return server;
}
module.exports = { origin, allowed, browserArgs, startProxy, CANDIDATE, LOCAL };
