import { readFileSync } from "node:fs";
import type { StackProps } from "aws-cdk-lib";
import {
	ArnFormat,
	Aws,
	CfnCondition,
	CfnOutput,
	CfnParameter,
	CfnResource,
	Duration,
	Fn,
	RemovalPolicy,
	Stack,
	Tags,
	Token,
} from "aws-cdk-lib";
import { CfnApp, CfnBranch, CfnDomain } from "aws-cdk-lib/aws-amplify";
import {
	Alarm,
	ComparisonOperator,
	Metric,
	TreatMissingData,
} from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import {
	CfnOIDCProvider,
	Effect,
	PolicyStatement,
	Role,
	ServicePrincipal,
	WebIdentityPrincipal,
} from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import {
	BlockPublicAccess,
	Bucket,
	BucketEncryption,
} from "aws-cdk-lib/aws-s3";
import { Topic } from "aws-cdk-lib/aws-sns";
import type { Construct } from "constructs";
import { getCleanUrlRules } from "../../src/lib/amplify-artifact";
import {
	CONTENTFUL_ACCESS_TOKEN_PARAMETER,
	PRODUCTION_SECRET_PARAMETERS,
	PROJECT_AUTH_SECRET_PARAMETER,
} from "../../src/lib/deployment-parameters";
import { PRODUCTION_AWS_ACCOUNT, PRODUCTION_AWS_REGION } from "./environment";

const DOMAIN_NAME = "carolyndiloreto.com";
const LEGACY_DOMAIN_NAME = "diloreto.com";
const LEGACY_DOMAIN_PREFIX = "carolyn";
const REPOSITORY_URL = "https://github.com/soodoh/websites";
const MONOREPO_BUILD_SPEC = readFileSync(
	new URL("../../../../amplify.yml", import.meta.url),
	"utf8",
);
const PRODUCTION_BRANCH = "main";
const AMPLIFY_CUSTOM_HEADERS = `customHeaders:
  - pattern: "**/*"
    headers:
      - key: "Strict-Transport-Security"
        value: "max-age=63072000; includeSubDomains"
      - key: "X-Content-Type-Options"
        value: "nosniff"
      - key: "Referrer-Policy"
        value: "strict-origin-when-cross-origin"
      - key: "X-Frame-Options"
        value: "DENY"
      - key: "Permissions-Policy"
        value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
  - pattern: "**/*.html"
    headers:
      - key: "Cache-Control"
        value: "no-cache, no-store, must-revalidate"
  - pattern: "/"
    headers:
      - key: "Cache-Control"
        value: "no-cache, no-store, must-revalidate"
  - pattern: "/assets/*"
    headers:
      - key: "Cache-Control"
        value: "public, max-age=31536000, immutable"
  - pattern: "/__tsr/staticServerFnCache/*"
    headers:
      - key: "Cache-Control"
        value: "public, max-age=31536000, immutable"
  - pattern: "/__release/albums/*"
    headers:
      - key: "Cache-Control"
        value: "public, max-age=31536000, immutable"
  - pattern: "/__deployment.json"
    headers:
      - key: "Cache-Control"
        value: "no-cache, no-store, must-revalidate"
`;
const MONOREPO_GITHUB_SUBJECT =
	"repo:soodoh@18269267/websites@1358469291:environment:production-carolyn";
const CONTENTFUL_STATE_BUCKET_NAME =
	"websites-carolyn-contentful-tofu-state-725669362139-us-west-2";
const CONTENTFUL_STATE_KEY = "contentful/terraform.tfstate";

// Route 53 Registrar created this zone when the domain was registered. It is
// imported so CDK does not create a duplicate hosted zone during migration.
const HOSTED_ZONE_ID = "Z32YJCERCJ1WLI";
const HOSTED_ZONE_NAME_SERVERS = [
	"ns-1056.awsdns-04.org",
	"ns-1780.awsdns-30.co.uk",
	"ns-362.awsdns-45.com",
	"ns-917.awsdns-50.net",
];

export class HostingStack extends Stack {
	constructor(scope: Construct, id: string, props: StackProps) {
		super(scope, id, props);

		if (Stack.of(this).account !== PRODUCTION_AWS_ACCOUNT) {
			throw new Error(
				`This stack must be deployed in AWS account ${PRODUCTION_AWS_ACCOUNT}`,
			);
		}
		if (Stack.of(this).region !== PRODUCTION_AWS_REGION) {
			throw new Error(
				`This stack must be deployed in ${PRODUCTION_AWS_REGION}`,
			);
		}
		Tags.of(this).add("Project", "carolyn-portfolio");
		Tags.of(this).add("Environment", "production");
		Tags.of(this).add("ManagedBy", "CDK");

		const contentfulSpaceId = new CfnParameter(this, "ContentfulSpaceId", {
			description: "Non-secret Contentful space identifier",
			type: "String",
		});
		const operationalAlarmTopicArn = new CfnParameter(
			this,
			"OperationalAlarmTopicArn",
			{
				allowedPattern: "^arn:[^:]+:sns:[^:]+:[0-9]{12}:[A-Za-z0-9_-]+$",
				description: "SNS topic ARN output from the account-foundation stack",
				type: "String",
			},
		);
		const githubOidcProviderArn = new CfnParameter(
			this,
			"GitHubOidcProviderArn",
			{
				allowedPattern:
					"^$|^arn:[^:]+:iam::[0-9]{12}:oidc-provider/token\\.actions\\.githubusercontent\\.com$",
				default: "",
				description:
					"GitHub Actions OIDC provider ARN from the account-foundation stack; empty retains staged legacy ownership",
				type: "String",
			},
		);
		const githubAccessTokenSecretArn = new CfnParameter(
			this,
			"GitHubAccessTokenSecretArn",
			{
				default: "",
				description:
					"Temporary Secrets Manager ARN containing a token field for initial GitHub App authorization",
				noEcho: true,
				type: "String",
			},
		);
		const enableDomainAssociation = new CfnParameter(
			this,
			"EnableDomainAssociation",
			{
				allowedValues: ["true", "false"],
				default: "true",
				description:
					"Create the validated production and legacy Amplify domain associations",
				type: "String",
			},
		);
		const hasExternalGitHubOidcProvider = new CfnCondition(
			this,
			"HasExternalGitHubOidcProvider",
			{
				expression: Fn.conditionNot(
					Fn.conditionEquals(githubOidcProviderArn.valueAsString, ""),
				),
			},
		);
		const createGitHubOidcProvider = new CfnCondition(
			this,
			"CreateGitHubOidcProvider",
			{
				expression: Fn.conditionEquals(githubOidcProviderArn.valueAsString, ""),
			},
		);
		const hasGitHubAccessToken = new CfnCondition(
			this,
			"HasGitHubAccessToken",
			{
				expression: Fn.conditionNot(
					Fn.conditionEquals(githubAccessTokenSecretArn.valueAsString, ""),
				),
			},
		);
		const shouldCreateDomainAssociation = new CfnCondition(
			this,
			"ShouldCreateDomainAssociation",
			{
				expression: Fn.conditionEquals(
					enableDomainAssociation.valueAsString,
					"true",
				),
			},
		);

		const hostedZone = HostedZone.fromHostedZoneAttributes(
			this,
			"ProductionHostedZone",
			{
				hostedZoneId: HOSTED_ZONE_ID,
				zoneName: DOMAIN_NAME,
			},
		);

		const productionSecretParameterArns = PRODUCTION_SECRET_PARAMETERS.map(
			(parameterName) => this.parameterArn(parameterName),
		);
		const projectAuthSecretParameterArn = this.parameterArn(
			PROJECT_AUTH_SECRET_PARAMETER,
		);

		const amplifySourceArn = this.formatArn({
			arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
			resource: "apps",
			resourceName: "*",
			service: "amplify",
		});
		const amplifyServicePrincipal = new ServicePrincipal(
			"amplify.amazonaws.com",
		).withConditions({
			ArnLike: { "aws:SourceArn": amplifySourceArn },
			StringEquals: { "aws:SourceAccount": Aws.ACCOUNT_ID },
		});
		const amplifyServiceRole = new Role(this, "AmplifyServiceAndLoggingRole", {
			assumedBy: amplifyServicePrincipal,
			description:
				"Allows Amplify builds to read production secrets and Amplify SSR to publish bounded CloudWatch logs",
		});
		amplifyServiceRole.addToPolicy(
			new PolicyStatement({
				actions: ["ssm:GetParameter"],
				resources: productionSecretParameterArns,
			}),
		);
		amplifyServiceRole.addToPolicy(
			new PolicyStatement({
				actions: ["logs:CreateLogGroup"],
				resources: [
					this.formatArn({
						arnFormat: ArnFormat.COLON_RESOURCE_NAME,
						resource: "log-group",
						resourceName: "/aws/amplify/*",
						service: "logs",
					}),
				],
			}),
		);
		amplifyServiceRole.addToPolicy(
			new PolicyStatement({
				actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
				resources: [
					this.formatArn({
						arnFormat: ArnFormat.COLON_RESOURCE_NAME,
						resource: "log-group",
						resourceName: "/aws/amplify/*:log-stream:*",
						service: "logs",
					}),
				],
			}),
		);
		amplifyServiceRole.addToPolicy(
			new PolicyStatement({
				actions: ["logs:DescribeLogGroups"],
				resources: ["*"],
			}),
		);

		const githubAccessToken = Token.asString(
			Fn.conditionIf(
				hasGitHubAccessToken.logicalId,
				Fn.join("", [
					"{{resolve:secretsmanager:",
					githubAccessTokenSecretArn.valueAsString,
					":SecretString:token}}",
				]),
				Aws.NO_VALUE,
			),
		);
		const amplifyApp = new CfnApp(this, "AmplifyApp", {
			accessToken: githubAccessToken,
			buildSpec: MONOREPO_BUILD_SPEC,
			cacheConfig: { type: "AMPLIFY_MANAGED" },
			customHeaders: AMPLIFY_CUSTOM_HEADERS,
			customRules: [
				{
					source: `https://www.${DOMAIN_NAME}`,
					status: "301",
					target: `https://${DOMAIN_NAME}`,
				},
				{
					source: `https://${LEGACY_DOMAIN_PREFIX}.${LEGACY_DOMAIN_NAME}`,
					status: "301",
					target: `https://${DOMAIN_NAME}`,
				},
				...getCleanUrlRules(),
			],
			description: "Carolyn DiLoreto portfolio production hosting",
			enableBranchAutoDeletion: false,
			iamServiceRole: amplifyServiceRole.roleArn,
			name: "carolyn-portfolio",
			platform: "WEB_COMPUTE",
			repository: REPOSITORY_URL,
		});
		const amplifyComputeRole = new Role(this, "AmplifySsrComputeRole", {
			assumedBy: new ServicePrincipal("amplify.amazonaws.com").withConditions({
				ArnLike: {
					"aws:SourceArn": `${amplifyApp.attrArn}/branches/*`,
				},
				StringEquals: { "aws:SourceAccount": Aws.ACCOUNT_ID },
			}),
			description:
				"App-scoped SSR role for the Carolyn Portfolio project authorization secret",
		});
		amplifyComputeRole.addToPolicy(
			new PolicyStatement({
				actions: ["ssm:GetParameter"],
				resources: [projectAuthSecretParameterArn],
			}),
		);
		const branchProperties = {
			appId: amplifyApp.attrAppId,
			computeRoleArn: amplifyComputeRole.roleArn,
			enableAutoBuild: false,
			enablePerformanceMode: false,
			enablePullRequestPreview: false,
			environmentVariables: [
				{
					name: "CONTENTFUL_SPACE_ID",
					value: contentfulSpaceId.valueAsString,
				},
				{ name: "AMPLIFY_MONOREPO_APP_ROOT", value: "apps/carolyn" },
			],
			framework: "Nitro",
			stage: "PRODUCTION",
		};
		const branch = new CfnBranch(this, "MonorepoProductionBranch", {
			...branchProperties,
			branchName: PRODUCTION_BRANCH,
			description: "Exact-SHA production releases from GitHub Actions",
		});
		branch.addDependency(amplifyApp);

		const domain = new CfnDomain(this, "ProductionDomain", {
			appId: amplifyApp.attrAppId,
			domainName: hostedZone.zoneName,
			enableAutoSubDomain: false,
			subDomainSettings: [
				{ branchName: PRODUCTION_BRANCH, prefix: "" },
				{ branchName: PRODUCTION_BRANCH, prefix: "www" },
			],
		});
		domain.cfnOptions.condition = shouldCreateDomainAssociation;
		domain.addDependency(branch);

		// This association attaches only carolyn.diloreto.com to the Carolyn app.
		// The shared diloreto.com Route 53 zone is owned by a separate AWS account;
		// this stack must never manage its apex, www, home, wildcard, mail, or paul records.
		const legacyDomain = new CfnDomain(this, "LegacyDomain", {
			appId: amplifyApp.attrAppId,
			domainName: LEGACY_DOMAIN_NAME,
			enableAutoSubDomain: false,
			subDomainSettings: [
				{
					branchName: PRODUCTION_BRANCH,
					prefix: LEGACY_DOMAIN_PREFIX,
				},
			],
		});
		legacyDomain.cfnOptions.condition = shouldCreateDomainAssociation;
		legacyDomain.addDependency(branch);

		new LogGroup(this, "AmplifySsrLogGroup", {
			logGroupName: `/aws/amplify/${amplifyApp.attrAppId}`,
			removalPolicy: RemovalPolicy.RETAIN,
			retention: RetentionDays.ONE_MONTH,
		});

		const alarmTopic = Topic.fromTopicArn(
			this,
			"OperationalAlarmTopic",
			operationalAlarmTopicArn.valueAsString,
		);
		const alarmTags = {
			Environment: "production",
			ManagedBy: "CDK",
			Project: "carolyn-portfolio",
		};
		const serverErrorAlarm = new Alarm(this, "Amplify5xxAlarm", {
			alarmDescription:
				"Amplify Hosting returned at least two 5xx responses in two of three five-minute periods",
			comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
			datapointsToAlarm: 2,
			evaluationPeriods: 3,
			metric: new Metric({
				dimensionsMap: { App: amplifyApp.attrAppId },
				metricName: "5xxErrors",
				namespace: "AWS/AmplifyHosting",
				period: Duration.minutes(5),
				statistic: "Sum",
			}),
			threshold: 2,
			treatMissingData: TreatMissingData.NOT_BREACHING,
		});
		serverErrorAlarm.addAlarmAction(new SnsAction(alarmTopic));
		serverErrorAlarm.addOkAction(new SnsAction(alarmTopic));
		for (const [key, value] of Object.entries(alarmTags)) {
			Tags.of(serverErrorAlarm).add(key, value);
		}

		const latencyAlarm = new Alarm(this, "AmplifyLatencyAlarm", {
			alarmDescription:
				"Amplify Hosting average time to first byte exceeded five seconds in two of three five-minute periods",
			comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
			datapointsToAlarm: 2,
			evaluationPeriods: 3,
			metric: new Metric({
				dimensionsMap: { App: amplifyApp.attrAppId },
				metricName: "Latency",
				namespace: "AWS/AmplifyHosting",
				period: Duration.minutes(5),
				statistic: "Average",
			}),
			threshold: 5,
			treatMissingData: TreatMissingData.NOT_BREACHING,
		});
		latencyAlarm.addAlarmAction(new SnsAction(alarmTopic));
		latencyAlarm.addOkAction(new SnsAction(alarmTopic));
		for (const [key, value] of Object.entries(alarmTags)) {
			Tags.of(latencyAlarm).add(key, value);
		}

		const githubOidcProvider = new CfnOIDCProvider(
			this,
			"GitHubActionsOidcProvider",
			{
				clientIdList: ["sts.amazonaws.com"],
				url: "https://token.actions.githubusercontent.com",
			},
		);
		githubOidcProvider.cfnOptions.condition = createGitHubOidcProvider;
		githubOidcProvider.applyRemovalPolicy(RemovalPolicy.RETAIN);
		const githubSubjectConditions = {
			StringEquals: {
				"token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
				"token.actions.githubusercontent.com:sub": MONOREPO_GITHUB_SUBJECT,
			},
		};
		const contentfulStateBucket = new Bucket(
			this,
			"ContentfulOpenTofuStateBucket",
			{
				blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
				bucketName: CONTENTFUL_STATE_BUCKET_NAME,
				encryption: BucketEncryption.S3_MANAGED,
				enforceSSL: true,
				removalPolicy: RemovalPolicy.RETAIN,
				versioned: true,
			},
		);
		const deploymentRole = new Role(this, "GitHubDeploymentRole", {
			assumedBy: new WebIdentityPrincipal(
				Token.asString(
					Fn.conditionIf(
						hasExternalGitHubOidcProvider.logicalId,
						githubOidcProviderArn.valueAsString,
						githubOidcProvider.ref,
					),
				),
				githubSubjectConditions,
			),
			description:
				"Allows the Carolyn Portfolio production environment to release and monitor Amplify production",
		});
		deploymentRole.addToPolicy(
			new PolicyStatement({
				actions: ["amplify:GetApp"],
				effect: Effect.ALLOW,
				resources: [amplifyApp.attrArn],
			}),
		);
		deploymentRole.addToPolicy(
			new PolicyStatement({
				actions: ["amplify:GetBranch", "amplify:UpdateBranch"],
				effect: Effect.ALLOW,
				resources: [branch.attrArn],
			}),
		);
		deploymentRole.addToPolicy(
			new PolicyStatement({
				actions: ["amplify:GetJob", "amplify:StartJob"],
				effect: Effect.ALLOW,
				resources: [`${branch.attrArn}/jobs/*`],
			}),
		);
		deploymentRole.addToPolicy(
			new PolicyStatement({
				actions: ["s3:ListBucket"],
				effect: Effect.ALLOW,
				resources: [contentfulStateBucket.bucketArn],
			}),
		);
		deploymentRole.addToPolicy(
			new PolicyStatement({
				actions: ["s3:GetObject", "s3:PutObject"],
				effect: Effect.ALLOW,
				resources: [contentfulStateBucket.arnForObjects(CONTENTFUL_STATE_KEY)],
			}),
		);
		deploymentRole.addToPolicy(
			new PolicyStatement({
				actions: ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"],
				effect: Effect.ALLOW,
				resources: [
					contentfulStateBucket.arnForObjects(`${CONTENTFUL_STATE_KEY}.tflock`),
				],
			}),
		);

		new CfnOutput(this, "AmplifyAppId", { value: amplifyApp.attrAppId });
		new CfnOutput(this, "AmplifyDefaultDomain", {
			value: amplifyApp.attrDefaultDomain,
		});
		new CfnOutput(this, "AmplifyProductionUrl", {
			value: `https://${PRODUCTION_BRANCH}.${amplifyApp.attrDefaultDomain}`,
		});
		new CfnOutput(this, "ProductionBranchName", {
			value: PRODUCTION_BRANCH,
		});
		new CfnOutput(this, "HostedZoneId", { value: HOSTED_ZONE_ID });
		new CfnOutput(this, "HostedZoneNameServers", {
			value: HOSTED_ZONE_NAME_SERVERS.join(","),
		});
		new CfnOutput(this, "GitHubDeploymentRoleArn", {
			value: deploymentRole.roleArn,
		});
		new CfnOutput(this, "ContentfulAccessTokenParameter", {
			value: CONTENTFUL_ACCESS_TOKEN_PARAMETER,
		});
		new CfnOutput(this, "ProjectAuthSecretParameter", {
			value: PROJECT_AUTH_SECRET_PARAMETER,
		});
		new CfnOutput(this, "ContentfulOpenTofuStateBucketName", {
			value: contentfulStateBucket.bucketName,
		});

		// The CDK stack remains the live owner only through the import handoff.
		// Retain every physical resource when it relinquishes that ownership.
		for (const resource of this.node.findAll()) {
			if (resource instanceof CfnResource) {
				resource.applyRemovalPolicy(RemovalPolicy.RETAIN);
			}
		}
	}

	private parameterArn(parameterName: string): string {
		return this.formatArn({
			resource: "parameter",
			resourceName: parameterName.slice(1),
			service: "ssm",
		});
	}
}
