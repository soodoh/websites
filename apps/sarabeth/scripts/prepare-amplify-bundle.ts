import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createProductionRoutes } from "@scripts/amplify-routing";
import publicRoutes from "@scripts/public-routes.json" with { type: "json" };
import { resolveReleaseCommit } from "@scripts/release-commit";
import { readAmplifyDeployManifest } from "@websites/static-site/amplify";
import { writeCleanPathAliases } from "@websites/static-site/output";
import { createReleaseIdentity } from "../../../scripts/deploy/release.ts";

const manifestPath = join(".amplify-hosting", "deploy-manifest.json");
const manifest = await readAmplifyDeployManifest(".amplify-hosting");
manifest.routes = createProductionRoutes(manifest.routes, publicRoutes);

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await writeCleanPathAliases(join(".amplify-hosting", "static"), publicRoutes);
const commit = await resolveReleaseCommit();
const identity = createReleaseIdentity(
	commit,
	process.env.RELEASE_RUN_ID,
	process.env.RELEASE_RUN_ATTEMPT,
);
await writeFile(
	join(".amplify-hosting", "static", "__deployment.json"),
	`${JSON.stringify(identity)}\n`,
);
console.log(
	`Prepared Amplify bundle for ${commit} with ${publicRoutes.length} static-first page routes`,
);
