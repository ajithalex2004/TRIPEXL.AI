import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Achievement } from "@shared/schema/achievements";
import { Star, Trophy, Award } from "lucide-react";

interface AchievementBadgeProps {
  achievement: Achievement;
  className?: string;
  showAnimation?: boolean;
}

export function AchievementBadge({
  achievement,
  className,
  showAnimation = false,
}: AchievementBadgeProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={showAnimation ? { scale: 0, rotate: -180 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className={cn(
          "relative group cursor-pointer",
          className
        )}
      >
        <motion.div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: achievement.badgeColor }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {achievement.isCompleted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Trophy className="w-8 h-8 text-white" />
            </motion.div>
          ) : (
            <Star className="w-8 h-8 text-white/50" />
          )}
        </motion.div>

        {/* Progress Ring */}
        <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)]">
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            strokeWidth="4"
            stroke={achievement.badgeColor}
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: achievement.progress }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </svg>

        {/* Achievement Tooltip */}
        <div className="absolute opacity-0 group-hover:opacity-100 -bottom-20 left-1/2 -translate-x-1/2 bg-black/90 text-white p-2 rounded-lg text-sm w-48 pointer-events-none transition-opacity">
          <p className="font-semibold">{achievement.name}</p>
          <p className="text-xs text-gray-300">{achievement.description}</p>
          <p className="text-xs mt-1">
            Progress: {Math.round(achievement.progress * 100)}%
          </p>
        </div>

        {/* Celebration Animation */}
        {showAnimation && achievement.isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, times: [0, 0.5, 1] }}
            className="absolute -inset-2"
          >
            <div className="absolute inset-0 animate-ping rounded-full bg-white/30" />
            <Award className="absolute top-0 right-0 w-6 h-6 text-yellow-400 animate-bounce" />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
