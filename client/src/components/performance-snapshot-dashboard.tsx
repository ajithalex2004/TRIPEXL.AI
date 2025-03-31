import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Droplets, Gauge, TrendingUp, ArrowUpRight, Ban, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import * as animationUtils from "@/lib/animation-utils";

// Now fetching from API directly

const fuelTypeColors = {
  PETROL: "#f97316",
  DIESEL: "#0f172a",
  ELECTRIC: "#06b6d4",
  HYBRID: "#22c55e",
  CNG: "#8b5cf6",
  LPG: "#eab308",
};

export function PerformanceSnapshotDashboard() {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  
  // Fetch actual vehicle type data from API
  const { data: vehicleTypes, isLoading } = useQuery({
    queryKey: ["/api/vehicle-types"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredVehicleTypes = selectedRegion === "all" 
    ? vehicleTypes
    : vehicleTypes.filter((vt) => vt.region === selectedRegion);

  // Prepare data for charts
  const fuelEfficiencyData = filteredVehicleTypes.map((vt) => ({
    name: vt.vehicle_type_code,
    value: Number(vt.fuel_efficiency),
    fuel_type: vt.fuel_type,
  }));

  const costPerKmData = filteredVehicleTypes.map((vt) => ({
    name: vt.vehicle_type_code,
    value: Number(vt.cost_per_km),
    fuel_type: vt.fuel_type,
  }));

  const co2EmissionsData = filteredVehicleTypes.map((vt) => ({
    name: vt.vehicle_type_code,
    value: Number(vt.co2_emission_factor),
    fuel_type: vt.fuel_type,
  }));

  const idleFuelConsumptionData = filteredVehicleTypes.map((vt) => ({
    name: vt.vehicle_type_code,
    value: Number(vt.idle_fuel_consumption),
    fuel_type: vt.fuel_type,
  }));

  // Calculate averages
  const avgFuelEfficiency = filteredVehicleTypes
    .filter(vt => vt.fuel_type !== "ELECTRIC") // Exclude electric vehicles
    .reduce((acc, vt) => acc + Number(vt.fuel_efficiency), 0) / 
    filteredVehicleTypes.filter(vt => vt.fuel_type !== "ELECTRIC").length;

  const avgCostPerKm = filteredVehicleTypes
    .reduce((acc, vt) => acc + Number(vt.cost_per_km), 0) / filteredVehicleTypes.length;

  const avgCO2EmissionFactor = filteredVehicleTypes
    .reduce((acc, vt) => acc + Number(vt.co2_emission_factor), 0) / filteredVehicleTypes.length;

  const fuelTypeCounts = filteredVehicleTypes.reduce((acc, vt) => {
    acc[vt.fuel_type] = (acc[vt.fuel_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fuelTypeDistribution = Object.entries(fuelTypeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const regions = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Fujairah", "Ras Al Khaimah", "Umm Al Quwain"];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={animationUtils.staggerContainer(0.1, 0.1)}
      className="space-y-6"
    >
      <motion.div variants={animationUtils.fadeIn("up")} className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fleet Performance</h2>
          <p className="text-muted-foreground">
            View key performance metrics across your fleet
          </p>
        </div>

        <Select
          value={selectedRegion}
          onValueChange={setSelectedRegion}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={animationUtils.fadeIn("up")} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium">Avg. Fuel Efficiency</CardTitle>
              <Droplets className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgFuelEfficiency.toFixed(2)} km/L
            </div>
            <p className="text-xs text-muted-foreground">
              Higher is better
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium">Avg. Cost per KM</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgCostPerKm.toFixed(2)} AED
            </div>
            <p className="text-xs text-muted-foreground">
              Lower is better
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium">CO₂ Emissions</CardTitle>
              <Ban className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgCO2EmissionFactor.toFixed(2)} kg/L
            </div>
            <p className="text-xs text-muted-foreground">
              Lower is better for environment
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium">Fleet Distribution</CardTitle>
              <Gauge className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredVehicleTypes.length} vehicles
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(fuelTypeCounts).length} different fuel types
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={animationUtils.fadeIn("up")}>
        <Tabs defaultValue="fuel-efficiency" className="space-y-4">
          <TabsList>
            <TabsTrigger value="fuel-efficiency">Fuel Efficiency</TabsTrigger>
            <TabsTrigger value="cost">Cost per KM</TabsTrigger>
            <TabsTrigger value="emissions">CO₂ Emissions</TabsTrigger>
            <TabsTrigger value="idle">Idle Consumption</TabsTrigger>
            <TabsTrigger value="distribution">Fuel Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fuel-efficiency" className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Fuel Efficiency by Vehicle Type</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fuelEfficiencyData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'km/Litre', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} km/L`, "Fuel Efficiency"]} />
                  <Legend />
                  <Bar dataKey="value">
                    {fuelEfficiencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={fuelTypeColors[entry.fuel_type as keyof typeof fuelTypeColors]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground flex items-center">
              <Info className="h-4 w-4 mr-2" />
              <span>Higher values indicate better fuel efficiency. Electric vehicles are not included in this metric.</span>
            </div>
          </TabsContent>
          
          <TabsContent value="cost" className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Cost per KM by Vehicle Type</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={costPerKmData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'AED', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} AED`, "Cost per KM"]} />
                  <Legend />
                  <Bar dataKey="value">
                    {costPerKmData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={fuelTypeColors[entry.fuel_type as keyof typeof fuelTypeColors]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>Lower values indicate more cost-effective operations. Electric vehicles typically have the lowest cost per km.</span>
            </div>
          </TabsContent>
          
          <TabsContent value="emissions" className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">CO₂ Emissions by Vehicle Type</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={co2EmissionsData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'kg CO₂/L', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} kg CO₂/L`, "Emissions Factor"]} />
                  <Legend />
                  <Bar dataKey="value">
                    {co2EmissionsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={fuelTypeColors[entry.fuel_type as keyof typeof fuelTypeColors]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>Lower values indicate environmentally friendlier vehicles. Electric vehicles have zero direct emissions.</span>
            </div>
          </TabsContent>
          
          <TabsContent value="idle" className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Idle Fuel Consumption by Vehicle Type</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={idleFuelConsumptionData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'L/hour', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} L/hour`, "Idle Consumption"]} />
                  <Legend />
                  <Bar dataKey="value">
                    {idleFuelConsumptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={fuelTypeColors[entry.fuel_type as keyof typeof fuelTypeColors]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground flex items-center">
              <Info className="h-4 w-4 mr-2" />
              <span>Lower values indicate more efficient vehicles during idle. Electric vehicles have zero idle consumption.</span>
            </div>
          </TabsContent>
          
          <TabsContent value="distribution" className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Fuel Type Distribution in Fleet</h3>
            <div className="h-[350px] flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fuelTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {fuelTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={fuelTypeColors[entry.name as keyof typeof fuelTypeColors]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} vehicles`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full md:w-1/2 h-full flex flex-col justify-center">
                <div className="space-y-4">
                  <h4 className="text-md font-medium">Fuel Type Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(fuelTypeCounts).map(([fuelType, count]) => (
                      <div key={fuelType} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: fuelTypeColors[fuelType as keyof typeof fuelTypeColors] }}
                          />
                          <span>{fuelType}</span>
                        </div>
                        <Badge variant="outline">{count} vehicles</Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-sm text-muted-foreground pt-4 border-t">
                    <p>A balanced distribution of fuel types allows for flexibility in assignments based on trip requirements.</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}