import { fileURLToPath } from "node:url";
import { hash } from "bcryptjs";
import { assertSafeProductionBuildEnvironment } from "@/lib/build-environment";
import { writeGeneratedRelease } from "@/lib/generated-release-writer";
import { deriveProjectAuthVersion } from "@/lib/password-utils";
import {
	captureReleaseContent,
	generateReleaseContent,
} from "@/lib/release-content-model";

const BCRYPT_ROUNDS = 10;

async function main(): Promise<void> {
	assertSafeProductionBuildEnvironment(process.env);
	const snapshot = await captureReleaseContent();
	const release = await generateReleaseContent(
		snapshot,
		(password) => hash(password, BCRYPT_ROUNDS),
		deriveProjectAuthVersion,
	);
	const targetDirectory = fileURLToPath(
		new URL("../src/lib/generated-release", import.meta.url),
	);
	await writeGeneratedRelease(targetDirectory, release);
	const albumBytes = Object.values(release.albumFiles).reduce(
		(total, album) => total + Buffer.byteLength(JSON.stringify(album)),
		0,
	);
	process.stdout.write(
		`Release snapshot written with ${snapshot.projects.length} projects and ${snapshot.albums.length} albums (${albumBytes} serialized album bytes)\n`,
	);
}

await main();
