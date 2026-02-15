const VerticalBar = ({ dark = false }: { dark?: boolean }) => {
  return (
    <div className={`w-px h-16 ${dark ? "bg-dark-blue" : "bg-light-yellow"}`} />
  );
};

export default VerticalBar;
