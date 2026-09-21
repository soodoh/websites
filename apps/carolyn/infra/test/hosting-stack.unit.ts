import { describe, expect, test } from "bun:test";
import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { getCleanUrlRules } from "../../src/lib/amplify-artifact";
import {
	PRODUCTION_AWS_ACCOUNT,
	PRODUCTION_AWS_REGION,
} from "../lib/environment";
import { HostingStack } from "../lib/hosting-stack";

function partitionArn(suffix: string) {
	return {
		"Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" }, suffix]],
	};
}

const contentfulAccessTokenParameterArn = partitionArn(
	":ssm:us-west-2:725669362139:parameter/carolyn-portfolio/prod/contentful-access-token",
);
const projectAuthSecretParameterArn = partitionArn(
	":ssm:us-west-2:725669362139:parameter/carolyn-portfolio/prod/project-auth-secret",
);
const secretParameterArns = [
	contentfulAccessTokenParameterArn,
	projectAuthSecretParameterArn,
];

function createProductionStack(): HostingStack {
	return new HostingStack(new App(), "TestHostingStack", {
		env: {
			account: PRODUCTION_AWS_ACCOUNT,
			region: PRODUCTION_AWS_REGION,
		},
	});
}

function createTemplate(): Template {
	return Template.fromStack(createProductionStack());
}

function getResource(
	template: Template,
	type: string,
	logicalIdFragment?: string,
) {
	const matches = Object.entries(template.findResources(type)).filter(
		([logicalId]) =>
			logicalIdFragment === undefined || logicalId.includes(logicalIdFragment),
	);
	expect(matches).toHaveLength(1);
	const match = matches[0];
	if (!match) {
		throw new Error(`Missing ${type} resource ${logicalIdFragment ?? ""}`);
	}
	return { logicalId: match[0], resource: match[1] };
}

function expectSecretPolicy(
	template: Template,
	roleLogicalIdFragment: string,
	parameterArns: unknown[],
	expectedLogStatements: unknown[] = [],
): void {
	const { logicalId: roleLogicalId } = getResource(
		template,
		"AWS::IAM::Role",
		roleLogicalIdFragment,
	);
	const { resource: policy } = getResource(
		template,
		"AWS::IAM::Policy",
		roleLogicalIdFragment,
	);
	expect(policy.Properties.Roles).toEqual([{ Ref: roleLogicalId }]);
	expect(policy.Properties.PolicyDocument).toEqual({
		Statement: [
			{
				Action: "ssm:GetParameter",
				Effect: "Allow",
				Resource: parameterArns.length === 1 ? parameterArns[0] : parameterArns,
			},
			...expectedLogStatements,
		],
		Version: "2012-10-17",
	});
}

describe("HostingStack environment guardrails", () => {
	test("rejects a non-production account", () => {
		expect(
			() =>
				new HostingStack(new App(), "WrongAccountStack", {
					env: {
						account: "111111111111",
						region: PRODUCTION_AWS_REGION,
					},
				}),
		).toThrow(PRODUCTION_AWS_ACCOUNT);
	});

	test("rejects a non-production region", () => {
		expect(
			() =>
				new HostingStack(new App(), "WrongRegionStack", {
					env: {
						account: PRODUCTION_AWS_ACCOUNT,
						region: "us-east-1",
					},
				}),
		).toThrow(PRODUCTION_AWS_REGION);
	});

	test("synthesizes production account and region ARNs", () => {
		const stack = createProductionStack();
		expect(stack.account).toBe(PRODUCTION_AWS_ACCOUNT);
		expect(stack.region).toBe(PRODUCTION_AWS_REGION);
		const template = JSON.stringify(Template.fromStack(stack).toJSON());
		expect(template).toContain(PRODUCTION_AWS_ACCOUNT);
		expect(template).toContain(PRODUCTION_AWS_REGION);
	});
});

describe("HostingStack production resources", () => {
	test("configures WEB_COMPUTE with exact bounded secret policies", () => {
		const template = createTemplate();
		template.hasParameter("GitHubAccessTokenSecretArn", {
			Default: "",
			NoEcho: true,
			Type: "String",
		});
		template.hasResourceProperties("AWS::Amplify::App", {
			CacheConfig: { Type: "AMPLIFY_MANAGED" },
			EnableBranchAutoDeletion: false,
			Platform: "WEB_COMPUTE",
			Repository: "https://github.com/soodoh/websites",
		});
		const { resource: app } = getResource(template, "AWS::Amplify::App");
		expect(app.Properties.CustomHeaders).toContain(
			'key: "Strict-Transport-Security"',
		);
		expect(app.Properties.CustomHeaders).toContain('key: "X-Frame-Options"');
		expect(app.Properties.CustomHeaders).toContain(
			'pattern: "/__deployment.json"',
		);
		expect(app.Properties.BuildSpec).toContain("appRoot: apps/carolyn");
		expect(app.Properties.BuildSpec).toContain("appRoot: apps/sarabeth");
		template.resourceCountIs("AWS::Amplify::Branch", 1);
		template.hasResourceProperties("AWS::Amplify::Branch", {
			BranchName: "main",
			EnableAutoBuild: false,
			EnablePerformanceMode: false,
			EnablePullRequestPreview: false,
			EnvironmentVariables: [
				{ Name: "CONTENTFUL_SPACE_ID", Value: { Ref: "ContentfulSpaceId" } },
				{ Name: "AMPLIFY_MONOREPO_APP_ROOT", Value: "apps/carolyn" },
			],
			Framework: "Nitro",
			Stage: "PRODUCTION",
		});

		expectSecretPolicy(
			template,
			"AmplifyServiceAndLoggingRole",
			secretParameterArns,
			[
				{
					Action: "logs:CreateLogGroup",
					Effect: "Allow",
					Resource: partitionArn(
						":logs:us-west-2:725669362139:log-group:/aws/amplify/*",
					),
				},
				{
					Action: ["logs:CreateLogStream", "logs:PutLogEvents"],
					Effect: "Allow",
					Resource: partitionArn(
						":logs:us-west-2:725669362139:log-group:/aws/amplify/*:log-stream:*",
					),
				},
				{
					Action: "logs:DescribeLogGroups",
					Effect: "Allow",
					Resource: "*",
				},
			],
		);
		expectSecretPolicy(template, "AmplifySsrComputeRole", [
			projectAuthSecretParameterArn,
		]);
	});

	test("pins Amplify trust boundaries and the branch compute role", () => {
		const template = createTemplate();
		const { resource: serviceRole } = getResource(
			template,
			"AWS::IAM::Role",
			"AmplifyServiceAndLoggingRole",
		);
		expect(serviceRole.Properties.AssumeRolePolicyDocument).toEqual({
			Statement: [
				{
					Action: "sts:AssumeRole",
					Condition: {
						ArnLike: {
							"aws:SourceArn": partitionArn(
								":amplify:us-west-2:725669362139:apps/*",
							),
						},
						StringEquals: {
							"aws:SourceAccount": { Ref: "AWS::AccountId" },
						},
					},
					Effect: "Allow",
					Principal: { Service: "amplify.amazonaws.com" },
				},
			],
			Version: "2012-10-17",
		});

		const { logicalId: computeRoleLogicalId, resource: computeRole } =
			getResource(template, "AWS::IAM::Role", "AmplifySsrComputeRole");
		expect(computeRole.Properties.AssumeRolePolicyDocument).toEqual({
			Statement: [
				{
					Action: "sts:AssumeRole",
					Condition: {
						ArnLike: {
							"aws:SourceArn": {
								"Fn::Join": [
									"",
									[{ "Fn::GetAtt": ["AmplifyApp", "Arn"] }, "/branches/*"],
								],
							},
						},
						StringEquals: {
							"aws:SourceAccount": { Ref: "AWS::AccountId" },
						},
					},
					Effect: "Allow",
					Principal: { Service: "amplify.amazonaws.com" },
				},
			],
			Version: "2012-10-17",
		});

		const { resource: productionBranch } = getResource(
			template,
			"AWS::Amplify::Branch",
			"MonorepoProductionBranch",
		);
		expect(productionBranch.Properties.ComputeRoleArn).toEqual({
			"Fn::GetAtt": [computeRoleLogicalId, "Arn"],
		});
	});

	test("configures canonical clean URL rewrites for emitted static files", () => {
		const template = createTemplate();
		template.hasResourceProperties("AWS::Amplify::App", {
			CustomRules: [
				{
					Source: "https://www.carolyndiloreto.com",
					Status: "301",
					Target: "https://carolyndiloreto.com",
				},
				{
					Source: "https://carolyn.diloreto.com",
					Status: "301",
					Target: "https://carolyndiloreto.com",
				},
				...getCleanUrlRules().map((rule) => ({
					Source: rule.source,
					Status: rule.status,
					Target: rule.target,
				})),
			],
		});
	});

	test("pins the exact GitHub OIDC trust and deployment permissions", () => {
		const template = createTemplate();
		const { logicalId: providerLogicalId, resource: provider } = getResource(
			template,
			"AWS::IAM::OIDCProvider",
		);
		expect(provider).toMatchObject({
			Condition: "CreateGitHubOidcProvider",
			DeletionPolicy: "Retain",
			Properties: {
				ClientIdList: ["sts.amazonaws.com"],
				Url: "https://token.actions.githubusercontent.com",
			},
			UpdateReplacePolicy: "Retain",
		});

		const { logicalId: roleLogicalId, resource: role } = getResource(
			template,
			"AWS::IAM::Role",
			"GitHubDeploymentRole",
		);
		const { logicalId: stateBucketLogicalId } = getResource(
			template,
			"AWS::S3::Bucket",
			"ContentfulOpenTofuStateBucket",
		);
		expect(role.Properties.AssumeRolePolicyDocument).toEqual({
			Statement: [
				{
					Action: "sts:AssumeRoleWithWebIdentity",
					Condition: {
						StringEquals: {
							"token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
							"token.actions.githubusercontent.com:sub":
								"repo:soodoh@18269267/websites@1358469291:environment:production-carolyn",
						},
					},
					Effect: "Allow",
					Principal: {
						Federated: {
							"Fn::If": [
								"HasExternalGitHubOidcProvider",
								{ Ref: "GitHubOidcProviderArn" },
								{ Ref: providerLogicalId },
							],
						},
					},
				},
			],
			Version: "2012-10-17",
		});

		const { resource: policy } = getResource(
			template,
			"AWS::IAM::Policy",
			"GitHubDeploymentRole",
		);
		expect(policy.Properties.Roles).toEqual([{ Ref: roleLogicalId }]);
		expect(policy.Properties.PolicyDocument).toEqual({
			Statement: [
				{
					Action: "amplify:GetApp",
					Effect: "Allow",
					Resource: { "Fn::GetAtt": ["AmplifyApp", "Arn"] },
				},
				{
					Action: ["amplify:GetBranch", "amplify:UpdateBranch"],
					Effect: "Allow",
					Resource: { "Fn::GetAtt": ["MonorepoProductionBranch", "Arn"] },
				},
				{
					Action: ["amplify:GetJob", "amplify:StartJob"],
					Effect: "Allow",
					Resource: {
						"Fn::Join": [
							"",
							[
								{ "Fn::GetAtt": ["MonorepoProductionBranch", "Arn"] },
								"/jobs/*",
							],
						],
					},
				},
				{
					Action: "s3:ListBucket",
					Effect: "Allow",
					Resource: { "Fn::GetAtt": [stateBucketLogicalId, "Arn"] },
				},
				{
					Action: ["s3:GetObject", "s3:PutObject"],
					Effect: "Allow",
					Resource: {
						"Fn::Join": [
							"",
							[
								{ "Fn::GetAtt": [stateBucketLogicalId, "Arn"] },
								"/contentful/terraform.tfstate",
							],
						],
					},
				},
				{
					Action: ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"],
					Effect: "Allow",
					Resource: {
						"Fn::Join": [
							"",
							[
								{ "Fn::GetAtt": [stateBucketLogicalId, "Arn"] },
								"/contentful/terraform.tfstate.tflock",
							],
						],
					},
				},
			],
			Version: "2012-10-17",
		});
	});

	test("stores Contentful OpenTofu state without an Amplify webhook", () => {
		const template = createTemplate();
		template.hasResourceProperties("AWS::S3::Bucket", {
			BucketEncryption: {
				ServerSideEncryptionConfiguration: [
					{ ServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } },
				],
			},
			BucketName:
				"websites-carolyn-contentful-tofu-state-725669362139-us-west-2",
			PublicAccessBlockConfiguration: {
				BlockPublicAcls: true,
				BlockPublicPolicy: true,
				IgnorePublicAcls: true,
				RestrictPublicBuckets: true,
			},
			VersioningConfiguration: { Status: "Enabled" },
		});
		template.resourceCountIs("AWS::Lambda::Function", 0);
		template.resourceCountIs("Custom::AmplifyWebhook", 0);
		expect(template.toJSON().Parameters.WebhookRotationVersion).toBeUndefined();
		expect(template.toJSON().Outputs.ContentfulWebhookUrl).toBeUndefined();
		expect(
			template.toJSON().Outputs.ContentfulOpenTofuStateBucketName,
		).toBeDefined();
	});

	test("pins domains and shared operational alarm wiring", () => {
		const template = createTemplate();
		template.resourceCountIs("AWS::Amplify::Domain", 2);
		template.hasResourceProperties("AWS::Amplify::Domain", {
			DomainName: "carolyndiloreto.com",
			EnableAutoSubDomain: false,
			SubDomainSettings: [
				{ BranchName: "main", Prefix: "" },
				{ BranchName: "main", Prefix: "www" },
			],
		});
		template.hasResourceProperties("AWS::Amplify::Domain", {
			DomainName: "diloreto.com",
			EnableAutoSubDomain: false,
			SubDomainSettings: [{ BranchName: "main", Prefix: "carolyn" }],
		});

		template.resourceCountIs("AWS::SNS::Topic", 0);
		template.resourceCountIs("AWS::SNS::Subscription", 0);
		template.resourceCountIs("AWS::Budgets::Budget", 0);
		template.resourceCountIs("AWS::CloudWatch::Alarm", 2);
		const commonAlarmProperties = {
			AlarmActions: [{ Ref: "OperationalAlarmTopicArn" }],
			DatapointsToAlarm: 2,
			Dimensions: [
				{
					Name: "App",
					Value: { "Fn::GetAtt": ["AmplifyApp", "AppId"] },
				},
			],
			EvaluationPeriods: 3,
			Namespace: "AWS/AmplifyHosting",
			OKActions: [{ Ref: "OperationalAlarmTopicArn" }],
			Period: 300,
			TreatMissingData: "notBreaching",
		};
		template.hasResourceProperties("AWS::CloudWatch::Alarm", {
			...commonAlarmProperties,
			ComparisonOperator: "GreaterThanOrEqualToThreshold",
			MetricName: "5xxErrors",
			Statistic: "Sum",
			Threshold: 2,
		});
		template.hasResourceProperties("AWS::CloudWatch::Alarm", {
			...commonAlarmProperties,
			ComparisonOperator: "GreaterThanThreshold",
			MetricName: "Latency",
			Statistic: "Average",
			Threshold: 5,
		});
	});

	test("retains every physical resource during the OpenTofu handoff", () => {
		const resources = createTemplate().toJSON().Resources as Record<
			string,
			{
				DeletionPolicy?: string;
				Type: string;
				UpdateReplacePolicy?: string;
			}
		>;
		for (const resource of Object.values(resources)) {
			if (resource.Type === "AWS::CDK::Metadata") continue;
			expect(resource.DeletionPolicy).toBe("Retain");
			expect(resource.UpdateReplacePolicy).toBe("Retain");
		}
	});

	test("retains logs and relies on the AWS-managed SSM key", () => {
		const template = createTemplate();
		const { resource: logGroup } = getResource(
			template,
			"AWS::Logs::LogGroup",
			"AmplifySsrLogGroup",
		);
		expect(logGroup).toMatchObject({
			DeletionPolicy: "Retain",
			Properties: { RetentionInDays: 30 },
			UpdateReplacePolicy: "Retain",
		});
		template.resourceCountIs("AWS::KMS::Key", 0);
		template.resourceCountIs("AWS::KMS::Alias", 0);
		expect(JSON.stringify(template.toJSON())).not.toContain("kms:Decrypt");
		expect(template.toJSON().Outputs).not.toHaveProperty("SecretKmsKeyArn");
	});
});
