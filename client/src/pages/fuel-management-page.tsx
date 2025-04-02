import { FuelPriceDashboard } from "@/components/fuel-price-dashboard";
import { FuelPriceHistory } from "@/components/fuel-price-history";
import { FuelTypeManagement } from "@/components/fuel-type-management";
import { PerformanceSnapshotDashboard } from "@/components/performance-snapshot-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { AlertCircle, BarChart3, Droplet, Gauge, History, Settings } from "lucide-react";
import * as animationUtils from "@/lib/animation-utils";

export default function FuelManagementPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={animationUtils.staggerContainer(0.1, 0.1)}
      className="container mx-auto py-6 space-y-6"
    >
      <motion.div variants={animationUtils.fadeIn("up")}>
        <h1 className="text-3xl font-bold tracking-tight">Fuel Management</h1>
        <p className="text-muted-foreground">
          Comprehensive fuel management system for tracking prices, managing fuel types, and analyzing performance metrics.
          Prices are automatically updated on the 1st of each month.
        </p>
      </motion.div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-auto w-full">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Price History</span>
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Fuel Types</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <FuelPriceDashboard />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <FuelPriceHistory />
        </TabsContent>
        
        <TabsContent value="management" className="space-y-4">
          <FuelTypeManagement />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <PerformanceSnapshotDashboard />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}