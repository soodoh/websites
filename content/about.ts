import ProfilePhoto from "@/assets/profile.jpeg";
import type { StaticImageData } from "next/image";

export type About = {
  title: string;
  jobTitle: string;
  tagLine: string;
  email: string;
  bio: string[];
  image: StaticImageData;
  skills: {
    title: string;
    bullets: string[];
  }[];
};

export const about: About = {
  title: "Paul DiLoreto",
  jobTitle: "Lead Software Engineer",
  tagLine: "Currently working at Docusign",
  image: ProfilePhoto,
  email: "paul@diloreto.com",
  bio: [
    `After receiving his Bachelor of Art's from UCLA's School of Theater, Film and Television, Paul performed professionally throughout Los Angeles, including playing "Shorty" in the Red Car Trolley Newsboys at Disney California Adventure for several years.`,
    `He is also a adept, self-taught software engineer. After building his first desktop computer and coding his first website at the age of 13, his thirst for technical knowledge has yet to be quenched. To date, Paul has developed expeterise with numerous languages, frameworks, and system architectures. Today, Paul mainly works with Node.js (TypeScript), React, and designs scalable systems with whatever tools appropriate for the requirements and scale.`,
    "Paul is currently a Lead Software Engineer at Docusign.",
  ],
  skills: [
    {
      title: "Front End",
      bullets: [
        "TypeScript",
        "React",
        "NextJS",
        "Service Workers",
        "Gatsby",
        "StencilJS",
        "Web Components",
        "CSS modules, Emotion, PostCSS, Sass, JSS, etc.",
        "Vanilla HTML, CSS, JS (when appropriate)",
        "Meteor (at Disney)",
        "jQuery (back in the day)",
      ],
    },
    {
      title: "Back End",
      bullets: [
        "Node.js",
        "Rust",
        "WebSockets",
        "WebRTC",
        "NextJS",
        "Express",
        "Terraform",
        "Meteor (at Disney)",
        "PHP (in the distant past)",
        "MongoDB",
        "SQL (Postgres, MySQL, etc.)",
      ],
    },
    {
      title: "Platforms",
      bullets: [
        "AWS",
        "Azure",
        "Github Actions",
        "Circle CI",
        "Jenkins",
        "Data Dog",
        "In-house proprietary services (when applicable)",
      ],
    },
    {
      title: "Tools",
      bullets: [
        "Neovim (I could go on and on about configs/plugins)",
        "Tmux",
        "Git (obviously?)",
        "Docker, Docker Compose, Kubernetes",
        "Several CLI tools",
        "Arch Linux (and other common distros)",
      ],
    },
  ],
};
