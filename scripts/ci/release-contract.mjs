// Pure offline contracts, NOT a GitHub provenance oracle, lock or deployment entry point.
// Trusted adapters must supply attempt-specific observations and serialized durable state.
import { readFileSync } from 'node:fs';
import { apps, git, releaseInputsDiffer } from './affected.mjs';

export const releasePolicy = JSON.parse(readFileSync(new URL('../../config/release-policy.json', import.meta.url)));
export const CI_WORKFLOW = '.github/workflows/ci.yml';
export const RECOVERY_WORKFLOW = '.github/workflows/release-site.yml';
const mainRef = 'refs/heads/main';
const sha = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value) && !/^0+$/.test(value);
const id = value => typeof value === 'string' && /^[1-9][0-9]*$/.test(value);
const hash = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
function requireThat(condition, message) { if (!condition) throw Error(message); }
function siteConfig(policy, site) {
  requireThat(apps.includes(site) && policy?.schemaVersion === 1 && policy.repository === 'soodoh/websites', 'Invalid release policy/site');
  const config = policy.sites?.[site];
  requireThat(config && id(policy.repositoryId) && id(policy.ownerId), 'Missing repository identity configuration');
  return config;
}
function identity(policy, observation) {
  requireThat(observation && observation.repository === policy.repository && observation.headRepository === policy.repository && observation.repositoryId === policy.repositoryId && observation.ownerId === policy.ownerId, 'Untrusted repository identity');
}
function ancestor(cwd, base, head) {
  requireThat(sha(base) && sha(head), 'Invalid immutable commit');
  requireThat(git(cwd, 'rev-parse', '--is-shallow-repository') === 'false', 'Insufficient history');
  git(cwd, 'merge-base', '--is-ancestor', base, head);
}

/** Compare trusted execution context with reviewed configuration BEFORE credential jobs. */
export function checkReleaseAuthorization(policy, site, mode, context) {
  const config = siteConfig(policy, site);
  requireThat(['automatic', 'manual'].includes(mode), 'Unsupported release mode');
  requireThat(config[`${mode}Enabled`] === true, 'Release path disabled');
  requireThat(/^\d{12}$/.test(config.account) && typeof config.region === 'string' && /^[a-z]{2}-[a-z]+-\d$/.test(config.region), 'Missing account/region configuration');
  requireThat(typeof config.environment === 'string' && config.environment.length > 0 && config.concurrency === ({ paul: 'portfolio-production', diloreto: 'diloreto-production', carolyn: 'carolyn-production', sarabeth: 'sarabeth-production' })[site], 'Invalid environment/concurrency configuration');
  requireThat(typeof config.roleArn === 'string' && config.roleArn.startsWith(`arn:aws:iam::${config.account}:role/`) && /^arn:aws:iam::\d{12}:role\/[\w+=,.@/-]+$/.test(config.roleArn), 'Missing exact role configuration');
  requireThat(typeof config.appId === 'string' && /^d[a-z0-9]+$/.test(config.appId), 'Missing app configuration');
  // Subjects are observed, not inferred from repo names, creation dates or branch refs.
  requireThat(typeof config.oidcSubject === 'string' && config.oidcSubject.length > 0 && !/[?*\s]/.test(config.oidcSubject), 'Missing exact OIDC subject');
  identity(policy, context);
  requireThat(context.site === site && context.account === config.account && context.region === config.region && context.environment === config.environment && context.roleArn === config.roleArn && context.appId === config.appId && context.oidcSubject === config.oidcSubject && context.audience === 'sts.amazonaws.com', 'Release identity mismatch');
  requireThat(context.event === (mode === 'automatic' ? 'push' : 'workflow_dispatch') && context.ref === mainRef && context.workflow === (mode === 'automatic' ? CI_WORKFLOW : RECOVERY_WORKFLOW), 'Untrusted release entry point');
  requireThat(sha(context.workflowSha) && id(context.runId) && id(context.runAttempt), 'Invalid execution identity');
  requireThat(id(policy.validationWorkflowIds?.[context.workflow]) && context.workflowId === policy.validationWorkflowIds[context.workflow], 'Untrusted workflow ID');
  return { site, environment: config.environment, concurrency: config.concurrency, account: config.account };
}

/** Validation receipt is a separate namespace; it never edits a schema-v1 marker. */
export function validateReleaseEvidence({ cwd, policy, site, selected, observed, recovery = null }) {
  siteConfig(policy, site);
  requireThat(selected && sha(selected.commit) && id(selected.runId) && id(selected.runAttempt), 'Missing selected validation identity');
  identity(policy, observed);
  requireThat(id(policy.validationWorkflowIds?.[observed.workflow]) && observed.workflowId === policy.validationWorkflowIds[observed.workflow], 'Untrusted validation workflow ID');
  requireThat(observed.ref === mainRef && observed.site === site && observed.runId === selected.runId && observed.runAttempt === selected.runAttempt && observed.checkoutSha === selected.commit, 'Validation selection mismatch');
  requireThat(observed.status === 'completed' && observed.siteResult === 'success' && observed.rootResult === 'success' && observed.siteSelected === true, 'Required site/root validation did not succeed');
  requireThat(sha(observed.workflowSha) && sha(observed.eventHeadSha), 'Missing workflow/event commit');
  // No PR source head OR synthetic merge checkout is a production validation event.
  if (observed.workflow === CI_WORKFLOW) {
    requireThat(observed.event === 'push' && observed.eventHeadSha === selected.commit && observed.workflowSha === selected.commit && recovery === null, 'Not trusted main-push validation');
  } else {
    requireThat(observed.workflow === RECOVERY_WORKFLOW && observed.event === 'workflow_dispatch', 'Not trusted release-site validation');
    requireThat(recovery?.kind === 'website-release-recovery' && recovery.schemaVersion === 1 && recovery.releaseAuthorized === false && recovery.site === site && recovery.repository === policy.repository && recovery.ref === mainRef && recovery.commit === selected.commit && recovery.runId === selected.runId && recovery.runAttempt === selected.runAttempt && recovery.workflowSha === observed.workflowSha && observed.eventHeadSha === observed.workflowSha, 'Recovery requires fresh invocation-bound validation');
  }
  ancestor(cwd, selected.commit, selected.mainSha);
  ancestor(cwd, observed.workflowSha, selected.mainSha);
  const receipt = {
    schemaVersion: 1, kind: 'website-release-validation', repository: policy.repository,
    repositoryId: policy.repositoryId, ownerId: policy.ownerId, site,
    commit: selected.commit, workflow: observed.workflow, workflowId: observed.workflowId,
    workflowSha: observed.workflowSha, eventHeadSha: observed.eventHeadSha,
    event: observed.event, ref: mainRef, runId: selected.runId, runAttempt: selected.runAttempt,
    releaseAuthorized: false,
  };
  return receipt;
}

/** Bind unchanged v1 metadata to separately observed validation; byte verification is additional. */
export function bindCiArtifact(receipt, metadata) {
  requireThat(receipt?.kind === 'website-release-validation' && receipt.schemaVersion === 1 && receipt.releaseAuthorized === false && receipt.repository === 'soodoh/websites' && id(receipt.repositoryId) && id(receipt.ownerId) && id(receipt.workflowId) && id(receipt.runId) && id(receipt.runAttempt) && sha(receipt.commit) && receipt.workflowSha === receipt.commit && receipt.eventHeadSha === receipt.commit && receipt.ref === mainRef && receipt.workflow === CI_WORKFLOW && receipt.event === 'push', 'Not CI main-push validation');
  requireThat(metadata && metadata.schemaVersion === 1 && metadata.releaseAuthorized === false && ['paul', 'diloreto'].includes(receipt.site), 'Not validation-only static metadata');
  for (const key of ['repository', 'site', 'commit', 'workflow', 'event', 'ref', 'runId', 'runAttempt']) requireThat(metadata[key] === receipt[key], `Artifact identity mismatch: ${key}`);
  const releaseId = `${receipt.site}-${receipt.runId}-${receipt.runAttempt}`;
  requireThat(metadata.releaseId === releaseId && metadata.artifactName === `${releaseId}-static` && metadata.deploymentRoot === 'dist/client' && hash(metadata.sha256), 'Invalid artifact identity/hash');
  return { schemaVersion: 1, kind: 'website-release-artifact-binding', validation: structuredClone(receipt), artifact: structuredClone(metadata), releaseAuthorized: false };
}

/** Call under the site's lock using fresh immutable main + durable high-watermark observations. */
export function planRelease({ cwd, site, commit, mainSha, state }) {
  requireThat(apps.includes(site), 'Unknown site');
  requireThat(state?.schemaVersion === 1 && state.repository === 'soodoh/websites' && state.site === site && sha(state.highWatermark), 'Missing initialized release state; approved bootstrap required');
  ancestor(cwd, commit, mainSha);
  ancestor(cwd, state.highWatermark, mainSha);
  const result = reason => ({ site, commit, mainSha, highWatermark: state.highWatermark, decision: reason, recoveryAction: `release-site(site=${site}, ref=main)` });
  if (commit === state.highWatermark) return result('already-released');
  // A same-input older run/attempt must never lower the deployment watermark.
  try { ancestor(cwd, state.highWatermark, commit); } catch { return result('obsolete-or-divergent'); }
  if (releaseInputsDiffer(cwd, site, commit, mainSha)) return result('requires-fresh-validation');
  return result('eligible');
}

/** No ref resolution or dispatch side effects. Adapter resolves main once, then checks out SHA. */
export function planRecovery({ cwd, policy, site, ref = 'main', mainSha, context }) {
  siteConfig(policy, site);
  identity(policy, context);
  requireThat(ref === 'main' && context.site === site && context.ref === mainRef && context.event === 'workflow_dispatch' && context.workflow === RECOVERY_WORKFLOW && id(context.runId) && id(context.runAttempt), 'Untrusted recovery request');
  requireThat(id(policy.validationWorkflowIds?.[RECOVERY_WORKFLOW]) && context.workflowId === policy.validationWorkflowIds[RECOVERY_WORKFLOW], 'Untrusted recovery workflow ID');
  ancestor(cwd, context.workflowSha, mainSha);
  return { schemaVersion: 1, kind: 'website-release-recovery', repository: policy.repository, site, ref: mainRef, commit: mainSha, workflowSha: context.workflowSha, runId: context.runId, runAttempt: context.runAttempt, releaseAuthorized: false };
}

/** Explain replaced/skipped work without trusting queue order or advancing release state. */
export function recoveryNotice(site, work) {
  requireThat(apps.includes(site) && Array.isArray(work), 'Invalid reconciliation inventory');
  const incomplete = work.map(item => {
    requireThat(item?.site === site && sha(item.commit) && id(item.runId) && id(item.runAttempt) && ['success', 'failure', 'cancelled', 'skipped', 'pending', 'in_progress'].includes(item.result), 'Malformed reconciliation work');
    return { ...item };
  }).filter(item => item.result !== 'success');
  return { site, incomplete, recoveryAction: `release-site(site=${site}, ref=main)`, automaticRetry: false };
}
