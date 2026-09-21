import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { PROJECT_AUTH_SECRET_PARAMETER } from "@/lib/deployment-parameters";

export { PROJECT_AUTH_SECRET_PARAMETER } from "@/lib/deployment-parameters";

interface ServerSecretLoaderOptions {
	environment: Readonly<Record<string, string | undefined>>;
	getParameter: (name: string) => Promise<string | undefined>;
}

export interface ServerSecretLoader {
	getProjectAuthSecret: () => Promise<string>;
}

export function createServerSecretLoader({
	environment,
	getParameter,
}: ServerSecretLoaderOptions): ServerSecretLoader {
	let initialization: Promise<string> | undefined;

	function getProjectAuthSecret(): Promise<string> {
		if (!initialization) {
			const pendingInitialization = loadProjectAuthSecret();
			initialization = pendingInitialization;
			void pendingInitialization.catch(() => {
				if (initialization === pendingInitialization) {
					initialization = undefined;
				}
			});
		}
		return initialization;
	}

	async function loadProjectAuthSecret(): Promise<string> {
		const localValue = environment.PROJECT_AUTH_SECRET;
		if (localValue) {
			return localValue;
		}

		let parameterValue: string | undefined;
		try {
			parameterValue = await getParameter(PROJECT_AUTH_SECRET_PARAMETER);
		} catch {
			throw new Error(
				"Failed to initialize PROJECT_AUTH_SECRET from AWS Systems Manager Parameter Store",
			);
		}
		if (!parameterValue) {
			throw new Error(
				`Missing PROJECT_AUTH_SECRET; set it locally or create ${PROJECT_AUTH_SECRET_PARAMETER}`,
			);
		}
		return parameterValue;
	}

	return { getProjectAuthSecret };
}

const ssmClient = new SSMClient({
	region: process.env.AWS_REGION ?? "us-west-2",
});
const serverSecrets = createServerSecretLoader({
	environment: process.env,
	getParameter: async (name) => {
		const response = await ssmClient.send(
			new GetParameterCommand({ Name: name, WithDecryption: true }),
		);
		return response.Parameter?.Value;
	},
});

export const getProjectAuthSecret = serverSecrets.getProjectAuthSecret;
