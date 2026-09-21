import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const configuration = readFileSync(
	new URL("../../infra/opentofu/main.tf", import.meta.url),
	"utf8",
);
const domainVariable = `$${"{var.domain_name}"}`;
const accountVariable = `$${"{var.aws_account_id}"}`;
const regionVariable = `$${"{var.aws_region}"}`;

test("allows SES sends only from the contact sender to the intended recipient", () => {
	expect(configuration).toContain('variable = "ses:FromAddress"');
	expect(configuration).toContain(`values   = ["contact@${domainVariable}"]`);
	expect(configuration.match(/variable = "ses:Recipients"/g)).toHaveLength(2);
	expect(
		configuration.match(/values\s+= \["sarabethstudio@gmail.com"\]/g),
	).toHaveLength(2);
	expect(
		configuration.match(/test\s+= "ForAllValues:StringEquals"/g),
	).toHaveLength(2);
});

test("stores Contentful OpenTofu state without an Amplify webhook", () => {
	expect(configuration).toContain(
		'resource "aws_s3_bucket" "contentful_state"',
	);
	expect(configuration).toContain(
		`contentful_state_bucket = "websites-sarabeth-contentful-tofu-state-${accountVariable}-${regionVariable}"`,
	);
	expect(configuration).toContain('status = "Enabled"');
	expect(configuration).toContain('sse_algorithm = "AES256"');
	expect(configuration).toContain('actions   = ["s3:ListBucket"]');
	expect(configuration).toContain('"s3:DeleteObject"');
	expect(configuration).not.toContain("Custom::AmplifyWebhook");
});

test("connects the durable pre-SES rate-limit boundary", () => {
	expect(configuration).toContain(
		'resource "aws_dynamodb_table" "email_rate_limit"',
	);
	expect(configuration).toContain(
		'name         = "sarabeth-contact-email-rate-limit"',
	);
	expect(configuration.match(/"dynamodb:UpdateItem"/g)).toHaveLength(2);
	expect(configuration).toContain('name  = "EMAIL_RATE_LIMIT_TABLE"');
	expect(configuration).toContain(
		"value = aws_dynamodb_table.email_rate_limit.name",
	);
});
