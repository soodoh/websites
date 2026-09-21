import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const foundation = Bun.YAML.parse(
	read("infra/aws-account-foundation.yaml"),
) as {
	Outputs: Record<string, unknown>;
	Resources: Record<
		string,
		{
			Condition?: string;
			DeletionPolicy?: string;
			Type: string;
			UpdateReplacePolicy?: string;
		}
	>;
};

const siteConfigurations = [
	"apps/paul/infra/opentofu/main.tf",
	"apps/diloreto/infra/opentofu/main.tf",
	"apps/carolyn/infra/opentofu/main.tf",
	"apps/sarabeth/infra/opentofu/main.tf",
].map(read);

describe("AWS account foundation", () => {
	test("owns retained OIDC, shared notifications, and the account budget", () => {
		expect(foundation.Resources.GitHubOidcProvider).toMatchObject({
			Condition: "CreateGitHubOidcProvider",
			DeletionPolicy: "Retain",
			Type: "AWS::IAM::OIDCProvider",
			UpdateReplacePolicy: "Retain",
		});
		expect(foundation.Resources.OperationalAlarmTopic?.Type).toBe(
			"AWS::SNS::Topic",
		);
		expect(foundation.Resources.MonthlyAccountBudget?.Type).toBe(
			"AWS::Budgets::Budget",
		);
		expect(foundation.Outputs).toHaveProperty("GitHubOidcProviderArn");
		expect(foundation.Outputs).toHaveProperty("OperationalAlarmTopicArn");
	});

	test("makes every target site consume the shared alarm topic", () => {
		for (const configuration of siteConfigurations) {
			expect(configuration).toContain(
				'variable "operational_alarm_topic_arn"',
			);
			expect(configuration).toMatch(/metric_name\s+= .*"5xxErrors"/);
			expect(configuration).toMatch(
				/evaluation_periods\s+= (?:3|var\.[^\n]+\? \d+ : 3)/,
			);
			expect(configuration).toMatch(
				/datapoints_to_alarm\s+= (?:2|var\.[^\n]+\? \d+ : 2)/,
			);
			expect(configuration).toMatch(
				/ok_actions\s+= .*\[var\.operational_alarm_topic_arn\]/,
			);
			expect(configuration).not.toContain(
				'resource "aws_budgets_budget"',
			);
			expect(configuration).not.toContain(
				'resource "aws_sns_topic_subscription"',
			);
		}
	});
});
