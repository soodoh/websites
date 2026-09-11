import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const pins = JSON.parse(read('config/paul-legacy-recovery.json'));
const templateText = read('apps/paul/infra/amplify-hosting.yaml');
// Bun preserves scalar/sequence values, not CloudFormation tag semantics. Assert tags separately.
const template = Bun.YAML.parse(templateText);
const guard = await import('../release/paul_acceptance_guard.cjs');
const metrics = await import('../release/paul_lighthouse_metrics.cjs');

test('existing restore-static keeps production default and independently locks protected Paul recovery', () => {
  const workflow = Bun.YAML.parse(read('.github/workflows/restore-static.yml'));
  expect(workflow.on.workflow_dispatch.inputs.operation).toMatchObject({ default: 'restore', options: ['restore', 'bootstrap', 'rehearsal'] });
  expect(workflow.jobs.paul.with.operation).toBe('restore');
  expect(workflow.jobs.diloreto.with.operation).toBe('restore');
  const job = workflow.jobs.recovery;
  expect(job.if).toBe('${{ false }}');
  expect(job.environment).toBe('production-portfolio');
  expect(job.concurrency).toEqual({ group: 'portfolio-production', 'cancel-in-progress': false });
  expect(job.permissions).toEqual({ contents: 'read', actions: 'read', checks: 'read', 'id-token': 'write' });
  expect(workflow.permissions).toEqual({ contents: 'read' });
  expect(job.steps[0].with).toEqual({ ref: '${{ github.workflow_sha }}', path: 'verification-harness', 'fetch-depth': 0, 'persist-credentials': false });
  expect(job.env.PAUL_BASELINE).toBe('${{ inputs.baseline }}');
  const commands = job.steps.filter(step => step.run).map(step => step.run).join('\n');
  expect(commands).not.toContain('${{');
  expect(commands).not.toContain('release_static');
  expect(commands).toContain('paul_recovery_entry.py check');
  expect(commands).toContain('paul_recovery_entry.py execute');
  const credentials = job.steps.findIndex(step => step.uses?.startsWith('aws-actions/'));
  expect(job.steps.slice(0, credentials).some(step => step.run?.includes('docker build --platform linux/amd64'))).toBe(true);
  expect(job.steps[credentials].with).toMatchObject({ 'allowed-account-ids': '658271954302', audience: 'sts.amazonaws.com', 'unset-current-credentials': true, 'role-session-name': 'paul-recovery-${{ github.run_id }}-${{ github.run_attempt }}' });
  expect(read('scripts/release/request.py')).toContain("dispatch.get('operation', 'restore') != 'restore'");
});

test('acceptance target is fixed; no arbitrary origin, proxy direct fallback or changed Lighthouse thresholds', () => {
  const target = guard.origin('candidate');
  expect(target).toBe('https://candidate.d121ux7va6hz6j.amplifyapp.com');
  expect(guard.origin('fixture')).toBe('http://127.0.0.1:3000');
  expect(() => guard.origin('production')).toThrow();
  expect(guard.allowed(target + '/release.json', target)).toBe(true);
  for (const url of ['https://pauldiloreto.com', 'https://www.pauldiloreto.com', 'https://foreign.invalid', 'http://127.0.0.1:3000', 'http://localhost:3000', 'http://[::1]:3000', 'http://2130706433:3000', 'https://user@candidate.d121ux7va6hz6j.amplifyapp.com', 'wss://candidate.d121ux7va6hz6j.amplifyapp.com', 'file:///tmp/a']) {
    expect(guard.allowed(url, target)).toBe(false);
  }
  expect(guard.browserArgs()).toContain('--proxy-bypass-list=<-loopback>');
  expect(guard.browserArgs().join(' ')).not.toContain('direct://');
  expect(read('scripts/release/paul_lighthouse.config.cjs')).toContain('assert: baseline.ci.assert');
  expect(read('scripts/release/paul_lighthouse.config.cjs')).toContain('numberOfRuns: baseline.ci.collect.numberOfRuns');
});

test('new acceptance image declares extraction prerequisite and keeps reports below nonroot tmpfs roots', () => {
  const dockerfile = read('scripts/release/Dockerfile.paul-acceptance');
  expect(dockerfile).toContain('apt-get install --no-install-recommends -y unzip');
  expect(dockerfile.indexOf('apt-get install')).toBeLessThan(dockerfile.indexOf('unzip -q'));
  expect(dockerfile).toContain('rm -rf /var/lib/apt/lists/* && unzip -v');
  expect(dockerfile).toContain('152.0.7977.77/linux64/chrome-linux64.zip');
  expect(dockerfile).toContain('USER 1000:1000');
  expect(dockerfile).not.toMatch(/chmod -R a\+rX \/work\s/);
  const config = read('scripts/release/paul_playwright.config.ts');
  expect(config).toContain('outputDir: "/work/apps/paul/test-results/run"');
  expect(config).toContain('outputFolder: "/work/apps/paul/playwright-report/run"');
});

test('ephemeral Lighthouse export projects only bounded metric fields, not URL/header/warning prose', () => {
  const secret = 'https://foreign.invalid/?signed=secret';
  const result = metrics.summarize({ lighthouseVersion: '12.6.1', requestedUrl: secret,
    environment: { hostUserAgent: 'HeadlessChrome/152.0.7977.77', benchmarkIndex: 123 },
    categories: { performance: { score: 0.77 } }, runWarnings: [secret],
    timing: { total: 100, entries: [{ headers: secret }] },
    configSettings: { throttlingMethod: 'simulate', throttling: { cpuSlowdownMultiplier: 4, headers: secret } },
    audits: { 'largest-contentful-paint': { numericValue: 4321, warnings: [secret], details: { cookies: secret } } },
  });
  expect(result.chromeVersion).toBe('152.0.7977.77');
  expect(result.performance).toBe(0.77);
  expect(result.metrics['largest-contentful-paint']).toBe(4321);
  expect(result.throttling.cpuSlowdownMultiplier).toBe(4);
  expect(result.runWarningCount).toBe(1);
  expect(result.auditWarnings).toEqual([{ audit: 'largest-contentful-paint', count: 1, error: false }]);
  expect(JSON.stringify(result)).not.toMatch(/foreign|signed|secret|cookies|headers/);
  expect(metrics.summarize({ categories: { performance: { score: Infinity } } }).performance).toBeNull();
});

test('Paul recovery record binds original identity and each exact key/version/length/digest', () => {
  expect(pins).toMatchObject({
    schemaVersion: 1, site: 'paul', repository: 'soodoh/portfolio-website', repositoryId: '81884767',
    ownerId: '18269267', workflow: '.github/workflows/deploy.yml', workflowId: '315997019',
    runId: '29767712137', runAttempt: '1', event: 'push', ref: 'refs/heads/main',
    commit: 'd351ff5fa1fca7795eac611b1e3c086277414fbb',
    sha256: '1c0c54b889ff620eefb60f50990cfa221e0036623f6b10a65246cd45ee58fc07',
    deploymentRoot: 'dist/client', expectedOwner: '658271954302',
    bucket: 'pauldiloreto-amplify-hosting-verifiedreleasebucket-idabawspxy3s',
    linkage: 'manually-reviewed-metadata-not-cryptographic-attestation',
  });
  expect(pins.objects).toEqual({
    'metadata.json': { key: 'releases/29767712137/1/metadata.json', versionId: 'MhK.Bce7aR9Y46DRlUVT10WURQehNjqQ', bytes: 221, sha256: '000ea6e8f6488c2f9960b13b705b24700fd6bd5c720282e4456181e311613c26' },
    'site.zip': { key: 'releases/29767712137/1/site.zip', versionId: 'lWxECRd492WB_Exz7n_B.VaCSHCoDdig', bytes: 2004287, sha256: pins.sha256 },
    'site.zip.sha256': { key: 'releases/29767712137/1/site.zip.sha256', versionId: 'PQ5U5IX4Hqn5wYkNRli5B5TLuROIh8DB', bytes: 75, sha256: 'fe1783ed89938e70487e1665adf0da1dd9a8a1fcdf596dd07f607efb82a6b9d7' },
  });
  expect(JSON.stringify(pins)).not.toMatch(/\/private\/tmp|\/Users\/|normalized|signature-verified/);
});

test('owning Paul IAM adds only individually version-conditioned recovery reads, exact optional bindings and no provider', () => {
  const policy = JSON.parse(read('config/release-policy.json'));
  const runtime = JSON.parse(read('config/release-runtime.json'));
  expect(template.Parameters.MonorepoSubject.Default).toBe('');
  expect(template.Parameters.MonorepoSubject.AllowedValues).toEqual(['', policy.sites.paul.oidcSubject]);
  expect(template.Parameters.MonorepoStateObjectArn.Default).toBe('');
  expect(template.Parameters.MonorepoStateObjectArn.AllowedValues).toEqual(['', `arn:aws:s3:::${runtime.sites.paul.stateBucket}/${runtime.sites.paul.stateKey}`]);
  const role = template.Resources.GitHubDeploymentRole.Properties;
  expect(role.AssumeRolePolicyDocument.Statement).toEqual([{
    Sid: 'GitHubProductionEnvironmentOnly', Effect: 'Allow',
    Principal: { Federated: 'GitHubOidcProviderArn' }, Action: 'sts:AssumeRoleWithWebIdentity',
    Condition: { StringEquals: {
      'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
      'token.actions.githubusercontent.com:sub': ['repo:${GitHubRepository}:environment:production', ['HasMonorepoSubject', 'MonorepoSubject', 'AWS::NoValue']],
    } },
  }]);
  expect(template.Parameters.GitHubRepository.Default).toBe('soodoh/portfolio-website');
  expect(role.Policies[0]).toEqual(['HasMonorepoState', {
    PolicyName: 'MonorepoReleaseState', PolicyDocument: {
      Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:GetObject', 's3:PutObject'], Resource: 'MonorepoStateObjectArn' }],
    },
  }, 'AWS::NoValue']);
  expect(role.Policies[1]).toEqual(['HasMonorepoSubject', {
    PolicyName: 'PinnedLegacyRecovery', PolicyDocument: {
      Version: '2012-10-17', Statement: Object.values(pins.objects).map(object => ({
        Effect: 'Allow', Action: 's3:GetObjectVersion', Resource: '${VerifiedReleaseBucket.Arn}/' + object.key,
        Condition: { StringEquals: { 's3:VersionId': object.versionId } },
      })),
    },
  }, 'AWS::NoValue']);
  expect(role.Policies).toHaveLength(3);
  expect(templateText.match(/Action: s3:GetObjectVersion/g)).toHaveLength(3);
  expect(templateText).toContain('HasMonorepoSubject: !Not [!Equals [!Ref MonorepoSubject, ""]]');
  expect(templateText).toContain('HasMonorepoState: !Not [!Equals [!Ref MonorepoStateObjectArn, ""]]');
  expect(templateText).toContain('- !If [HasMonorepoSubject, !Ref MonorepoSubject, !Ref AWS::NoValue]');
  expect(templateText).toContain('Resource: !Ref MonorepoStateObjectArn');
  for (const object of Object.values(pins.objects)) expect(templateText).toContain('Resource: !Sub ${VerifiedReleaseBucket.Arn}/' + object.key);
  expect(Object.keys(template.Resources).sort()).toEqual(['AmplifyApp', 'AmplifyDomain', 'CandidateBranch', 'GitHubDeploymentRole', 'HostedZone', 'ProductionBranch', 'VerifiedReleaseBucket'].sort());
  expect(templateText).not.toContain('AWS::IAM::OIDCProvider');
  expect(template.Resources.VerifiedReleaseBucket.DeletionPolicy).toBe('Retain');
  expect(template.Resources.VerifiedReleaseBucket.UpdateReplacePolicy).toBe('Retain');
  expect(template.Resources.VerifiedReleaseBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
});
