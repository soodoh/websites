import { socialMedia } from "@/content/socialMedia";
import Link from "next/link";
import React from "react";
import styles from "./ContactButtons.module.css";

const ContactButtons = () => {
  return (
    <div className={styles.container}>
      {socialMedia.map(({ label, ariaLabel, url }) => (
        <Link
          key={`socialMedia-${label}`}
          className={styles.socialMediaButton}
          aria-label={ariaLabel}
          href={url}
        >
          {label}
        </Link>
      ))}
    </div>
  );
};

export default ContactButtons;
