import { createFileRoute } from "@tanstack/react-router";
import NotFound from "@/components/not-found";

export const Route = createFileRoute("/404")({
	head: () => ({
		meta: [
			{ title: "404: Page Not Found | PD Portfolio" },
			{ name: "robots", content: "noindex, follow" },
		],
	}),
	component: NotFound,
});
