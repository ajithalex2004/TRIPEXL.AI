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
    defaultValues: initialData || {
      group_id: 0,
      vehicle_type_code: "",
      vehicle_type_name: "",
      vehicle_type: "",
      manufacturer: "",
      model_year: new Date().getFullYear(),
      number_of_passengers: 0,
      region: "ABU_DHABI",
      fuel_efficiency: 0,
      fuel_price_per_litre: 0,
      fuel_type: "",
      service_plan: "",
      cost_per_km: 0,
      department: "FLEET",
      unit: "",
      alert_before: 0,
      idle_fuel_consumption: 0,
      vehicle_capacity: 0,
      co2_emission_factor: 0
    }
  });

  // Load master data
  const { data: masterData, isLoading: isLoadingMasterData } = useQuery({
    queryKey: ["/api/vehicle-masters"],
    onSuccess: (data) => {
      console.log("MASTER DATA LOADED:", data);
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

  // Handle manufacturer change
  const handleManufacturerChange = (value: string) => {
    console.log("Manufacturer changed to:", value);
    setSelectedManufacturer(value);
    form.setValue("manufacturer", value);
    form.setValue("vehicle_type", ""); // Reset model when manufacturer changes
    setSelectedModel(null);
  };

  // Handle model change
  const handleModelChange = (value: string) => {
    console.log("Model changed to:", value);
    setSelectedModel(value);
    form.setValue("vehicle_type", value);
    
    // Find model data and update related fields
    if (masterData?.vehicleModels && selectedManufacturer) {
      const modelData = masterData.vehicleModels[selectedManufacturer]?.models.find(
        (model: any) => model.name === value
      );
      
      if (modelData) {
        console.log("Model data found:", modelData);
        
        // Create a timeout to ensure DOM update has processed
        setTimeout(() => {
          try {
            console.log("Setting model-specific values");
            
            // Get current form state
            const currentFormState = form.getValues();
            console.log("Current form state before update:", currentFormState);
            
            // Directly update efficiency value
            const efficiency = Number(modelData.efficiency);
            form.setValue("fuel_efficiency", efficiency);
            
            // Update all other model-specific fields
            form.setValue("vehicle_capacity", Number(modelData.capacity));
            form.setValue("idle_fuel_consumption", Number(modelData.idleConsumption));
            form.setValue("number_of_passengers", Number(modelData.passengerCapacity));
            
            // Get fuel price and calculate cost per km
            const fuelPrice = form.getValues("fuel_price_per_litre");
            if (fuelPrice && efficiency > 0) {
              const costPerKm = Number((fuelPrice / efficiency).toFixed(2));
              console.log("Setting cost per km to:", costPerKm, "based on price:", fuelPrice, "and efficiency:", efficiency);
              form.setValue("cost_per_km", costPerKm);
            }
            
            // Log the updated form state
            console.log("Form state after update:", form.getValues());
          } catch (error) {
            console.error("Error updating form values:", error);
          }
        }, 50);
      }
    }
  };

  // Handle fuel type change
  const handleFuelTypeChange = (value: string) => {
    console.log("Fuel type changed to:", value);
    setSelectedFuelType(value);
    form.setValue("fuel_type", value);
    
    // Find fuel type data and update price and co2 factor
    if (fuelTypes) {
      const fuelData = fuelTypes.find((ft: any) => ft.type === value);
      if (fuelData) {
        console.log("Fuel data found:", fuelData);
        
        // Create a timeout to ensure DOM update has processed
        setTimeout(() => {
          try {
            console.log("Setting fuel type-specific values");
            
            // Get current form state
            const currentFormState = form.getValues();
            console.log("Current form state before fuel update:", currentFormState);
            
            // Parse values as numbers
            const price = parseFloat(fuelData.price);
            const co2Factor = parseFloat(fuelData.co2_factor);
            
            // Update form values
            form.setValue("fuel_price_per_litre", price);
            form.setValue("co2_emission_factor", co2Factor);
            
            // Calculate cost per km based on current efficiency
            const efficiency = form.getValues("fuel_efficiency");
            if (price && efficiency && efficiency > 0) {
              const costPerKm = Number((price / efficiency).toFixed(2));
              console.log("Setting cost per km to:", costPerKm, "based on price:", price, "and efficiency:", efficiency);
              form.setValue("cost_per_km", costPerKm);
            }
            
            // Log updated form state
            console.log("Form state after fuel update:", form.getValues());
          } catch (error) {
            console.error("Error updating fuel values:", error);
          }
        }, 50);
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
                        <FormLabel>Vehicle Group *</FormLabel>
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
                    <FormLabel>Manufacturer *</FormLabel>
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
                    <FormLabel>Vehicle Model *</FormLabel>
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
                        <FormLabel>Model Year *</FormLabel>
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
                        <FormLabel>Vehicle Type Name *</FormLabel>
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
                    <FormLabel>Fuel Type *</FormLabel>
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
                        <FormLabel>Fuel Price Per Litre (AED) *</FormLabel>
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
                        <FormLabel>Fuel Efficiency (km/l) *</FormLabel>
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
                        <FormLabel>Idle Fuel Consumption (l/h) *</FormLabel>
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
                        <FormLabel>Number of Passengers *</FormLabel>
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
                        <FormLabel>Department *</FormLabel>
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