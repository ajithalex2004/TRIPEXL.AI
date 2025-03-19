import { motion } from "framer-motion";
import * as React from "react";

interface VehicleLoadingIndicatorProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VehicleLoadingIndicator({
  size = "md",
  className
}: VehicleLoadingIndicatorProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  return (
    <div className={`relative ${sizes[size]} ${className || ""}`}>
      {/* Vehicle body */}
      <motion.div
        className="absolute inset-0"
        initial={{ x: -50, opacity: 0 }}
        animate={{ 
          x: [50, -50],
          opacity: 1
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <motion.path
            d="M4 10h16v6H4z" // Vehicle body
            className="fill-primary/80"
          />
          <motion.path
            d="M2 12h2v2H2z" // Front bumper
            className="fill-primary"
          />
          <motion.path
            d="M20 12h2v2h-2z" // Back bumper
            className="fill-primary"
          />
          {/* Wheels */}
          <motion.circle
            cx="7"
            cy="16"
            r="2"
            className="fill-primary"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.circle
            cx="17"
            cy="16"
            r="2"
            className="fill-primary"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </svg>
      </motion.div>

      {/* Road markers */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          initial={{ backgroundPosition: "0 0" }}
          animate={{ backgroundPosition: "-100% 0" }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundImage: "linear-gradient(90deg, transparent 50%, currentColor 50%)",
            backgroundSize: "20px 100%"
          }}
        />
      </motion.div>
    </div>
  );
}