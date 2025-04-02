import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertVehicleTypeMasterSchema, type InsertVehicleTypeMaster, type VehicleTypeMaster } from "@shared/schema";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface VehicleTypeFormProps {
  onSubmit: (data: InsertVehicleTypeMaster) => Promise<void>;
  initialData?: VehicleTypeMaster;
  isEditing?: boolean;
}

export function VehicleTypeForm({ onSubmit, initialData, isEditing = false }: VehicleTypeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(initialData?.manufacturer || null);
  const [selectedModel, setSelectedModel] = useState<string | null>(initialData?.vehicle_type || null);
  const [selectedFuelType, setSelectedFuelType] = useState<string | null>(initialData?.fuel_type || null);

  // Initialize form
  const form = useForm<InsertVehicleTypeMaster>({
    resolver: zodResolver(insertVehicleTypeMasterSchema),
    defaultValues: {
      group_id: initialData?.group_id || 0,
      vehicle_type_code: initialData?.vehicle_type_code || "",
      vehicle_type_name: initialData?.vehicle_type_name || "",
      vehicle_type: initialData?.vehicle_type || "",
      manufacturer: initialData?.manufacturer || "",
      model_year: initialData?.model_year || new Date().getFullYear(),
      number_of_passengers: initialData?.number_of_passengers || 0,
      region: initialData?.region || "ABU_DHABI",
      fuel_efficiency: initialData?.fuel_efficiency ? Number(initialData.fuel_efficiency) : 0,
      fuel_price_per_litre: initialData?.fuel_price_per_litre ? Number(initialData.fuel_price_per_litre) : 3.75,
      fuel_type: initialData?.fuel_type || "SPECIAL_95",
      service_plan: initialData?.service_plan || "",
      cost_per_km: initialData?.cost_per_km ? Number(initialData.cost_per_km) : 0,
      department: initialData?.department || "FLEET",
      unit: initialData?.unit || "",
      alert_before: initialData?.alert_before || 0,
      idle_fuel_consumption: initialData?.idle_fuel_consumption ? Number(initialData.idle_fuel_consumption) : 0,
      vehicle_capacity: initialData?.vehicle_capacity || 0,
      co2_emission_factor: initialData?.co2_emission_factor ? Number(initialData.co2_emission_factor) : 0
    }
  });

  // Load master data with debugMasterData setting
  const { data: masterData, isLoading: isLoadingMasterData } = useQuery({
    queryKey: ["/api/vehicle-masters"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
    onSuccess: (data) => {
      console.log("MASTER DATA LOADED:", JSON.stringify(data, null, 2));
      
      // Debug specific properties
      if (data) {
        console.log("Master data received with properties:", Object.keys(data));
        console.log("Groups:", Array.isArray(data.groups) ? data.groups.length : 'Not an array');
        console.log("Manufacturers:", Array.isArray(data.manufacturers) ? data.manufacturers.length : 'Not an array');
        console.log("VehicleModels:", data.vehicleModels ? Object.keys(data.vehicleModels).length : 'Not an object');
        console.log("Regions:", Array.isArray(data.regions) ? data.regions.length : 'Not an array');
        console.log("Departments:", Array.isArray(data.departments) ? data.departments.length : 'Not an array');
        console.log("FuelTypes:", Array.isArray(data.fuelTypes) ? data.fuelTypes.length : 'Not an array');
      } else {
        console.warn("Master data is null or undefined");
      }
    },
    onError: (error) => {
      console.error("Error loading master data:", error);
    }
  });

  // Vehicle groups
  const { data: vehicleGroups, isLoading: isLoadingVehicleGroups } = useQuery({
    queryKey: ["/api/vehicle-groups"],
    onSuccess: (data) => {
      console.log("VEHICLE GROUPS LOADED:", data);
    },
    onError: (error) => {
      console.error("Error loading vehicle groups:", error);
    }
  });

  // Fetch fuel types
  const { data: fuelTypes, isLoading: isLoadingFuelTypes } = useQuery({
    queryKey: ["/api/fuel-types"],
    onSuccess: (data) => {
      console.log("FUEL TYPES LOADED:", data);
    },
    onError: (error) => {
      console.error("Error loading fuel types:", error);
    }
  });

  // Set vehicle type code when model, manufacturer and year are set
  useEffect(() => {
    const manufacturer = form.watch("manufacturer");
    const model = form.watch("vehicle_type");
    const year = form.watch("model_year");
    
    if (manufacturer && model && year) {
      const timestamp = new Date().getTime().toString().substring(9, 13);
      const code = `${manufacturer.substring(0,3)}-${model.substring(0,3)}-${year}-${timestamp}`.toUpperCase();
      form.setValue("vehicle_type_code", code);
    }
  }, [form.watch("manufacturer"), form.watch("vehicle_type"), form.watch("model_year"), form]);
  
  // Initialize form with data for editing mode
  useEffect(() => {
    if (isEditing && initialData) {
      console.log("Initializing edit mode with data:", initialData);
      
      // Set state variables for select fields
      if (initialData.manufacturer) {
        setSelectedManufacturer(initialData.manufacturer);
      }
      
      if (initialData.vehicle_type) {
        setSelectedModel(initialData.vehicle_type);
      }
      
      if (initialData.fuel_type) {
        setSelectedFuelType(initialData.fuel_type);
      }
    }
  }, [isEditing, initialData]);

  // Handle manufacturer change with improved error handling
  const handleManufacturerChange = (value: string) => {
    console.log("Manufacturer changed to:", value);
    
    if (!value) {
      console.warn("Invalid manufacturer value received");
      return;
    }
    
    // Update state and form values
    setSelectedManufacturer(value);
    form.setValue("manufacturer", value);
    
    // Reset model-related fields
    form.setValue("vehicle_type", ""); 
    setSelectedModel(null);
    
    console.log("Reset model selection after manufacturer change");
    
    // Find exact match or case-insensitive match in manufacturer list
    if (masterData?.manufacturers) {
      // First try exact match
      let matchingManufacturer = masterData.manufacturers.find(
        (m: string) => m === value
      );
      
      // If no exact match, try case-insensitive match
      if (!matchingManufacturer) {
        matchingManufacturer = masterData.manufacturers.find(
          (m: string) => m.toLowerCase() === value.toLowerCase()
        );
        
        // If found a case-insensitive match, update to correct case
        if (matchingManufacturer) {
          setSelectedManufacturer(matchingManufacturer);
          form.setValue("manufacturer", matchingManufacturer);
          console.log(`Updated manufacturer to proper case: "${matchingManufacturer}"`);
        }
      }
      
      if (!matchingManufacturer) {
        console.warn(`Manufacturer "${value}" not found in available list:`, masterData.manufacturers);
      } else {
        console.log(`Manufacturer "${matchingManufacturer}" verified in the available list`);
      }
    }
  };

  // Handle model change with improved error handling
  const handleModelChange = (value: string) => {
    console.log("Model changed to:", value);
    setSelectedModel(value);
    form.setValue("vehicle_type", value);
    
    if (!masterData) {
      console.warn("No master data available");
      return;
    }
    
    if (!selectedManufacturer) {
      console.warn("No manufacturer selected");
      return;
    }
    
    console.log("Checking for model data in masterData for:", selectedManufacturer);
    
    // First verify we have vehicle models data
    if (!masterData.vehicleModels) {
      console.warn("No vehicleModels data in masterData");
      return;
    }
    
    // Find exact manufacturer match, try case sensitivity fixes if needed
    const manufacturerKey = Object.keys(masterData.vehicleModels).find(
      (m) => m.toLowerCase() === selectedManufacturer.toLowerCase()
    );
    
    if (!manufacturerKey) {
      console.warn(`No manufacturer ${selectedManufacturer} found in vehicleModels:`, 
        Object.keys(masterData.vehicleModels).join(", ")
      );
      return;
    }
    
    // If the case is different, update the form and state
    if (manufacturerKey !== selectedManufacturer) {
      console.log(`Updating manufacturer from "${selectedManufacturer}" to "${manufacturerKey}" to match case`);
      setSelectedManufacturer(manufacturerKey);
      form.setValue("manufacturer", manufacturerKey);
    }
    
    // Safely get the models array
    const manufacturerData = masterData.vehicleModels[manufacturerKey];
    if (!manufacturerData || !manufacturerData.models || !Array.isArray(manufacturerData.models)) {
      console.warn(`Models data not found or invalid for ${manufacturerKey}`);
      return;
    }
    
    // Find the specific model - first try exact case match
    let modelData = manufacturerData.models.find((model: any) => 
      model && typeof model === 'object' && model.name === value
    );
    
    // If not found, try case-insensitive match
    if (!modelData) {
      modelData = manufacturerData.models.find((model: any) => 
        model && typeof model === 'object' && model.name.toLowerCase() === value.toLowerCase()
      );
      
      // If found with different case, update form value to correct case
      if (modelData) {
        console.log(`Updating model from "${value}" to "${modelData.name}" to match case`);
        setSelectedModel(modelData.name);
        form.setValue("vehicle_type", modelData.name);
      }
    }
    
    // If model data found, update form values
    if (modelData) {
      console.log("Model data found:", modelData);
      
      try {
        // Safely get numeric values with fallbacks
        const efficiency = typeof modelData.efficiency === 'number' 
          ? modelData.efficiency 
          : typeof modelData.efficiency === 'string' 
            ? parseFloat(modelData.efficiency) 
            : 0;
            
        const capacity = typeof modelData.capacity === 'number' 
          ? modelData.capacity 
          : typeof modelData.capacity === 'string' 
            ? parseFloat(modelData.capacity) 
            : 0;
            
        const idleConsumption = typeof modelData.idleConsumption === 'number' 
          ? modelData.idleConsumption 
          : typeof modelData.idleConsumption === 'string' 
            ? parseFloat(modelData.idleConsumption) 
            : 0;
            
        const passengerCapacity = typeof modelData.passengerCapacity === 'number' 
          ? modelData.passengerCapacity 
          : typeof modelData.passengerCapacity === 'string' 
            ? parseFloat(modelData.passengerCapacity) 
            : 0;
        
        console.log("Parsed model values:", {
          efficiency,
          capacity,
          idleConsumption,
          passengerCapacity
        });
        
        // Update form fields with the extracted values
        form.setValue("fuel_efficiency", efficiency);
        form.setValue("vehicle_capacity", capacity);
        form.setValue("idle_fuel_consumption", idleConsumption);
        form.setValue("number_of_passengers", passengerCapacity);
        
        // Get fuel price and calculate cost per km
        const fuelPrice = form.getValues("fuel_price_per_litre");
        if (fuelPrice && efficiency > 0) {
          const costPerKm = Number((fuelPrice / efficiency).toFixed(2));
          console.log("Setting cost per km to:", costPerKm);
          form.setValue("cost_per_km", costPerKm);
        }
        
        // Set a reasonable vehicle type name if not already set
        if (!form.getValues("vehicle_type_name")) {
          const typeName = `${manufacturerKey} ${modelData.name}`;
          form.setValue("vehicle_type_name", typeName);
          console.log("Set vehicle type name to:", typeName);
        }
        
      } catch (error) {
        console.error("Error updating form values:", error);
      }
    } else {
      console.warn(`Could not find model data for "${value}" in ${manufacturerKey} models`);
    }
  };

  // Handle fuel type change
  const handleFuelTypeChange = (value: string) => {
    console.log("Fuel type changed to:", value);
    setSelectedFuelType(value);
    form.setValue("fuel_type", value);
    
    // Find fuel type data and update price and co2 factor
    if (!fuelTypes || !Array.isArray(fuelTypes) || fuelTypes.length === 0) {
      console.warn("No fuel types data available or not in the expected format:", fuelTypes);
      return;
    }
    
    console.log("Looking for fuel type in available fuel types:", 
      fuelTypes.map((ft: any) => ft.type || "unknown").join(", ")
    );
    
    // Case-insensitive search to handle any capitalization issues
    let fuelData = fuelTypes.find((ft: any) => 
      ft.type && typeof ft.type === 'string' && 
      ft.type.toLowerCase() === value.toLowerCase()
    );

    // If exact match not found, try to find closest match
    if (!fuelData && value) {
      console.log("No exact match found, trying closest match");
      
      // Try partial match (e.g., "Petrol" might match "PETROL 95")
      fuelData = fuelTypes.find((ft: any) => 
        ft.type && typeof ft.type === 'string' && 
        (ft.type.toLowerCase().includes(value.toLowerCase()) ||
         value.toLowerCase().includes(ft.type.toLowerCase()))
      );
      
      if (fuelData) {
        console.log(`Found closest match: "${fuelData.type}" for input "${value}"`);
        
        // Update the fuel type value to match the database value
        setSelectedFuelType(fuelData.type);
        form.setValue("fuel_type", fuelData.type);
      }
    }
    
    if (fuelData) {
      console.log("Fuel data found:", fuelData);
      
      try {
        // Parse values as numbers - ensure we handle string values properly
        const price = typeof fuelData.price === 'string' 
          ? parseFloat(fuelData.price) 
          : typeof fuelData.price === 'number'
            ? fuelData.price
            : 0;
            
        // Try various property names for CO2 factor
        let co2Factor = null;
        if (fuelData.co2_factor !== undefined) {
          co2Factor = typeof fuelData.co2_factor === 'string'
            ? parseFloat(fuelData.co2_factor)
            : fuelData.co2_factor;
        } else if (fuelData.co2Factor !== undefined) {
          co2Factor = typeof fuelData.co2Factor === 'string'
            ? parseFloat(fuelData.co2Factor)
            : fuelData.co2Factor;
        } else {
          // Default CO2 factor if not found
          co2Factor = 2.0;
          console.warn("CO2 factor not found in fuel data, using default value:", co2Factor);
        }
        
        console.log("Extracted values - Price:", price, "CO2 Factor:", co2Factor);
        
        // Update form values
        form.setValue("fuel_price_per_litre", price);
        form.setValue("co2_emission_factor", co2Factor);
        
        // Calculate cost per km based on current efficiency
        const efficiency = form.getValues("fuel_efficiency");
        if (price && efficiency && efficiency > 0) {
          const costPerKm = Number((price / efficiency).toFixed(2));
          console.log("Setting cost per km to:", costPerKm);
          form.setValue("cost_per_km", costPerKm);
        }
        
        // Log updated form state
        console.log("Form state after fuel update:", form.getValues());
      } catch (error) {
        console.error("Error updating fuel values:", error);
      }
    } else {
      console.warn(`Could not find fuel data for type: ${value}`);
      // Show available fuel types for debugging
      if (fuelTypes.length > 0) {
        console.log("Available fuel types:", 
          fuelTypes.map((ft: any) => ft.type || "unknown").join(", ")
        );
      }
    }
  };

  // Update cost per km
  const updateCostPerKm = (efficiency?: number) => {
    const fuelPrice = form.getValues("fuel_price_per_litre");
    const fuelEfficiency = efficiency || form.getValues("fuel_efficiency");
    
    if (fuelPrice && fuelEfficiency && fuelEfficiency > 0) {
      const costPerKm = Number((fuelPrice / fuelEfficiency).toFixed(2));
      console.log("Calculated cost per km:", costPerKm);
      form.setValue("cost_per_km", costPerKm);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: InsertVehicleTypeMaster) => {
    try {
      setIsSubmitting(true);
      
      // Format numeric values
      const formattedData = {
        ...data,
        group_id: Number(data.group_id),
        model_year: Number(data.model_year),
        number_of_passengers: Number(data.number_of_passengers),
        vehicle_capacity: Number(data.vehicle_capacity),
        fuel_efficiency: Number(data.fuel_efficiency),
        fuel_price_per_litre: Number(data.fuel_price_per_litre),
        idle_fuel_consumption: Number(data.idle_fuel_consumption),
        co2_emission_factor: Number(data.co2_emission_factor),
        cost_per_km: Number(data.cost_per_km),
        alert_before: Number(data.alert_before || 0)
      };
      
      await onSubmit(formattedData);
      
      toast({
        title: "Success",
        description: isEditing ? "Vehicle type updated successfully" : "Vehicle type created successfully",
      });
      
      if (!isEditing) {
        form.reset();
        setSelectedManufacturer(null);
        setSelectedModel(null);
        setSelectedFuelType(null);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save vehicle type",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingMasterData || isLoadingVehicleGroups || isLoadingFuelTypes) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading form data...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6">
          <table className="w-full border-collapse">
            <tbody>
              {/* Row 1: Vehicle Group | Manufacturer */}
              <tr>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="group_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Group</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vehicleGroups?.map((group: any) => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
                <td className="border p-2">
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <Select
                      onValueChange={handleManufacturerChange}
                      value={selectedManufacturer || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manufacturer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {masterData?.manufacturers?.map((manufacturer: string) => (
                          <SelectItem key={manufacturer} value={manufacturer}>
                            {manufacturer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.manufacturer?.message}
                    </FormMessage>
                  </FormItem>
                </td>
              </tr>

              {/* Row 2: Vehicle Model | Model Year */}
              <tr>
                <td className="border p-2">
                  <FormItem>
                    <FormLabel>Vehicle Model</FormLabel>
                    <Select
                      onValueChange={handleModelChange}
                      value={selectedModel || ""}
                      disabled={!selectedManufacturer}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedManufacturer ? "Select model" : "Select manufacturer first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedManufacturer && masterData?.vehicleModels &&
                          masterData.vehicleModels[selectedManufacturer]?.models?.map((model: any) => (
                            <SelectItem key={model.name} value={model.name}>
                              {model.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.vehicle_type?.message}
                    </FormMessage>
                  </FormItem>
                </td>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="model_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model Year</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={2000}
                            max={new Date().getFullYear() + 1}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Enter model year"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 3: Vehicle Category | Vehicle Type Name */}
              <tr>
                <td className="border p-2">
                  <FormItem>
                    <FormLabel>Vehicle Category</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        disabled
                        placeholder="Auto-populated from group" 
                      />
                    </FormControl>
                  </FormItem>
                </td>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="vehicle_type_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter vehicle type name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 4: Fuel Type | Fuel Price Per Litre */}
              <tr>
                <td className="border p-2">
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select
                      onValueChange={handleFuelTypeChange}
                      value={selectedFuelType || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fuelTypes?.map((type: any) => (
                          <SelectItem key={type.id} value={type.type}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{type.type}</span>
                              <span className="text-xs text-muted-foreground">
                                {parseFloat(type.price).toFixed(2)} AED/L
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.fuel_type?.message}
                    </FormMessage>
                  </FormItem>
                </td>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="fuel_price_per_litre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Price Per Litre (AED)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value));
                              updateCostPerKm();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 5: Fuel Efficiency | Cost Per KM */}
              <tr>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="fuel_efficiency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Efficiency (km/l)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value));
                              updateCostPerKm(parseFloat(e.target.value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="cost_per_km"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Per KM</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            value={field.value}
                            readOnly
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 6: Idle Fuel Consumption | CO2 Emission Factor */}
              <tr>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="idle_fuel_consumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idle Fuel Consumption (l/h)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            value={field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="co2_emission_factor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CO2 Emission Factor</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            value={field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 7: Number of Passengers | Vehicle Capacity */}
              <tr>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="number_of_passengers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Passengers</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Enter passenger capacity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="vehicle_capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Capacity</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="number" 
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Enter vehicle capacity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 8: Service Plan | Alert Before Value (KM) */}
              <tr>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="service_plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Plan</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter service plan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="alert_before"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alert Before Value (KM)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Enter alert before value"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 9: Department | Region */}
              <tr>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masterData?.departments?.map((dept: string) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masterData?.regions?.map((region: string) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 10: Unit | Vehicle Type Code (Auto-Generated) */}
              <tr>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter unit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="vehicle_type_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type Code</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly className="bg-muted" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Form submission buttons */}
        <div className="flex justify-end space-x-2 px-6 py-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setSelectedManufacturer(null);
              setSelectedModel(null);
              setSelectedFuelType(null);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{isEditing ? "Updating..." : "Creating..."}</span>
              </>
            ) : (
              <span>{isEditing ? "Update" : "Create"} Vehicle Type</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}