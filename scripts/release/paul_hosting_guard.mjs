import guard from './paul_acceptance_guard.cjs';
const target = guard.origin(process.env.PAUL_ACCEPTANCE_MODE);
if (process.env.HOSTING_BASE_URL !== target || process.env.HOSTING_EXPECT_DOMAIN_REDIRECTS !== '0') throw Error('Wrong candidate hosting target');
const fetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = input instanceof Request ? input.url : String(input);
  if (!guard.allowed(url, target)) throw Error('Candidate hosting origin refused');
  const response = await fetch(input, { ...options, redirect: 'manual' });
  if (response.url !== url || (response.status >= 300 && response.status < 400 && response.headers.has('location'))) {
    await response.body?.cancel(); throw Error('Candidate hosting redirect refused');
  }
  return response;
};
await import('../../apps/paul/scripts/hosting-smoke.mjs');
