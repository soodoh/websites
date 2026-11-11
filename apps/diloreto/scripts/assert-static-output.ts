import { readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import {
	artifactSize,
	listArtifactFiles,
} from "@websites/static-site/artifact";

const outputDirectory = "dist/client";
const requiredAssets = ["robots.txt", "favicon.png", "apple-touch-icon.png"];
const searchableExtensions = new Set([
	".css",
	".html",
	".js",
	".json",
	".txt",
	".xml",
]);
const forbiddenPatterns = [/\.netlify\/images/i, /netlify/i];

// Independent artifact contract, not a second parser for TanStack route filenames.
// Native autoStaticPathsDiscovery + failOnError covers additional static routes.
const requiredRouteFiles = [
	"index.html",
	"areyou/index.html",
	"familytree/index.html",
	"404.html",
];
const requiredCleanPathAliases = requiredRouteFiles.flatMap((path) =>
	path.endsWith("/index.html")
		? [`${path.slice(0, -"/index.html".length)}.html`]
		: [],
);

for (const requiredFile of [
	...requiredRouteFiles,
	...requiredCleanPathAliases,
	...requiredAssets,
]) {
	const path = join(outputDirectory, requiredFile);
	if (!(await stat(path)).isFile()) {
		throw new Error(`Missing required static file: ${path}`);
	}
}

const files = await listArtifactFiles(outputDirectory);

for (const path of files) {
	const extension = extname(path);
	if (!searchableExtensions.has(extension)) {
		continue;
	}

	const contents = await readFile(path, "utf8");
	for (const pattern of forbiddenPatterns) {
		if (pattern.test(contents)) {
			throw new Error(
				`Forbidden deployment reference ${pattern} found in ${relative(outputDirectory, path)}`,
			);
		}
	}
}

const home = await readFile(join(outputDirectory, "index.html"), "utf8");
const history = await readFile(
	join(outputDirectory, "areyou/index.html"),
	"utf8",
);
const historyAlias = await readFile(
	join(outputDirectory, "areyou.html"),
	"utf8",
);
const notFound = await readFile(join(outputDirectory, "404.html"), "utf8");

if (historyAlias !== history) {
	throw new Error(
		"The extensionless clean-path alias differs from its route document",
	);
}
if (!home.includes("<picture") || !history.includes("<picture")) {
	throw new Error(
		"Responsive picture markup is missing from prerendered pages",
	);
}
if (!/srcset=/i.test(home) || !/srcset=/i.test(history)) {
	throw new Error(
		"Responsive image srcsets are missing from prerendered pages",
	);
}
if (!notFound.includes("404: Page Not Found")) {
	throw new Error("The custom 404 document is missing its expected content");
}
if (!/<script\b/i.test(notFound)) {
	throw new Error("The custom 404 document must retain its client runtime");
}

const totalBytes = await artifactSize(files);

console.log(
	`Static output verified: ${requiredRouteFiles.length} routes, ${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB`,
);
