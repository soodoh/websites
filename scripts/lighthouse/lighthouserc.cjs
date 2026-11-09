// biome-ignore-all lint/suspicious/noUndeclaredEnvVars: Internal child-process variables set by run.mjs, not Turbo task inputs.
const { lighthouseConfig } = require("./policy.cjs");

module.exports = lighthouseConfig(
	process.env.LHCI_SITE,
	process.env.LHCI_FORM_FACTOR,
);
