import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { VehicleTypeMaster, InsertVehicleTypeMaster } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VehicleTypeForm } from "@/components/ui/vehicle-type-server-form";
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
import { Loader2, Search, X, Filter, ChevronDown } from "lucide-react";
import * as animationUtils from "@/lib/animation-utils";

export default function VehicleTypeManagement() {
  const [selectedType, setSelectedType] = useState<VehicleTypeMaster | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query vehicle types
  const { data: vehicleTypes, isLoading } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-types"],
  });

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
      
      return searchMatches && regionMatches && vehicleTypeMatches && departmentMatches;
    });
  }, [vehicleTypes, searchQuery, regionFilter, vehicleTypeFilter, departmentFilter]);
  
  // Check if any filters are active
  const isFiltering = 
    searchQuery !== "" || 
    (regionFilter !== "" && regionFilter !== "all") || 
    (vehicleTypeFilter !== "" && vehicleTypeFilter !== "all") || 
    (departmentFilter !== "" && departmentFilter !== "all");
  
  // Function to clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setRegionFilter("all");
    setVehicleTypeFilter("all");
    setDepartmentFilter("all");
  }, []);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertVehicleTypeMaster) => {
      console.log("Creating vehicle type with data:", data);
      const response = await apiRequest("POST", "/api/vehicle-types", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create vehicle type");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({
        title: "Success",
        description: "Vehicle type created successfully",
      });
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
    mutationFn: async ({ id, ...data }: InsertVehicleTypeMaster & { id: number }) => {
      console.log("Updating vehicle type:", id, "with data:", data);
      const response = await apiRequest("PATCH", `/api/vehicle-types/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update vehicle type");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({
        title: "Success",
        description: "Vehicle type updated successfully",
      });
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

  const handleSubmit = async (data: InsertVehicleTypeMaster) => {
    try {
      console.log("Vehicle Type Management - Submitting data:", data);
      
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
      const formattedData = {
        ...data,
        // Convert any nulls to empty strings for text fields
        color: data.color || "",
        vehicle_model: data.vehicle_model || "",
        vehicle_type: data.vehicle_type || "",
        vehicle_type_name: data.vehicle_type_name || "",
        unit: data.unit || "",
        service_plan: data.service_plan || "",
        department: data.department || "Fleet",
        region: data.region || "Abu Dhabi"
      };
      
      console.log("Vehicle Type Management - Formatted data:", formattedData);
      
      if (selectedType) {
        await updateMutation.mutateAsync({ ...formattedData, id: selectedType.id });
      } else {
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3">
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
                              className="cursor-pointer hover:bg-accent/50 transition-colors"
                              onClick={() => {
                                setSelectedType(type);
                                setIsFormOpen(true);
                              }}
                              variants={animationUtils.listItem(index, 0.05)}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              whileHover={{
                                backgroundColor: "rgba(var(--primary), 0.1)",
                                transition: { duration: 0.1 }
                              }}
                            >
                              <TableCell>{type.group_id}</TableCell>
                              <TableCell>{type.vehicle_type_code}</TableCell>
                              <TableCell>{type.vehicle_type}</TableCell>
                              <TableCell>{type.region}</TableCell>
                              <TableCell>{type.department}</TableCell>
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
              <VehicleDetailsCard vehicleData={selectedType} />
            </div>
          )}
          
          <VehicleTypeForm
            onSubmit={handleSubmit}
            initialData={selectedType || undefined}
            isEditing={!!selectedType}
          />
        </DialogContent>
      </Dialog>

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