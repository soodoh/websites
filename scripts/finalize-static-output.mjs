import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const notFoundPath = resolve("dist/client/404.html");
const prerenderedHtml = await readFile(notFoundPath, "utf8");
const staticMobileNavigation = `<nav aria-label="404 navigation" class="hidden max-md:flex gap-4"><a class="text-light-yellow" href="/">Home</a><a class="text-light-yellow" href="/#projects">Work</a><a class="text-light-yellow" href="/#about">About</a><a class="text-light-yellow" href="/#contact">Contact</a></nav>`;
const withoutHydration = prerenderedHtml
	.replace(/<link rel="modulepreload"[^>]*>/g, "")
	.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
const staticHtml = withoutHydration.replace(
	/<div class="hidden max-md:block"><button[\s\S]*?<\/button><\/div>/,
	staticMobileNavigation,
);

if (!staticHtml.includes("404: Page Not Found")) {
	throw new Error(
		"Refusing to finalize 404.html without the custom not-found UI",
	);
}
if (staticHtml.includes("<script")) {
	throw new Error("404.html still contains a hydration script");
}
if (staticHtml === withoutHydration) {
	throw new Error(
		"404.html mobile navigation was not converted to static links",
	);
}

await writeFile(notFoundPath, staticHtml);
console.log("Finalized non-hydrating dist/client/404.html");
