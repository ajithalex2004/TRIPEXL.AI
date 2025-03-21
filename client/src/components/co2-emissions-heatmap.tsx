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
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { VehicleTypeMaster } from "@shared/schema";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface EmissionDataPoint {
  x: number; // Fuel efficiency
  y: number; // CO2 emissions
  z: number; // Usage frequency/intensity
  name: string; // Vehicle type name
  fuelType: string;
}

export function CO2EmissionsHeatmap() {
  const { data: vehicleTypes, isLoading } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-types"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!vehicleTypes || vehicleTypes.length === 0) {
    return <div>No vehicle data available</div>;
  }

  // Process data for the heatmap
  const emissionsData: EmissionDataPoint[] = vehicleTypes.map(vehicle => ({
    x: Number(vehicle.fuelEfficiency),
    y: Number(vehicle.co2EmissionFactor),
    z: 20, // This could be based on actual usage data in the future
    name: `${vehicle.manufacturer} ${vehicle.vehicleType}`,
    fuelType: vehicle.fuelType
  }));

  const maxEmission = Math.max(...emissionsData.map(d => d.y));
  const minEmission = Math.min(...emissionsData.map(d => d.y));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>CO2 Emissions Heatmap</CardTitle>
        <CardDescription>
          Vehicle fleet emissions visualization based on fuel efficiency and CO2 emission factors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
              }}
            >
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Fuel Efficiency" 
                unit=" km/L"
                label={{ value: 'Fuel Efficiency (km/L)', position: 'bottom' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="CO2 Emissions" 
                unit=" kg/L"
                label={{ value: 'CO2 Emissions (kg/L)', angle: -90, position: 'left' }}
              />
              <ZAxis 
                type="number" 
                dataKey="z" 
                range={[50, 400]} 
                name="Usage"
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background/95 p-2 rounded-lg border shadow-sm">
                        <p className="font-medium">{data.name}</p>
                        <p>Fuel Type: {data.fuelType}</p>
                        <p>Fuel Efficiency: {data.x.toFixed(2)} km/L</p>
                        <p>CO2 Emissions: {data.y.toFixed(2)} kg/L</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                data={emissionsData}
                fill="#8884d8"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}