export type Project = {
	title: string;
	ariaLabel: string;
	url: string;
	image: {
		src: string;
		avifSrcSet: string;
		webpSrcSet: string;
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
			avifSrcSet:
				"/images/carolyn-portfolio-320.avif 320w, /images/carolyn-portfolio-480.avif 480w, /images/carolyn-portfolio.avif 698w",
			webpSrcSet:
				"/images/carolyn-portfolio-320.webp 320w, /images/carolyn-portfolio-480.webp 480w, /images/carolyn-portfolio.webp 698w",
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
			avifSrcSet:
				"/images/family-website-320.avif 320w, /images/family-website-480.avif 480w, /images/family-website.avif 702w",
			webpSrcSet:
				"/images/family-website-320.webp 320w, /images/family-website-480.webp 480w, /images/family-website.webp 702w",
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
