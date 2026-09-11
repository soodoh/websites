const baseline = require('../../apps/paul/lighthouserc.cjs');
const guard = require('./paul_acceptance_guard.cjs');
const target = guard.origin(process.env.PAUL_ACCEPTANCE_MODE);
if (process.env.PAUL_RECOVERY_ORIGIN !== target) throw Error('Wrong candidate origin');
const settings = { ...baseline.ci.collect.settings };
delete settings.chromeFlags; // The runner starts the guarded exact Chrome before LHCI connects.
settings.port = 9222;
settings.hostname = '127.0.0.1';
module.exports = { ci: {
  collect: {
    numberOfRuns: baseline.ci.collect.numberOfRuns,
    url: [target + '/'], settings,
    // If the prepared guarded browser disappears, fail rather than launch an unguarded one.
    chromePath: '/bin/false',
  },
  assert: baseline.ci.assert,
  upload: { target: 'filesystem', outputDir: '.lighthouseci/candidate-reports' },
} };
