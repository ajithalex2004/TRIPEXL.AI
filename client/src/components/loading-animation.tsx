import { motion } from "framer-motion";
import { FC } from "react";

interface LoadingAnimationProps {
  size?: "sm" | "md" | "lg";
}

export const LoadingAnimation: FC<LoadingAnimationProps> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const circleVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const dotVariants = {
    animate: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="relative">
      <motion.div
        className={`${sizeClasses[size]} border-4 border-primary/20 rounded-full`}
        animate="animate"
        variants={circleVariants}
      >
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full"
          variants={dotVariants}
          animate="animate"
        />
      </motion.div>
    </div>
  );
};
