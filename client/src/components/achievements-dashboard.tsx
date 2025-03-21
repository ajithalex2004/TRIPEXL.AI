import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AchievementBadge } from "./achievement-badge";
import { EmiratesSpinner } from "@/components/ui/emirates-spinner";
import type { Achievement } from "@shared/schema/achievements";
import { motion } from "framer-motion";

export function AchievementsDashboard() {
  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <EmiratesSpinner size="lg" />
      </div>
    );
  }

  if (!achievements?.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No achievements available
      </div>
    );
  }

  const completedAchievements = achievements.filter(a => a.isCompleted);
  const inProgressAchievements = achievements.filter(a => !a.isCompleted);

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Achievement Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{completedAchievements.length}</p>
              <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.round((completedAchievements.length / achievements.length) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Achievements */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Completed Achievements</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {completedAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AchievementBadge achievement={achievement} showAnimation={true} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* In Progress Achievements */}
      <div>
        <h3 className="text-lg font-semibold mb-4">In Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {inProgressAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AchievementBadge achievement={achievement} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
