import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { extractYamlBlock } from "@tests/support/yaml-block";

const hostingTemplate = readFileSync(
	new URL("../../infra/cloudformation/hosting.yaml", import.meta.url),
	"utf8",
);
const dnsTemplate = readFileSync(
	new URL("../../infra/cloudformation/dns.yaml", import.meta.url),
	"utf8",
);
const bootstrapTemplate = readFileSync(
	new URL("../../infra/cloudformation/bootstrap.yaml", import.meta.url),
	"utf8",
);
const rootBuildSpec = readFileSync(
	new URL("../../../../amplify.yml", import.meta.url),
	"utf8",
);

test("uses the root build specification and secret-backed replacement authorization", () => {
	expect(hostingTemplate).not.toContain("      BuildSpec: |");
	expect(rootBuildSpec).toContain("appRoot: apps/sarabeth");
	expect(hostingTemplate).toContain("GitHubAccessTokenSecretArn:");
	expect(hostingTemplate).toContain("resolve:secretsmanager:");
	expect(hostingTemplate).toContain("{GitHubAccessTokenSecretArn}");
	expect(hostingTemplate).toContain(":SecretString:token}}");
	expect(hostingTemplate).not.toContain("  GitHubAccessToken:\n");
	expect(bootstrapTemplate).toContain("Action: secretsmanager:GetSecretValue");
	expect(bootstrapTemplate).toContain("secret:sarabeth-amplify-github-*");
	expect(hostingTemplate).toContain("- amplify:UpdateBranch");
});

test("applies the shared security, cache, alarm, and log contracts", () => {
	const app = extractYamlBlock(hostingTemplate, "AmplifyApp:");
	const errorAlarm = extractYamlBlock(hostingTemplate, "Amplify5xxAlarm:");
	const latencyAlarm = extractYamlBlock(
		hostingTemplate,
		"AmplifyLatencyAlarm:",
	);
	const logGroup = extractYamlBlock(hostingTemplate, "AmplifyComputeLogGroup:");

	for (const header of [
		"Strict-Transport-Security",
		"X-Content-Type-Options",
		"Referrer-Policy",
		"X-Frame-Options",
		"Permissions-Policy",
	]) {
		expect(app).toContain(header);
	}
	expect(app).toContain('pattern: "/__tsr/staticServerFnCache/*"');
	expect(app).toContain('pattern: "/__deployment.json"');
	for (const alarm of [errorAlarm, latencyAlarm]) {
		expect(alarm).toContain("DatapointsToAlarm: 2");
		expect(alarm).toContain("EvaluationPeriods: 3");
		expect(alarm).toContain("!Ref OperationalAlarmTopicArn");
		expect(alarm).toContain("OKActions:");
	}
	expect(logGroup).toContain("RetentionInDays: 30");
	expect(hostingTemplate).not.toContain("Type: AWS::SNS::Topic");
});

test("keeps only the final native Amplify DNS target", () => {
	expect(dnsTemplate).not.toContain("Netlify");
	expect(dnsTemplate).not.toContain("WebTarget");
	expect(dnsTemplate).toContain("DNSName: !Ref AmplifyCloudFrontTarget");
	expect(dnsTemplate).toContain("AmplifyCertificateValidation:");
});
