import { motion } from "framer-motion";
import { PerformanceSnapshotDashboard } from "@/components/performance-snapshot-dashboard";

export default function PerformanceSnapshotPage() {
  return (
    <div className="container mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col gap-4 mb-6">
          <h1 className="text-2xl font-bold">Performance Snapshot</h1>
          <p className="text-muted-foreground">
            One-click overview of your fleet's key performance metrics
          </p>
        </div>
        <PerformanceSnapshotDashboard />
      </motion.div>
    </div>
  );
}
