import { contentfulFixture } from "@tests/fixtures/contentful";
import type { DataProvider } from "@/utils/data-provider";
import type { ContentfulSnapshot } from "@/utils/types";

const get = async <Key extends keyof ContentfulSnapshot>(key: Key) =>
	structuredClone(contentfulFixture[key]);

export const dataProvider: DataProvider = {
	getAboutData: () => get("about"),
	getCommonData: () => get("common"),
	getContactData: () => get("contact"),
	getEngagementsData: () => get("engagements"),
	getHomeData: () => get("home"),
	getLessonsData: () => get("lessons"),
	getMediaData: () => get("media"),
};
