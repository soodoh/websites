import { expect, test } from "bun:test";
import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { HostingStack } from "../lib/hosting-stack";

type Resource = { Type: string; Properties: Record<string, unknown> };
const environment = { account: "725669362139", region: "us-west-2" };
const transition = {
	subject: "fixture:observed-immutable-environment-subject",
	stateObjectArn: "arn:aws:s3:::fixture-only/state/carolyn.json",
	repositoryConnection: true,
};
function synth(
	value?: typeof transition & { candidateBranch?: string | null },
) {
	const app = new App({ context: value ? { monorepoTransition: value } : {} });
	return Template.fromStack(
		new HostingStack(app, "TransitionFixture", { env: environment }),
	).toJSON();
}

test("optional transition retains every logical resource identity and exact old trust", () => {
	const before = synth();
	const after = synth(transition);
	expect(Object.keys(after.Resources).sort()).toEqual(
		Object.keys(before.Resources).sort(),
	);
	const roles = (Object.values(after.Resources) as Resource[]).filter(
		(resource) => resource.Type === "AWS::IAM::Role",
	);
	const deploymentRole = roles.find((role) =>
		JSON.stringify(role).includes(transition.subject),
	);
	expect(deploymentRole?.Properties.AssumeRolePolicyDocument).toMatchObject({
		Statement: [
			{
				Condition: {
					StringEquals: {
						"token.actions.githubusercontent.com:sub": [
							"repo:soodoh/carolyn-portfolio:environment:production",
							transition.subject,
						],
					},
				},
			},
		],
	});
	expect(JSON.stringify(after)).toContain("apps/carolyn");
	expect(JSON.stringify(after)).toContain(transition.stateObjectArn);
	expect(JSON.stringify(before)).not.toContain(transition.subject);
});

test("exact transition does not reconnect repository unless explicitly selected", () => {
	const template = synth({ ...transition, repositoryConnection: false });
	const app = (Object.values(template.Resources) as Resource[]).find(
		(resource) => resource.Type === "AWS::Amplify::App",
	);
	expect(app?.Properties.Repository).toBe(
		"https://github.com/soodoh/carolyn-portfolio",
	);
});

test("missing or wildcard subjects/resources fail closed before synth", () => {
	for (const subject of ["", "repo:*", "repo:?"]) {
		expect(() => synth({ ...transition, subject })).toThrow();
	}
	expect(() =>
		synth({ ...transition, stateObjectArn: "arn:aws:s3:::fixture-only/*" }),
	).toThrow();
});

test("candidate is absent by default and null preserves every application resource", () => {
	const baseline = synth();
	// The CLI adds AWS::CDK::Metadata as the nineteenth synthesized resource.
	expect(Object.keys(baseline.Resources)).toHaveLength(18);
	expect(synth({ ...transition, candidateBranch: null })).toEqual(
		synth(transition),
	);
	expect(baseline.Resources.MonorepoCandidateBranch).toBeUndefined();
});

test("explicit candidate adds only retained isolated branch with exact build and job policy", () => {
	const before = synth(transition);
	const after = synth({ ...transition, candidateBranch: "fixture-candidate" });
	expect(Object.keys(after.Resources).sort()).toEqual(
		[...Object.keys(before.Resources), "MonorepoCandidateBranch"].sort(),
	);
	const candidate = after.Resources.MonorepoCandidateBranch;
	expect(candidate).toMatchObject({
		Type: "AWS::Amplify::Branch",
		DeletionPolicy: "Retain",
		UpdateReplacePolicy: "Retain",
		Properties: {
			BranchName: "fixture-candidate",
			EnableAutoBuild: false,
			EnablePullRequestPreview: false,
			Stage: "BETA",
			EnvironmentVariables: [
				{ Name: "CONTENTFUL_SPACE_ID", Value: { Ref: "ContentfulSpaceId" } },
				{ Name: "AMPLIFY_MONOREPO_APP_ROOT", Value: "apps/carolyn" },
				{ Name: "CAROLYN_CANDIDATE_BRANCH", Value: "fixture-candidate" },
			],
		},
	});
	for (const [id, resource] of Object.entries(before.Resources)) {
		if ((resource as Resource).Type !== "AWS::IAM::Policy")
			expect(after.Resources[id]).toEqual(resource);
	}
	const policies = Object.values(after.Resources).filter(
		(resource) => (resource as Resource).Type === "AWS::IAM::Policy",
	) as Resource[];
	const deployment = policies.find((resource) =>
		JSON.stringify(resource).includes("amplify:StartJob"),
	);
	if (!deployment) throw new Error("Missing deployment policy");
	const statements = (
		deployment.Properties.PolicyDocument as {
			Statement: {
				Action: string | string[];
				Effect: string;
				Resource: unknown;
			}[];
		}
	).Statement;
	expect(statements).toContainEqual({
		Action: ["amplify:GetJob", "amplify:StartJob", "amplify:StopJob"],
		Effect: "Allow",
		Resource: {
			"Fn::Join": [
				"",
				[{ "Fn::GetAtt": ["MonorepoCandidateBranch", "Arn"] }, "/jobs/*"],
			],
		},
	});
	expect(statements).toContainEqual({
		Action: ["amplify:GetBranch", "amplify:ListJobs"],
		Effect: "Allow",
		Resource: { "Fn::GetAtt": ["MonorepoCandidateBranch", "Arn"] },
	});
	const domain = statements.find(
		(statement) => statement.Action === "amplify:GetDomainAssociation",
	);
	expect(domain?.Resource).toEqual(
		["carolyndiloreto.com", "diloreto.com"].map((name) => ({
			"Fn::Join": [
				"",
				[{ "Fn::GetAtt": ["AmplifyApp", "Arn"] }, `/domains/${name}`],
			],
		})),
	);
	const service = policies.find((resource) =>
		JSON.stringify(resource).includes("logs:CreateLogGroup"),
	);
	expect(JSON.stringify(service)).toContain("MonorepoCandidateBranch");
	expect(JSON.stringify(service)).toContain("amplify:GetJob");
	expect(JSON.stringify(after)).not.toContain("amplify:CreateBranch");
	expect(JSON.stringify(after)).not.toContain(
		"amplify:UpdateDomainAssociation",
	);
});

test("unsafe or disconnected candidate configuration fails before synthesis", () => {
	for (const candidateBranch of [
		"",
		"*",
		"main",
		"amplify-production",
		"sarabeth-production",
		"bad/ref",
		"Upper",
		"-bad",
		"a".repeat(64),
	]) {
		expect(() => synth({ ...transition, candidateBranch })).toThrow();
	}
	expect(() =>
		synth({
			...transition,
			candidateBranch: "fixture-candidate",
			repositoryConnection: false,
		}),
	).toThrow();
});
