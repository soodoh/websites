const ArrowBack = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      width="61"
      height="9"
      viewBox="0 0 61 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        y1="-0.5"
        x2="55"
        y2="-0.5"
        transform="matrix(-1 0 0 1 61 5)"
        stroke="#0E0827"
      />
      <path
        d="M1.96701e-07 4.5L6 8.39711L6 0.602885L1.96701e-07 4.5Z"
        fill="#0E0827"
      />
    </svg>
  );
};

export default ArrowBack;
