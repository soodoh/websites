import classNames from "classnames/bind";
import styles from "./VerticalBar.module.css";

const cx = classNames.bind(styles);

const VerticalBar = ({ dark = false }: { dark?: boolean }) => {
  return <div className={cx(styles.bar, { dark })} />;
};

export default VerticalBar;
