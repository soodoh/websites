import { createHash } from "node:crypto";
import type { ContentSource, ContentSourceLoader } from "@/lib/content-source";
import { getBuildContentSource } from "@/lib/content-source";
import { getAboutContentFromSource } from "@/lib/fetch-about-data";
import { getSocialMedia } from "@/lib/fetch-home-data";
import { getAlbumsFromSource } from "@/lib/fetch-photos";
import {
	getProjectPageSnapshotFromSource,
	getProjectsFromSource,
} from "@/lib/fetch-projects";
import type {
	ProjectAuthManifest,
	ProjectAuthSource,
} from "@/lib/project-auth-manifest-builder";
import { buildProjectAuthManifest } from "@/lib/project-auth-manifest-builder";
import type {
	AboutData,
	Album,
	ImageType,
	Project,
	ProjectInfo,
	SocialMedia,
} from "@/lib/types";

export type ReleaseContentSnapshot = {
	aboutData: AboutData;
	albums: Album[];
	backgroundImage: ImageType;
	projects: Array<{
		detail: ProjectInfo;
		password?: string;
		summary: Project;
	}>;
	resumeUrl: string;
	socialMedia: SocialMedia[];
};

export type PublicReleaseContent = {
	aboutData: AboutData;
	backgroundImage: ImageType;
	photography: {
		albumNames: string[];
		albumSources: Record<string, string>;
		initialAlbum: Album;
	};
	projectProtection: Record<string, boolean>;
	projects: Project[];
	publicProjectDetails: Record<string, ProjectInfo>;
	resumeUrl: string;
	socialMedia: SocialMedia[];
};

export type GeneratedReleaseContent = {
	albumFiles: Record<string, Album>;
	authManifest: ProjectAuthManifest;
	projectRoutes: Record<string, "protected" | "public">;
	protectedProjectDetails: Record<string, ProjectInfo>;
	publicContent: PublicReleaseContent;
};

type HashPassword = (password: string) => Promise<string>;
type DeriveAuthVersion = (slug: string, password: string) => Promise<string>;

function sameProjectSummary(summary: Project, detail: ProjectInfo): boolean {
	return (
		summary.id === detail.id &&
		summary.title === detail.title &&
		summary.slug === detail.slug &&
		summary.summary === detail.summary &&
		JSON.stringify(summary.coverImage) === JSON.stringify(detail.coverImage) &&
		JSON.stringify(summary.projectType) === JSON.stringify(detail.projectType)
	);
}

function assertProjectInventory(
	source: ContentSource,
	projects: ReleaseContentSnapshot["projects"],
): void {
	const slugs = new Set<string>();
	const ids = new Set<string>();
	for (const { detail, summary } of projects) {
		if (slugs.has(summary.slug)) {
			throw new Error(`Duplicate project slug in release: ${summary.slug}`);
		}
		if (ids.has(summary.id)) {
			throw new Error(`Duplicate project ID in release: ${summary.id}`);
		}
		if (!sameProjectSummary(summary, detail)) {
			throw new Error(
				`Project summary and detail differ in release: ${summary.slug}`,
			);
		}
		slugs.add(summary.slug);
		ids.add(summary.id);
	}

	if (source.kind === "fixture") {
		const detailSlugs = Object.keys(source.content.projectInfo).toSorted();
		const summarySlugs = [...slugs].toSorted();
		if (
			detailSlugs.length !== summarySlugs.length ||
			detailSlugs.some((slug, index) => slug !== summarySlugs[index])
		) {
			throw new Error(
				"Project summary, detail, and authorization inventories differ.",
			);
		}
	}
}

export async function captureReleaseContent(
	loadSource: ContentSourceLoader = getBuildContentSource,
): Promise<ReleaseContentSnapshot> {
	const source = await loadSource();
	const sameSource = async () => source;
	const [about, socialMedia, summaries, albums] = await Promise.all([
		getAboutContentFromSource(sameSource),
		getSocialMedia(sameSource),
		getProjectsFromSource(sameSource),
		getAlbumsFromSource(sameSource),
	]);
	const projects = await Promise.all(
		summaries.map(async (summary) => {
			const { password, projectInfo: detail } =
				await getProjectPageSnapshotFromSource(summary.slug, sameSource);
			return { detail, password, summary };
		}),
	);
	assertProjectInventory(source, projects);
	if (albums.length === 0) {
		throw new Error("No photography albums are configured.");
	}

	return {
		aboutData: about.aboutData,
		albums,
		backgroundImage: about.backgroundImage,
		projects,
		resumeUrl: about.resumeUrl,
		socialMedia,
	};
}

function albumFileName(album: Album): string {
	return `${createHash("sha256").update(JSON.stringify(album)).digest("hex")}.json`;
}

export async function generateReleaseContent(
	snapshot: ReleaseContentSnapshot,
	hashPassword: HashPassword,
	deriveAuthVersion: DeriveAuthVersion,
): Promise<GeneratedReleaseContent> {
	const authSources: ProjectAuthSource[] = snapshot.projects.map(
		({ password, summary }) => ({ password, slug: summary.slug }),
	);
	const authManifest = await buildProjectAuthManifest(
		authSources,
		hashPassword,
		deriveAuthVersion,
	);
	const publicProjectDetails: Record<string, ProjectInfo> = {};
	const protectedProjectDetails: Record<string, ProjectInfo> = {};
	const projectProtection: Record<string, boolean> = {};
	const projectRoutes: Record<string, "protected" | "public"> = {};
	for (const { detail, password, summary } of snapshot.projects) {
		const isProtected = Boolean(password);
		projectProtection[summary.slug] = isProtected;
		projectRoutes[summary.slug] = isProtected ? "protected" : "public";
		if (isProtected) {
			protectedProjectDetails[summary.slug] = detail;
		} else {
			publicProjectDetails[summary.slug] = detail;
		}
	}

	const albumFiles: Record<string, Album> = {};
	const albumSources: Record<string, string> = {};
	for (const album of snapshot.albums) {
		const filename = albumFileName(album);
		albumFiles[filename] = album;
		albumSources[album.name] = `/__release/albums/${filename}`;
	}
	const initialAlbum = snapshot.albums[0];
	if (!initialAlbum) {
		throw new Error("No photography albums are configured.");
	}

	return {
		albumFiles,
		authManifest,
		projectRoutes,
		protectedProjectDetails,
		publicContent: {
			aboutData: snapshot.aboutData,
			backgroundImage: snapshot.backgroundImage,
			photography: {
				albumNames: snapshot.albums.map((album) => album.name),
				albumSources,
				initialAlbum,
			},
			projectProtection,
			projects: snapshot.projects.map(({ summary }) => summary),
			publicProjectDetails,
			resumeUrl: snapshot.resumeUrl,
			socialMedia: snapshot.socialMedia,
		},
	};
}
