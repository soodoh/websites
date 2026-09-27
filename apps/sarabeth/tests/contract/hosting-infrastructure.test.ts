import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const configuration = readFileSync(
	new URL("../../infra/opentofu/main.tf", import.meta.url),
	"utf8",
);
const targetHeaders = JSON.parse(
	readFileSync(
		new URL("../../infra/opentofu/custom-headers.json.tftpl", import.meta.url),
		"utf8",
	),
) as Array<{ headers: Array<{ key: string; value: string }>; pattern: string }>;

test("does not enable automatic production builds outside the release workflow", () => {
	expect(configuration).toMatch(/enable_auto_build\s*=\s*false/);
});

test("defines the security, cache, alarm, and log contracts", () => {
	const headersFor = (pattern: string) =>
		new Map(
			targetHeaders
				.find((entry) => entry.pattern === pattern)
				?.headers.map(({ key, value }) => [key.toLowerCase(), value]) ?? [],
		);
	for (const pattern of ["/", "/__deployment.json"]) {
		expect(headersFor(pattern).get("cache-control")).toContain("no-store");
	}
	expect(headersFor("**/*").get("strict-transport-security")).toContain(
		"includeSubDomains",
	);
	expect(configuration).toContain("evaluation_periods  = 3");
	expect(configuration).toContain("datapoints_to_alarm = 2");
	expect(configuration).toContain(
		"ok_actions          = [var.operational_alarm_topic_arn]",
	);
	expect(configuration).toContain("retention_in_days = 30");
	expect(configuration).not.toContain('resource "aws_sns_topic"');
});
