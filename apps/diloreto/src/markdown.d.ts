declare module "*.md?compiled" {
	const markdown: import("@/content/markdown").CompiledMarkdown;

	export default markdown;
}
