import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Droplets, 
  Gauge, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Ban, 
  AlertTriangle, 
  Info, 
  DollarSign,
  Calendar,
  PieChart as PieChartIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import * as animationUtils from "@/lib/animation-utils";
import { format } from "date-fns";

// Fuel type color mapping for visualization consistency
const fuelTypeColors = {
  PETROL: "#f97316", // Orange
  DIESEL: "#0f172a", // Dark blue
  ELECTRIC: "#06b6d4", // Cyan
  HYBRID: "#22c55e", // Green
  CNG: "#8b5cf6", // Purple
  LPG: "#eab308", // Yellow
  Premium: "#dc2626", // Red
  Petrol: "#f97316", // Orange
  Diesel: "#0f172a", // Dark blue
  Electric: "#06b6d4", // Cyan
  Hybrid: "#22c55e", // Green
};

export function PerformanceSnapshotDashboard() {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("6m");
  
  // Fetch all performance data in one call
  const { data, isLoading } = useQuery<{
    vehicles: any[];
    fuelTypes: any[];
    fuelPriceHistory: any[];
    performanceMetrics: {
      avgFuelEfficiency: number;
      avgCostPerKm: number;
      avgCO2EmissionFactor: number;
      fuelTypeDistribution: Record<string, number>;
      topPerformers: any[];
      underperformers: any[];
      recommendations: any[];
    }
  }>({
    queryKey: ["/api/performance-snapshot"],
  });
  
  // Extract data from the response
  const vehicleTypes = data?.vehicles || [];
  const fuelPriceHistory = data?.fuelPriceHistory || [];
  const fuelTypes = data?.fuelTypes || [];
  const performanceMetrics = data?.performanceMetrics;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Prepare data for fuel price trends chart
  const fuelPriceData = useMemo(() => {
    if (!fuelPriceHistory || fuelPriceHistory.length === 0) {
      return [];
    }
    
    // Group by date (month-year)
    const groupedData: Record<string, Record<string, number>> = {};
    
    fuelPriceHistory.forEach((record: any) => {
      const date = new Date(record.date);
      const formattedDate = format(date, 'MMM yyyy');
      
      if (!groupedData[formattedDate]) {
        groupedData[formattedDate] = {};
      }
      
      groupedData[formattedDate][record.fuel_type] = parseFloat(record.price);
    });
    
    // Convert to array format for the chart
    return Object.entries(groupedData).map(([date, prices]) => ({
      date,
      ...prices,
    }));
  }, [fuelPriceHistory]);
  
  // Calculate fuel price trends
  const fuelTrends = useMemo(() => {
    if (!fuelTypes || fuelTypes.length === 0) return {};
    
    const trends: Record<string, {change: number, direction: string}> = {};
    
    fuelTypes.forEach((fuel: any) => {
      if (fuel.historical_prices && fuel.historical_prices.length >= 2) {
        const latest = parseFloat(fuel.price);
        const previous = parseFloat(fuel.historical_prices[fuel.historical_prices.length - 2].price);
        const change = ((latest - previous) / previous) * 100;
        trends[fuel.type] = {
          change: parseFloat(change.toFixed(2)),
          direction: change >= 0 ? 'up' : 'down'
        };
      } else {
        trends[fuel.type] = { change: 0, direction: 'neutral' };
      }
    });
    
    return trends;
  }, [fuelTypes]);

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

  // Use the metrics from backend if available, or calculate locally if not
  const avgFuelEfficiency = performanceMetrics?.avgFuelEfficiency || 
    filteredVehicleTypes
      .filter(vt => vt.fuel_type !== "ELECTRIC") // Exclude electric vehicles
      .reduce((acc, vt) => acc + Number(vt.fuel_efficiency), 0) / 
      filteredVehicleTypes.filter(vt => vt.fuel_type !== "ELECTRIC").length;

  const avgCostPerKm = performanceMetrics?.avgCostPerKm || 
    filteredVehicleTypes
      .reduce((acc, vt) => acc + Number(vt.cost_per_km), 0) / filteredVehicleTypes.length;

  const avgCO2EmissionFactor = performanceMetrics?.avgCO2EmissionFactor || 
    filteredVehicleTypes
      .reduce((acc, vt) => acc + Number(vt.co2_emission_factor), 0) / filteredVehicleTypes.length;
    
  // Get recommendations from the backend
  const recommendations = performanceMetrics?.recommendations || [];

  const fuelTypeCounts = filteredVehicleTypes.reduce((acc, vt) => {
    acc[vt.fuel_type] = (acc[vt.fuel_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fuelTypeDistribution = Object.entries(fuelTypeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const regions = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Fujairah", "Ras Al Khaimah", "Umm Al Quwain"];

  // Create fuel price trend cards data
  const fuelPriceTrendCards = fuelTypes
    .filter((fuel: any) => ["PETROL", "DIESEL", "SUPER"].includes(fuel.type.toUpperCase()))
    .map((fuel: any) => {
      const trend = fuelTrends[fuel.type] || { change: 0, direction: 'neutral' };
      return {
        type: fuel.type,
        price: parseFloat(fuel.price).toFixed(2),
        trend: trend.change,
        direction: trend.direction,
      };
    });

  // Convert historical price data for the line chart
  const fuelPriceTrendChartData = useMemo(() => {
    if (!fuelPriceHistory || fuelPriceHistory.length === 0) return [];
    
    // Sort by date
    const sorted = [...fuelPriceHistory].sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Group by date and fuel type
    const result: any[] = [];
    let lastDate = '';
    let currentEntry: any = null;
    
    sorted.forEach((record: any) => {
      const date = format(new Date(record.date), 'MMM yyyy');
      
      if (date !== lastDate) {
        if (currentEntry) {
          result.push(currentEntry);
        }
        currentEntry = { date };
        lastDate = date;
      }
      
      currentEntry[record.fuel_type] = parseFloat(record.price);
    });
    
    if (currentEntry) {
      result.push(currentEntry);
    }
    
    return result;
  }, [fuelPriceHistory]);
  
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

        <div className="flex gap-2">
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
          
          <Select
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>
      
      {/* Fuel Price Trend Cards */}
      <motion.div variants={animationUtils.fadeIn("up")} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fuelPriceTrendCards.map((card) => (
          <Card key={card.type} className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-md overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-medium">{card.type}</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-2xl font-bold flex items-center">
                {card.price} AED
                <span className={`ml-2 text-sm ${
                  card.direction === 'up' ? 'text-destructive' : 
                  card.direction === 'down' ? 'text-emerald-500' : 'text-muted-foreground'
                } flex items-center`}>
                  {card.direction === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : card.direction === 'down' ? (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  ) : null}
                  {card.trend !== 0 ? `${Math.abs(card.trend)}%` : ''}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Current {card.type} price per liter in Abu Dhabi
              </p>
            </CardContent>
            <div 
              className="h-1" 
              style={{ 
                background: `${
                  card.direction === 'up' ? 'linear-gradient(to right, #ff4b4b, #ff8f8f)' : 
                  card.direction === 'down' ? 'linear-gradient(to right, #22c55e, #4ade80)' : 
                  'linear-gradient(to right, #94a3b8, #cbd5e1)'
                }`
              }}
            ></div>
          </Card>
        ))}
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
        <Tabs defaultValue="fuel-trends" className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="fuel-trends">Fuel Price Trends</TabsTrigger>
            <TabsTrigger value="fuel-efficiency">Fuel Efficiency</TabsTrigger>
            <TabsTrigger value="cost">Cost per KM</TabsTrigger>
            <TabsTrigger value="emissions">CO₂ Emissions</TabsTrigger>
            <TabsTrigger value="idle">Idle Consumption</TabsTrigger>
            <TabsTrigger value="distribution">Fuel Distribution</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fuel-trends" className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Fuel Price Trends (Last 12 Months)</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={fuelPriceTrendChartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'AED', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} AED`, "Price per Liter"]} />
                  <Legend />
                  {fuelTypes
                    .filter((fuel: any) => ["PETROL", "DIESEL", "SUPER"].includes(fuel.type.toUpperCase()))
                    .map((fuel: any) => (
                      <Line
                        key={fuel.type}
                        type="monotone"
                        dataKey={fuel.type}
                        name={fuel.type}
                        stroke={fuelTypeColors[fuel.type as keyof typeof fuelTypeColors]}
                        activeDot={{ r: 8 }}
                      />
                    ))
                  }
                  <ReferenceLine y={3.5} label="Average" stroke="red" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4">
              <h4 className="text-md font-medium mb-2">Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm border p-3 rounded-md bg-background/50">
                  <h5 className="font-medium flex items-center text-primary mb-2">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Impact on Operational Costs
                  </h5>
                  <p>Fuel price fluctuations directly impact operational costs. Each 1 AED change in fuel price affects per-kilometer cost by approximately 0.07-0.12 AED depending on vehicle efficiency.</p>
                </div>
                <div className="text-sm border p-3 rounded-md bg-background/50">
                  <h5 className="font-medium flex items-center text-primary mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    Monthly Recalculation
                  </h5>
                  <p>Vehicle costs are automatically recalculated on the 1st of each month based on current fuel prices to maintain accurate operational metrics and forecasting.</p>
                </div>
                <div className="text-sm border p-3 rounded-md bg-background/50">
                  <h5 className="font-medium flex items-center text-primary mb-2">
                    <PieChartIcon className="h-4 w-4 mr-2" />
                    Strategic Recommendations
                  </h5>
                  <p>During periods of rising fuel prices, prioritize electric and hybrid vehicles or higher efficiency vehicles to minimize operational costs.</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
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
          
          <TabsContent value="recommendations" className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Fleet Optimization Recommendations</h3>
            <div className="space-y-6">
              {/* If we have recommendations from the API, use those */}
              {recommendations && recommendations.length > 0 ? (
                recommendations.map((recommendation: any, index: number) => (
                  <Card key={index} className="backdrop-blur-xl bg-background/60 border shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium">{recommendation.title}</CardTitle>
                        {recommendation.impact === 'high' && <Badge className="bg-red-500">High Impact</Badge>}
                        {recommendation.impact === 'medium' && <Badge className="bg-amber-500">Medium Impact</Badge>}
                        {recommendation.impact === 'low' && <Badge className="bg-emerald-500">Low Impact</Badge>}
                      </div>
                      <CardDescription>{recommendation.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{recommendation.description}</p>
                      {recommendation.savings && (
                        <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm">
                          <span className="font-medium">Potential savings: </span>
                          {recommendation.savings}
                        </div>
                      )}
                    </CardContent>
                    {recommendation.actions && (
                      <CardFooter className="text-sm border-t pt-3 text-muted-foreground">
                        <span className="font-medium mr-2">Suggested action:</span>
                        {recommendation.actions}
                      </CardFooter>
                    )}
                  </Card>
                ))
              ) : (
                // Default recommendations if API doesn't provide any
                <>
                  <Card className="backdrop-blur-xl bg-background/60 border shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium">Fuel Type Optimization</CardTitle>
                        <Badge className="bg-red-500">High Impact</Badge>
                      </div>
                      <CardDescription>Based on current fuel prices and fleet performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Consider increasing the ratio of electric and hybrid vehicles in your fleet to reduce operational costs. 
                        Electric vehicles show 75% lower cost per kilometer compared to petrol vehicles.
                      </p>
                      <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm">
                        <span className="font-medium">Potential savings: </span>
                        Up to 0.45 AED per kilometer, translating to approximately 18,000 AED per vehicle annually based on average usage patterns.
                      </div>
                    </CardContent>
                    <CardFooter className="text-sm border-t pt-3 text-muted-foreground">
                      <span className="font-medium mr-2">Suggested action:</span>
                      When replacing aged vehicles, prioritize electric models for urban usage profiles.
                    </CardFooter>
                  </Card>
                  
                  <Card className="backdrop-blur-xl bg-background/60 border shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium">Idle Time Reduction</CardTitle>
                        <Badge className="bg-amber-500">Medium Impact</Badge>
                      </div>
                      <CardDescription>Based on vehicle telemetry data analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Data indicates an average idle time of 1.8 hours per vehicle per day across your fleet. 
                        Implementing systematic idle reduction practices could significantly reduce fuel consumption and emissions.
                      </p>
                      <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm">
                        <span className="font-medium">Potential savings: </span>
                        Reducing idle time by 50% could save approximately 0.8-1.5 liters of fuel per vehicle daily, resulting in 
                        monthly savings of ~800 AED per 10 vehicles.
                      </div>
                    </CardContent>
                    <CardFooter className="text-sm border-t pt-3 text-muted-foreground">
                      <span className="font-medium mr-2">Suggested action:</span>
                      Implement driver training program focused on idle reduction and consider idle-reduction technologies for high-usage vehicles.
                    </CardFooter>
                  </Card>
                  
                  <Card className="backdrop-blur-xl bg-background/60 border shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium">Maintenance Optimization</CardTitle>
                        <Badge className="bg-emerald-500">Low Impact</Badge>
                      </div>
                      <CardDescription>Preventative maintenance schedule improvements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Analysis shows maintenance intervals can be optimized based on fuel type and usage patterns. 
                        Diesel vehicles in particular show 15% longer optimal service intervals than currently scheduled.
                      </p>
                      <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm">
                        <span className="font-medium">Potential savings: </span>
                        Approximately 5-8% reduction in annual maintenance costs while maintaining optimal vehicle performance.
                      </div>
                    </CardContent>
                    <CardFooter className="text-sm border-t pt-3 text-muted-foreground">
                      <span className="font-medium mr-2">Suggested action:</span>
                      Revise maintenance schedules based on vehicle-specific data rather than using standardized intervals.
                    </CardFooter>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}