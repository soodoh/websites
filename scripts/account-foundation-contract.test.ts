import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const foundation = read("infra/account-foundation/main.tf");

const siteRoots = [
	"apps/paul/infra/opentofu",
	"apps/diloreto/infra/opentofu",
	"apps/carolyn/infra/opentofu",
	"apps/sarabeth/infra/opentofu",
];
const siteConfigurations = siteRoots.map((directory) =>
	read(`${directory}/main.tf`),
);

describe("AWS account foundation", () => {
	test("keeps each AWS state encrypted and natively locked", () => {
		for (const directory of ["infra/account-foundation", ...siteRoots]) {
			const versions = readFileSync(
				resolve(root, directory, "versions.tf"),
				"utf8",
			);
			expect(versions, directory).toContain('backend "s3"');
			expect(versions, directory).toMatch(/encrypt\s*=\s*true/);
			expect(versions, directory).toMatch(/use_lockfile\s*=\s*true/);
		}
	});

	test("sites consume the shared OIDC provider without owning another", () => {
		for (const configuration of siteConfigurations) {
			expect(configuration).toContain('variable "github_oidc_provider_arn"');
			expect(configuration).not.toContain(
				'resource "aws_iam_openid_connect_provider"',
			);
		}
	});

	test("owns OIDC, shared notifications, the account budget, and protected state", () => {
		for (const resource of [
			'resource "aws_iam_openid_connect_provider" "github_actions"',
			'resource "aws_sns_topic" "operational_alarms"',
			'resource "aws_sns_topic_subscription" "operational_alarm_email"',
			'resource "aws_budgets_budget" "monthly_account"',
			'resource "aws_s3_bucket" "tofu_state"',
			'resource "aws_s3_bucket_versioning" "tofu_state"',
			'resource "aws_s3_bucket_server_side_encryption_configuration" "tofu_state"',
			'resource "aws_s3_bucket_public_access_block" "tofu_state"',
			'resource "aws_s3_bucket_policy" "tofu_state"',
		]) {
			expect(foundation).toContain(resource);
		}
		expect(foundation).toMatch(/ManagedBy\s+= "OpenTofu"/);
		expect(foundation).toContain("prevent_destroy = true");
		expect(foundation).toContain('output "github_oidc_provider_arn"');
		expect(foundation).toContain('output "operational_alarm_topic_arn"');
	});

	test("binds production roles to the current GitHub repository identity", () => {
		const subjects = siteConfigurations.flatMap((configuration) =>
			Array.from(
				configuration.matchAll(
					/values\s+= \["(repo:[^"]+:environment:[^"]+)"\]/g,
				),
				(match) => match[1],
			),
		);

		expect(subjects).toHaveLength(5);
		for (const subject of subjects) {
			expect(
				subject.startsWith(
					"repo:soodoh@18269267/websites@1380705200:environment:",
				),
			).toBe(true);
		}
	});

	test("makes every site consume the shared alarm topic", () => {
		for (const configuration of siteConfigurations) {
			expect(configuration).toContain('variable "operational_alarm_topic_arn"');
			expect(configuration).toMatch(/metric_name\s+= .*"5xxErrors"/);
			expect(configuration).toMatch(/evaluation_periods\s+= 3/);
			expect(configuration).toMatch(/datapoints_to_alarm\s+= 2/);
			expect(configuration).toMatch(
				/ok_actions\s+= .*\[var\.operational_alarm_topic_arn\]/,
			);
			expect(configuration).not.toContain('resource "aws_budgets_budget"');
			expect(configuration).not.toContain(
				'resource "aws_sns_topic_subscription"',
			);
		}
	});
});
