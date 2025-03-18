import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const expressions = [
  {
    id: "happy",
    svg: (
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
      />
    )
  },
  {
    id: "thinking",
    svg: (
      <path
        d="M9 22h6c.55 0 1-.45 1-1v-1h-8v1c0 .55.45 1 1 1zm-4-6h14c.55 0 1-.45 1-1v-1H4v1c0 .55.45 1 1 1zm16-10v8H3V6c0-.55.45-1 1-1h16c.55 0 1 .45 1 1z"
        fill="currentColor"
      />
    )
  },
  {
    id: "waiting",
    svg: (
      <path
        d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
        fill="currentColor"
      />
    )
  },
  {
    id: "excited",
    svg: (
      <path
        d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm1-10.06L14.06 11l1.06-1.06L16.18 11l1.06-1.06-2.12-2.12zm-4.12 0L9.94 11 11 9.94 8.88 7.82 6.76 9.94 7.82 11zM12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"
        fill="currentColor"
      />
    )
  }
];

interface LoadingMascotProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function LoadingMascot({ className, size = "md", ...props }: LoadingMascotProps) {
  const [currentExpression, setCurrentExpression] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExpression((prev) => (prev + 1) % expressions.length);
    }, 1500); // Change expression every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-24 h-24"
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <AnimatePresence mode="wait">
        <motion.svg
          key={expressions[currentExpression].id}
          viewBox="0 0 24 24"
          className="w-full h-full text-primary"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {expressions[currentExpression].svg}
        </motion.svg>
      </AnimatePresence>
    </div>
  );
}
