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
        {/* Outer circle - Emirates Red */}
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke="#EF3340"
          strokeWidth="4"
          fill="none"
          strokeDasharray="31.4 94.2"
          className="animate-[dash_1.5s_ease-in-out_infinite]"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Middle circle - Emirates Navy Blue */}
        <circle
          cx="25"
          cy="25"
          r="15"
          stroke="#004990"
          strokeWidth="4"
          fill="none"
          strokeDasharray="23.6 70.8"
          className="animate-[dash_1.5s_ease-in-out_infinite_reverse]"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 25 25"
            to="0 25 25"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Inner circle - Emirates Light Blue */}
        <circle
          cx="25"
          cy="25"
          r="10"
          stroke="#0066cc"
          strokeWidth="4"
          fill="none"
          strokeDasharray="15.7 47.1"
          className="animate-[dash_1.5s_ease-in-out_infinite]"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Center circle for Emirates premium look */}
        <circle
          cx="25"
          cy="25"
          r="6"
          fill="#004990"
          fillOpacity="0.9"
        >
          <animate
            attributeName="opacity"
            values="0.6;0.9;0.6"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Emirates wordmark - optional text */}
        <text
          x="25"
          y="26.5"
          fontSize="4"
          fontWeight="bold"
          textAnchor="middle"
          fill="#FFFFFF"
          className="font-sans"
        >
          EK
        </text>
      </svg>
    </div>
  );
}