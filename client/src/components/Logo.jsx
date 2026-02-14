import React from "react";

const Logo = ({ size = "32", className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Film reel circles */}
      <circle cx="60" cy="60" r="40" fill="none" stroke="#d6b56f" strokeWidth="8"/>
      <circle cx="140" cy="60" r="40" fill="none" stroke="#d6b56f" strokeWidth="8"/>
      <circle cx="100" cy="140" r="40" fill="none" stroke="#d6b56f" strokeWidth="8"/>

      {/* Inner circles for film reel holes */}
      <circle cx="60" cy="60" r="8" fill="#d6b56f"/>
      <circle cx="140" cy="60" r="8" fill="#d6b56f"/>
      <circle cx="100" cy="140" r="8" fill="#d6b56f"/>

      {/* Play button in center */}
      <polygon
        points="100,85 115,100 100,115"
        fill="#d6b56f"
        className="logo-play-btn"
      />

      {/* Center circle */}
      <circle cx="100" cy="100" r="25" fill="none" stroke="#d6b56f" strokeWidth="3"/>
    </svg>
  );
};

export default Logo;
