// Bounded metric-only export before ephemeral report storage disappears; never export page/trace data.
const fs = require('node:fs');
const path = require('node:path');
const numeric = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
function numbers(value, keys) {
  return Object.fromEntries(keys.map(key => [key, numeric(value?.[key])]));
}
function summarize(lhr) {
  const audits = lhr.audits || {};
  const settings = lhr.configSettings || {};
  return {
    lighthouseVersion: /^\d+(\.\d+){2}$/.test(lhr.lighthouseVersion) ? lhr.lighthouseVersion : null,
    chromeVersion: lhr.environment?.hostUserAgent?.match(/Chrome\/(\d+(?:\.\d+){3})/)?.[1] || null,
    performance: numeric(lhr.categories?.performance?.score),
    metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time',
      'cumulative-layout-shift', 'speed-index'].map(key => [key, numeric(audits[key]?.numericValue)])),
    benchmarkIndex: numeric(lhr.environment?.benchmarkIndex),
    timing: numbers(lhr.timing, ['total']),
    throttlingMethod: ['simulate', 'devtools', 'provided'].includes(settings.throttlingMethod) ? settings.throttlingMethod : null,
    throttling: numbers(settings.throttling, ['rttMs', 'throughputKbps', 'requestLatencyMs', 'downloadThroughputKbps', 'uploadThroughputKbps', 'cpuSlowdownMultiplier']),
    formFactor: ['mobile', 'desktop'].includes(settings.formFactor) ? settings.formFactor : null,
    screenEmulation: numbers(settings.screenEmulation, ['width', 'height', 'deviceScaleFactor']),
    // Only identifiers/counts; warning prose can contain page-derived URLs or other data.
    runWarningCount: Array.isArray(lhr.runWarnings) ? lhr.runWarnings.length : 0,
    auditWarnings: Object.entries(audits).filter(([key, audit]) => /^[a-z0-9-]{1,80}$/.test(key) &&
      (audit.warnings?.length || audit.errorMessage)).slice(0, 30).map(([audit, value]) =>
      ({ audit, count: Array.isArray(value.warnings) ? value.warnings.length : 0, error: Boolean(value.errorMessage) })),
  };
}
function exportMetrics(directory) {
  const reports = fs.readdirSync(directory).filter(name => /^lhr-[a-z0-9-]+\.json$/.test(name)).sort();
  if (reports.length > 3) throw Error('Unexpected Lighthouse report count');
  const result = reports.map(name => {
    const file = path.join(directory, name);
    if (fs.statSync(file).size > 8 * 1024 * 1024) throw Error('Oversized Lighthouse report');
    return summarize(JSON.parse(fs.readFileSync(file, 'utf8')));
  });
  const output = JSON.stringify({ schemaVersion: 1, reports: result });
  if (Buffer.byteLength(output) > 16384) throw Error('Oversized Lighthouse metric export');
  console.log('PAUL_ACCEPTANCE_LIGHTHOUSE_METRICS ' + output);
}
module.exports = { summarize, exportMetrics };
