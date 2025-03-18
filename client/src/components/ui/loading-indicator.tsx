import * as React from "react";
import { motion } from "framer-motion";

interface LoadingIndicatorProps {
  size?: "sm" | "md" | "lg";
}

export function LoadingIndicator({ size = "md" }: LoadingIndicatorProps) {
  const sizes = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Road background */}
      <div className={`relative ${sizes[size]} bg-slate-200 rounded-full overflow-hidden`}>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1/3 bg-slate-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Moving truck */}
        <motion.svg
          viewBox="0 0 100 100"
          className="absolute w-1/3 h-1/3"
          initial={{ x: -50 }}
          animate={{ 
            x: 150,
            rotateY: [0, 0, 180, 180, 0],
          }}
          transition={{
            x: {
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            },
            rotateY: {
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              times: [0, 0.48, 0.52, 0.98, 1]
            }
          }}
        >
          <motion.path
            d="M10,50 L30,50 L35,40 L65,40 L70,50 L90,50 L90,70 L10,70 Z"
            fill="#4F46E5"
            stroke="#1E1B4B"
            strokeWidth="2"
          />
          <circle cx="30" cy="70" r="8" fill="#1E1B4B" />
          <circle cx="70" cy="70" r="8" fill="#1E1B4B" />
        </motion.svg>

        {/* Animated progress track */}
        <motion.div
          className="absolute bottom-1/4 left-0 right-0 h-1 bg-slate-300"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      
      {/* Loading text */}
      <motion.p
        className="mt-4 text-slate-600 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Loading...
      </motion.p>
    </div>
  );
}
