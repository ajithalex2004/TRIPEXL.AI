import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertCircle,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Download,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import * as animationUtils from "@/lib/animation-utils";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

// Define the fuel type interface
interface FuelType {
  id: number;
  type: string;
  price: number;
  co2_factor: number;
  updated_at: string;
  created_at: string;
  historical_prices?: string;
}

// Define the schema for the fuel type form
const fuelTypeSchema = z.object({
  type: z.string().min(2, { message: "Fuel type must be at least 2 characters" }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number" }),
  co2_factor: z.coerce.number().min(0, { message: "CO2 factor must be a positive number" }),
});

type FuelTypeFormValues = z.infer<typeof fuelTypeSchema>;

export function FuelTypeManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isScrapingWam, setIsScrapingWam] = useState(false);
  const [showUaeFuels, setShowUaeFuels] = useState(false);

  // Form for adding/editing fuel types
  const form = useForm<FuelTypeFormValues>({
    resolver: zodResolver(fuelTypeSchema),
    defaultValues: {
      type: "",
      price: 0,
      co2_factor: 0,
    },
  });

  // Fetch fuel types data
  const { data: fuelTypes, isLoading, isError } = useQuery<FuelType[]>({
    queryKey: ["/api/fuel-types"],
  });
  
  // Mutation for running WAM scraper to get latest UAE fuel prices
  const wamScraperMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/fuel-types/wam-scrape");
      return await response.json();
    },
    onMutate: () => {
      setIsScrapingWam(true);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-types"] });
      toast({
        title: "Success",
        description: "WAM fuel prices scraped successfully",
      });
      // Update form with the latest UAE fuel prices if in add mode
      if (!isEditing && data.success) {
        setTimeout(() => {
          setShowUaeFuels(true);
        }, 1000);
      }
    },
    onError: (error) => {
      console.error("Error running WAM fuel price scraper:", error);
      toast({
        title: "Error",
        description: "Failed to fetch UAE fuel prices",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsScrapingWam(false);
    },
  });

  // Mutation for creating a new fuel type
  const createFuelTypeMutation = useMutation({
    mutationFn: async (values: FuelTypeFormValues) => {
      const response = await apiRequest("POST", "/api/fuel-types", values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-types"] });
      toast({
        title: "Success",
        description: "Fuel type added successfully",
      });
      setEditDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Error creating fuel type:", error);
      toast({
        title: "Error",
        description: "Failed to add fuel type",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a fuel type
  const updateFuelTypeMutation = useMutation({
    mutationFn: async (values: FuelTypeFormValues & { id: number }) => {
      const { id, ...data } = values;
      const response = await apiRequest("PATCH", `/api/fuel-types/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-types"] });
      toast({
        title: "Success",
        description: "Fuel type updated successfully",
      });
      setEditDialogOpen(false);
      setSelectedFuelType(null);
    },
    onError: (error) => {
      console.error("Error updating fuel type:", error);
      toast({
        title: "Error",
        description: "Failed to update fuel type",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a fuel type
  const deleteFuelTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/fuel-types/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-types"] });
      toast({
        title: "Success",
        description: "Fuel type deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedFuelType(null);
    },
    onError: (error) => {
      console.error("Error deleting fuel type:", error);
      toast({
        title: "Error",
        description: "Failed to delete fuel type. It may be in use by vehicles.",
        variant: "destructive",
      });
    },
  });

  // Handle edit button click
  const handleEditClick = (fuelType: FuelType) => {
    setSelectedFuelType(fuelType);
    setIsEditing(true);
    form.reset({
      type: fuelType.type,
      price: fuelType.price,
      co2_factor: fuelType.co2_factor,
    });
    setEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (fuelType: FuelType) => {
    setSelectedFuelType(fuelType);
    setDeleteDialogOpen(true);
  };

  // Handle add new fuel type button click
  const handleAddClick = () => {
    setIsEditing(false);
    setShowUaeFuels(false);
    form.reset({
      type: "",
      price: 0,
      co2_factor: 0,
    });
    setEditDialogOpen(true);
  };
  
  // Function to handle the WAM scraper button click
  const handleScrapeWam = () => {
    wamScraperMutation.mutate();
  };
  
  // Function to apply a UAE fuel type to the form
  const applyUaeFuelType = (fuelType: FuelType) => {
    form.setValue("type", fuelType.type);
    form.setValue("price", fuelType.price);
    form.setValue("co2_factor", fuelType.co2_factor);
    setShowUaeFuels(false);
    
    toast({
      title: "Fuel Type Applied",
      description: `${fuelType.type} with current UAE price and CO2 factor applied to form`,
    });
  };

  // Handle form submission
  const onSubmit = (values: FuelTypeFormValues) => {
    if (isEditing && selectedFuelType) {
      updateFuelTypeMutation.mutate({
        id: selectedFuelType.id,
        ...values,
      });
    } else {
      createFuelTypeMutation.mutate(values);
    }
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

  // Determine if mutations are in progress
  const isSubmitting =
    createFuelTypeMutation.isPending ||
    updateFuelTypeMutation.isPending ||
    deleteFuelTypeMutation.isPending;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={animationUtils.staggerContainer(0.1, 0.1)}
      className="space-y-6"
    >
      <motion.div variants={animationUtils.fadeIn("up")}>
        <Card className="backdrop-blur-xl bg-background/60 border shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Fuel Type Management</CardTitle>
              <CardDescription>
                Manage fuel types, their prices, and CO₂ emission factors
              </CardDescription>
            </div>
            <Button onClick={handleAddClick} className="space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Fuel Type</span>
            </Button>
          </CardHeader>
          <CardContent>
            {isError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load fuel types. Please try again later.
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Price (AED/Litre)</TableHead>
                    <TableHead>CO₂ Factor (kg/litre)</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelTypes?.map((fuelType) => (
                    <TableRow key={fuelType.id}>
                      <TableCell className="font-medium">{fuelType.type}</TableCell>
                      <TableCell>{fuelType.price.toFixed(2)} AED</TableCell>
                      <TableCell>{fuelType.co2_factor.toFixed(2)}</TableCell>
                      <TableCell>{formatDate(fuelType.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(fuelType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(fuelType)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!fuelTypes?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No fuel types available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="bg-muted/10 border-t flex flex-col sm:flex-row justify-between items-center gap-4 p-4">
            <div className="text-sm text-muted-foreground">
              {fuelTypes?.length
                ? `${fuelTypes.length} fuel type${fuelTypes.length > 1 ? "s" : ""}`
                : "No fuel types"}
            </div>
            <div className="text-sm text-muted-foreground">
              Updating prices will recalculate costs for all vehicles
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Fuel Type" : "Add New Fuel Type"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details of this fuel type"
                : "Add a new fuel type to the system"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="E.g., Super 98, Diesel" />
                    </FormControl>
                    <FormDescription>
                      Enter the official name of the fuel type
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (AED/Litre)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="3.14"
                      />
                    </FormControl>
                    <FormDescription>Current price per litre in AED</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co2_factor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CO₂ Emission Factor (kg/litre)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="2.34"
                      />
                    </FormControl>
                    <FormDescription>
                      CO₂ emissions in kilograms per litre of fuel
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!isEditing && (
                <div className="mt-6 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      UAE Fuel Types
                    </h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleScrapeWam}
                            disabled={isScrapingWam}
                            className="h-8"
                          >
                            {isScrapingWam ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4 mr-2" />
                            )}
                            <span>
                              {isScrapingWam
                                ? "Fetching..."
                                : "Fetch UAE Fuel Prices"}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Fetch latest UAE fuel prices from WAM (Emirates News Agency) using web scraper
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {showUaeFuels && fuelTypes && fuelTypes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-accent/30 p-3 rounded-md border"
                    >
                      <p className="text-xs text-muted-foreground mb-3">
                        Select a UAE fuel type to automatically fill in price and CO₂ factor:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {fuelTypes.map((fuel) => (
                          <Badge
                            key={fuel.id}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 flex gap-1 py-1.5"
                            onClick={() => applyUaeFuelType(fuel)}
                          >
                            <span>{fuel.type}</span>
                            <span className="opacity-70">({fuel.price.toFixed(2)} AED)</span>
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? "Update" : "Create"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the fuel type "{selectedFuelType?.type}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteFuelTypeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedFuelType && deleteFuelTypeMutation.mutate(selectedFuelType.id)}
              disabled={deleteFuelTypeMutation.isPending}
            >
              {deleteFuelTypeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}