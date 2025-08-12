import { type ReactNode } from "react";
import styles from "./GradientContainer.module.css";

const GradientContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className={styles.container}>
      <div className={styles.topGradient} />

      <div className={styles.content}>
        {children}
        <div className={styles.gradientBackground}>
          <div className={styles.firstColor} />
          <div className={styles.halfwayGradient} />
          <div className={styles.secondColor} />
        </div>
      </div>

      <div className={styles.bottomGradient} />
    </div>
  );
};

export default GradientContainer;
