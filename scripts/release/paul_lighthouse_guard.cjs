// Install before Lighthouse can create/navigate a page; pause new targets until guarded.
const { origin, allowed } = require('./paul_acceptance_guard.cjs');
module.exports = async browser => {
  if (browser.__paulGuard) return;
  const target = origin(process.env.PAUL_ACCEPTANCE_MODE);
  const socket = new WebSocket(browser.wsEndpoint());
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let next = 0;
  const pending = new Map();
  const guarded = new Set();
  function send(method, params = {}, sessionId) {
    const id = ++next;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  async function guard(sessionId) {
    if (guarded.has(sessionId)) return;
    guarded.add(sessionId);
    await send('Network.enable', {}, sessionId);
    await send('Network.setBlockedURLs', { urls: ['ws://*', 'wss://*'] }, sessionId);
    await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }, { urlPattern: '*', requestStage: 'Response' }] }, sessionId);
    await send('Runtime.runIfWaitingForDebugger', {}, sessionId);
  }
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id); pending.delete(message.id);
      if (message.error) request?.reject(Error('Candidate CDP guard unavailable'));
      else request?.resolve(message.result);
      return;
    }
    const task = async () => {
      const { method, params, sessionId } = message;
      if (method === 'Target.attachedToTarget') {
        if (params.targetInfo.type === 'page') await guard(params.sessionId);
        else {
          // No service/shared workers or arbitrary execution targets in acceptance.
          await send('Target.closeTarget', { targetId: params.targetInfo.targetId });
        }
      }
      if (method === 'Fetch.requestPaused') {
        const redirect = params.responseStatusCode >= 300 && params.responseStatusCode < 400 &&
          params.responseHeaders?.some(header => header.name.toLowerCase() === 'location');
        if (!allowed(params.request.url, target) || redirect) {
          await send('Fetch.failRequest', { requestId: params.requestId, errorReason: 'BlockedByClient' }, sessionId);
        } else {
          await send('Fetch.continueRequest', { requestId: params.requestId }, sessionId);
        }
      }
    };
    task().catch(() => { console.error('Candidate browser guard failed closed'); browser.close().finally(() => process.exit(1)); });
  });
  await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
  const targets = await send('Target.getTargets');
  for (const info of targets.targetInfos.filter(info => info.type === 'page')) {
    const attached = await send('Target.attachToTarget', { targetId: info.targetId, flatten: true });
    await guard(attached.sessionId);
  }
  browser.__paulGuard = socket;
};
