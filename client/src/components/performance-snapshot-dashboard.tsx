import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { VehicleTypeMaster } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { QuickFilterBar, FilterOption } from "./ui/quick-filter-bar";
import { applyFilters, hasActiveFilters, extractUniqueOptions } from "@/lib/filter-utils";
import { motion } from "framer-motion";
import * as animationUtils from "@/lib/animation-utils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function PerformanceSnapshotDashboard() {
  // State for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    "vehicle_type": "all",
    "region": "all",
    "department": "all"
  });

  // Fetch vehicle types data
  const { data: vehicleTypes, isLoading: loadingVehicleTypes } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-types"],
  });

  // Extract filter options from data
  const filterOptions = useMemo<FilterOption[]>(() => {
    if (!vehicleTypes) return [];
    
    return [
      {
        id: "vehicle_type",
        label: "Vehicle Type",
        options: extractUniqueOptions(vehicleTypes, "vehicle_type"),
        defaultValue: "all"
      },
      {
        id: "region",
        label: "Region",
        options: extractUniqueOptions(vehicleTypes, "region"),
        defaultValue: "all"
      },
      {
        id: "department",
        label: "Department",
        options: extractUniqueOptions(vehicleTypes, "department"),
        defaultValue: "all"
      }
    ];
  }, [vehicleTypes]);

  // Apply filters to data
  const filteredVehicleTypes = useMemo(() => {
    if (!vehicleTypes) return [];
    
    return applyFilters(
      vehicleTypes,
      searchQuery,
      filterValues,
      ["vehicle_type_code", "vehicle_type_name", "vehicle_type", "manufacturer"]
    );
  }, [vehicleTypes, searchQuery, filterValues]);

  // Check if any filters are active
  const isFiltering = useMemo(() => {
    return hasActiveFilters(searchQuery, filterValues);
  }, [searchQuery, filterValues]);

  // Filter change handler
  const handleFilterChange = useCallback((filterId: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [filterId]: value
    }));
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setFilterValues({
      "vehicle_type": "all",
      "region": "all",
      "department": "all"
    });
  }, []);

  if (loadingVehicleTypes) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!vehicleTypes?.length) {
    return (
      <div className="text-center py-8">
        <p>No vehicle data available.</p>
      </div>
    );
  }

  // Calculate metrics
  const metrics = {
    totalVehicles: vehicleTypes.length,
    filteredVehicles: filteredVehicleTypes.length,
    avgFuelEfficiency: filteredVehicleTypes.length 
      ? filteredVehicleTypes.reduce((acc, v) => acc + Number(parseFloat(v.fuel_efficiency.toString())), 0) / filteredVehicleTypes.length
      : 0,
    avgCostPerKm: filteredVehicleTypes.length 
      ? filteredVehicleTypes.reduce((acc, v) => {
          // cost_per_km is a decimal in the DB schema, might come as string or number
          const cost = typeof v.cost_per_km === 'string' 
            ? Number(parseFloat(v.cost_per_km)) 
            : Number(v.cost_per_km);
          return acc + cost;
        }, 0) / filteredVehicleTypes.length
      : 0,
  };

  // Prepare data for vehicle type distribution
  const typeDistribution = filteredVehicleTypes.reduce((acc, vehicle) => {
    acc[vehicle.vehicle_type] = (acc[vehicle.vehicle_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(typeDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  // Prepare data for fuel efficiency comparison (limit to top 10 for better visualization)
  const fuelEfficiencyData = filteredVehicleTypes
    .slice(0, 10)
    .map(vehicle => {
      // Handle fuel_efficiency and cost_per_km which could be strings or decimals
      const efficiency = typeof vehicle.fuel_efficiency === 'string' 
        ? Number(parseFloat(vehicle.fuel_efficiency)) 
        : Number(vehicle.fuel_efficiency);
      
      const cost = typeof vehicle.cost_per_km === 'string' 
        ? Number(parseFloat(vehicle.cost_per_km)) 
        : Number(vehicle.cost_per_km);
        
      return {
        name: vehicle.vehicle_type_code,
        efficiency,
        cost
      };
    });

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={animationUtils.staggerContainer(0.1, 0.1)}
      className="space-y-6"
    >
      {/* Quick Filter Bar */}
      <motion.div variants={animationUtils.fadeIn("up")}>
        <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>Performance Snapshot Dashboard</CardTitle>
            <CardDescription>Analyze vehicle performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <QuickFilterBar
              searchPlaceholder="Search by code, name, type or manufacturer..."
              filterOptions={filterOptions}
              onSearch={setSearchQuery}
              onFilterChange={handleFilterChange}
              clearFilters={clearAllFilters}
              searchValue={searchQuery}
              filterValues={filterValues}
              isFiltering={isFiltering}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtered status message */}
      {isFiltering && (
        <motion.div variants={animationUtils.fadeIn("up")} className="text-sm text-muted-foreground">
          Showing {filteredVehicleTypes.length} of {vehicleTypes.length} vehicles
        </motion.div>
      )}

      {/* No results message */}
      {isFiltering && filteredVehicleTypes.length === 0 ? (
        <motion.div variants={animationUtils.fadeIn("up")} className="text-center py-8 bg-background/60 border rounded-lg shadow-sm">
          <div className="flex flex-col items-center justify-center gap-2 p-8">
            <p className="text-muted-foreground text-lg">No vehicles match your filters</p>
            <Button variant="outline" onClick={clearAllFilters} className="mt-2">
              Clear all filters
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          variants={animationUtils.staggerContainer(0.1, 0.1)}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Key Metrics Cards */}
          <motion.div variants={animationUtils.fadeIn("up")}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Total Vehicles</CardTitle>
                <CardDescription>
                  {isFiltering 
                    ? `Showing ${filteredVehicleTypes.length} of ${vehicleTypes.length}`
                    : "Fleet size overview"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isFiltering
                    ? `${filteredVehicleTypes.length} / ${vehicleTypes.length}`
                    : metrics.totalVehicles
                  }
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={animationUtils.fadeIn("up")}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Average Fuel Efficiency</CardTitle>
                <CardDescription>
                  {isFiltering ? "Based on filtered vehicles" : "Across all vehicles"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.avgFuelEfficiency.toFixed(2)} KM/L
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={animationUtils.fadeIn("up")}>
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Average Cost per KM</CardTitle>
                <CardDescription>
                  {isFiltering ? "Based on filtered vehicles" : "Operating cost overview"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${metrics.avgCostPerKm.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Vehicle Type Distribution */}
          <motion.div variants={animationUtils.fadeIn("up")} className="col-span-2">
            <Card className="transition-all hover:shadow-md h-full">
              <CardHeader>
                <CardTitle>Vehicle Type Distribution</CardTitle>
                <CardDescription>
                  {isFiltering ? "Based on filtered vehicles" : "Fleet composition breakdown"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available for distribution chart
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Efficiency Comparison */}
          <motion.div variants={animationUtils.fadeIn("up")} className="col-span-3">
            <Card className="transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Efficiency Comparison</CardTitle>
                <CardDescription>
                  {isFiltering ? "Based on filtered vehicles (showing up to 10)" : "Fuel efficiency and cost analysis by vehicle type (showing up to 10)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fuelEfficiencyData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fuelEfficiencyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" label={{ value: 'Fuel Efficiency (KM/L)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Cost per KM ($)', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="efficiency" fill="#8884d8" name="Fuel Efficiency" />
                        <Bar yAxisId="right" dataKey="cost" fill="#82ca9d" name="Cost per KM" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available for efficiency chart
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
