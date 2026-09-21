import { cp, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { GeneratedReleaseContent } from "@/lib/release-content-model";

async function writeJson(path: string, value: unknown): Promise<void> {
	await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeGeneratedRelease(
	targetDirectory: string,
	release: GeneratedReleaseContent,
): Promise<void> {
	const parent = dirname(targetDirectory);
	const transactionId = `${process.pid}-${Date.now()}`;
	const stagingDirectory = `${targetDirectory}.staging-${transactionId}`;
	const backupDirectory = `${targetDirectory}.backup-${transactionId}`;
	await mkdir(join(stagingDirectory, "static", "albums"), { recursive: true });

	try {
		await Promise.all([
			writeJson(
				join(stagingDirectory, "public-release-content.json"),
				release.publicContent,
			),
			writeJson(
				join(stagingDirectory, "protected-project-content.server.json"),
				release.protectedProjectDetails,
			),
			writeJson(
				join(stagingDirectory, "project-auth-manifest.server.json"),
				release.authManifest,
			),
			writeJson(
				join(stagingDirectory, "project-routes.json"),
				release.projectRoutes,
			),
			...Object.entries(release.albumFiles).map(([filename, album]) =>
				writeJson(join(stagingDirectory, "static", "albums", filename), album),
			),
		]);

		await mkdir(parent, { recursive: true });
		let backedUp = false;
		try {
			await rename(targetDirectory, backupDirectory);
			backedUp = true;
		} catch (error) {
			if (error instanceof Error && "code" in error && error.code === "EXDEV") {
				await cp(targetDirectory, backupDirectory, { recursive: true });
				await rm(targetDirectory, { force: true, recursive: true });
				backedUp = true;
			} else if (
				!(error instanceof Error && "code" in error && error.code === "ENOENT")
			) {
				throw error;
			}
		}

		try {
			await rename(stagingDirectory, targetDirectory);
		} catch (error) {
			if (backedUp) {
				await rename(backupDirectory, targetDirectory);
			}
			throw error;
		}
		if (backedUp) {
			await rm(backupDirectory, { force: true, recursive: true });
		}
	} catch (error) {
		await rm(stagingDirectory, { force: true, recursive: true });
		throw error;
	}
}
