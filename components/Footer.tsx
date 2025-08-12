import ArrowForward from "@/components/ArrowForward";
import ContactButtons from "@/components/ContactButtons";
import { about } from "@/content/about";
import React from "react";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.container}>
      <ContactButtons />

      <div className={styles.contactMe} id="contact">
        <h6 className={styles.contactTitle}>Feel free to contact me at</h6>

        <h6 className={styles.contact}>
          <ArrowForward className={styles.arrow} />
          <a href={`mailto:${about.email}`}>{about.email}</a>
        </h6>
      </div>
    </footer>
  );
};

export default Footer;
