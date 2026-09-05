import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		port: 3000,
	},
	plugins: [
		tanstackStart({
			prerender: {
				enabled: true,
				concurrency: 1,
				crawlLinks: true,
				failOnError: true,
			},
			pages: [
				{
					path: "/404",
					prerender: { enabled: true, outputPath: "/404.html" },
				},
			],
		}),
		tailwindcss(),
		viteReact(),
	],
});
