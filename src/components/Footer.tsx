import ArrowForward from "@/components/ArrowForward";
import ContactButtons from "@/components/ContactButtons";
import { about } from "@/content/about";

const Footer = () => {
  return (
    <footer className="flex flex-wrap text-light-blue my-12 px-[10vw] max-sm:flex-col-reverse max-sm:items-center max-sm:px-8">
      <ContactButtons />

      <div
        className="flex-1 flex flex-wrap justify-center items-center font-header text-xl max-sm:justify-start max-sm:mb-12"
        id="contact"
      >
        <span className="m-0 text-light-blue uppercase max-sm:mb-4">
          Feel free to contact me at
        </span>

        <div className="m-0 flex items-center [&_a]:text-light-yellow [&_a]:no-underline">
          <ArrowForward className="mx-8 [&_line]:fill-light-yellow [&_line]:stroke-light-yellow [&_path]:fill-light-yellow [&_path]:stroke-light-yellow" />
          <a href={`mailto:${about.email}`}>{about.email}</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
