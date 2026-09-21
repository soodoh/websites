import { prepareAmplifyArtifact } from "@/lib/amplify-artifact";
import { assertSafeProductionBuildEnvironment } from "@/lib/build-environment";
import projectRoutes from "@/lib/generated-release/project-routes.json";
import type { ReleaseProjectRoute } from "@/lib/release-project-routes";

const mode = assertSafeProductionBuildEnvironment(process.env);

await prepareAmplifyArtifact(
	".amplify-hosting",
	mode,
	projectRoutes as Record<string, ReleaseProjectRoute>,
);
process.stdout.write(
	`Prepared ${mode} Amplify artifact with static public content and bounded compute routes.\n`,
);
