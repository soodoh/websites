export interface Markdown {
  childMarkdownRemark: {
    html: string;
  };
}

export interface Image {
  fluid: any;
}

export interface Project {
  id: string;
  coverImage: Image;
  description: Markdown;
  jobTitle: string;
  title: string;
  url?: string;
}
