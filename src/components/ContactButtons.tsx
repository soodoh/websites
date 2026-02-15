import { socialMedia } from "@/content/socialMedia";

const ContactButtons = () => {
  return (
    <div className="flex flex-col justify-center max-sm:flex-row">
      {socialMedia.map(({ label, ariaLabel, url }) => (
        <a
          key={`socialMedia-${label}`}
          className="w-10 h-10 flex justify-center items-center border-none rounded-full bg-light-blue text-dark-blue no-underline m-2 transition-colors duration-300 hover:bg-purple"
          aria-label={ariaLabel}
          href={url}
        >
          {label}
        </a>
      ))}
    </div>
  );
};

export default ContactButtons;
