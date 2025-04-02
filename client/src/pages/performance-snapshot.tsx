import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { PerformanceSnapshotDashboard } from "@/components/performance-snapshot-dashboard";
import { VehicleDetailsCard } from "@/components/ui/vehicle-details-card";

export default function PerformanceSnapshotPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  // Fetch top performing vehicles for details view
  const { data: topVehicles } = useQuery<any[]>({
    queryKey: ["/api/performance-snapshot/top-performers"],
  });
  
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
        
        {/* Top Performers Section with Vehicle Details Cards */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-4">Top Performing Vehicles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topVehicles && topVehicles.length > 0 ? (
              topVehicles.map((vehicle) => (
                <motion.div 
                  key={vehicle.id} 
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <VehicleDetailsCard vehicleData={vehicle} />
                </motion.div>
              ))
            ) : (
              <p className="text-muted-foreground col-span-3">No top performers data available yet.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
