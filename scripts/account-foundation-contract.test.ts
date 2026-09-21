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

const siteTemplates = [
	"apps/paul/infra/amplify-hosting.yaml",
	"apps/diloreto/infra/amplify-hosting.yml",
	"apps/sarabeth/infra/cloudformation/hosting.yaml",
].map(read);
const carolynStack = read("apps/carolyn/infra/lib/hosting-stack.ts");

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

	test("makes every site consume the shared alarm topic", () => {
		for (const template of siteTemplates) {
			expect(template).toContain("OperationalAlarmTopicArn:");
			expect(template).toContain("MetricName: 5xxErrors");
			expect(template).toContain("EvaluationPeriods: 3");
			expect(template).toContain("DatapointsToAlarm: 2");
			expect(template).toContain("OKActions:");
		}
		expect(carolynStack).toContain('"OperationalAlarmTopicArn"');
		expect(carolynStack).toContain("addOkAction");
		expect(carolynStack).not.toContain("new CfnBudget");
		expect(carolynStack).not.toContain("new EmailSubscription");
	});
});
