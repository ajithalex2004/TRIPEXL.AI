import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EmiratesSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function EmiratesSpinner({ className, size = 'md', ...props }: EmiratesSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div 
      className={cn("relative", sizeClasses[size], className)} 
      {...props}
    >
      <svg
        className="animate-spin"
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle - Red */}
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke="#EF3340"
          strokeWidth="4"
          fill="none"
          strokeDasharray="31.4 94.2"
          className="animate-[dash_1.5s_ease-in-out_infinite]"
        />

        {/* Middle circle - Blue */}
        <circle
          cx="25"
          cy="25"
          r="15"
          stroke="#004990"
          strokeWidth="4"
          fill="none"
          strokeDasharray="23.6 70.8"
          className="animate-[dash_1.5s_ease-in-out_infinite_reverse]"
        />

        {/* Inner circle - Light Blue */}
        <circle
          cx="25"
          cy="25"
          r="10"
          stroke="#0066cc"
          strokeWidth="4"
          fill="none"
          strokeDasharray="15.7 47.1"
          className="animate-[dash_1.5s_ease-in-out_infinite]"
        />

        {/* Center circle for logo background */}
        <circle
          cx="25"
          cy="25"
          r="8"
          fill="#FFFFFF"
        />

        {/* EXL Logo */}
        <image
          href="/attached_assets/image_1742546091702.png"
          x="17"
          y="17"
          width="16"
          height="16"
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    </div>
  );
}