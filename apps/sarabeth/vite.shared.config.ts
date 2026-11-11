import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { responsiveImages } from "@websites/images/vite";
import { nitro } from "nitro/vite";
import type { UserConfig } from "vite";
import { createStaticReleaseFunctionId } from "./scripts/static-release-function-id";

export const sharedViteConfig = {
	server: {
		host: "127.0.0.1",
		port: 3000,
	},
	preview: {
		host: process.env.HOST ?? "127.0.0.1",
		port: Number(process.env.PORT ?? 3000),
		strictPort: true,
	},
	resolve: {
		tsconfigPaths: true,
	},
	build: {
		sourcemap: false,
	},
	plugins: [
		responsiveImages(),
		tanstackStart({
			serverFns: {
				generateFunctionId: createStaticReleaseFunctionId(),
			},
			pages: [
				{ path: "/" },
				{
					path: "/404",
					prerender: { outputPath: "/404.html", crawlLinks: false },
				},
			],
			prerender: {
				enabled: true,
				crawlLinks: true,
				failOnError: true,
			},
		}),
		nitro(),
		viteReact(),
		tailwindcss(),
	],
} satisfies UserConfig;
