# Monorepo deployment migration

## Current state

The four applications and pull-request CI are in the monorepo. Production deployment ownership has not yet been transferred from the legacy repositories.

The previous migration checkpoint/evidence system was removed because workflow runs, logs, approvals, and artifacts belong in GitHub/AWS rather than in committed chronological records. This document tracks only the current design and remaining work.

## Chosen design

- One explicit deployment workflow per site.
- Native GitHub path filters select affected sites.
- Each workflow validates and deploys in the same run.
- GitHub Environments provide approval and environment-scoped configuration.
- AWS OIDC provides short-lived credentials.
- Site-specific concurrency prevents overlapping deploys.
- Repository enable variables keep deploy jobs fail-closed until cutover.
- Rollback uses a reviewed revert or forward fix through normal CI.

Removed architecture includes the central `workflow_run` orchestrator, custom release policy/runtime JSON, provenance receipts, high-watermark state, reconciliation jobs, inactive release wrappers, identity-observation tooling, and committed execution evidence.

## Remaining work

For each site, in this order: Paul, DiLoreto, Carolyn, Sarabeth.

1. Review the site's workflow and existing AWS deployment role.
2. Configure environment variables and exact monorepo OIDC trust.
3. Confirm the current production app, branch, URL, and rollback revision.
4. For Carolyn/Sarabeth, connect Amplify to this repository and root monorepo build specification.
5. Disable the legacy repository's production writer.
6. Enable and manually run the monorepo deployment workflow.
7. Verify production, then allow normal path-filtered pushes.

Production operations require explicit approval at execution time. See [`../deployment.md`](../deployment.md) for configuration, cutover, and rollback instructions.

## OpenTofu decision

OpenTofu is desirable as a later infrastructure standard, but converting existing CloudFormation/CDK ownership during deployment cutover would enlarge the failure surface. Keep current IaC ownership through the four website cutovers, then migrate resources to OpenTofu with imports and no-change plans as a separate project.
