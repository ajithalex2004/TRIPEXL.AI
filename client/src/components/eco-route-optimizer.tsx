import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmiratesSpinner } from "@/components/ui/emirates-spinner";
import { Leaf, Battery, Fuel, BarChart2 } from "lucide-react";

interface Route {
  distance: number;
  duration: number;
  fuelConsumption: number;
  co2Emissions: number;
  trafficLevel: "Low" | "Medium" | "High";
}

interface RouteOptimizationProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  vehicleType: string;
  fuelEfficiency: number;
  co2EmissionFactor: number;
}

export function EcoRouteOptimizer({
  origin,
  destination,
  vehicleType,
  fuelEfficiency,
  co2EmissionFactor,
}: RouteOptimizationProps) {
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: [
      "/api/eco-routes",
      origin,
      destination,
      vehicleType,
      fuelEfficiency,
      co2EmissionFactor,
    ],
    enabled: !!(origin && destination && vehicleType),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <EmiratesSpinner size="lg" />
      </div>
    );
  }

  if (!routes?.length) {
    return <div>No routes available</div>;
  }

  const bestEcoRoute = routes.reduce((prev, current) =>
    prev.co2Emissions < current.co2Emissions ? prev : current
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Eco-Friendly Route Suggestions</h2>
      
      {/* Best Eco-Route Card */}
      <Card className="p-4 border-green-500 border-2">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="text-green-500 h-6 w-6" />
          <h3 className="text-lg font-semibold">Most Eco-Friendly Route</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Fuel Consumption</p>
              <p className="font-medium">{bestEcoRoute.fuelConsumption.toFixed(2)} L</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Battery className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">CO2 Emissions</p>
              <p className="font-medium">{bestEcoRoute.co2Emissions.toFixed(2)} kg</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Traffic Level</p>
              <p className="font-medium">{bestEcoRoute.trafficLevel}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Alternative Routes */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Alternative Routes</h3>
        {routes
          .filter((route) => route !== bestEcoRoute)
          .map((route, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Consumption</p>
                    <p className="font-medium">{route.fuelConsumption.toFixed(2)} L</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Battery className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">CO2 Emissions</p>
                    <p className="font-medium">{route.co2Emissions.toFixed(2)} kg</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  Select Route
                </Button>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
