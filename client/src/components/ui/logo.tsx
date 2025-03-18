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
        viewBox="0 0 200 60" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M0 0H40V10H10V25H35V35H10V50H40V60H0V0Z" 
          fill="#004990"
        />
        <path 
          d="M50 0H90V10H60V60H50V0Z" 
          fill="#004990"
        />
        <path 
          d="M100 0H140V10H110V25H135V35H110V50H140V60H100V0Z" 
          fill="#004990"
        />
        <path 
          d="M150 0H190L170 30L190 60H150V50H175L165 35L175 10H150V0Z" 
          fill="#004990"
        />
      </svg>
      <span className="font-bold text-[#004990] text-xl">Solutions</span>
    </div>
  );
}
