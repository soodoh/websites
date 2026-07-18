export type About = {
	title: string;
	jobTitle: string;
	tagLine: string;
	email: string;
	bio: string[];
	image: string;
	focusAreas: Array<{
		title: string;
		description: string;
	}>;
};

export const about: About = {
	title: "Paul DiLoreto",
	jobTitle: "Lead Software Engineer",
	tagLine: "Frontend platforms, technical strategy, and developer experience.",
	image: "/images/profile.jpeg",
	email: "paul@diloreto.com",
	bio: [
		"I’m a Lead Software Engineer at Docusign with nearly a decade of experience building and modernizing web platforms. I specialize in frontend platform architecture, working at the intersection of product development, system design, and developer experience. I turn ambiguous, cross-team problems into practical technical strategies—and stay close enough to implementation to ensure those strategies ship.",
		"At Docusign, I lead onboarding and platform initiatives that improve customer experiences while making engineering teams faster and systems easier to operate. My work has strengthened shared frontend foundations, substantially improved automated-test reliability and coverage, reduced operational noise, and introduced reusable tooling and patterns adopted beyond my immediate team. Previously, at Twitter, Healthline, and Disney, I helped guide large-scale platform migrations, built full-stack systems supporting multiple digital communities, and modernized legacy applications without disrupting delivery.",
		"Before engineering, I studied theater at UCLA and performed professionally at Disney California Adventure. That experience still shapes how I lead: communicating clearly, understanding the audience, building alignment, and staying composed amid ambiguity. I’m most energized by durable frontend platforms, healthy engineering systems, and pragmatic uses of AI that multiply what teams can accomplish.",
	],
	focusAreas: [
		{
			title: "Frontend Platform Architecture",
			description:
				"Scalable React and TypeScript foundations, shared APIs, modular architecture, and sustainable patterns.",
		},
		{
			title: "Technical Strategy and Delivery",
			description:
				"Turning ambiguous product goals into executable plans spanning teams, systems, and stakeholders.",
		},
		{
			title: "Developer Experience",
			description:
				"Tooling, code generation, platform utilities, migrations, and standards that reduce engineering friction.",
		},
		{
			title: "Quality and Operational Excellence",
			description:
				"Test architecture, observability, experimentation, reliability, and production readiness.",
		},
		{
			title: "Full-Stack System Design",
			description:
				"Node.js services, asynchronous workflows, cloud infrastructure, data systems, and distributed integrations.",
		},
		{
			title: "AI-Assisted Engineering",
			description:
				"Repeatable, human-reviewed workflows that accelerate maintenance, testing, investigation, and delivery.",
		},
	],
};
