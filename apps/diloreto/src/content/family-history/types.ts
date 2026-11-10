import type { ContentImage } from "../image";
import type { CompiledMarkdown } from "../markdown";

export type HistoryRecordMetadata = {
	title: string;
	link?: string;
	headerPhoto?: ContentImage;
	galleryPhotos?: ContentImage[];
};

export type HistoryRecord = HistoryRecordMetadata & {
	year: number;
	content: CompiledMarkdown;
};
