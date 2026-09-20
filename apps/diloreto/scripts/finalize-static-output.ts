import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const outputDirectory = "dist/client";
const notFoundPath = join(outputDirectory, "404.html");
const notFoundDocument = await readFile(notFoundPath, "utf8");
const staticNotFoundDocument = notFoundDocument
	.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
	.replace(/<link\b(?=[^>]*\brel=["']modulepreload["'])[^>]*>/gi, "");

if (!staticNotFoundDocument.includes("404: Page Not Found")) {
	throw new Error("Refusing to write a 404 document without the expected UI");
}

await writeFile(notFoundPath, staticNotFoundDocument);

const cleanPathAliases: string[] = [];

async function writeCleanPathAliases(directory: string): Promise<void> {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (!entry.isDirectory()) {
			continue;
		}

		const childDirectory = join(directory, entry.name);
		await writeCleanPathAliases(childDirectory);

		const childEntries = await readdir(childDirectory);
		if (!childEntries.includes("index.html")) {
			continue;
		}

		const route = relative(outputDirectory, childDirectory);
		const aliasPath = join(outputDirectory, `${route}.html`);
		await writeFile(
			aliasPath,
			await readFile(join(childDirectory, "index.html")),
		);
		cleanPathAliases.push(relative(outputDirectory, aliasPath));
	}
}

await writeCleanPathAliases(outputDirectory);
console.log(
	`Finalized hydration-free ${notFoundPath} and ${cleanPathAliases.length} clean-path aliases`,
);
