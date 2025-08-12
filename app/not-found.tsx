import { Metadata } from "next";
import styles from "./notFound.module.css";
// import layoutStyles from "@/components/commonStyles/layout.module.css";

// Statically generated at build time, will error if any Dynamic APIs are used
export const dynamic = "error";

export const metadata: Metadata = {
  title: "PD: Page Not Found",
  description: "The page you are looking for does not exist.",
  robots: "noindex, nofollow",
  keywords: [],
};

export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1>404: Page Not Found</h1>
      <h2>Please check your URL, or select something from the nav bar</h2>
    </div>
  );
}
