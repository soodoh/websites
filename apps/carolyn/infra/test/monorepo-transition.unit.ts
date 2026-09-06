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
function synth(value?: typeof transition) {
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
