import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const awsRoots = [
	"infra/account-foundation",
	"apps/paul/infra/opentofu",
	"apps/diloreto/infra/opentofu",
	"apps/carolyn/infra/opentofu",
	"apps/sarabeth/infra/opentofu",
];

const siteRoots = awsRoots.slice(1);
const retainedLegacyTemplates = [
	"infra/aws-account-foundation.yaml",
	"apps/diloreto/infra/amplify-hosting.yml",
	"apps/sarabeth/infra/cloudformation/bootstrap.yaml",
	"apps/sarabeth/infra/cloudformation/dns.yaml",
	"apps/sarabeth/infra/cloudformation/domain.yaml",
	"apps/sarabeth/infra/cloudformation/hosting.yaml",
];

describe("OpenTofu AWS migration", () => {
	test("pins every isolated root and uses encrypted S3 native locking", () => {
		for (const directory of awsRoots) {
			const versions = read(`${directory}/versions.tf`);
			expect(versions).toContain('required_version = "= 1.12.6"');
			expect(versions).toContain('version = "= 6.65.0"');
			expect(versions).toContain('backend "s3"');
			expect(versions).toContain("encrypt      = true");
			expect(versions).toContain("use_lockfile = true");
			expect(existsSync(resolve(root, `${directory}/.terraform.lock.hcl`))).toBe(
				true,
			);
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
	});

	test("models every site without creating a second account OIDC provider", () => {
		for (const directory of siteRoots) {
			const configuration = read(`${directory}/main.tf`);
			expect(configuration).toContain('variable "github_oidc_provider_arn"');
			expect(configuration).toContain('resource "aws_amplify_app" "production"');
			expect(configuration).toContain(
				'resource "aws_cloudwatch_metric_alarm" "amplify_5xx"',
			);
			expect(configuration).not.toContain(
				'resource "aws_iam_openid_connect_provider"',
			);
			expect(configuration).toContain("prevent_destroy = true");
		}
	});

	test("keeps Paul's Amplify headers in the canonical read form", () => {
		const configuration = read("apps/paul/infra/opentofu/main.tf");
		const customHeaders = JSON.parse(
			read("apps/paul/infra/opentofu/custom-headers.json.tftpl"),
		) as Array<Record<string, unknown>>;

		expect(configuration).toContain(
			'file("${path.module}/custom-headers.json.tftpl")',
		);
		expect(Object.keys(customHeaders[0] ?? {})).toEqual(["headers", "pattern"]);
		expect(customHeaders.at(-1)?.pattern).toBe("$DEPLOYMENT_MARKER_PATH");
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

	test("makes every active legacy resource retention-safe", () => {
		for (const path of retainedLegacyTemplates) {
			const source = read(path);
			const resources = source
				.split("\nResources:\n")[1]
				?.split("\nOutputs:\n")[0];
			expect(resources).toBeDefined();
			if (!resources) continue;

			const starts = [...resources.matchAll(/^  [A-Za-z0-9]+:\n/g)].map(
				(match) => match.index,
			);
			expect(starts.length).toBeGreaterThan(0);
			for (const [index, start] of starts.entries()) {
				const end = starts[index + 1] ?? resources.length;
				const resource = resources.slice(start, end);
				expect(resource).toContain("DeletionPolicy: Retain");
				expect(resource).toContain("UpdateReplacePolicy: Retain");
			}
		}
	});

	test("keeps only active legacy owners during the staged import window", () => {
		for (const path of [
			"infra/aws-account-foundation.yaml",
			"apps/diloreto/infra/amplify-hosting.yml",
			"apps/carolyn/infra/lib/hosting-stack.ts",
			"apps/sarabeth/infra/cloudformation/hosting.yaml",
		]) {
			expect(existsSync(resolve(root, path))).toBe(true);
		}
		expect(
			existsSync(resolve(root, "apps/paul/infra/amplify-hosting.yaml")),
		).toBe(false);
		const runbook = read("docs/opentofu-migration.md");
		expect(runbook).toContain("Import while CloudFormation/CDK still owns");
		expect(runbook).toContain("do not apply from both tools");
		expect(runbook).toContain("DeletionPolicy: Retain");
	});
});
