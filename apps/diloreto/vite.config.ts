import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { responsiveImages } from "@websites/images/vite";
import { defineConfig } from "vite";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		port: 3000,
	},
	plugins: [
		responsiveImages(),
		tanstackStart({
			pages: [
				{
					path: "/404",
					prerender: { outputPath: "/404.html", crawlLinks: false },
				},
			],
			prerender: {
				enabled: true,
				autoStaticPathsDiscovery: true,
				crawlLinks: false,
				failOnError: true,
			},
		}),
		tailwindcss(),
		viteReact(),
	],
});
