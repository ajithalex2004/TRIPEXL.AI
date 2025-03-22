import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTooltipProps {
  message: React.ReactNode;
  isVisible: boolean;
  className?: string;
}

export function AnimatedTooltip({ message, isVisible, className }: AnimatedTooltipProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute z-50 px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-md shadow-lg",
            "before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2",
            "before:border-8 before:border-transparent before:border-t-red-500",
            className
          )}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}