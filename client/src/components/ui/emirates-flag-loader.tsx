import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmiratesFlagLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function EmiratesFlagLoader({ className, size = 'md', ...props }: EmiratesFlagLoaderProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  return (
    <div className={cn("relative flex flex-col gap-1", className)} {...props}>
      {/* Red stripe */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn("w-full bg-[#EF3340]", sizeClasses[size])}
      />

      {/* Green stripe */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className={cn("w-full bg-[#009739]", sizeClasses[size])}
      />

      {/* White stripe */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className={cn("w-full bg-white", sizeClasses[size])}
      />

      {/* Black stripe */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className={cn("w-full bg-black", sizeClasses[size])}
      />

      {/* Animated stars overlay */}
      <motion.div 
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_white_21%),_radial-gradient(circle,_white_20%,_transparent_21%)] bg-[length:60px_60px] opacity-10" />
      </motion.div>
    </div>
  );
}