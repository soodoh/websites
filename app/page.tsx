import HomeContent from "@/components/HomeContent";
import { about } from "@/content/about";
import type { Metadata } from "next";

// Statically generated at build time, will error if any Dynamic APIs are used
export const dynamic = "error";

export const metadata: Metadata = {
  title: "PD: Portfolio",
  description: about.tagLine,
  keywords: [],
  icons: "/favicon.png",
};

const Home = async () => {
  return <HomeContent />;
};

export default Home;
