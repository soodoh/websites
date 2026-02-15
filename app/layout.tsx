import "@/styles/globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { about } from "@/content/about";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PD Portfolio",
  description: about.tagLine,
  robots: "index, follow",
  keywords: [],
  icons: "/favicon.png",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/*
        TODO get the correct value for this
        <meta
          name="google-site-verification"
          content="mZWTxlscBqxebm-E7NiMf8dG-G2qbqKKODr0BoCUobQ"
        /> */}
      </head>
      <body>
        <Header />
        <main className="grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
