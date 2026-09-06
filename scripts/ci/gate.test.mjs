import { expect, test } from 'bun:test';
import { checkGate } from './gate.mjs';
function needs() { return { detect: { result: 'success', outputs: { selection: JSON.stringify({ sarabeth: true, carolyn: false, paul: false, diloreto: false }) } }, root: { result: 'success' }, sarabeth: { result: 'success' }, carolyn: { result: 'skipped' }, paul: { result: 'skipped' }, diloreto: { result: 'skipped' } }; }
test('selected success/unaffected skip passes; docs-only passes', () => {
  expect(checkGate(needs())).toBe(true);
  const n = needs(); n.detect.outputs.selection = JSON.stringify({ sarabeth: false, carolyn: false, paul: false, diloreto: false }); n.sarabeth.result = 'skipped';
  expect(checkGate(n)).toBe(true);
});
for (const job of ['detect', 'root', 'sarabeth']) for (const result of ['failure', 'cancelled', 'skipped', undefined]) test(`${job} ${result} fails gate`, () => { const n = needs(); n[job].result = result; expect(() => checkGate(n)).toThrow(); });
test('unexpected running unaffected suite or malformed selection fails', () => {
  const n = needs(); n.paul.result = 'success'; expect(() => checkGate(n)).toThrow();
  n.paul.result = 'skipped'; n.detect.outputs.selection = '{}'; expect(() => checkGate(n)).toThrow();
});
