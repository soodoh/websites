import type { JSX } from "react";
import type { CompiledMarkdown } from "@/content/markdown";

export default function MarkdownContent({
	content,
}: {
	content: CompiledMarkdown;
}): JSX.Element {
	return (
		<div
			className="font-serif markdown-content"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Build-only ReactMarkdown output escapes HTML and rejects unsafe URLs.
			dangerouslySetInnerHTML={content}
		/>
	);
}
