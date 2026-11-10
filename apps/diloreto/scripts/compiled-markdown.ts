import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import type { Plugin } from "vite";
import type { CompiledMarkdown } from "../src/content/markdown";

/** Retain ReactMarkdown's escaping and URL policy without shipping its parser. */
export function compileMarkdown(markdown: string): CompiledMarkdown {
	return {
		__html: renderToStaticMarkup(createElement(ReactMarkdown, null, markdown)),
	};
}

export function compiledMarkdown(): Plugin {
	return {
		name: "compiled-markdown",
		enforce: "pre",
		async load(id) {
			if (!id.endsWith(".md?compiled")) return;
			const path = id.slice(0, -"?compiled".length);
			this.addWatchFile(path);
			const markdown = await readFile(path, "utf8");
			return `export default ${JSON.stringify(compileMarkdown(markdown))};`;
		},
	};
}
