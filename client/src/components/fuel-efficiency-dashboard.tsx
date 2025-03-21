import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleTypeMaster } from "@shared/schema";

export function FuelEfficiencyDashboard() {
  // Fetch vehicle types data
  const { data: vehicleTypes, isLoading } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-types"],
  });

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (!vehicleTypes || vehicleTypes.length === 0) {
    return <div>No vehicle data available.</div>;
  }

  // Prepare data for the charts
  const manufacturerEfficiency = vehicleTypes.reduce((acc, vehicle) => {
    if (!acc[vehicle.manufacturer]) {
      acc[vehicle.manufacturer] = {
        manufacturer: vehicle.manufacturer,
        avgEfficiency: 0,
        count: 0,
      };
    }
    acc[vehicle.manufacturer].avgEfficiency += vehicle.fuelEfficiency;
    acc[vehicle.manufacturer].count += 1;
    return acc;
  }, {} as Record<string, { manufacturer: string; avgEfficiency: number; count: number }>);

  const manufacturerData = Object.values(manufacturerEfficiency).map(
    (item) => ({
      manufacturer: item.manufacturer,
      avgEfficiency: Number((item.avgEfficiency / item.count).toFixed(2)),
    })
  );

  // Prepare year-wise efficiency data
  const yearlyEfficiency = vehicleTypes.reduce((acc, vehicle) => {
    if (!acc[vehicle.modelYear]) {
      acc[vehicle.modelYear] = {
        year: vehicle.modelYear,
        avgEfficiency: 0,
        count: 0,
      };
    }
    acc[vehicle.modelYear].avgEfficiency += vehicle.fuelEfficiency;
    acc[vehicle.modelYear].count += 1;
    return acc;
  }, {} as Record<number, { year: number; avgEfficiency: number; count: number }>);

  const yearlyData = Object.values(yearlyEfficiency)
    .map((item) => ({
      year: item.year,
      avgEfficiency: Number((item.avgEfficiency / item.count).toFixed(2)),
    }))
    .sort((a, b) => a.year - b.year);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 p-4">
      {/* Manufacturer-wise Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Average Fuel Efficiency by Manufacturer</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={manufacturerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="manufacturer" />
              <YAxis label={{ value: 'Avg. KM/L', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="avgEfficiency"
                fill="#8884d8"
                name="Average Fuel Efficiency (KM/L)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Year-wise Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Efficiency Trend by Model Year</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis label={{ value: 'Avg. KM/L', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgEfficiency"
                stroke="#82ca9d"
                name="Average Fuel Efficiency (KM/L)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}