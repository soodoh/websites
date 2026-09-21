import publicRelease from "@/lib/generated-release/public-release-content.json";
import type { PublicReleaseContent } from "@/lib/release-content-model";

const release = publicRelease as unknown as PublicReleaseContent;

export function getReleaseCommonContent() {
	return { socialMedia: release.socialMedia };
}

export function getReleaseHomeContent() {
	return {
		backgroundImage: release.backgroundImage,
		projects: release.projects,
	};
}

export function getReleaseAboutContent() {
	return {
		aboutData: release.aboutData,
		backgroundImage: release.backgroundImage,
	};
}

export function getReleasePhotographyContent() {
	return release.photography;
}

export function getReleaseProjects() {
	return release.projects;
}

export function getReleasePublicProject(slug: string) {
	return release.publicProjectDetails[slug];
}

export function getReleaseResumeUrl() {
	return release.resumeUrl;
}
