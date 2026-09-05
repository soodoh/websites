import { access, readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const clientRoot = resolve("dist/client");
const requiredFiles = ["index.html", "404.html", "favicon.png"];

/** @type {(condition: unknown, message: string) => asserts condition} */
const assert = (condition, message) => {
	if (!condition) {
		throw new Error(message);
	}
};

/**
 * @param {string} directory
 * @returns {Promise<string[]>}
 */
const listFiles = async (directory) => {
	const entries = await readdir(directory, { withFileTypes: true });
	const nestedFiles = await Promise.all(
		entries.map(async (entry) => {
			const path = join(directory, entry.name);
			return entry.isDirectory() ? listFiles(path) : [path];
		}),
	);
	return nestedFiles.flat();
};

for (const file of requiredFiles) {
	await access(join(clientRoot, file));
}

const indexHtml = await readFile(join(clientRoot, "index.html"), "utf8");
const notFoundHtml = await readFile(join(clientRoot, "404.html"), "utf8");
/** @type {{ label: string, url: string }[]} */
const navigationLinks = JSON.parse(
	await readFile(resolve("src/content/navigation.json"), "utf8"),
);
const files = await listFiles(clientRoot);
const relativeFiles = files.map((file) => relative(clientRoot, file));

assert(
	indexHtml.includes('<link rel="canonical" href="https://pauldiloreto.com/"'),
	"index.html is missing the canonical production URL",
);
assert(
	indexHtml.includes("Paul<br/>DiLoreto"),
	"index.html does not contain the current prerendered home page",
);
assert(
	notFoundHtml.includes("404: Page Not Found"),
	"404.html does not contain the custom not-found UI",
);
assert(
	!notFoundHtml.includes('class="h-screen flex flex-col'),
	"404.html contains the home page banner and could flash incorrect content",
);
assert(
	!notFoundHtml.includes("<script"),
	"404.html contains client scripts and could hydrate against an unknown URL",
);
for (const { label, url } of navigationLinks) {
	assert(
		notFoundHtml.includes(`href="${url}">${label}</a>`),
		`404.html is missing the ${label} navigation link`,
	);
}
assert(
	relativeFiles.every(
		(file) => !file.endsWith(".mjs") && !file.includes("server"),
	),
	"dist/client contains a server artifact",
);
assert(
	relativeFiles.includes("images/profile-240.avif") &&
		relativeFiles.includes("images/profile-1200.webp") &&
		relativeFiles.includes("images/carolyn-portfolio-320.avif") &&
		relativeFiles.includes("images/family-website-480.webp") &&
		!relativeFiles.includes("images/profile.jpeg"),
	"responsive image assets are incomplete or the oversized profile source leaked into the artifact",
);

const assetReferences = [
	...indexHtml.matchAll(/(?:href|src)="(\/assets\/[^"?#]+)"/g),
].map((match) => match[1].slice(1));
assert(
	assetReferences.length > 0,
	"index.html does not reference hashed assets",
);

for (const asset of assetReferences) {
	await access(join(clientRoot, asset));
	assert(
		/-[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/.test(asset),
		`Asset is not content hashed: ${asset}`,
	);
}

const profileFallbackSize = (
	await stat(join(clientRoot, "images/profile-960.jpg"))
).size;
assert(
	profileFallbackSize < 250_000,
	`Profile fallback is unexpectedly large: ${profileFallbackSize} bytes`,
);

console.log(
	`Static output verified: ${relativeFiles.length} files in dist/client; server bundle excluded from deployment root.`,
);
