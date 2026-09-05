import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const notFoundPath = resolve("dist/client/404.html");
const navigationPath = resolve("src/content/navigation.json");
const [prerenderedHtml, navigationJson] = await Promise.all([
	readFile(notFoundPath, "utf8"),
	readFile(navigationPath, "utf8"),
]);
/** @type {{ label: string, url: string }[]} */
const navigationLinks = JSON.parse(navigationJson);
const staticMobileNavigation = `<nav aria-label="404 navigation" class="hidden max-md:flex gap-4"><a class="text-light-yellow" href="/">Home</a>${navigationLinks
	.map(
		({ label, url }) =>
			`<a class="text-light-yellow" href="${url}">${label}</a>`,
	)
	.join("")}</nav>`;
const withoutHydration = prerenderedHtml
	.replace(/<link rel="modulepreload"[^>]*>/g, "")
	.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
const staticHtml = withoutHydration.replace(
	/<div[^>]*data-static-navigation-replacement="mobile"[^>]*>[\s\S]*?<\/header>/,
	`${staticMobileNavigation}</header>`,
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
		"404.html mobile navigation marker was not converted to static links",
	);
}

await writeFile(notFoundPath, staticHtml);
console.log("Finalized non-hydrating dist/client/404.html");
