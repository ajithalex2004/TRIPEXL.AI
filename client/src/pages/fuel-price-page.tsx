import { FuelPriceDashboard } from "@/components/fuel-price-dashboard";
import { FuelPriceHistory } from "@/components/fuel-price-history";
import { PerformanceSnapshotDashboard } from "@/components/performance-snapshot-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import * as animationUtils from "@/lib/animation-utils";

export default function FuelPricePage() {
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
          Track fuel prices, efficiency, and calculate operating costs for your fleet. 
          Prices are automatically updated on the 1st of each month.
        </p>
      </motion.div>

      <Tabs defaultValue="prices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prices">Current Fuel Prices</TabsTrigger>
          <TabsTrigger value="history">Historical Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="prices" className="space-y-4">
          <FuelPriceDashboard />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <FuelPriceHistory />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <PerformanceSnapshotDashboard />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}