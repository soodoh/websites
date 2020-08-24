import { Markdown, Image } from './contentful';

export interface Project {
  coverImage: Image;
  description: Markdown;
  jobTitle: string;
  title: string;
  url?: string;
}
