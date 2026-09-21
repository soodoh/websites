import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import {
	getReleaseAboutContent,
	getReleaseCommonContent,
	getReleaseHomeContent,
	getReleasePhotographyContent,
	getReleaseProjects,
	getReleasePublicProject,
} from "@/lib/release-content";
import { validateProjectSlug } from "@/lib/server-function-inputs";

export const getStaticCommonContent = createServerFn()
	.middleware([staticFunctionMiddleware])
	.handler(() => getReleaseCommonContent());

export const getStaticHomeContent = createServerFn()
	.middleware([staticFunctionMiddleware])
	.handler(() => getReleaseHomeContent());

export const getStaticAboutContent = createServerFn()
	.middleware([staticFunctionMiddleware])
	.handler(() => getReleaseAboutContent());

export const getStaticPhotographyContent = createServerFn()
	.middleware([staticFunctionMiddleware])
	.handler(() => getReleasePhotographyContent());

export const getStaticProjects = createServerFn()
	.middleware([staticFunctionMiddleware])
	.handler(() => getReleaseProjects());

export const getStaticPublicProject = createServerFn()
	.validator(validateProjectSlug)
	.middleware([staticFunctionMiddleware])
	.handler(({ data: slug }) => {
		const projectInfo = getReleasePublicProject(slug);
		if (!projectInfo) {
			throw new Error(`Public project is missing from this release: ${slug}`);
		}
		return projectInfo;
	});
