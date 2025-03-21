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

        {/* Middle circle - Green */}
        <circle
          cx="25"
          cy="25"
          r="15"
          stroke="#009739"
          strokeWidth="4"
          fill="none"
          strokeDasharray="23.6 70.8"
          className="animate-[dash_1.5s_ease-in-out_infinite_reverse]"
        />

        {/* Inner circle - Black */}
        <circle
          cx="25"
          cy="25"
          r="10"
          stroke="#000000"
          strokeWidth="4"
          fill="none"
          strokeDasharray="15.7 47.1"
          className="animate-[dash_1.5s_ease-in-out_infinite]"
        />

        {/* Center white background for text */}
        <circle
          cx="25"
          cy="25"
          r="6"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="1"
        />

        {/* Animated EXL text */}
        <text
          x="25"
          y="27"
          fontSize="6"
          fontWeight="bold"
          textAnchor="middle"
          fill="#EF3340"
          className="font-sans"
        >
          EXL
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="3s"
            repeatCount="indefinite"
          />
        </text>
      </svg>
    </div>
  );
}