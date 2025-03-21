import { AchievementsDashboard } from "@/components/achievements-dashboard";
import { motion } from "framer-motion";

export default function AchievementsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-4"
      >
        <h1 className="text-3xl font-bold">Fleet Manager Achievements</h1>
        <p className="text-muted-foreground">
          Track your progress and earn recognition for your fleet management excellence
        </p>
      </motion.div>

      <AchievementsDashboard />
    </div>
  );
}
