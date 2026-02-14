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
      {/* Camera/Film Box */}
      <rect x="15" y="15" width="90" height="75" fill="none" stroke="#d6b56f" strokeWidth="3" rx="3" />
      
      {/* Top two film reels */}
      <circle cx="40" cy="35" r="13" fill="none" stroke="#d6b56f" strokeWidth="2.5" />
      <circle cx="40" cy="35" r="6" fill="none" stroke="#d6b56f" strokeWidth="1.5" />
      
      <circle cx="75" cy="35" r="13" fill="none" stroke="#d6b56f" strokeWidth="2.5" />
      <circle cx="75" cy="35" r="6" fill="none" stroke="#d6b56f" strokeWidth="1.5" />
      
      {/* Film strip lines inside box */}
      <line x1="25" y1="52" x2="95" y2="52" stroke="#d6b56f" strokeWidth="1.5" opacity="0.7" />
      <line x1="25" y1="62" x2="95" y2="62" stroke="#d6b56f" strokeWidth="1.5" opacity="0.7" />
      <line x1="25" y1="72" x2="95" y2="72" stroke="#d6b56f" strokeWidth="1.5" opacity="0.7" />
      
      {/* Right section - film container */}
      <rect x="115" y="15" width="70" height="50" fill="none" stroke="#d6b56f" strokeWidth="3" rx="3" />
      <line x1="125" y1="28" x2="175" y2="28" stroke="#d6b56f" strokeWidth="1.5" opacity="0.7" />
      <line x1="125" y1="43" x2="175" y2="43" stroke="#d6b56f" strokeWidth="1.5" opacity="0.7" />
      <line x1="125" y1="58" x2="175" y2="58" stroke="#d6b56f" strokeWidth="1.5" opacity="0.7" />
      
      {/* Arrow/Play button pointing right - curved chevron */}
      <path d="M 35 100 Q 65 125 95 155 L 82 148 M 95 155 L 87 140" fill="none" stroke="#d6b56f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Curved lines on arrow for texture */}
      <path d="M 42 107 Q 55 118 68 130" fill="none" stroke="#d6b56f" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      <path d="M 48 115 Q 65 130 82 145" fill="none" stroke="#d6b56f" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      
      {/* Bottom film strip */}
      <rect x="25" y="165" width="95" height="13" fill="none" stroke="#d6b56f" strokeWidth="2" rx="2" />
      <line x1="35" y1="165" x2="35" y2="178" stroke="#d6b56f" strokeWidth="1.5" />
      <line x1="50" y1="165" x2="50" y2="178" stroke="#d6b56f" strokeWidth="1.5" />
      <line x1="65" y1="165" x2="65" y2="178" stroke="#d6b56f" strokeWidth="1.5" />
      <line x1="80" y1="165" x2="80" y2="178" stroke="#d6b56f" strokeWidth="1.5" />
      <line x1="95" y1="165" x2="95" y2="178" stroke="#d6b56f" strokeWidth="1.5" />
      <line x1="110" y1="165" x2="110" y2="178" stroke="#d6b56f" strokeWidth="1.5" />
    </svg>
  );
};

export default Logo;
