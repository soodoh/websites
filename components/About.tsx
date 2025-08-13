import { about } from "@/content/about";
import titleStyles from "@/styles/backgroundTitle.module.css";
import cx from "classnames";
import Image from "next/image";
import { Fragment } from "react";
import { Parallax } from "react-scroll-parallax";
import styles from "./About.module.css";

const About = () => {
  return (
    <div className={styles.container}>
      <Parallax
        className={cx(titleStyles.title, styles.title)}
        translateY={[-40, 60]}
        translateX={[5, -5]}
      >
        <h1 id="about">About Me</h1>
      </Parallax>

      <Parallax className={styles.portrait} translateY={[10, -60]}>
        <Image src={about.image} alt="Profile photo of Paul DiLoreto" />
      </Parallax>

      <div className={styles.grid}>
        <h2>About</h2>

        <div className={styles.about}>
          {about.bio.map((paragraph, index) => (
            <p key={`about-paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>

        <h2>Skills</h2>

        <div className={styles.skills}>
          {about.skills.map(({ title, bullets }) => (
            <Fragment key={`skill-category-${title}`}>
              <h3>{title}</h3>
              <ul>
                {bullets.map((bullet, index) => (
                  <li key={`skill-${title}-${index}`}>{bullet}</li>
                ))}
              </ul>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
