import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const hostingTemplate = readFileSync(
	new URL("../../infra/cloudformation/hosting.yaml", import.meta.url),
	"utf8",
);
const dnsTemplate = readFileSync(
	new URL("../../infra/cloudformation/dns.yaml", import.meta.url),
	"utf8",
);
const rootBuildSpec = readFileSync(
	new URL("../../../../amplify.yml", import.meta.url),
	"utf8",
);
const opentofuConfiguration = readFileSync(
	new URL("../../infra/opentofu/main.tf", import.meta.url),
	"utf8",
);
const targetHeaders = JSON.parse(
	readFileSync(
		new URL("../../infra/opentofu/custom-headers.json.tftpl", import.meta.url),
		"utf8",
	),
) as Array<{ headers: Array<{ key: string }>; pattern: string }>;

test("preserves the deployed build during handoff and defines the target release contract", () => {
	expect(hostingTemplate).toContain("      BuildSpec: |");
	expect(rootBuildSpec).toContain("appRoot: apps/sarabeth");
	expect(opentofuConfiguration).not.toContain("build_spec");
	expect(hostingTemplate).toContain("GitHubAccessTokenSecretArn:");
	expect(hostingTemplate).toContain("resolve:secretsmanager:");
	expect(hostingTemplate).toContain("{GitHubAccessTokenSecretArn}");
	expect(hostingTemplate).toContain(":SecretString:token}}");
	expect(hostingTemplate).not.toContain("  GitHubAccessToken:\n");
	expect(opentofuConfiguration).toContain(
		'variable "enable_branch_environment_updates"',
	);
	expect(opentofuConfiguration).toContain('"amplify:UpdateBranch"');
});

test("defines the target security, cache, alarm, and log contracts in OpenTofu", () => {
	const headerNames = targetHeaders.flatMap(({ headers }) =>
		headers.map(({ key }) => key),
	);
	for (const header of [
		"Strict-Transport-Security",
		"X-Content-Type-Options",
		"Referrer-Policy",
		"X-Frame-Options",
		"Permissions-Policy",
	]) {
		expect(headerNames).toContain(header);
	}
	for (const pattern of [
		"/__tsr/staticServerFnCache/*",
		"/__deployment.json",
	]) {
		expect(targetHeaders.map((header) => header.pattern)).toContain(pattern);
	}
	expect(opentofuConfiguration).toContain(
		"evaluation_periods  = var.use_legacy_alarm_contract ? 1 : 3",
	);
	expect(opentofuConfiguration).toContain(
		"datapoints_to_alarm = var.use_legacy_alarm_contract ? 1 : 2",
	);
	expect(opentofuConfiguration).toContain(
		"evaluation_periods  = var.use_legacy_alarm_contract ? 2 : 3",
	);
	expect(opentofuConfiguration).toContain(
		"ok_actions          = [var.operational_alarm_topic_arn]",
	);
	expect(opentofuConfiguration).toContain("retention_in_days = 30");
	expect(opentofuConfiguration).not.toContain('resource "aws_sns_topic"');
});

test("preserves legacy DNS during handoff and defines only Amplify targets in OpenTofu", () => {
	expect(dnsTemplate).toContain("Netlify");
	expect(dnsTemplate).toContain("WebTarget");
	expect(opentofuConfiguration).not.toContain("Netlify");
	for (const record of ["apex_ipv4", "apex_ipv6", "www_ipv4", "www_ipv6"]) {
		expect(opentofuConfiguration).toContain(
			`resource "aws_route53_record" "${record}"`,
		);
	}
	expect(opentofuConfiguration).toContain(
		"name                   = var.amplify_cloudfront_target",
	);
	expect(opentofuConfiguration).toContain(
		'resource "aws_route53_record" "amplify_certificate_validation"',
	);
});
