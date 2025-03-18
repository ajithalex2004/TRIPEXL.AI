import * as React from "react";

export function Logo({ className = "", size = "default" }: { className?: string; size?: "small" | "default" | "large" }) {
  const sizes = {
    small: "h-6",
    default: "h-8",
    large: "h-12"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg 
        className={sizes[size]} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="20" fill="#004990"/>
        <circle cx="20" cy="20" r="16" fill="#004990" fillOpacity="0.8"/>
        <circle cx="20" cy="20" r="12" fill="#004990" fillOpacity="0.6"/>
        <circle cx="20" cy="20" r="8" fill="#004990" fillOpacity="0.4"/>
      </svg>
      <span className="font-bold text-[#004990] text-xl">EXL Solutions</span>
    </div>
  );
}