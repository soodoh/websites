import type { JSX } from "react";

const VerticalBar = ({ dark = false }: { dark?: boolean }): JSX.Element => {
  return (
    <div className={`w-px h-16 ${dark ? "bg-dark-blue" : "bg-light-yellow"}`} />
  );
};

export default VerticalBar;
