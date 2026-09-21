import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getReleaseResumeUrl } from "@/lib/release-content";

const getResumePageUrl = createServerFn().handler(getReleaseResumeUrl);

export const Route = createFileRoute("/resume")({
	loader: async () => {
		const resumeUrl = await getResumePageUrl();
		throw redirect({ href: resumeUrl, statusCode: 307 });
	},
});
