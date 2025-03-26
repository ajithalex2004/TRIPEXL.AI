import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function PerformanceSnapshotDashboard() {
  // Fetch vehicle types data
  const { data: vehicleTypes, isLoading: loadingVehicleTypes } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-types"],
  });

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
    avgFuelEfficiency: vehicleTypes.reduce((acc, v) => acc + parseFloat(v.fuel_efficiency), 0) / vehicleTypes.length,
    avgCostPerKm: vehicleTypes.reduce((acc, v) => acc + v.cost_per_km, 0) / vehicleTypes.length,
  };

  // Prepare data for vehicle type distribution
  const typeDistribution = vehicleTypes.reduce((acc, vehicle) => {
    acc[vehicle.vehicle_type] = (acc[vehicle.vehicle_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(typeDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  // Prepare data for fuel efficiency comparison
  const fuelEfficiencyData = vehicleTypes.map(vehicle => ({
    name: vehicle.vehicle_type_code,
    efficiency: parseFloat(vehicle.fuel_efficiency),
    cost: vehicle.cost_per_km
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Key Metrics Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Total Vehicles</CardTitle>
          <CardDescription>Fleet size overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.totalVehicles}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Fuel Efficiency</CardTitle>
          <CardDescription>Across all vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {metrics.avgFuelEfficiency.toFixed(2)} KM/L
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Cost per KM</CardTitle>
          <CardDescription>Operating cost overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            ${metrics.avgCostPerKm.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Type Distribution */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Vehicle Type Distribution</CardTitle>
          <CardDescription>Fleet composition breakdown</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Efficiency Comparison */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Efficiency Comparison</CardTitle>
          <CardDescription>Fuel efficiency and cost analysis by vehicle type</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
