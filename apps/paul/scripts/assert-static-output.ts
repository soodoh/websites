import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { listArtifactFiles } from "@websites/static-site/artifact";

const clientRoot = resolve("dist/client");
const requiredFiles = ["index.html", "404.html", "favicon.png"];

for (const file of requiredFiles) {
	await access(join(clientRoot, file));
}

const indexHtml = await readFile(join(clientRoot, "index.html"), "utf8");
const notFoundHtml = await readFile(join(clientRoot, "404.html"), "utf8");
const navigationLinks: { label: string; url: string }[] = JSON.parse(
	await readFile(resolve("src/content/navigation.json"), "utf8"),
);
const files = await listArtifactFiles(clientRoot);
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
	notFoundHtml.includes("<script"),
	"404.html must retain JavaScript for the interactive navigation",
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
const pictures = [
	...indexHtml.matchAll(/<picture\b[^>]*>([\s\S]*?)<\/picture>/g),
];
assert(
	pictures.length === 3,
	"All three content images must use responsive picture markup",
);
const imageReferences = new Set<string>();
for (const [, picture] of pictures) {
	const sources = [...picture.matchAll(/srcSet="([^"]+)"/gi)];
	assert(sources.length > 0, "Responsive image has no source candidates");
	for (const [, srcSet] of sources) {
		for (const candidate of srcSet.split(", ")) {
			const [url, descriptor] = candidate.split(" ");
			assert(
				/^\d+w$/.test(descriptor),
				`Invalid responsive descriptor: ${descriptor}`,
			);
			assert(
				url.startsWith("/assets/"),
				`Image is not build-generated: ${url}`,
			);
			imageReferences.add(url.slice(1));
		}
	}
	assert(
		/\bsizes=/.test(picture) &&
			/\bwidth="\d+"/.test(picture) &&
			/\bheight="\d+"/.test(picture),
		"Responsive image must declare layout sizes and dimensions",
	);
}
for (const image of imageReferences) await access(join(clientRoot, image));
assert(
	!relativeFiles.some((file) => file.startsWith("images/")),
	"Hand-maintained image variants leaked into the artifact",
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

const profileFallback = indexHtml.match(
	/<img\b[^>]*src="([^"]+)"[^>]*alt="Paul DiLoreto"/,
);
assert(profileFallback, "Profile fallback is missing");
const profileFallbackSize = (await stat(join(clientRoot, profileFallback[1])))
	.size;
assert(
	profileFallbackSize < 250_000,
	`Profile fallback is unexpectedly large: ${profileFallbackSize} bytes`,
);

console.log(
	`Static output verified: ${relativeFiles.length} files in dist/client; server bundle excluded from deployment root.`,
);
