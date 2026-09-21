import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setResponseHeader } from "@tanstack/react-start/server";
import type { JSX } from "react";
import PasswordForm from "@/components/password-form";
import ProjectInfoPage from "@/components/project-info-page";
import { verifyToken } from "@/lib/password-utils";
import { getProjectAuth } from "@/lib/project-auth.server";
import { getProtectedReleaseProject } from "@/lib/protected-release-content.server";
import { getReleaseProjectRoute } from "@/lib/release-project-routes";
import { getStaticPublicProject } from "@/lib/release-server-functions";
import {
	isValidProjectSlug,
	validateProjectSlug,
} from "@/lib/server-function-inputs";

const getProtectedProjectPageData = createServerFn({ method: "POST" })
	.validator(validateProjectSlug)
	.handler(async ({ data: slug }) => {
		setResponseHeader("Cache-Control", "private, no-store");
		const auth = getProjectAuth(slug);
		if (!auth?.passwordHash || !auth.authVersion) {
			return { notFound: true as const };
		}
		const token = getCookie(`project-auth-${slug}`);
		if (!token || !(await verifyToken(token, slug, auth.authVersion))) {
			return { authorized: false as const, slug };
		}
		const projectInfo = getProtectedReleaseProject(slug);
		if (!projectInfo) {
			throw new Error(`Protected project is missing from release: ${slug}`);
		}
		return {
			authorized: true as const,
			projectInfo,
			protected: true as const,
		};
	});

export const Route = createFileRoute("/projects/$slug")({
	loader: async ({ params: { slug } }) => {
		if (!isValidProjectSlug(slug)) {
			throw notFound();
		}
		const route = getReleaseProjectRoute(slug);
		if (!route) {
			throw notFound();
		}
		if (route === "public") {
			return {
				authorized: true as const,
				projectInfo: await getStaticPublicProject({ data: slug }),
				protected: false as const,
			};
		}
		const data = await getProtectedProjectPageData({ data: slug });
		if ("notFound" in data) {
			throw notFound();
		}
		return data;
	},
	head: ({ loaderData }) => {
		if (!loaderData?.authorized) {
			return {
				meta: [
					{ title: "CD Projects - Password Protected" },
					{ name: "robots", content: "noindex, nofollow" },
				],
			};
		}
		const { projectInfo } = loaderData;
		return {
			meta: [
				{ title: `CD Projects - ${projectInfo.title}` },
				{
					name: "description",
					content: `Carolyn DiLoreto's project, ${projectInfo.title} - ${projectInfo.summary}`,
				},
				{
					name: "robots",
					content: loaderData.protected ? "noindex, nofollow" : "index, follow",
				},
			],
		};
	},
	component: ProjectPage,
});

function ProjectPage(): JSX.Element {
	const data = Route.useLoaderData();
	if (!data.authorized) {
		return <PasswordForm slug={data.slug} />;
	}
	return <ProjectInfoPage projectInfo={data.projectInfo} />;
}
