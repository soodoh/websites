import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import NotFound from "@/components/not-found";

export const Route = createFileRoute("/__static-not-found")({
	component: StaticNotFoundPage,
});

function StaticNotFoundPage(): JSX.Element {
	return <NotFound />;
}
