import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "vite";
import { expect, test } from "vitest";
import { compiledMarkdown, compileMarkdown } from "./compiled-markdown";

test("compiles headings, prose, emphasis, links, and lists without presentation changes", () => {
	expect(
		compileMarkdown(
			"## History\n\nA **family** with *roots*.\n\n[Tree](/familytree)\n\n- One\n- Two",
		).__html,
	).toBe(
		'<h2>History</h2>\n<p>A <strong>family</strong> with <em>roots</em>.</p>\n<p><a href="/familytree">Tree</a></p>\n<ul>\n<li>One</li>\n<li>Two</li>\n</ul>',
	);
});

test("keeps raw HTML inert and removes unsafe link protocols", () => {
	const { __html: html } = compileMarkdown(
		'<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n[Unsafe](javascript:alert%281%29)\n\n[Safe](https://example.com)',
	);
	expect(html).not.toMatch(/<(?:script|img)\b/);
	expect(html).not.toContain('href="javascript:');
	expect(html).toContain("&lt;script&gt;");
	expect(html).toContain('<a href="https://example.com">Safe</a>');
});

test("Vite emits compiled HTML without a Markdown parser in the browser graph", async () => {
	const root = await mkdtemp(join(tmpdir(), "compiled-markdown-"));
	try {
		const source = join(root, "content.md");
		await writeFile(source, "# Family\n\nA **history**.");
		const entry = join(root, "entry.js");
		await writeFile(entry, 'export { default } from "./content.md?compiled";');
		const outDir = join(root, "dist");
		const result = await build({
			configFile: false,
			root,
			logLevel: "silent",
			plugins: [compiledMarkdown()],
			build: {
				outDir,
				lib: { entry, formats: ["es"], fileName: "content" },
			},
		});
		const outputs = Array.isArray(result) ? result : [result];
		for (const output of outputs) {
			if (!("output" in output)) throw new Error("Expected Vite output");
			for (const chunk of output.output) {
				if (chunk.type !== "chunk") continue;
				expect(chunk.code).toContain("<strong>history</strong>");
				expect(
					Object.keys(chunk.modules).every(
						(id) => !id.includes("node_modules"),
					),
				).toBe(true);
			}
		}
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
