/** HTML emitted only by the build-time Markdown compiler, never from runtime input. */
export type CompiledMarkdown = Readonly<{ __html: string }>;
