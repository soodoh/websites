import CarolynPortfolio from "@/assets/carolyn-portfolio.png";
import FamilyWebsite from "@/assets/family-website.png";
import type { StaticImageData } from "next/image";

export type Project = {
  title: string;
  description?: string;
  ariaLabel: string;
  url: string;
  image: StaticImageData;
  bullets: string[];
};

export const projects: Project[] = [
  {
    title: "UX Portfolio",
    ariaLabel: "Screenshot of Carolyn's UX Portfolio",
    url: "https://carolyndiloreto.com/",
    image: CarolynPortfolio,
    bullets: [
      "Provided Contentful CMS for non-technical users to manage content",
      "Used React, CSS Modules, and TypeScript",
      "Serverside rendering + static site generation with NextJS",
      "Static content changes in Contentful CMS triggers continuous deployment via Netlify webhooks",
      "Testing with Jest + Playwright",
    ],
  },
  {
    title: "Family Website",
    ariaLabel: "Screenshot of DiLoreto.com Family Website",
    url: "https://diloreto.com/",
    image: FamilyWebsite,
    bullets: [
      "Provided Contentful CMS for non-technical users to manage content",
      "Used React, CSS Modules, and TypeScript",
      "NextJS for static site generation",
      "Static content changes in Contentful CMS triggers continuous deployment via Netlify webhooks",
      "Testing with Jest + Playwright",
    ],
  },
];
