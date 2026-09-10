import { expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const read = path => readFileSync(root + path, 'utf8');
const yaml = path => Bun.YAML.parse(read(path));
const deployFiles = ['_carolyn-release.yml', '_diloreto-release.yml', '_paul-release.yml', '_sarabeth-release.yml', 'infrastructure-sarabeth.yml', 'redeploy-diloreto.yml', 'release-after-ci.yml', 'release-reconciliation.yml', 'release-site.yml', 'restore-static.yml'];

const observationFiles = ['paul-identity-observation.yml'];

test('all production jobs/calls have literal false publication lock; no unexpected workflow escapes', () => {
  expect(readdirSync(root + '.github/workflows').sort()).toEqual([...deployFiles, ...observationFiles, 'ci.yml', '_carolyn-ci.yml', '_diloreto-ci.yml', '_paul-ci.yml', '_sarabeth-ci.yml'].sort());
  const runtime = JSON.parse(read('config/release-runtime.json'));
  expect(runtime.publicationLocked).toBe(true);
  expect(runtime.sites.sarabeth.candidateEnabled).toBe(false);
  expect(runtime.sites.sarabeth.switchEnabled).toBe(false);
  for (const filename of deployFiles) {
    const workflow = yaml('.github/workflows/' + filename);
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(workflow.on.pull_request_target).toBeUndefined();
    for (const job of Object.values(workflow.jobs)) {
      if (job.environment || job.permissions?.['id-token'] || job.permissions?.contents === 'write' || job.uses) expect(job.if).toBe('${{ false }}');
      if (!job.environment && !job.uses) {
        expect(job.permissions?.['id-token']).toBeUndefined();
        expect(job.permissions?.contents).not.toBe('write');
      }
      for (const step of job.steps ?? []) {
        if (step.uses && !step.uses.startsWith('./')) expect(step.uses).toMatch(/@[0-9a-f]{40}$/);
        if (step.uses?.startsWith('actions/checkout')) expect(step.with['persist-credentials']).toBe(false);
      }
    }
  }
});

test('Paul identity observation is exactly main-only protected manual observation, not release authority', () => {
  expect(observationFiles).toEqual(['paul-identity-observation.yml']);
  const path = '.github/workflows/paul-identity-observation.yml';
  // Whole-object equality closes event/job/step/input additions, not just known bad operations.
  expect(yaml(path)).toEqual({
    name: 'Paul protected identity observation',
    on: { workflow_dispatch: null },
    permissions: {},
    jobs: {
      observe: {
        if: "${{ github.repository == 'soodoh/websites' && github.repository_id == '1358469291' && github.repository_owner == 'soodoh' && github.repository_owner_id == '18269267' && github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && github.run_attempt == '1' && github.workflow_ref == 'soodoh/websites/.github/workflows/paul-identity-observation.yml@refs/heads/main' }}",
        'runs-on': 'ubuntu-24.04',
        environment: 'production-portfolio',
        'timeout-minutes': 5,
        concurrency: { group: 'paul-identity-observation', 'cancel-in-progress': false },
        permissions: { contents: 'read', 'id-token': 'write' },
        steps: [
          {
            uses: 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
            with: { ref: '${{ github.workflow_sha }}', 'fetch-depth': 1, 'persist-credentials': false },
          },
          {
            uses: 'actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97',
            with: { 'python-version': '3.14.6' },
          },
          {
            name: 'Validate checkout and context before decoded platform observation',
            shell: 'bash',
            env: {
              OBS_REPOSITORY: '${{ github.repository }}',
              OBS_REPOSITORY_ID: '${{ github.repository_id }}',
              OBS_REPOSITORY_OWNER: '${{ github.repository_owner }}',
              OBS_REPOSITORY_OWNER_ID: '${{ github.repository_owner_id }}',
              OBS_ENVIRONMENT: 'production-portfolio',
              OBS_EVENT_NAME: '${{ github.event_name }}',
              OBS_REF: '${{ github.ref }}',
              OBS_WORKFLOW_REF: '${{ github.workflow_ref }}',
              OBS_WORKFLOW_SHA: '${{ github.workflow_sha }}',
              OBS_SHA: '${{ github.sha }}',
              OBS_RUN_ID: '${{ github.run_id }}',
              OBS_RUN_ATTEMPT: '${{ github.run_attempt }}',
            },
            run: 'set +x\npython3 -I -B scripts/release/paul_identity_observation.py\n',
          },
        ],
      },
    },
  });
  expect(read(path)).not.toMatch(/secrets[.:]|GH_TOKEN|github\.token|aws-actions|actions\/(?:cache|upload-artifact|download-artifact)|(?:bun|pip|npm) install|GITHUB_(?:OUTPUT|ENV|STEP_SUMMARY)|deploy\.py|oidc\.py|workflow_call|inputs[.:]/);
  expect(JSON.parse(read('config/release-runtime.json')).entryWorkflowIds[path]).toBeUndefined();
  expect(JSON.parse(read('config/release-policy.json')).validationWorkflowIds[path]).toBeUndefined();
});

test('whole deployment and restoration share noncanceling app-specific critical section and trusted harness', () => {
  for (const site of ['paul', 'diloreto', 'carolyn', 'sarabeth']) {
    const workflow = yaml(`.github/workflows/_${site}-release.yml`), job = workflow.jobs.release;
    expect(job.concurrency).toEqual({ group: site === 'paul' ? 'portfolio-production' : `${site}-production`, 'cancel-in-progress': false });
    expect(job.environment).toBe(site === 'paul' ? 'production-portfolio' : `production-${site}`);
    expect(job.steps[0].with.ref).toBe('${{ github.workflow_sha }}');
    expect(job.steps[0].with.path).toBe('verification-harness');
    const install = job.steps.findIndex(step => step.run?.includes('bun install'));
    const config = job.steps.findIndex(step => step.id === 'config');
    const credentials = job.steps.findIndex(step => step.uses?.startsWith('aws-actions/'));
    expect(job.steps[install].run).toBe('bun install --frozen-lockfile --ignore-scripts');
    expect(install).toBeLessThan(config); expect(config).toBeLessThan(credentials);
    expect(job.steps[credentials].with['unset-current-credentials']).toBe(true);
    expect(job.steps[credentials].with.audience).toBe('sts.amazonaws.com');
    expect(job.steps[credentials].with['allowed-account-ids']).toMatch(/^\d{12}$/);
    expect(job.steps[credentials + 1].run).toContain(`scripts/release/deploy.py deploy ${site}`);
    expect(job.steps[credentials + 1]['working-directory']).toBe('verification-harness');
  }
  expect(yaml('.github/workflows/infrastructure-sarabeth.yml').jobs.cloudformation.concurrency.group).toBe('sarabeth-production');
});

test('recovery validates immutable selected SHA regardless push scope; DiLoreto manual ref is distinct', () => {
  for (const name of ['release-site.yml', 'redeploy-diloreto.yml']) {
    const workflow = yaml('.github/workflows/' + name);
    expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch']);
    expect(workflow.jobs.resolve.outputs.commit).toBe('${{ steps.select.outputs.commit }}');
    expect(workflow.jobs.root.name).toBe('release root validation');
    for (const [id, job] of Object.entries(workflow.jobs).filter(([id]) => id.endsWith('-validate'))) {
      expect(job.env.AWS_EC2_METADATA_DISABLED).toBe('true');
      expect(job.steps[0].with.ref).toBe('${{ github.workflow_sha }}');
      expect(job.steps[1].with.ref).toBe('${{ needs.resolve.outputs.commit }}');
      expect(job.steps.find(step => step.run?.includes('validate.sh')).run).toContain(id.replace('-validate', ''));
    }
  }
  const selector = read('scripts/release/select.mjs');
  expect(selector).toContain("if (!redeploy && ref !== 'main')");
  expect(selector).toContain("'merge-base', '--is-ancestor', commit, main");
  expect(selector).toContain('Missing/ambiguous ref');
  expect(read('.github/workflows/redeploy-diloreto.yml')).toContain('operation: redeploy');
});

test('SSR monorepo buildspec uses exact short roots, frozen root ignored lifecycles and production-only attestation', () => {
  const spec = yaml('amplify.yml');
  expect(spec.applications.map(app => app.appRoot)).toEqual(['apps/carolyn', 'apps/sarabeth']);
  for (const app of spec.applications) {
    expect(app.frontend.buildPath).toBe('/');
    expect(app.frontend.artifacts.baseDirectory).toBe(`${app.appRoot}/.amplify-hosting`);
    expect(app.frontend.phases.preBuild.commands).toContain('bun install --frozen-lockfile --ignore-scripts');
    expect(app.frontend.phases.preBuild.commands).toContain('nvm install 24.20.0');
    expect(app.frontend.phases.preBuild.commands).toContain('npm install --global bun@1.4.0');
    expect(app.frontend.cache).toBeUndefined();
  }
  const build = read('scripts/release/amplify-build.sh');
  expect(build).toContain('unset RELEASE_COMMIT GITHUB_SHA NODE_OPTIONS');
  expect(build).toContain('bun scripts/verify-amplify-source.ts');
  expect(build).toContain('RELEASE_COMMIT="$actual" AWS_COMMIT_ID="$actual"');
  expect(build).toContain('website-ssr-production');
  expect(build).not.toContain('dns-result-order=ipv4first');
});

test('Sarabeth infrastructure preserves legacy recovery and explicitly binds optional transition parameters', () => {
  const legacy = yaml('apps/sarabeth/.github/workflows/infrastructure.yaml').jobs.cloudformation;
  const active = yaml('.github/workflows/infrastructure-sarabeth.yml').jobs.cloudformation;
  const additions = ['Set up trusted Node', 'Set up trusted Bun', 'Install trusted root smoke tools before credentials', 'Fail closed before infrastructure credentials', 'Verify selected monorepo candidate before infrastructure mutation', 'Accept monorepo production before CMS retarget', 'Apply separately approved webhook target after production acceptance', 'Finish accepted monorepo switch without discarding previous recovery', 'Fail unresolved monorepo switch without blind rollback'];
  expect(active.steps.map(step => step.name).filter(name => !additions.includes(name))).toEqual(legacy.steps.map(step => step.name));
  const named = name => active.steps.findIndex(step => step.name === name);
  expect(named('Install trusted root smoke tools before credentials')).toBeLessThan(named('Configure protected infrastructure credentials'));
  expect(active.steps[named('Apply hosting stack')].if).toContain("inputs.operation != 'switch-monorepo'");
  expect(named('Validate canonical www redirects after activation')).toBeLessThan(named('Accept monorepo production before CMS retarget'));
  expect(named('Accept monorepo production before CMS retarget')).toBeLessThan(named('Apply separately approved webhook target after production acceptance'));
  expect(named('Apply separately approved webhook target after production acceptance')).toBeLessThan(named('Finish accepted monorepo switch without discarding previous recovery'));
  for (const name of ['Restore Netlify records after domain failure', 'Remove failed domain association after DNS rollback', 'Fail after domain rollback']) expect(active.steps[named(name)].if).toContain("inputs.operation == 'legacy'");
  expect(active['timeout-minutes']).toBe(230);
  expect(active.environment).toBe('infrastructure-sarabeth');
  expect(active.defaults.run['working-directory']).toBe('apps/sarabeth');
  const changedOperations = ['Apply hosting stack', 'Apply approval-gated domain association and DNS'];
  for (const step of legacy.steps.filter(step => step.run && !changedOperations.includes(step.name))) expect(active.steps.find(candidate => candidate.name === step.name).run).toBe(step.run);
  const workflow = yaml('.github/workflows/infrastructure-sarabeth.yml');
  expect(workflow.on.workflow_dispatch.inputs.operation.default).toBe('legacy');
  expect(workflow.on.workflow_dispatch.inputs.retarget_webhook.default).toBe(false);
  const gate = active.steps.find(step => step.name === 'Fail closed before infrastructure credentials').run;
  expect(gate).toContain('sarabeth_transition.py prepare');
  expect(gate).toContain('scripts/release/oidc.py');
  const hosting = active.steps.find(step => step.name === changedOperations[0]).run;
  expect(hosting).toContain('"${hosting_parameters[@]}"');
  expect(hosting).toContain('GitHubOidcProviderArn="$OIDC_PROVIDER_ARN"');
  const domain = active.steps.find(step => step.name === changedOperations[1]);
  expect(domain['continue-on-error']).toBe(true);
  expect(domain.run).toContain('"${domain_parameters[@]}"');
  expect(domain.run.indexOf('sarabeth_transition.py guard')).toBeLessThan(domain.run.indexOf('aws cloudformation deploy'));
  expect(domain.run.match(/sarabeth_transition.py guard/g)).toHaveLength(2);
  expect(domain.run).toContain('sarabeth_transition.py domain');
  const preflight = active.steps.findIndex(step => step.name === 'Verify selected monorepo candidate before infrastructure mutation');
  expect(preflight).toBeLessThan(active.steps.findIndex(step => step.name === changedOperations[0]));
  expect(active.steps[preflight].run).toContain('sarabeth_transition.py begin');
  const recovery = yaml('.github/workflows/release-site.yml');
  expect(recovery.on.workflow_dispatch.inputs.sarabeth_operation).toMatchObject({ options: ['release', 'candidate'], default: 'release' });
  expect(recovery.jobs['sarabeth-release'].with.operation).toBe('${{ inputs.sarabeth_operation }}');
});

test('terminal observer covers every release entry without credentials, redispatch or recursion', () => {
  const observer = yaml('.github/workflows/release-reconciliation.yml');
  const entries = Object.keys(JSON.parse(read('config/release-runtime.json')).entryWorkflowIds);
  expect(observer.on.workflow_run.workflows.sort()).toEqual(entries.map(path => yaml(path).name).sort());
  expect(observer.on.workflow_run.types).toEqual(['completed']);
  expect(observer.on.workflow_run.branches).toEqual(['main']);
  expect(observer.jobs.reconcile.if).toBe('${{ false }}');
  expect(observer.jobs.reconcile.permissions).toEqual({ contents: 'read', actions: 'read' });
  expect(observer.jobs.reconcile.steps.find(step => step.run?.includes('reconcile.py'))).toBeDefined();
  expect(observer.jobs.reconcile.steps.at(-1).if).toBe('always()');
  expect(observer.jobs.reconcile.steps.at(-1).run).toContain('GITHUB_STEP_SUMMARY');
  expect(read('scripts/release/deploy.py')).toContain("observe_subject(config['oidcSubject'])");
  const policy = JSON.parse(read('config/release-policy.json'));
  for (const key of ['legacyDiloretoRepositoryId', 'legacyDiloretoWorkflowId', 'legacyDiloretoManifestSha256']) expect(policy[key]).toBeNull();
});

test('owning IaC keeps old subjects, exact optional new subjects, provider/DNS identities and retained Sarabeth main', () => {
  for (const path of ['apps/paul/infra/amplify-hosting.yaml', 'apps/diloreto/infrastructure/amplify-hosting.yml', 'apps/sarabeth/infrastructure/cloudformation/bootstrap.yaml', 'apps/sarabeth/infrastructure/cloudformation/hosting.yaml']) {
    const template = read(path);
    expect(template).toContain('MonorepoSubject:'); expect(template).toContain('Default: ""');
    expect(template).toContain('HasMonorepoSubject, !Ref MonorepoSubject, !Ref AWS::NoValue');
    expect(template).toContain('token.actions.githubusercontent.com:aud');
    expect(template).not.toContain('repo:soodoh/websites:');
  }
  const hosting = read('apps/sarabeth/infrastructure/cloudformation/hosting.yaml');
  expect(hosting).toContain('  MainBranch:'); expect(hosting).toContain('  MonorepoBranch:');
  expect(hosting).toContain('BranchName: sarabeth-production'); expect(hosting).toContain('Condition: CreateMonorepoBranch');
  expect(hosting).toContain('DeletionPolicy: Retain');
  expect(hosting).toContain('/sarabeth-studio/production/last-known-good-sha');
  const bootstrap = read('apps/sarabeth/infrastructure/cloudformation/bootstrap.yaml');
  const infra = bootstrap.split('  InfrastructureDeploymentRole:')[1];
  expect(infra).toContain('Sid: OwnAcceptedMonorepoCandidateSwitch');
  expect(infra).toContain('Action: [s3:GetObject, s3:PutObject]');
  expect(infra).toContain('Resource: !Ref MonorepoStateObjectArn');
  expect(infra).toContain('Action: [amplify:GetApp, amplify:GetBranch, amplify:GetJob, amplify:ListJobs]');
  expect(infra).toContain('Sid: PersistVerifiedMonorepoProduction');
  expect(infra).toContain('Action: ssm:PutParameter');
  expect(infra).toContain('parameter/sarabeth-studio/production/last-known-good-sha');
  expect(infra).toContain('apps/${MonorepoAppId}/branches/sarabeth-production/jobs/*');
  expect(bootstrap).toContain('HasMonorepoApp: !Not [!Equals [!Ref MonorepoAppId, ""]]');
  expect(bootstrap).toContain('MonorepoAppId:\n    Type: String\n    Default: ""\n    AllowedPattern: "^$|^d[a-z0-9]+$"');
  expect(hosting).toContain('EnableMonorepoBranch:\n    Type: String\n    Default: "false"');
  expect(hosting).toContain('CreateMonorepoBranch: !Equals [!Ref EnableMonorepoBranch, "true"]');
  const candidatePolicy = hosting.split('        - !If\n          - CreateMonorepoBranch\n          - PolicyName: ObserveMonorepoCandidateDomain')[1].split('        - PolicyName: ReleaseSpecificAmplifyApp')[0];
  expect(candidatePolicy).toContain('Action: amplify:GetDomainAssociation');
  expect(candidatePolicy).toContain('Resource: !Sub ${AmplifyApp.Arn}/domains/sarabethbelon.com');
  expect(candidatePolicy).toContain('- !Ref AWS::NoValue');
  expect(candidatePolicy).not.toContain('*');
  const candidateBoundary = bootstrap.split('          - !If\n            - HasMonorepoApp\n            - Sid: ObserveMonorepoCandidateDomain')[1].split('          - Sid: AmplifyJobsAndWebhooks')[0];
  expect(candidateBoundary).toContain('Action: amplify:GetDomainAssociation');
  expect(candidateBoundary).toContain('Resource: !Sub arn:${AWS::Partition}:amplify:${AWS::Region}:${AWS::AccountId}:apps/${MonorepoAppId}/domains/sarabethbelon.com');
  expect(candidateBoundary).toContain('- !Ref AWS::NoValue');
  expect(candidateBoundary).not.toContain('*');
  expect(bootstrap.split('          - Sid: AmplifyJobsAndWebhooks')[1].split('          - Sid: ContentfulBuildParameter')[0]).not.toContain('amplify:GetDomainAssociation');
  expect(hosting.split('        - PolicyName: ReleaseSpecificAmplifyApp')[1]).not.toContain('amplify:GetDomainAssociation');
});

test('Carolyn candidate and production rebuild remain independently disabled with trusted isolated smoke', () => {
  const runtime = JSON.parse(read('config/release-runtime.json')).sites.carolyn;
  expect(runtime.candidateEnabled).toBe(false);
  expect(runtime.promotionEnabled).toBe(false);
  expect(runtime.candidateBranch).toBeNull();
  expect(runtime.candidateUrl).toBeNull();
  const recovery = yaml('.github/workflows/release-site.yml');
  expect(recovery.on.workflow_dispatch.inputs.carolyn_operation).toMatchObject({ options: ['release', 'candidate', 'promote'], default: 'release' });
  expect(recovery.jobs['carolyn-release'].with.operation).toBe('${{ inputs.carolyn_operation }}');
  const candidate = read('apps/carolyn/tests/amplify.candidate.smoke.ts');
  expect(candidate).not.toContain('carolyndiloreto.com');
  expect(candidate).not.toContain('carolyn.diloreto.com');
  expect(candidate).toContain('routeCandidateRequest');
  const candidatePolicy = read('apps/carolyn/tests/candidate-policy.ts');
  expect(candidatePolicy).toContain('route.abort("blockedbyclient")');
  expect(candidatePolicy).toContain('route.fetch({ maxRedirects: 0 })');
  expect(candidatePolicy).not.toContain('new URL(location, url).href');
  expect(candidatePolicy).toContain('response.status() >= 300');
  expect(candidatePolicy).toContain('response.status() < 400');
  expect(candidatePolicy).toContain('location !== undefined');
  expect(read('apps/carolyn/tests/candidate-policy.test.ts')).toContain('expect(destinationRequests).toEqual([])');
  expect(candidate).toContain('maxRedirects: 0');
  expect(candidate).toContain('private, no-store');
  expect(candidate).toContain('The password you entered is incorrect.');
  expect(candidate).toContain('/_serverFn/');
  expect(candidate).toContain('toBe(404)');
  expect(read('apps/carolyn/playwright.candidate.config.ts')).toContain('serviceWorkers: "block"');
  const production = read('apps/carolyn/tests/amplify.smoke.ts');
  expect(production).toContain('https://carolyndiloreto.com');
  expect(production).toContain('https://carolyn.diloreto.com');
  expect(production).toContain('expect(defaultCommit).toBe(canonicalCommit)');
});
