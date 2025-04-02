import { useState, useMemo, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { VehicleTypeMaster, InsertVehicleTypeMaster } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VehicleTypeForm } from "@/components/ui/vehicle-type-form";

import { VehicleDetailsCard } from "@/components/ui/vehicle-details-card";
import {
  Card,
  CardContent,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, X, Filter, ChevronDown, Trash2, Pencil, Plus } from "lucide-react";
import * as animationUtils from "@/lib/animation-utils";

export default function VehicleTypeManagement() {
  const [selectedType, setSelectedType] = useState<VehicleTypeMaster | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [vehicleGroupFilter, setVehicleGroupFilter] = useState<string>("all");
  const [vehicleGroups, setVehicleGroups] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query vehicle types with better caching and retry strategy
  const { data: vehicleTypes, isLoading, refetch, isError, error } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-types"],
    staleTime: 0, // Always consider data stale (fetch on mount)
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
    retry: 3, // Retry 3 times if the request fails
    retryDelay: 1000, // Wait 1 second between retries
    queryFn: async () => {
      try {
        console.log("Attempting to fetch vehicle types from API...");
        
        // Use a more explicit fetch with error logging
        const response = await fetch("/api/vehicle-types", {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        });
        
        console.log("API response status:", response.status);
        console.log("API response OK:", response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }
        
        const responseText = await response.text();
        console.log("Raw API response:", responseText);
        
        // Parse the text manually for better debugging
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("API data parsed successfully:", data);
          console.log("Number of vehicle types:", data.length);
          return data;
        } catch (parseError: unknown) {
          const error = parseError as Error;
          console.error("Error parsing JSON:", error);
          throw new Error(`Invalid JSON response: ${error.message}`);
        }
      } catch (err) {
        console.error("Error fetching vehicle types:", err);
        throw err;
      }
    }
  });
  
  // Force refetch when component mounts to ensure fresh data
  useEffect(() => {
    console.log("Component mounted, refetching vehicle types...");
    // Add a small delay to ensure the fetch happens after any previous operations complete
    const timer = setTimeout(() => {
      refetch();
      console.log("Explicit refetch triggered");
      
      // Debug output
      if (vehicleTypes) {
        console.log("Vehicle types data received:", vehicleTypes);
        console.log("Number of vehicle types:", vehicleTypes.length);
      } else {
        console.log("No vehicle types data received");
      }
      
      if (isError) {
        console.error("Error loading vehicle types:", error);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [refetch, vehicleTypes, isError, error]);
  
  // Fetch vehicle groups to display group names
  useEffect(() => {
    const fetchVehicleGroups = async () => {
      try {
        const response = await fetch("/api/vehicle-groups");
        if (response.ok) {
          const data = await response.json();
          console.log("Vehicle groups loaded:", data);
          setVehicleGroups(data);
        } else {
          console.error("Failed to load vehicle groups:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching vehicle groups:", error);
      }
    };
    
    fetchVehicleGroups();
  }, []);

  // Extract unique filter options from data
  const regionOptions = useMemo(() => {
    if (!vehicleTypes) return [];
    return Array.from(new Set(vehicleTypes.map(type => type.region))).filter(Boolean);
  }, [vehicleTypes]);

  const vehicleTypeOptions = useMemo(() => {
    if (!vehicleTypes) return [];
    return Array.from(new Set(vehicleTypes.map(type => type.vehicle_type))).filter(Boolean);
  }, [vehicleTypes]);

  const departmentOptions = useMemo(() => {
    if (!vehicleTypes) return [];
    return Array.from(new Set(vehicleTypes.map(type => type.department))).filter(Boolean);
  }, [vehicleTypes]);
  
  // Get vehicle group options from the loaded vehicleGroups
  const vehicleGroupOptions = useMemo(() => {
    if (!vehicleGroups || !vehicleGroups.length) return [];
    return vehicleGroups.map(group => ({ id: group.id, name: group.name }));
  }, [vehicleGroups]);
  
  // Helper function to get vehicle group name by ID
  const getVehicleGroupNameById = useCallback((id: number): string => {
    if (!vehicleGroups) return "Unknown";
    const group = vehicleGroups.find(g => g.id === id);
    return group ? group.name : "Unknown";
  }, [vehicleGroups]);

  // Filter functionality
  const filteredVehicleTypes = useMemo(() => {
    if (!vehicleTypes) return [];
    
    return vehicleTypes.filter(type => {
      // Check if it matches the search query
      const searchMatches = searchQuery === "" || (
        (type.vehicle_type_code?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (type.vehicle_type_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (type.vehicle_type?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (type.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      // Check filters
      const regionMatches = regionFilter === "" || regionFilter === "all" || type.region === regionFilter;
      const vehicleTypeMatches = vehicleTypeFilter === "" || vehicleTypeFilter === "all" || type.vehicle_type === vehicleTypeFilter;
      const departmentMatches = departmentFilter === "" || departmentFilter === "all" || type.department === departmentFilter;
      const vehicleGroupMatches = vehicleGroupFilter === "" || vehicleGroupFilter === "all" || type.group_id === parseInt(vehicleGroupFilter);
      
      return searchMatches && regionMatches && vehicleTypeMatches && departmentMatches && vehicleGroupMatches;
    });
  }, [vehicleTypes, searchQuery, regionFilter, vehicleTypeFilter, departmentFilter, vehicleGroupFilter]);
  
  // Check if any filters are active
  const isFiltering = 
    searchQuery !== "" || 
    (regionFilter !== "" && regionFilter !== "all") || 
    (vehicleTypeFilter !== "" && vehicleTypeFilter !== "all") || 
    (departmentFilter !== "" && departmentFilter !== "all") ||
    (vehicleGroupFilter !== "" && vehicleGroupFilter !== "all");
  
  // Function to clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setRegionFilter("all");
    setVehicleTypeFilter("all");
    setDepartmentFilter("all");
    setVehicleGroupFilter("all");
  }, []);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating vehicle type with data:", data);
      const response = await apiRequest("POST", "/api/vehicle-types", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create vehicle type");
      }
      return response.json();
    },
    onSuccess: (newItem) => {
      // First invalidate the query
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      
      // Then explicitly refetch to ensure we get fresh data
      refetch().then(() => {
        // Add a manual toast to confirm data refresh too
        toast({
          title: "Refreshed",
          description: "Vehicle types data refreshed",
        });
      });
      
      console.log("Vehicle type created:", newItem);
      console.log("Vehicle type created, refetching data...");
      
      toast({
        title: "Success",
        description: "New vehicle type created",
      });
      
      // Close the form
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      console.error("Error creating vehicle type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create vehicle type",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      console.log("Updating vehicle type:", id, "with data:", data);
      const response = await apiRequest("PATCH", `/api/vehicle-types/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update vehicle type");
      }
      return response.json();
    },
    onSuccess: (updatedItem) => {
      // First invalidate the query
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      
      // Then explicitly refetch to ensure we get fresh data
      refetch().then(() => {
        // Add a manual toast to confirm data refresh too
        toast({
          title: "Refreshed",
          description: "Vehicle types data refreshed",
        });
      });
      
      console.log("Vehicle type updated:", updatedItem);
      console.log("Vehicle type updated, refetching data...");
      
      toast({
        title: "Success",
        description: "Vehicle type updated successfully",
      });
      
      // Close the form and reset selection
      setIsFormOpen(false);
      setSelectedType(null);
    },
    onError: (error: Error) => {
      console.error("Error updating vehicle type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle type",
        variant: "destructive",
      });
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log("Deleting vehicle type with ID:", id);
      const response = await apiRequest("DELETE", `/api/vehicle-types/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete vehicle type");
      }
      return response.json();
    },
    onSuccess: () => {
      // First invalidate the query
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      
      // Then explicitly refetch to ensure we get fresh data
      refetch().then(() => {
        toast({
          title: "Refreshed",
          description: "Vehicle types data refreshed",
        });
      });
      
      console.log("Vehicle type deleted successfully");
      
      toast({
        title: "Success",
        description: "Vehicle type deleted successfully",
      });
      
      // Reset selection if needed
      if (selectedType) {
        setSelectedType(null);
      }
    },
    onError: (error: Error) => {
      console.error("Error deleting vehicle type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete vehicle type",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      console.log("Vehicle Type Management - Received data from form:", data);
      
      // Additional validation and formatting
      if (!data.vehicle_model) {
        console.warn("Missing vehicle_model, using vehicle_type");
        data.vehicle_model = data.vehicle_type;
      }
      
      if (!data.vehicle_type) {
        console.warn("Missing vehicle_type, using vehicle_model");
        data.vehicle_type = data.vehicle_model;
      }
      
      // Format data for API consistency
      // We'll use a regular object without type annotation first
      const formattedData = {
        // Integer fields
        group_id: Number(data.group_id) || 0,
        model_year: Number(data.model_year) || new Date().getFullYear(),
        number_of_passengers: Number(data.number_of_passengers) || 0,
        vehicle_capacity: Number(data.vehicle_capacity) || 0,
        alert_before: Number(data.alert_before) || 0,
        
        // Text fields
        vehicle_type_code: String(data.vehicle_type_code || ""),
        vehicle_type_name: String(data.vehicle_type_name || ""),
        manufacturer: String(data.manufacturer || ""),
        vehicle_model: String(data.vehicle_model || ""),
        region: String(data.region || "Abu Dhabi"),
        fuel_type: String(data.fuel_type || ""),
        service_plan: String(data.service_plan || ""),
        vehicle_type: String(data.vehicle_type || ""),
        department: String(data.department || "Fleet"),
        unit: String(data.unit || ""),
        color: String(data.color || ""),
        
        // Decimal fields - use strings for database compatibility
        fuel_efficiency: String(data.fuel_efficiency || "0"),
        fuel_price_per_litre: String(data.fuel_price_per_litre || "0"),
        cost_per_km: String(data.cost_per_km || "0"),
        idle_fuel_consumption: String(data.idle_fuel_consumption || "0"),
        co2_emission_factor: String(data.co2_emission_factor || "0"),
      };
      
      console.log("Vehicle Type Management - Formatted data for API:", formattedData);
      
      if (selectedType) {
        console.log("Updating vehicle type with ID:", selectedType.id);
        // Just pass the data directly without type assertion
        // The server will handle any necessary conversions
        await updateMutation.mutateAsync({ 
          ...formattedData, 
          id: selectedType.id 
        });
      } else {
        console.log("Creating new vehicle type");
        // Just pass the data directly without type assertion
        // The server will handle any necessary conversions
        await createMutation.mutateAsync(formattedData);
      }
    } catch (error) {
      console.error("Submit error:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background/50 via-background to-background/90 p-6">
      <motion.div 
        className="max-w-7xl mx-auto space-y-6"
        initial="hidden"
        animate="visible"
        variants={animationUtils.staggerContainer(0.1, 0.2)}
      >
        <motion.div variants={animationUtils.fadeIn("up")}>
          <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-2xl overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background/0 pointer-events-none"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "mirror",
              }}
            />
            <CardHeader className="pb-0">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Vehicle Type Management
                  </CardTitle>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto flex items-center gap-2"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                    />
                  </Button>
                </div>
                
                <div className="flex gap-2 items-center">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-10"
                      placeholder="Search by code, name, or manufacturer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <X 
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
                        onClick={() => setSearchQuery("")}
                      />
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => {
                      refetch();
                      toast({
                        title: "Refreshed",
                        description: "Vehicle types data refreshed",
                      });
                    }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="h-4 w-4"
                    >
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 21h5v-5" />
                    </svg>
                  </Button>
                </div>
                
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium">Region</label>
                          <Select
                            value={regionFilter || "all"}
                            onValueChange={setRegionFilter}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All regions" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All regions</SelectItem>
                              {regionOptions.map(region => (
                                <SelectItem key={region} value={region}>
                                  {region}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Vehicle Type</label>
                          <Select
                            value={vehicleTypeFilter || "all"}
                            onValueChange={setVehicleTypeFilter}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All types</SelectItem>
                              {vehicleTypeOptions.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Department</label>
                          <Select
                            value={departmentFilter || "all"}
                            onValueChange={setDepartmentFilter}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All departments" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All departments</SelectItem>
                              {departmentOptions.map(dept => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Vehicle Group</label>
                          <Select
                            value={vehicleGroupFilter || "all"}
                            onValueChange={setVehicleGroupFilter}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All groups" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All groups</SelectItem>
                              {vehicleGroupOptions.map(group => (
                                <SelectItem key={group.id} value={group.id.toString()}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {isFiltering && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="flex gap-1 items-center"
                          >
                            <X className="h-3 w-3" />
                            Clear Filters
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-4">
              {isLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading vehicle types...</p>
                  </div>
                </div>
              ) : isError ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="rounded-full bg-destructive/10 p-3">
                      <X className="h-6 w-6 text-destructive" />
                    </div>
                    <p className="font-medium text-destructive">
                      Failed to load vehicle types
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {error instanceof Error ? error.message : "Unknown error"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : filteredVehicleTypes.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">No vehicle types found</p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {isFiltering 
                        ? "Try changing or clearing your filters"
                        : "Try creating a new vehicle type"}
                    </p>
                    {isFiltering && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-2"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[100px]">Code</TableHead>
                        <TableHead>Type Name</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Vehicle Type</TableHead>
                        <TableHead>Vehicle Group</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVehicleTypes.map((type) => (
                        <TableRow key={type.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{type.vehicle_type_code}</TableCell>
                          <TableCell>{type.vehicle_type_name}</TableCell>
                          <TableCell>{type.manufacturer}</TableCell>
                          <TableCell>{type.vehicle_type}</TableCell>
                          <TableCell>
                            {type.group_id ? (
                              <Badge variant="outline" className="font-normal">
                                {getVehicleGroupNameById(type.group_id)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </TableCell>
                          <TableCell>{type.region}</TableCell>
                          <TableCell>{type.department}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedType(type);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedType(type);
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* Vehicle Type Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="lg:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{selectedType ? "Edit" : "Create"} Vehicle Type</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-auto">
            <VehicleTypeForm
              onSubmit={handleSubmit}
              initialData={selectedType}
              isEditing={!!selectedType}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vehicle type 
              <span className="font-semibold mx-1">
                {selectedType?.vehicle_type_name}
              </span>
              and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedType) {
                  deleteMutation.mutate(selectedType.id);
                }
                setDeleteConfirmOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* FAB for adding new vehicle types */}
      <AnimatePresence>
        {!isFormOpen && (
          <motion.div
            className="fixed bottom-6 right-6"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Button
              size="lg"
              className="rounded-full h-14 w-14 bg-gradient-to-br from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-primary/90 hover:to-primary border-2 border-primary/20"
              onClick={() => {
                setSelectedType(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-6 w-6 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}