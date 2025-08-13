import { about } from "@/content/about";
import titleStyles from "@/styles/backgroundTitle.module.css";
import cx from "classnames";
import * as motion from "motion/react-client";
import Link from "next/link";
import { Parallax } from "react-scroll-parallax";
import ArrowForward from "./ArrowForward";
import styles from "./Banner.module.css";
import ContactButtons from "./ContactButtons";
import VerticalBar from "./VerticalBar";

const Banner = () => {
  return (
    <div className={styles.container}>
      <Parallax
        className={cx(titleStyles.title, styles.titleBackground)}
        translateY={[-60, 60]}
      >
        <motion.h1
          initial={{ opacity: 0, y: 500 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            y: { type: "spring", visualDuration: 1, bounce: 0.3 },
          }}
        >
          Paul
          <br />
          DiLoreto
        </motion.h1>
      </Parallax>

      <Parallax
        className={styles.titleGroup}
        translateY={[5, -5]}
        translateX={[-10, 10]}
      >
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 1,
            y: { type: "spring", delay: 0.5, visualDuration: 1, bounce: 0.3 },
          }}
        >
          <h2 className={styles.title}>{about.title}</h2>

          <p className={styles.jobTitle}>{about.jobTitle}</p>

          <p className={styles.tagLine}>{about.tagLine}</p>

          <Link className={styles.contactButton} href={`mailto:${about.email}`}>
            Contact Me
            <ArrowForward />
          </Link>
        </motion.div>
      </Parallax>

      <div className={styles.socialMediaButtons}>
        <ContactButtons />
      </div>

      <motion.div
        className={styles.viewMore}
        initial={{ opacity: 0, y: 200 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 1,
          duration: 1,
          y: { type: "spring", delay: 1, visualDuration: 1, bounce: 0.3 },
        }}
      >
        <span>View More</span>
        <VerticalBar />
      </motion.div>
    </div>
  );
};

export default Banner;
