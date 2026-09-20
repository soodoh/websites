# Monorepo deployment migration

## Current state

The four applications, pull-request CI, and production deployment workflows are owned by the monorepo. Legacy deployment writers are disabled, and each AWS deployment role trusts only its protected monorepo environment.

The previous migration checkpoint/evidence system was removed because workflow runs, logs, approvals, and artifacts belong in GitHub/AWS rather than in committed chronological records. This document tracks only the current design and remaining work.

## Chosen design

- One explicit deployment workflow per site.
- Native GitHub path filters select affected sites.
- Each workflow validates and deploys in the same run.
- GitHub Environments provide approval and environment-scoped configuration.
- AWS OIDC provides short-lived credentials.
- Site-specific concurrency prevents overlapping deploys.
- Rollback uses a reviewed revert or forward fix through normal CI.

Removed architecture includes the central `workflow_run` orchestrator, custom release policy/runtime JSON, provenance receipts, high-watermark state, reconciliation jobs, inactive release wrappers, identity-observation tooling, and committed execution evidence.

## Remaining work

The deployment cutover is complete. Production operations still require approval through each protected GitHub Environment. See [`../deployment.md`](../deployment.md) for deployment and rollback instructions.

## OpenTofu decision

OpenTofu is desirable as a later infrastructure standard, but converting existing CloudFormation/CDK ownership during deployment cutover would enlarge the failure surface. Keep current IaC ownership through the four website cutovers, then migrate resources to OpenTofu with imports and no-change plans as a separate project.
