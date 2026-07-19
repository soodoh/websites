import type { JSX } from "react";
import { socialMedia } from "@/content/social-media";

const ContactButtons = ({ label }: { label: string }): JSX.Element => {
	return (
		<nav
			aria-label={label}
			className="flex flex-col justify-center max-sm:flex-row"
		>
			{socialMedia.map(({ label, ariaLabel, url }) => (
				<a
					key={`socialMedia-${label}`}
					className="w-10 h-10 flex justify-center items-center border-none rounded-full bg-light-blue text-dark-blue no-underline m-2 transition-colors duration-300 hover:bg-purple"
					href={url}
				>
					<span className="sr-only">{ariaLabel}</span>
					<span aria-hidden="true">{label}</span>
				</a>
			))}
		</nav>
	);
};

export default ContactButtons;
