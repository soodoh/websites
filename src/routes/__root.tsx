/// <reference types="vite/client" />
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { about } from "@/content/about";
import appCss from "@/styles/globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PD Portfolio" },
      { name: "description", content: about.tagLine },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png" },
    ],
  }),
  notFoundComponent: NotFound,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

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

function NotFound() {
  return (
    <div className="mt-20 px-[10vw] max-sm:px-8 [&_h1]:text-[2rem] [&_h2]:text-base">
      <h1>404: Page Not Found</h1>
      <h2>Please check your URL, or select something from the nav bar</h2>
    </div>
  );
}
