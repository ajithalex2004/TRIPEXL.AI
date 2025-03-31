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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import * as animationUtils from "@/lib/animation-utils";

interface FuelPriceHistory {
  month: string;
  petrol: number;
  diesel: number;
  electric: number;
  hybrid: number;
  cng: number;
  lpg: number;
}

// Now using API data direct from the database

export function FuelPriceHistory() {
  const [selectedFuelType, setSelectedFuelType] = useState<string>("petrol");

  // Fetch real historical fuel price data from the API
  const { data: history, isLoading } = useQuery<FuelPriceHistory[]>({
    queryKey: ["/api/fuel-prices/history"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const fuelTypeColors = {
    petrol: "#f97316",
    diesel: "#0f172a",
    electric: "#06b6d4",
    hybrid: "#22c55e",
    cng: "#8b5cf6",
    lpg: "#eab308",
  };

  const lines = Object.keys(fuelTypeColors).map((fuelType) => (
    <Line
      key={fuelType}
      type="monotone"
      dataKey={fuelType}
      stroke={fuelTypeColors[fuelType as keyof typeof fuelTypeColors]}
      activeDot={{ r: 8 }}
      strokeWidth={2}
    />
  ));

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={animationUtils.staggerContainer(0.1, 0.1)}
      className="space-y-6"
    >
      <motion.div variants={animationUtils.fadeIn("up")}>
        <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>Fuel Price Trends</CardTitle>
            <CardDescription>
              Historical fuel price data across the UAE
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={history}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'AED per Litre', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} AED`, ""]} />
                  <Legend onClick={(e) => setSelectedFuelType(e.dataKey)} />
                  {lines}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Petrol</TableHead>
                  <TableHead>Diesel</TableHead>
                  <TableHead>Electric</TableHead>
                  <TableHead>Hybrid</TableHead>
                  <TableHead>CNG</TableHead>
                  <TableHead>LPG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history?.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell>{month.petrol.toFixed(2)} AED</TableCell>
                    <TableCell>{month.diesel.toFixed(2)} AED</TableCell>
                    <TableCell>{month.electric.toFixed(2)} AED</TableCell>
                    <TableCell>{month.hybrid.toFixed(2)} AED</TableCell>
                    <TableCell>{month.cng.toFixed(2)} AED</TableCell>
                    <TableCell>{month.lpg.toFixed(2)} AED</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="text-sm text-muted-foreground italic">
              Note: This data is based on historical UAE fuel prices. Prices are subject to change on the 1st of each month.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}