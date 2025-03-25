import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          status === "active"
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          className
        )}
      >
        <motion.div
          className={cn(
            "mr-1 h-1.5 w-1.5 rounded-full",
            status === "active" ? "bg-green-400" : "bg-red-400"
          )}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {status === "active" ? "Active" : "Inactive"}
      </motion.div>
    </AnimatePresence>
  );
}
