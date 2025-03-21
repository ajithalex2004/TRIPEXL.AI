import { z } from "zod";

export const achievementSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  criteria: z.string(),
  progress: z.number(),
  isCompleted: z.boolean(),
  unlockedAt: z.string().nullable(),
  badgeColor: z.string(),
});

export type Achievement = z.infer<typeof achievementSchema>;

export const insertAchievementSchema = achievementSchema.omit({ 
  id: true,
  isCompleted: true,
  unlockedAt: true,
  progress: true,
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

// Achievement categories and their corresponding badge colors
export const ACHIEVEMENT_CATEGORIES = {
  FUEL_EFFICIENCY: '#34D399', // green
  ECO_FRIENDLY: '#10B981', // emerald
  SAFETY: '#3B82F6', // blue
  MAINTENANCE: '#6366F1', // indigo
  MANAGEMENT: '#8B5CF6', // violet
  EXCEPTIONAL: '#EC4899', // pink
} as const;
