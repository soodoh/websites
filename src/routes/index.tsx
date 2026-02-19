import { createFileRoute } from "@tanstack/react-router";
import HomeContent from "@/components/home-content";
import { about } from "@/content/about";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PD: Portfolio" },
      { name: "description", content: about.tagLine },
    ],
    links: [{ rel: "icon", href: "/favicon.png" }],
  }),
  component: HomeContent,
});

export default Route;
