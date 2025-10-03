import { type ReactNode } from "react";
import styles from "./GradientContainer.module.css";

const GradientContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className={styles.container}>
      <div className={styles.topGradient} />

      <div className={styles.content}>{children}</div>

      <div className={styles.bottomGradient} />
    </div>
  );
};

export default GradientContainer;
