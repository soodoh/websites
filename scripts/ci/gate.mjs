import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apps, validateSelection } from './affected.mjs';
export function checkGate(needs) {
  if (needs?.detect?.result !== 'success' || needs?.root?.result !== 'success') throw Error('Detection/root validation did not succeed');
  const selected = validateSelection(JSON.parse(needs.detect.outputs.selection));
  for (const app of apps) {
    const expected = selected[app] ? 'success' : 'skipped';
    if (needs[app]?.result !== expected) throw Error(`${app}: expected ${expected}, got ${needs[app]?.result}`);
  }
  return true;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkGate(JSON.parse(process.env.CI_NEEDS));
  console.log('CI gate passed');
}
