import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface AnimatedTooltipProps {
  message: React.ReactNode;
  isVisible: boolean;
  className?: string;
  type?: "error" | "warning" | "info";
}

export function AnimatedTooltip({ 
  message, 
  isVisible, 
  className,
  type = "error" 
}: AnimatedTooltipProps) {
  const variants = {
    initial: { 
      opacity: 0, 
      y: -10,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: "easeIn"
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  const colors = {
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500"
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          className={cn(
            "absolute z-50 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-lg",
            "flex items-center gap-2",
            colors[type],
            "before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2",
            `before:border-8 before:border-transparent before:border-t-${colors[type].split('-')[1]}`,
            className
          )}
        >
          <motion.div
            variants={pulseVariants}
            animate="animate"
            className="flex items-center"
          >
            <AlertCircle className="w-4 h-4" />
          </motion.div>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}