import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  LineChart,
  Line,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

export function PerformanceSnapshotDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedMetric, setSelectedMetric] = useState("fuel_efficiency");

  // Query to get performance data 
  const { data: performanceData, isLoading: isPerformanceLoading } = useQuery({
    queryKey: ["/api/performance/snapshot", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/performance/snapshot?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error("Failed to fetch performance data");
      }
      return response.json();
    },
  });

  // Processed data for various charts
  const vehicleRankingsData = useMemo(() => {
    if (!performanceData || !performanceData.vehicleRankings) return [];
    return performanceData.vehicleRankings;
  }, [performanceData]);

  const fuelEfficiencyData = useMemo(() => {
    if (!performanceData || !performanceData.fuelEfficiencyData) return [];
    return performanceData.fuelEfficiencyData;
  }, [performanceData]);

  const costPerKmData = useMemo(() => {
    if (!performanceData || !performanceData.costPerKmData) return [];
    return performanceData.costPerKmData;
  }, [performanceData]);

  const co2EmissionsData = useMemo(() => {
    if (!performanceData || !performanceData.co2EmissionsData) return [];
    return performanceData.co2EmissionsData;
  }, [performanceData]);

  const radarChartData = useMemo(() => {
    if (!performanceData || !performanceData.radarChartData) return [];
    return performanceData.radarChartData;
  }, [performanceData]);

  const getColorByRank = (rank: number) => {
    // Colors range from green (best) to red (worst)
    const colors = [
      "#10b981", // Emerald-500 (best)
      "#34d399", // Emerald-400
      "#6ee7b7", // Emerald-300
      "#a7f3d0", // Emerald-200
      "#d1fae5", // Emerald-100
      "#fee2e2", // Red-100
      "#fecaca", // Red-200
      "#fca5a5", // Red-300
      "#f87171", // Red-400
      "#ef4444", // Red-500 (worst)
    ];
    return colors[Math.min(rank, colors.length - 1)];
  };

  // Helper to sort and prepare data for charts based on selected metric
  const getSortedChartData = (data: any[], metric: string, limit = 10) => {
    if (!data || data.length === 0) return [];
    
    // Make a copy to avoid mutating the original data
    const sortedData = [...data]
      .sort((a, b) => {
        // Handle sorting based on metric
        if (metric === "fuel_efficiency" || metric === "co2_emission_factor") {
          // Lower is better for these metrics (sort ascending)
          return a[metric] - b[metric];
        } else {
          // Higher is better for all other metrics (sort descending)
          return b[metric] - a[metric];
        }
      })
      .slice(0, limit) // Limit results
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        color: getColorByRank(index),
      }));
    
    return sortedData;
  };

  // Chart data based on selected metric
  const chartData = useMemo(() => {
    switch (selectedMetric) {
      case "fuel_efficiency":
        return getSortedChartData(fuelEfficiencyData, "fuel_efficiency");
      case "cost_per_km": 
        return getSortedChartData(costPerKmData, "cost_per_km");
      case "co2_emission_factor":
        return getSortedChartData(co2EmissionsData, "co2_emission_factor");
      default:
        return [];
    }
  }, [fuelEfficiencyData, costPerKmData, co2EmissionsData, selectedMetric]);

  // Metrics mapping for labels and formatting
  const metricInfo = {
    fuel_efficiency: {
      label: "Fuel Efficiency",
      unit: "L/100km",
      description: "Lower values are better",
      format: (value: number) => `${value.toFixed(2)} L/100km`,
    },
    cost_per_km: {
      label: "Cost per Kilometer",
      unit: "AED/km",
      description: "Lower values are better",
      format: (value: number) => `${value.toFixed(2)} AED/km`,
    },
    co2_emission_factor: {
      label: "CO₂ Emissions",
      unit: "kg/km",
      description: "Lower values are better",
      format: (value: number) => `${value.toFixed(2)} kg/km`,
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance Snapshot</h2>
          <p className="text-muted-foreground">
            Overview of key performance metrics across the fleet
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-40">
            <Select
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-40">
            <Select
              value={selectedMetric}
              onValueChange={setSelectedMetric}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fuel_efficiency">Fuel Efficiency</SelectItem>
                <SelectItem value="cost_per_km">Cost per KM</SelectItem>
                <SelectItem value="co2_emission_factor">CO₂ Emissions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {isPerformanceLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[240px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !performanceData ? (
        <div className="flex items-center justify-center h-64 w-full">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">No performance data available</p>
            <p className="text-sm text-muted-foreground">Try selecting a different time period</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Performance Rankings */}
          <Card>
            <CardHeader>
              <CardTitle>
                {metricInfo[selectedMetric as keyof typeof metricInfo].label} Rankings
              </CardTitle>
              <CardDescription>
                {metricInfo[selectedMetric as keyof typeof metricInfo].description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="vehicle_type_code" 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip 
                      formatter={(value: number) => 
                        metricInfo[selectedMetric as keyof typeof metricInfo].format(value)
                      }
                    />
                    <Bar 
                      dataKey={selectedMetric} 
                      fill="#8884d8"
                      // Use individual colors based on rank
                      isAnimationActive={true}
                    >
                      {chartData.map((entry, index) => (
                        <rect 
                          key={`bar-${index}`} 
                          fill={entry.color} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Vehicle Performance Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trends Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  Historical performance trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={fuelEfficiencyData?.slice(0, 5) || []}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vehicle_type_code" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="fuel_efficiency"
                        name="Fuel Efficiency (L/100km)"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cost_per_km"
                        name="Cost per KM (AED)"
                        stroke="#82ca9d"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Metric Performance</CardTitle>
                <CardDescription>
                  Comparative analysis across metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart 
                      outerRadius={90} 
                      data={radarChartData?.slice(0, 5) || []}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Vehicle A"
                        dataKey="vehicle_a"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Vehicle B"
                        dataKey="vehicle_b"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                Vehicle types with the best overall performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4 pb-4">
                  {vehicleRankingsData.slice(0, 5).map((vehicle, index) => (
                    <Card key={index} className="min-w-[200px] max-w-[250px] bg-muted/50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Badge variant={index < 3 ? "default" : "outline"}>
                            #{index + 1}
                          </Badge>
                          <Badge variant="outline" className="font-mono">
                            {vehicle.vehicle_type_code}
                          </Badge>
                        </div>
                        <CardTitle className="text-base mt-2">
                          {vehicle.vehicle_type_name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Efficiency</p>
                          <p className="font-medium">{vehicle.fuel_efficiency.toFixed(1)} L/100km</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cost</p>
                          <p className="font-medium">{vehicle.cost_per_km.toFixed(2)} AED/km</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">CO₂</p>
                          <p className="font-medium">{vehicle.co2_emission_factor.toFixed(2)} kg/km</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Score</p>
                          <p className="font-medium">{vehicle.overall_score.toFixed(0)}/100</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}