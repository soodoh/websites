import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { extractYamlBlock } from "@tests/support/yaml-block";

const hostingTemplate = readFileSync(
	new URL("../../infra/cloudformation/hosting.yaml", import.meta.url),
	"utf8",
);
const bootstrapTemplate = readFileSync(
	new URL("../../infra/cloudformation/bootstrap.yaml", import.meta.url),
	"utf8",
);

test("allows SES sends only from the contact sender to the intended recipient", () => {
	const computeRole = extractYamlBlock(hostingTemplate, "AmplifyComputeRole:");
	const workloadBoundary = extractYamlBlock(
		bootstrapTemplate,
		"- Sid: ContactEmail",
	);

	expect(computeRole).toContain("ses:FromAddress: contact@sarabethbelon.com");
	for (const policy of [computeRole, workloadBoundary]) {
		expect(policy).toContain("ForAllValues:StringEquals:");
		expect(policy).toContain("ses:Recipients: sarabethstudio@gmail.com");
	}
});

test("stores Contentful OpenTofu state without an Amplify webhook", () => {
	const stateBucket = extractYamlBlock(
		hostingTemplate,
		"ContentfulOpenTofuStateBucket:",
	);
	const deploymentRole = extractYamlBlock(
		hostingTemplate,
		"RoutineDeploymentRole:",
	);
	const workloadBoundary = extractYamlBlock(
		bootstrapTemplate,
		"- Sid: ContentfulOpenTofuState",
	);

	expect(stateBucket).toContain("Type: AWS::S3::Bucket");
	expect(stateBucket).toContain("DeletionPolicy: Retain");
	expect(stateBucket).toContain(
		"BucketName: websites-sarabeth-contentful-tofu-state-015989770400-us-west-2",
	);
	expect(stateBucket).toContain("SSEAlgorithm: AES256");
	expect(stateBucket).toContain("Status: Enabled");
	expect(deploymentRole).toContain("Action: s3:ListBucket");
	expect(workloadBoundary).toContain("s3:DeleteObject");
	expect(hostingTemplate).not.toContain("Custom::AmplifyWebhook");
	expect(hostingTemplate).not.toContain("ContentfulWebhookUrl:");
});

test("connects the durable pre-SES rate-limit boundary", () => {
	const table = extractYamlBlock(hostingTemplate, "EmailRateLimitTable:");
	const computeRole = extractYamlBlock(hostingTemplate, "AmplifyComputeRole:");
	const branch = extractYamlBlock(hostingTemplate, "MainBranch:");
	const workloadBoundary = extractYamlBlock(
		bootstrapTemplate,
		"- Sid: ContactEmailRateLimit",
	);

	expect(table).toContain("Type: AWS::DynamoDB::Table");
	expect(table).toContain("DeletionPolicy: Retain");
	expect(table).toContain("UpdateReplacePolicy: Retain");
	expect(table).toContain("TableName: sarabeth-contact-email-rate-limit");
	expect(computeRole).toContain(
		"Action: dynamodb:UpdateItem\n                Resource: !GetAtt EmailRateLimitTable.Arn",
	);
	expect(branch).toContain(
		"- Name: EMAIL_RATE_LIMIT_TABLE\n          Value: !Ref EmailRateLimitTable",
	);
	expect(workloadBoundary).toContain("Action: dynamodb:UpdateItem");
	expect(workloadBoundary).toContain(
		`Resource: !Sub arn:\${AWS::Partition}:dynamodb:\${AWS::Region}:\${AWS::AccountId}:table/sarabeth-contact-email-rate-limit`,
	);
});
