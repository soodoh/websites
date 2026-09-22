import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const rootBuildSpec = readFileSync(
	new URL("../../../../amplify.yml", import.meta.url),
	"utf8",
);
const configuration = readFileSync(
	new URL("../../infra/opentofu/main.tf", import.meta.url),
	"utf8",
);
const targetHeaders = JSON.parse(
	readFileSync(
		new URL("../../infra/opentofu/custom-headers.json.tftpl", import.meta.url),
		"utf8",
	),
) as Array<{ headers: Array<{ key: string }>; pattern: string }>;

test("defines the repository-connected release contract in OpenTofu", () => {
	expect(rootBuildSpec).toContain("appRoot: apps/sarabeth");
	expect(configuration).toContain('resource "aws_amplify_app" "production"');
	expect(configuration).toContain(
		'resource "awscc_amplify_branch" "production"',
	);
	expect(configuration).toContain("enable_auto_build           = false");
	expect(configuration).toContain(
		'actions   = ["amplify:GetBranch", "amplify:UpdateBranch"]',
	);
	expect(configuration).not.toContain("cloudformation:");
});

test("defines the security, cache, alarm, and log contracts", () => {
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
	expect(configuration).toContain("evaluation_periods  = 3");
	expect(configuration).toContain("datapoints_to_alarm = 2");
	expect(configuration).toContain(
		"ok_actions          = [var.operational_alarm_topic_arn]",
	);
	expect(configuration).toContain("retention_in_days = 30");
	expect(configuration).not.toContain('resource "aws_sns_topic"');
});

test("defines only Amplify production DNS targets", () => {
	for (const record of ["apex_ipv4", "apex_ipv6", "www_ipv4", "www_ipv6"]) {
		expect(configuration).toContain(
			`resource "aws_route53_record" "${record}"`,
		);
	}
	expect(configuration).toContain(
		"name                   = var.amplify_cloudfront_target",
	);
	expect(configuration).toContain(
		'resource "aws_route53_record" "amplify_certificate_validation"',
	);
	expect(configuration).not.toContain("Netlify");
});
