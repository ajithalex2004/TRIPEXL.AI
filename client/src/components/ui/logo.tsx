import * as React from "react";

export function Logo({ className = "", size = "default" }: { className?: string; size?: "small" | "default" | "large" }) {
  const sizes = {
    small: "h-6",
    default: "h-8",
    large: "h-12"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/attached_assets/image_1742282529798.png"
        alt="EXL Solutions Logo"
        className={`${sizes[size]} object-contain`}
      />
    </div>
  );
}