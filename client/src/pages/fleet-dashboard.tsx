import { FleetDashboard } from "@/components/fleet-dashboard";
import { motion } from "framer-motion";

export default function FleetDashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <FleetDashboard />
      </motion.div>
    </div>
  );
}
