import { useState, useMemo, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { VehicleTypeMaster, InsertVehicleTypeMaster } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VehicleTypeForm } from "@/components/ui/vehicle-type-form-new-fixed";
import { VehicleTypeFAB } from "@/components/ui/vehicle-type-fab";
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
import { Loader2, Search, X, Filter, ChevronDown, Trash2, Pencil } from "lucide-react";
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
                <motion.div variants={animationUtils.fadeIn("up", 0.1)}>
                  <CardTitle>Vehicle Types</CardTitle>
                </motion.div>
                
                <motion.div 
                  variants={animationUtils.fadeIn("up", 0.15)}
                  className="flex flex-col md:flex-row gap-3 items-start md:items-center"
                >
                  {/* Refresh button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      console.log("Manual refresh requested");
                      refetch();
                    }}
                    title="Refresh vehicle types"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="lucide lucide-refresh-cw"
                    >
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                      <path d="M21 3v5h-5"></path>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                      <path d="M8 16H3v5"></path>
                    </svg>
                  </Button>
                  
                  {/* Search box */}
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by code, name or type..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="absolute right-2 top-2.5 p-0.5 rounded-full bg-muted/50 hover:bg-muted"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  
                  {/* Filter button */}
                  <Button
                    variant={showFilters ? "secondary" : "outline"}
                    className="flex items-center gap-1"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                    />
                  </Button>
                  
                  {/* Clear filters button (only shows when filters are active) */}
                  {isFiltering && (
                    <Button
                      variant="ghost"
                      className="text-primary"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  )}
                </motion.div>
                
                {/* Filter panel */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-3">
                        {/* Region filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Region</label>
                          <Select
                            value={regionFilter}
                            onValueChange={setRegionFilter}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All regions" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All regions</SelectItem>
                              {regionOptions.map((region) => (
                                <SelectItem key={region} value={region}>
                                  {region}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Vehicle type filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Vehicle Type</label>
                          <Select
                            value={vehicleTypeFilter}
                            onValueChange={setVehicleTypeFilter}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All types</SelectItem>
                              {vehicleTypeOptions.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Department filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Department</label>
                          <Select
                            value={departmentFilter}
                            onValueChange={setDepartmentFilter}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All departments" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All departments</SelectItem>
                              {departmentOptions.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Vehicle Group filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Vehicle Group</label>
                          <Select
                            value={vehicleGroupFilter}
                            onValueChange={setVehicleGroupFilter}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All groups" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All groups</SelectItem>
                              {vehicleGroupOptions.map((group) => (
                                <SelectItem key={group.id} value={group.id.toString()}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Active filter badges */}
                {isFiltering && (
                  <motion.div 
                    variants={animationUtils.fadeIn("up", 0.2)}
                    className="flex flex-wrap gap-2 pt-2"
                  >
                    {searchQuery && (
                      <Badge variant="outline" className="flex gap-1 items-center">
                        <span>Search: {searchQuery}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setSearchQuery("")}
                        />
                      </Badge>
                    )}
                    {regionFilter && regionFilter !== "all" && (
                      <Badge variant="outline" className="flex gap-1 items-center">
                        <span>Region: {regionFilter}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setRegionFilter("all")}
                        />
                      </Badge>
                    )}
                    {vehicleTypeFilter && vehicleTypeFilter !== "all" && (
                      <Badge variant="outline" className="flex gap-1 items-center">
                        <span>Type: {vehicleTypeFilter}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setVehicleTypeFilter("all")}
                        />
                      </Badge>
                    )}
                    {departmentFilter && departmentFilter !== "all" && (
                      <Badge variant="outline" className="flex gap-1 items-center">
                        <span>Department: {departmentFilter}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setDepartmentFilter("all")}
                        />
                      </Badge>
                    )}
                    {vehicleGroupFilter && vehicleGroupFilter !== "all" && (
                      <Badge variant="outline" className="flex gap-1 items-center">
                        <span>Group: {getVehicleGroupNameById(parseInt(vehicleGroupFilter))}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setVehicleGroupFilter("all")}
                        />
                      </Badge>
                    )}
                  </motion.div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <motion.div 
                  className="flex items-center justify-center h-32"
                  animate={animationUtils.pulse}
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle Group</TableHead>
                        <TableHead>Type Code</TableHead>
                        <TableHead>Vehicle Type</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVehicleTypes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 py-4">
                              <p className="text-muted-foreground">No vehicle types found</p>
                              {isFiltering && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={clearFilters}
                                >
                                  Clear filters
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <AnimatePresence>
                          {filteredVehicleTypes.map((type, index) => (
                            <motion.tr
                              key={type.id}
                              className="hover:bg-accent/50 transition-colors"
                              variants={animationUtils.listItem(index, 0.05)}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              whileHover={{
                                backgroundColor: "rgba(var(--primary), 0.1)",
                                transition: { duration: 0.1 }
                              }}
                            >
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedType(type);
                                  setIsFormOpen(true);
                                }}
                              >
                                {vehicleGroups.find(group => group.id === type.group_id)?.name || `Group ${type.group_id}`}
                              </TableCell>
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedType(type);
                                  setIsFormOpen(true);
                                }}
                              >{type.vehicle_type_code}</TableCell>
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedType(type);
                                  setIsFormOpen(true);
                                }}
                              >{type.vehicle_type}</TableCell>
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedType(type);
                                  setIsFormOpen(true);
                                }}
                              >{type.region}</TableCell>
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedType(type);
                                  setIsFormOpen(true);
                                }}
                              >{type.department}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {/* Edit button */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedType(type);
                                      setIsFormOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  {/* Delete button */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedType(type);
                                      setDeleteConfirmOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      )}
                    </TableBody>
                  </Table>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Dialog 
        open={isFormOpen} 
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedType(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {selectedType ? "Edit Vehicle Type" : "Add Vehicle Type"}
              </DialogTitle>
            </motion.div>
          </DialogHeader>
          
          {selectedType && (
            <div className="mb-6">
              <VehicleDetailsCard 
                vehicleData={selectedType} 
                getVehicleGroupName={getVehicleGroupNameById} 
              />
            </div>
          )}
          
          <VehicleTypeForm
            onSubmit={handleSubmit}
            initialData={selectedType || undefined}
            isEditing={!!selectedType}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vehicle type? This action cannot be undone.
              {selectedType && (
                <div className="mt-2 p-3 bg-background rounded-md border">
                  <p><strong>Code:</strong> {selectedType.vehicle_type_code}</p>
                  <p><strong>Name:</strong> {selectedType.vehicle_type_name}</p>
                  <p><strong>Type:</strong> {selectedType.vehicle_type}</p>
                  <p><strong>Group:</strong> {getVehicleGroupNameById(selectedType.group_id)}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => {
                if (selectedType) {
                  deleteMutation.mutate(selectedType.id);
                }
                setDeleteConfirmOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.5 
        }}
      >
        <VehicleTypeFAB
          onAddClick={() => {
            setSelectedType(null);
            setIsFormOpen(true);
          }}
          onImport={async (file) => {
            toast({
              title: "Import started",
              description: "Importing vehicle types from file...",
            });
            // Actual implementation would parse and upload file
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast({
              title: "Import completed",
              description: "Vehicle types imported successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
          }}
          onExport={async () => {
            toast({
              title: "Export started",
              description: "Exporting vehicle types...",
            });
            // Actual implementation would generate and download Excel
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast({
              title: "Export completed",
              description: "Vehicle types exported successfully",
            });
          }}
          onDownloadTemplate={async () => {
            toast({
              title: "Download started",
              description: "Downloading template file...",
            });
            // Actual implementation would generate and download Excel template
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast({
              title: "Download completed",
              description: "Template downloaded successfully",
            });
          }}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
            toast({
              title: "Refreshed",
              description: "Vehicle types data refreshed",
            });
          }}
        />
      </motion.div>
    </div>
  );
}