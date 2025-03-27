import { Variants } from "framer-motion";

export const fadeIn = (
  direction: "up" | "down" | "left" | "right" = "up",
  delay: number = 0,
  duration: number = 0.3
): Variants => {
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  return {
    hidden: {
      ...directions[direction],
      opacity: 0,
    },
    visible: {
      ...directions["up"], // Reset any directional offsets to zero
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };
};

export const staggerContainer = (
  staggerChildren: number = 0.05,
  delayChildren: number = 0
): Variants => {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };
};

export const scaleIn = (delay: number = 0, duration: number = 0.3): Variants => {
  return {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration,
        delay,
        ease: "easeOut",
      },
    },
  };
};

export const slideIn = (
  direction: "up" | "down" | "left" | "right" = "left",
  type: "tween" | "spring" = "tween",
  delay: number = 0,
  duration: number = 0.3
): Variants => {
  const directions = {
    up: { y: "100%" },
    down: { y: "-100%" },
    left: { x: "-100%" },
    right: { x: "100%" },
  };

  return {
    hidden: directions[direction],
    visible: {
      x: 0,
      y: 0,
      transition: {
        type,
        delay,
        duration,
        ease: "easeOut",
      },
    },
  };
};

export const textVariant = (delay: number = 0): Variants => {
  return {
    hidden: {
      y: 20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
        delay,
      },
    },
  };
};

export const listItem = (
  index: number = 0,
  staggerAmount: number = 0.1
): Variants => {
  return {
    hidden: { y: 10, opacity: 0 },
    visible: { 
      y: 0,
      opacity: 1,
      transition: {
        delay: index * staggerAmount,
        duration: 0.3,
        ease: "easeOut"
      } 
    },
    exit: { 
      y: 10, 
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      } 
    }
  };
};

export const buttonHoverEffect = {
  scale: 1.03,
  boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
  transition: { duration: 0.3 },
};

export const buttonTapEffect = {
  scale: 0.97,
  boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
};

export const cardHoverEffect = {
  y: -5,
  boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
  transition: { duration: 0.3 },
};

export const pulse = {
  scale: [1, 1.05, 1],
  opacity: [0.8, 1, 0.8],
  transition: { 
    repeat: Infinity,
    duration: 2,
    ease: "easeInOut"
  },
};