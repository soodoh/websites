import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export async function listArtifactFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, {
		recursive: true,
		withFileTypes: true,
	});
	return entries
		.filter((entry) => !entry.isDirectory())
		.map((entry) => join(entry.parentPath, entry.name));
}

export async function artifactSize(files: readonly string[]): Promise<number> {
	let bytes = 0;
	for (const file of files) bytes += (await stat(file)).size;
	return bytes;
}

/** Scan each file once, including binary assets; never include secret values in errors. */
export async function assertNoArtifactSecrets(
	files: readonly string[],
	values: readonly (string | undefined)[],
): Promise<void> {
	const secrets = values
		.filter((value): value is string => Boolean(value))
		.map((value) => Buffer.from(value));
	if (secrets.length === 0) return;
	for (const file of files) {
		const contents = await readFile(file);
		assert(
			!secrets.some((secret) => contents.includes(secret)),
			`A secret value was serialized into the artifact: ${file}`,
		);
	}
}
