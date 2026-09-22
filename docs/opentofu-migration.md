# AWS OpenTofu ownership

## Status

All account and site ownership handoffs are complete. OpenTofu is the sole active AWS desired state for the account foundations and all four sites. The retired CloudFormation/CDK stacks and Sarabeth CloudFormation execution role have been deleted. Production deployments, exact release-marker checks, and smoke tests succeeded after each handoff.

| Boundary | OpenTofu root | State key |
| --- | --- | --- |
| Account foundation | `infra/account-foundation` | `account-foundation/terraform.tfstate` |
| Paul | `apps/paul/infra/opentofu` | `sites/paul/terraform.tfstate` |
| DiLoreto | `apps/diloreto/infra/opentofu` | `sites/diloreto/terraform.tfstate` |
| Carolyn | `apps/carolyn/infra/opentofu` | `sites/carolyn/terraform.tfstate` |
| Sarabeth | `apps/sarabeth/infra/opentofu` | `sites/sarabeth/terraform.tfstate` |

Each AWS account has its own versioned, encrypted S3 state bucket. Contentful remains in the independent roots under `apps/carolyn/infra/contentful` and `apps/sarabeth/infra/contentful`; never combine Contentful and AWS state.

## Safety invariants

1. Select the correct AWS profile, account, region, backend bucket, and state key before planning.
2. Run and review a saved plan before every apply. Proceed only when replacements and destroys are explicitly intended.
3. Obtain explicit approval before an AWS write, GitHub settings write, workflow dispatch, production HTTP test, apply, destroy, import, or state mutation.
4. Keep state versioned, encrypted, private, and access-controlled. State contains infrastructure metadata and can contain secrets.
5. Manage each resource from exactly one state. Use `tofu state mv` or an import plan for ownership changes rather than creating a second owner.
6. Preserve `prevent_destroy` on durable production resources unless a separately reviewed deletion requires changing it.
7. Treat a changed physical ID as a replacement and stop unless the reviewed plan explicitly authorizes it.

## Validation

```sh
bun run infra:validate
```

This initializes every root with `-backend=false`, verifies the pinned providers, and runs `tofu validate`. `scripts/ci/lint.sh` also enforces formatting.

## Planning a production root

Copy the root's `terraform.tfvars.example` to an ignored `.tfvars` file and supply the real non-secret identifiers. Initialize against the account's existing state bucket and the boundary's key:

```sh
tofu -chdir=apps/<site>/infra/opentofu init \
  -backend-config='bucket=<account-state-bucket>' \
  -backend-config='key=sites/<site>/terraform.tfstate' \
  -backend-config='region=<aws-region>'

tofu -chdir=apps/<site>/infra/opentofu plan \
  -var-file=<ignored-production.tfvars>
```

Use `account-foundation/terraform.tfstate` for the foundation root. Backend arguments and production `.tfvars` files remain uncommitted.

The account foundation owns the GitHub Actions OIDC provider, shared alarm topic and confirmed subscription, monthly budget, and protected state bucket. Site roots consume the foundation's OIDC and alarm-topic outputs.

Carolyn and Sarabeth use the AWS Cloud Control provider for Amplify branches because branch-scoped compute roles are not represented by the standard AWS provider. Their Contentful webhook roots retain separate providers, credentials, and state.

## Amplify custom headers

AWS provider 6.66.0 returns Amplify custom headers as a nested JSON list, while `UpdateApp` requires top-level YAML. The committed `custom-headers.json.tftpl` files are the canonical read form used for stable plans.

For an intentional Carolyn header change, temporarily express the reviewed write payload required by that root, apply it once, then restore canonical JSON and require a no-change plan. For Sarabeth, set `write_target_custom_headers = true` only for the reviewed update apply, return it to `false`, and require a no-change plan.

## Completed handoff record

The migration used a retention-first sequence for every legacy owner:

1. Import resources and prove a no-change plan while the legacy stack still owned them.
2. Apply retention policies without changing physical resources.
3. Remove legacy ownership and verify `DELETE_SKIPPED` or the equivalent retained result.
4. Apply the OpenTofu target contract and verify physical IDs.
5. Deploy production, verify the exact release marker, and require final no-change plans.
6. Delete the empty legacy stacks and retired source definitions.

Do not restore a retired CloudFormation/CDK definition as active desired state. Recovery is a forward OpenTofu change or an explicitly planned ownership transfer with imports. A normal legacy stack update against existing resources can create replacements.

The post-migration audit confirmed that Paul's former verified-release bucket no longer exists. The separate `paul.diloreto.backups` bucket belongs to the home-lab recovery boundary and is not website infrastructure.
