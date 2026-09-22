import {
	BLOCKS,
	type Document,
	type TopLevelBlock,
} from "@contentful/rich-text-types";
import type { ContentfulSnapshot, ImageType } from "@/utils/types";

const placeholder =
	"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const text = (value: string) => ({
	nodeType: "text" as const,
	value,
	marks: [],
	data: {},
});

const paragraph = (value: string): TopLevelBlock => ({
	nodeType: BLOCKS.PARAGRAPH,
	data: {},
	content: [text(value)],
});

const heading = (value: string): TopLevelBlock => ({
	nodeType: BLOCKS.HEADING_1,
	data: {},
	content: [text(value)],
});

const document = (...content: TopLevelBlock[]): Document => ({
	nodeType: BLOCKS.DOCUMENT,
	data: {},
	content,
});

const image = (
	id: string,
	title: string,
	width: number,
	height: number,
): ImageType => ({
	id,
	title,
	description: `${title} test image`,
	url: `https://images.ctfassets.net/sarabeth-visual-fixture/master/${id}/${id}.webp`,
	width,
	height,
	placeholder,
});

const heroPortrait = image("hero-portrait", "Hero portrait", 1600, 2133);
const stageWide = image("stage-wide", "Stage performance", 1600, 900);
const studioLandscape = image("studio-landscape", "Voice studio", 1200, 800);
const performancePortrait = image(
	"performance-portrait",
	"Performance portrait",
	800,
	1200,
);
const rehearsalSquare = image("rehearsal-square", "Rehearsal", 900, 900);
const bannerWide = image("banner-wide", "Page banner", 1800, 700);

/**
 * Stable presentation scenarios for browser and visual tests.
 *
 * This is deliberately not a live Contentful export. Raw Contentful response
 * mapping is covered independently by contentful-fetchers.spec.ts.
 */
export const contentfulFixture: ContentfulSnapshot = {
	common: {
		location: "Los Angeles",
		brandName: "Sarabeth Belón",
		socialMediaLinks: [
			{ source: "instagram", link: "https://www.instagram.com/example/" },
			{ source: "youtube", link: "https://www.youtube.com/@example" },
			{ source: "email", link: "mailto:sarabeth@example.com" },
		],
	},
	home: [
		{
			id: "home-introduction",
			mainSection: true,
			title: "Sarabeth Belón",
			subtitle: undefined,
			description: document(
				paragraph(
					"Soprano, teaching artist, and performer bringing expressive stories to the stage.",
				),
			),
			buttonText: "Read Bio",
			buttonLink: "/about",
			images: [heroPortrait],
		},
		{
			id: "home-performer",
			mainSection: false,
			title: "Vocal Artist",
			subtitle: "Opera · Concert · New Work",
			description: document(
				paragraph(
					"A versatile performer at home in intimate recitals and large-scale productions.",
				),
			),
			buttonText: "View Engagements",
			buttonLink: "/engagements",
			images: [performancePortrait, stageWide, heroPortrait],
		},
		{
			id: "home-studio",
			mainSection: false,
			title: "Sarabeth's Studio",
			subtitle: "Individual voice lessons",
			description: document(
				paragraph(
					"Supportive, practical instruction helps each student build a reliable and expressive voice.",
				),
			),
			buttonText: "Ask About Lessons",
			buttonLink: "/contact",
			images: [studioLandscape],
		},
		{
			id: "home-engagements",
			mainSection: false,
			title: "Engagements",
			subtitle: "On stage and in concert",
			description: document(
				paragraph(
					"Explore upcoming appearances and selected performances from recent seasons.",
				),
			),
			buttonText: "See Performances",
			buttonLink: "/engagements",
			images: [stageWide, performancePortrait],
		},
	],
	about: {
		headshot: heroPortrait,
		location: "Los Angeles",
		bio: document(
			heading("Sarabeth Belón"),
			paragraph(
				"Sarabeth is a Los Angeles-based soprano whose work spans opera, concert music, and collaborative performance.",
			),
			paragraph(
				"Her practice combines musical precision with generous storytelling, and her teaching helps singers develop sustainable technique and confident communication.",
			),
		),
	},
	engagements: {
		title: "Engagements",
		bannerImage: bannerWide,
		engagements: [
			{
				id: "past-recital",
				title: "Winter Recital",
				role: "Soprano",
				company: "Community Concert Series",
				link: "https://example.com/winter-recital",
				startDate: "2025-12-01",
				endDate: "2025-12-01",
			},
			{
				id: "akhnaten",
				title: "Akhnaten",
				role: "Chorus (alto)",
				company: "Los Angeles Opera",
				link: "https://www.laopera.org/performances/2026/akhnaten",
				startDate: "2026-02-28",
				endDate: "2026-03-22",
			},
			{
				id: "future-concert",
				title: "New Music Showcase",
				role: "Featured Artist",
				company: "Test Arts Collective",
				link: "https://example.com/new-music",
				startDate: "2027-05-15",
				endDate: "2027-05-15",
			},
		],
	},
	lessons: {
		title: "Voice Lessons",
		bannerImage: bannerWide,
		followLink: "https://www.instagram.com/example/",
		aboutDescription: document(
			paragraph(
				"Lessons are tailored to each singer's goals, experience, and repertoire.",
			),
		),
		teachingPhilosophy: document(
			paragraph(
				"Healthy coordination, curiosity, and clear feedback create durable progress.",
			),
		),
		studioExpectations: document(
			paragraph(
				"Students arrive prepared to experiment, reflect, and practice between sessions.",
			),
		),
		socialMediaDescription: document(
			paragraph(
				"Follow the studio for exercises, performance notes, and updates.",
			),
		),
		socialMediaImage: rehearsalSquare,
		teachingResume: document(
			paragraph(
				"Private voice instruction · Group workshops · Audition coaching",
			),
		),
		email: "studio@example.com",
		phoneNumber: "555-0100",
		reviewLink: "https://example.com/review",
	},
	media: {
		images: [
			heroPortrait,
			stageWide,
			performancePortrait,
			studioLandscape,
			rehearsalSquare,
			bannerWide,
		],
		audio: [
			{
				id: "audio-forgotten",
				title: "Let It Be Forgotten",
				description: "Song recording",
				url: "https://assets.ctfassets.net/sarabeth-visual-fixture/master/audio-forgotten/test-audio.wav",
			},
			{
				id: "audio-zion",
				title: "Bereite dich Zion",
				description: "Aria recording",
				url: "https://downloads.ctfassets.net/sarabeth-visual-fixture/master/audio-zion/test-audio.wav",
			},
		],
	},
	contact: { bannerImage: bannerWide },
};
