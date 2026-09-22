import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const modulePath = `$${"{path.module}"}`;

const awsRoots = [
	"infra/account-foundation",
	"apps/paul/infra/opentofu",
	"apps/diloreto/infra/opentofu",
	"apps/carolyn/infra/opentofu",
	"apps/sarabeth/infra/opentofu",
];
const siteRoots = awsRoots.slice(1);
const contentfulRoots = [
	"apps/carolyn/infra/contentful",
	"apps/sarabeth/infra/contentful",
];
const retiredSources = [
	"infra/aws-account-foundation.yaml",
	"apps/diloreto/infra/amplify-hosting.yml",
	"apps/diloreto/infra/amplify-hosting-transition.yml",
	"apps/carolyn/infra/cdk.json",
	"apps/carolyn/infra/bin",
	"apps/carolyn/infra/lib",
	"apps/carolyn/infra/test",
	"apps/sarabeth/infra/cloudformation",
];

describe("OpenTofu AWS ownership", () => {
	test("pins every isolated root and uses encrypted S3 native locking", () => {
		for (const directory of awsRoots) {
			const versions = read(`${directory}/versions.tf`);
			expect(versions).toContain('required_version = "= 1.12.6"');
			expect(versions).toContain('version = "= 6.65.0"');
			expect(versions).toContain('backend "s3"');
			expect(versions).toContain("encrypt      = true");
			expect(versions).toContain("use_lockfile = true");
			expect(
				existsSync(resolve(root, `${directory}/.terraform.lock.hcl`)),
			).toBe(true);
			expect(
				existsSync(resolve(root, `${directory}/terraform.tfvars.example`)),
			).toBe(true);
		}
	});

	test("models shared account resources and protected state", () => {
		const foundation = read("infra/account-foundation/main.tf");
		for (const resource of [
			'aws_iam_openid_connect_provider" "github_actions',
			'aws_sns_topic" "operational_alarms',
			'aws_budgets_budget" "monthly_account',
			'aws_s3_bucket" "tofu_state',
			'aws_s3_bucket_versioning" "tofu_state',
			'aws_s3_bucket_server_side_encryption_configuration" "tofu_state',
			'aws_s3_bucket_public_access_block" "tofu_state',
		]) {
			expect(foundation).toContain(resource);
		}
		expect(foundation).toContain("prevent_destroy = true");
		expect(foundation).toMatch(/ManagedBy\s+= "OpenTofu"/);
	});

	test("models every site without creating a second account OIDC provider", () => {
		for (const directory of siteRoots) {
			const configuration = read(`${directory}/main.tf`);
			expect(configuration).toContain('variable "github_oidc_provider_arn"');
			expect(configuration).toContain(
				'resource "aws_amplify_app" "production"',
			);
			expect(configuration).toContain(
				'resource "aws_cloudwatch_metric_alarm" "amplify_5xx"',
			);
			expect(configuration).not.toContain(
				'resource "aws_iam_openid_connect_provider"',
			);
			expect(configuration).toContain("prevent_destroy = true");
			expect(configuration).toMatch(/ManagedBy\s+= "OpenTofu"/);
		}
	});

	test("keeps standard-provider Amplify headers in canonical read form", () => {
		for (const site of ["paul", "diloreto", "carolyn", "sarabeth"]) {
			const configuration = read(`apps/${site}/infra/opentofu/main.tf`);
			const customHeaders = JSON.parse(
				read(`apps/${site}/infra/opentofu/custom-headers.json.tftpl`),
			) as Array<Record<string, unknown>>;

			expect(configuration).toContain(
				`file("${modulePath}/custom-headers.json.tftpl")`,
			);
			expect(Object.keys(customHeaders[0] ?? {}).sort()).toEqual([
				"headers",
				"pattern",
			]);
			expect(customHeaders.at(-1)?.pattern).toBe(
				site === "paul" || site === "diloreto"
					? "$DEPLOYMENT_MARKER_PATH"
					: "/__deployment.json",
			);
		}
	});

	test("sends GitHub-required headers from Contentful webhooks", () => {
		for (const directory of contentfulRoots) {
			const configuration = read(`${directory}/main.tf`);
			expect(configuration).toContain('"User-Agent" = {');
			expect(configuration).toContain(
				'value = "soodoh-websites-contentful-webhook"',
			);
		}
	});

	test("uses AWS Cloud Control for branch-scoped compute roles", () => {
		for (const site of ["carolyn", "sarabeth"]) {
			const versions = read(`apps/${site}/infra/opentofu/versions.tf`);
			const configuration = read(`apps/${site}/infra/opentofu/main.tf`);
			expect(versions).toContain('version = "= 1.102.0"');
			expect(configuration).toContain(
				'resource "awscc_amplify_branch" "production"',
			);
			expect(configuration).toContain("compute_role_arn");
		}
	});

	test("removes retired CloudFormation and CDK desired state", () => {
		for (const path of retiredSources) {
			expect(existsSync(resolve(root, path))).toBe(false);
		}
		const runbook = read("docs/opentofu-migration.md");
		expect(runbook).toContain(
			"All account and site ownership handoffs are complete",
		);
		expect(runbook).toContain("OpenTofu is the sole active AWS desired state");
	});
});
