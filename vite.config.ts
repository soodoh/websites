import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(async () => ({
	server: {
		port: 3000,
	},
	plugins: [
		tanstackStart({
			prerender: {
				enabled: true,
				crawlLinks: true,
			},
		}),
		...(process.env.PLAYWRIGHT_TEST === "1"
			? []
			: [(await import("@netlify/vite-plugin-tanstack-start")).default()]),
		tailwindcss(),
		tsconfigPaths(),
		viteReact(),
	],
}));
