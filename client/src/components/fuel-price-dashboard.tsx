import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import * as animationUtils from "@/lib/animation-utils";
import { apiRequest } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FuelType {
  type: string;
  price: number;
  updated_at: string;
}

export function FuelPriceDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isScrapingWam, setIsScrapingWam] = useState(false);

  // Fetch fuel types data
  const { data: fuelTypes, isLoading } = useQuery<FuelType[]>({
    queryKey: ["/api/fuel-types"],
  });

  // Mutation for updating fuel prices
  const updateFuelPricesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/fuel-prices/update");
      return await response.json();
    },
    onMutate: () => {
      setIsUpdating(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-types"] });
      toast({
        title: "Success",
        description: "Fuel prices updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating fuel prices:", error);
      toast({
        title: "Error",
        description: "Failed to update fuel prices",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  // Mutation for running WAM scraper
  const wamScraperMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/fuel-prices/wam-scrape");
      return await response.json();
    },
    onMutate: () => {
      setIsScrapingWam(true);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-types"] });
      toast({
        title: "Success",
        description: "WAM fuel prices scraper completed successfully",
      });
    },
    onError: (error) => {
      console.error("Error running WAM fuel price scraper:", error);
      toast({
        title: "Error",
        description: "Failed to run WAM fuel price scraper",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsScrapingWam(false);
    },
  });

  // Handle update button click
  const handleUpdateFuelPrices = () => {
    updateFuelPricesMutation.mutate();
  };
  
  // Handle WAM scraper button click
  const handleRunWamScraper = () => {
    wamScraperMutation.mutate();
  };

  // Format date for better readability
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-AE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
            <CardTitle>UAE Fuel Price Dashboard</CardTitle>
            <CardDescription>
              Current fuel prices across the UAE. Updated monthly on the 1st day of each month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Price (AED/Litre)</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelTypes?.map((fuelType) => (
                  <TableRow key={fuelType.type}>
                    <TableCell className="font-medium">{fuelType.type}</TableCell>
                    <TableCell>{fuelType.price.toFixed(2)} AED</TableCell>
                    <TableCell>{formatDate(fuelType.updated_at)}</TableCell>
                  </TableRow>
                ))}
                {!fuelTypes?.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No fuel price data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t flex flex-col sm:flex-row justify-between items-center gap-4 p-4">
            <div className="text-sm text-muted-foreground">
              {fuelTypes?.length
                ? `Last updated on ${formatDate(fuelTypes[0].updated_at)}`
                : "No update history available"}
            </div>
            <div className="flex gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleRunWamScraper}
                      disabled={isScrapingWam || isUpdating}
                      variant="outline"
                      className="space-x-2"
                    >
                      {isScrapingWam ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      <span>{isScrapingWam ? "Scraping WAM..." : "Scrape WAM"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fetch latest fuel prices from Emirates News Agency (WAM)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button
                onClick={handleUpdateFuelPrices}
                disabled={isUpdating || isScrapingWam}
                className="space-x-2"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>{isUpdating ? "Updating..." : "Update Now"}</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}