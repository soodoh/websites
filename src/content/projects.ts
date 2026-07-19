export type Project = {
	title: string;
	description?: string;
	ariaLabel: string;
	url: string;
	image: {
		src: string;
		webpSrc: string;
		width: number;
		height: number;
	};
	bullets: string[];
};

export const projects: Project[] = [
	{
		title: "UX Portfolio",
		ariaLabel: "Screenshot of Carolyn's UX Portfolio",
		url: "https://carolyndiloreto.com/",
		image: {
			src: "/images/carolyn-portfolio.png",
			webpSrc: "/images/carolyn-portfolio.webp",
			width: 698,
			height: 453,
		},
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
		image: {
			src: "/images/family-website.png",
			webpSrc: "/images/family-website.webp",
			width: 702,
			height: 439,
		},
		bullets: [
			"Provided Contentful CMS for non-technical users to manage content",
			"Used React, CSS Modules, and TypeScript",
			"NextJS for static site generation",
			"Static content changes in Contentful CMS triggers continuous deployment via Netlify webhooks",
			"Testing with Jest + Playwright",
		],
	},
];
