/// <reference types="vite/client" />

import headerFont from "@fontsource/fjalla-one/files/fjalla-one-latin-400-normal.woff2?url";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";
import NotFound from "@/components/not-found";
import { about } from "@/content/about";
import appCss from "@/styles/globals.css?url";

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<Header />
				<main className="grow">{children}</main>
				<Footer />
				<Scripts />
			</body>
		</html>
	);
}

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "PD Portfolio" },
			{ name: "description", content: about.tagLine },
			{ name: "robots", content: "index, follow" },
		],
		links: [
			{ rel: "canonical", href: "https://pauldiloreto.com/" },
			{
				rel: "preload",
				href: headerFont,
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
			},
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.png", sizes: "96x96" },
		],
	}),
	notFoundComponent: NotFound,
	component: RootComponent,
});

export default Route;
