import { copyFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

/** Add .html aliases for known public routes, preserving their directory indexes. */
export async function writeCleanPathAliases(
	outputDirectory: string,
	publicPaths: readonly string[],
): Promise<void> {
	const root = resolve(outputDirectory);
	for (const path of publicPaths) {
		if (path === "/") continue;
		const directory = resolve(root, path.replace(/^\/+/, ""));
		const fromRoot = relative(root, directory);
		if (
			!fromRoot ||
			isAbsolute(fromRoot) ||
			fromRoot === ".." ||
			fromRoot.startsWith(`..${sep}`)
		) {
			throw new Error(
				`Clean-path alias must stay inside the output directory: ${path}`,
			);
		}
		await copyFile(join(directory, "index.html"), `${directory}.html`);
	}
}
