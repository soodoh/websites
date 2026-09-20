import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appRoot = resolve(import.meta.dir, "..");
const workspaceRoot = resolve(appRoot, "../..");
const readApp = (path: string) => readFileSync(resolve(appRoot, path), "utf8");
const readWorkspace = (path: string) =>
	readFileSync(resolve(workspaceRoot, path), "utf8");

type CustomRule = {
	Source: string;
	Status: string;
	Target: string;
};

type Resource = {
	Condition?: string;
	Type: string;
	Properties?: {
		CustomHeaders?: string;
		CustomRules?: CustomRule[];
		SubDomainSettings?: Array<{ BranchName: string; Prefix: string }>;
	};
};

type Template = {
	Conditions?: Record<string, unknown>;
	Outputs: Record<string, unknown>;
	Parameters: Record<string, unknown>;
	Resources: Record<string, Resource>;
};

const template = Bun.YAML.parse(
	readApp("infra/amplify-hosting.yml"),
) as Template;
const transitionTemplate = Bun.YAML.parse(
	readApp("infra/amplify-hosting-transition.yml"),
) as Template;
const resources = template.Resources;
const app = resources.AmplifyApp.Properties;
if (!app?.CustomHeaders || !app.CustomRules) {
	throw new Error("Amplify app hosting configuration is missing");
}
const rules = app.CustomRules;
const headerDocument = Bun.YAML.parse(app.CustomHeaders) as {
	customHeaders: Array<{
		pattern: string;
		headers: Array<{ key: string; value: string }>;
	}>;
};
const headersFor = (pattern: string) =>
	new Map(
		headerDocument.customHeaders
			.find((entry) => entry.pattern === pattern)
			?.headers.map(({ key, value }) => [key.toLowerCase(), value]) ?? [],
	);

const transitionSource = readApp("infra/amplify-hosting-transition.yml");
const smoke = readApp("scripts/hosting-smoke.mjs");
const outputAssertion = readApp("scripts/assert-static-output.ts");
const workflow = readWorkspace(".github/workflows/deploy-diloreto.yml");
const domainVariable = `$${"{DomainName}"}`;
const githubShaExpression = `$${"{{ github.sha }}"}`;

describe("approval-gated transition contract", () => {
	test("defines an explicit four-phase state machine that defaults to no cutover", () => {
		expect(transitionTemplate.Parameters.MigrationPhase).toEqual({
			Type: "String",
			Default: "Legacy",
			AllowedValues: ["Legacy", "Candidate", "AliasRelease", "Native"],
			Description:
				"Approval-gated migration phase. Advance exactly one phase per reviewed CloudFormation update.",
		});
		expect(transitionTemplate.Conditions).toMatchObject({
			MigrationLegacy: ["MigrationPhase", "Legacy"],
			MigrationCandidate: ["MigrationPhase", "Candidate"],
			MigrationAliasRelease: ["MigrationPhase", "AliasRelease"],
			MigrationNative: ["MigrationPhase", "Native"],
			EdgeOwnsProductionAliases: ["MigrationLegacy", "MigrationCandidate"],
			CreateAmplifyDomain: [
				"MigrationCandidate",
				"MigrationAliasRelease",
				"MigrationNative",
			],
		});
	});

	test("keeps legacy logical IDs while adding the candidate domain", () => {
		for (const [logicalId, type] of Object.entries({
			AmplifyApp: "AWS::Amplify::App",
			AmplifyBranch: "AWS::Amplify::Branch",
			EdgeCachePolicy: "AWS::CloudFront::CachePolicy",
			EdgeRequestFunction: "AWS::CloudFront::Function",
			EdgeCertificate: "AWS::CertificateManager::Certificate",
			EdgeDistribution: "AWS::CloudFront::Distribution",
			ApexIpv4Record: "AWS::Route53::RecordSet",
			ApexIpv6Record: "AWS::Route53::RecordSet",
			WwwIpv4Record: "AWS::Route53::RecordSet",
			WwwIpv6Record: "AWS::Route53::RecordSet",
			PaulRedirectRecord: "AWS::Route53::RecordSet",
			GitHubDeploymentRole: "AWS::IAM::Role",
		})) {
			expect(transitionTemplate.Resources[logicalId]?.Type).toBe(type);
		}
		expect(transitionTemplate.Resources.AmplifyDomain.Type).toBe(
			"AWS::Amplify::Domain",
		);
		expect(transitionTemplate.Resources.AmplifyDomain.Condition).toBe(
			"CreateAmplifyDomain",
		);
	});

	test("prepares identical Amplify behavior before moving traffic", () => {
		const transitionApp = transitionTemplate.Resources.AmplifyApp.Properties;
		expect(transitionApp?.CustomRules).toEqual(app.CustomRules);
		expect(transitionApp?.CustomHeaders).toBe(app.CustomHeaders);
	});

	test("separates alias release from native domain attachment", () => {
		expect(transitionSource).toContain(
			"Aliases: !If\n          - EdgeUsesCustomAliases",
		);
		for (const logicalId of [
			"ApexIpv4Record",
			"ApexIpv6Record",
			"WwwIpv4Record",
			"WwwIpv6Record",
		]) {
			expect(transitionTemplate.Resources[logicalId]?.Condition).toBe(
				"CreateDnsRecords",
			);
		}
		expect(transitionTemplate.Resources.PaulRedirectRecord.Condition).toBe(
			"CreatePaulDnsRecord",
		);
		expect(transitionSource).toContain(
			'- MigrationNative\n          - Prefix: ""',
		);
		expect(transitionSource).toContain(
			"- Prefix: candidate\n            BranchName: !Ref BranchName",
		);
	});
});

describe("native Amplify hosting contract", () => {
	test("uses an Amplify domain association without custom edge resources", () => {
		expect(resources.AmplifyDomain.Type).toBe("AWS::Amplify::Domain");
		expect(resources.AmplifyDomain.Properties?.SubDomainSettings).toEqual([
			{ Prefix: "", BranchName: "BranchName" },
			{ Prefix: "www", BranchName: "BranchName" },
			{ Prefix: "paul", BranchName: "BranchName" },
		]);

		const forbiddenTypes = new Set([
			"AWS::CertificateManager::Certificate",
			"AWS::CloudFront::CachePolicy",
			"AWS::CloudFront::Distribution",
			"AWS::CloudFront::Function",
			"AWS::Route53::HostedZone",
			"AWS::Route53::RecordSet",
		]);
		expect(
			Object.values(resources)
				.map((resource) => resource.Type)
				.filter((type) => forbiddenTypes.has(type)),
		).toEqual([]);
		for (const obsoleteParameter of [
			"EnableCustomDomain",
			"EnableDnsCutover",
			"EnablePaulRedirect",
			"EnablePaulDnsCutover",
			"HostedZoneId",
		]) {
			expect(template.Parameters).not.toHaveProperty(obsoleteParameter);
		}
		for (const obsoleteOutput of [
			"EdgeDistributionId",
			"EdgeDefaultDomain",
			"EdgeDefaultUrl",
			"EdgeCertificateArn",
		]) {
			expect(template.Outputs).not.toHaveProperty(obsoleteOutput);
		}
	});

	test("returns the static custom 404 with an actual 404 status", () => {
		expect(rules.at(-1)).toEqual({
			Source: "/<*>",
			Target: "/404.html",
			Status: "404-200",
		});
		expect(rules.at(-1)?.Status).not.toBe("404");
		expect(outputAssertion).toContain("404: Page Not Found");
		expect(outputAssertion).toContain("must not contain hydration scripts");
		expect(smoke).toContain('"/hosting-migration-smoke/missing-page"');
		expect(smoke).toContain('"/hosting-migration-smoke/missing-page.missing"');
	});

	test("relies on Amplify clean URLs for both forms of the static route", () => {
		expect(rules.some((rule) => rule.Source.startsWith("/areyou"))).toBeFalse();
		expect(outputAssertion).toContain('"areyou/index.html"');
		expect(smoke).toContain('new URL("/areyou", baseUrl)');
		expect(smoke).toContain('new URL("/areyou/", baseUrl)');
	});

	test("domain-only permanent redirects preserve paths and query strings", () => {
		expect(rules.slice(0, 2)).toEqual([
			{
				Source: `https://www.${domainVariable}`,
				Target: `https://${domainVariable}`,
				Status: "301",
			},
			{
				Source: `https://paul.${domainVariable}`,
				Target: "https://pauldiloreto.com",
				Status: "301",
			},
		]);
		for (const rule of rules.slice(0, 2)) {
			const source = new URL(
				rule.Source.replace(domainVariable, "diloreto.com"),
			);
			const target = new URL(
				rule.Target.replace(domainVariable, "diloreto.com"),
			);
			expect(source.pathname).toBe("/");
			expect(source.search).toBe("");
			expect(target.search).toBe("");
		}
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
			"/release.json",
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

	test("deploys through the shared static uploader and verifies the release marker", () => {
		expect(workflow).toContain(
			'scripts/deploy/amplify-static.sh "$AMPLIFY_APP_ID" "$AMPLIFY_BRANCH" release/site.zip',
		);
		expect(workflow).toContain("apps/diloreto/scripts/hosting-smoke.mjs");
		expect(workflow).toContain(`HOSTING_EXPECT_COMMIT: ${githubShaExpression}`);
		expect(workflow).not.toContain("AMPLIFY_URL");
		expect(smoke).toContain('new URL("/release.json", baseUrl)');
		expect(smoke).toContain("Release marker commit");
	});
});
