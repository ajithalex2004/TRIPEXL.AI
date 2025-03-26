import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Battery, Fuel, MapPin, AlertTriangle } from "lucide-react";
import { VehicleType } from "@shared/schema";

// Status indicator components with animations
const StatusIndicator = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-red-500";
      case "maintenance":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-2"
    >
      <div className={`h-3 w-3 rounded-full ${getStatusColor(status)} animate-pulse`} />
      <span className="text-sm font-medium">{status}</span>
    </motion.div>
  );
};

// Vehicle status card with live updates
const VehicleStatusCard = ({ vehicle }: { vehicle: VehicleType }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">
              {vehicle.vehicleTypeName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {vehicle.vehicleTypeCode}
            </p>
          </div>
          <StatusIndicator status={vehicle.isActive ? "Active" : "Inactive"} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {vehicle.vehicleType}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{vehicle.region}</span>
          </div>
          <div className="flex items-center gap-2">
            <Battery className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Status: {vehicle.isActive ? "Available" : "In Use"}</span>
          </div>
          {vehicle.maintenance && (
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Maintenance Due</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export function FleetDashboard() {
  // Fetch vehicle type data instead of vehicle master
  const { data: vehicles, isLoading } = useQuery<VehicleType[]>({
    queryKey: ["/api/vehicle-types"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading fleet status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fleet Status Dashboard</h2>
          <p className="text-sm text-muted-foreground">Real-time vehicle status and analytics</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="bg-green-500/10">
            Active: {vehicles?.filter(v => v.isActive).length || 0}
          </Badge>
          <Badge variant="outline" className="bg-red-500/10">
            Inactive: {vehicles?.filter(v => !v.isActive).length || 0}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {vehicles?.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <VehicleStatusCard vehicle={vehicle} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}