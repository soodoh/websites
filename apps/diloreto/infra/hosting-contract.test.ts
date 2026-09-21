import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appRoot = resolve(import.meta.dir, "..");
const workspaceRoot = resolve(appRoot, "../..");
const readApp = (path: string) => readFileSync(resolve(appRoot, path), "utf8");
const readWorkspace = (path: string) =>
	readFileSync(resolve(workspaceRoot, path), "utf8");

const configuration = readApp("infra/opentofu/main.tf");
const headers = JSON.parse(
	readApp("infra/opentofu/custom-headers.json.tftpl"),
) as Array<{
	headers: Array<{ key: string; value: string }>;
	pattern: string;
}>;
const headersFor = (pattern: string) =>
	new Map(
		headers
			.find((entry) => entry.pattern === pattern)
			?.headers.map(({ key, value }) => [key.toLowerCase(), value]) ?? [],
	);
const smoke = readApp("scripts/hosting-smoke.mjs");
const outputFinalizer = readApp("scripts/finalize-static-output.ts");
const outputAssertion = readApp("scripts/assert-static-output.ts");
const workflow = readWorkspace(".github/workflows/deploy-diloreto.yml");
const githubShaExpression = `$${"{{ github.sha }}"}`;
const domainVariable = `$${"{var.domain_name}"}`;

describe("native Amplify hosting contract", () => {
	test("uses a protected Amplify domain association without custom edge resources", () => {
		expect(configuration).toContain(
			'resource "aws_amplify_domain_association" "production"',
		);
		expect(configuration).toContain('prefix      = ""');
		expect(configuration).toContain('prefix      = "www"');
		expect(configuration).toContain('prefix      = "paul"');
		expect(configuration).toContain("prevent_destroy = true");
		for (const forbiddenResource of [
			"aws_acm_certificate",
			"aws_cloudfront_distribution",
			"aws_cloudfront_function",
			"aws_route53_record",
			"aws_route53_zone",
		]) {
			expect(configuration).not.toContain(`resource "${forbiddenResource}"`);
		}
	});

	test("returns the static custom 404 with an actual 404 status", () => {
		expect(configuration).toContain('source = "/<*>"');
		expect(configuration).toContain('target = "/404.html"');
		expect(configuration).toContain('status = "404-200"');
		expect(outputAssertion).toContain("404: Page Not Found");
		expect(outputAssertion).toContain("must not contain hydration scripts");
		expect(smoke).toContain('"/hosting-migration-smoke/missing-page"');
		expect(smoke).toContain("missing.response.status === 301");
	});

	test("emits both Amplify clean-URL file forms without redirects", () => {
		expect(outputFinalizer).toContain("writeCleanPathAliases");
		expect(outputAssertion).toContain('"areyou/index.html"');
		expect(outputAssertion).toContain('"areyou.html"');
		expect(outputAssertion).toContain("historyAlias !== history");
		expect(smoke).toContain('new URL("/areyou", baseUrl)');
		expect(smoke).toContain('new URL("/areyou/", baseUrl)');
	});

	test("defines domain-only permanent redirects", () => {
		expect(configuration).toContain(`source = "https://www.${domainVariable}"`);
		expect(configuration).toContain(`target = "https://${domainVariable}"`);
		expect(configuration).toContain(
			`source = "https://paul.${domainVariable}"`,
		);
		expect(configuration).toContain('target = "https://pauldiloreto.com"');
		expect(smoke).toContain("did not preserve the path and query");
	});

	test("sets immutable caching only for fingerprinted assets", () => {
		expect(headersFor("/assets/*").get("cache-control")).toBe(
			"public, max-age=31536000, immutable",
		);
		for (const pattern of [
			"/",
			"/areyou*",
			"**/*.html",
			"/robots.txt",
			"/favicon.png",
			"/apple-touch-icon.png",
			"$DEPLOYMENT_MARKER_PATH",
		]) {
			const cacheControl = headersFor(pattern).get("cache-control") ?? "";
			expect(cacheControl).toContain("no-store");
			expect(cacheControl).toContain("must-revalidate");
			expect(cacheControl).not.toContain("immutable");
		}
	});

	test("keeps the security-header policy on every response", () => {
		expect(Object.fromEntries(headersFor("**"))).toEqual({
			"strict-transport-security": "max-age=63072000; includeSubDomains",
			"x-content-type-options": "nosniff",
			"x-frame-options": "DENY",
			"referrer-policy": "strict-origin-when-cross-origin",
			"permissions-policy": "camera=(), geolocation=(), microphone=()",
		});
	});

	test("deploys through the static uploader and verifies the release marker", () => {
		expect(workflow).toContain(
			'scripts/deploy/amplify-static.sh "$AMPLIFY_APP_ID" "$AMPLIFY_BRANCH" release/site.zip',
		);
		expect(workflow).toContain("apps/diloreto/scripts/hosting-smoke.mjs");
		expect(workflow).toContain(`HOSTING_EXPECT_COMMIT: ${githubShaExpression}`);
		expect(smoke).toContain('new URL("/__deployment.json", baseUrl)');
		expect(smoke).toContain("Release marker commit");
	});
});
