import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  insertVehicleTypeMasterSchema,
  InsertVehicleTypeMaster,
  VehicleTypeMaster,
} from "@shared/schema";

interface VehicleTypeFormProps {
  onSubmit: (data: InsertVehicleTypeMaster) => Promise<void>;
  initialData?: VehicleTypeMaster;
  isEditing?: boolean;
}

export function VehicleTypeForm({
  onSubmit,
  initialData,
  isEditing = false,
}: VehicleTypeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(
    initialData?.manufacturer || null
  );
  const [selectedModel, setSelectedModel] = useState<string | null>(
    initialData?.vehicle_model || null
  );
  const [selectedFuelType, setSelectedFuelType] = useState<string | null>(
    initialData?.fuel_type || null
  );

  // Enhanced schema with validation
  const formSchema = insertVehicleTypeMasterSchema.extend({
    vehicle_capacity: z.coerce.number().min(0, "Capacity must be a positive number"),
    number_of_passengers: z.coerce.number().min(0, "Number of passengers must be a positive number"),
    fuel_efficiency: z.coerce.number().min(0, "Fuel efficiency must be a positive number"),
    idle_fuel_consumption: z.coerce.number().min(0, "Idle fuel consumption must be a positive number"),
    co2_emission_factor: z.coerce.number().min(0, "CO2 emission factor must be a positive number"),
    fuel_price_per_litre: z.coerce.number().min(0, "Fuel price must be a positive number"),
    cost_per_km: z.coerce.number().min(0, "Cost per km must be a positive number"),
    model_year: z.coerce
      .number()
      .min(2000, "Year must be 2000 or later")
      .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  });

  // Helper to clean initial values
  const cleanInitialData = (data?: VehicleTypeMaster) => {
    if (!data) {
      return {
        group_id: 0,
        vehicle_type_name: "",
        manufacturer: "",
        vehicle_model: "",
        model_year: new Date().getFullYear(),
        color: "",
        number_of_passengers: 0,
        vehicle_capacity: 0,
        fuel_type: "",
        fuel_efficiency: 0,
        fuel_price_per_litre: 0,
        idle_fuel_consumption: 0,
        co2_emission_factor: 0,
        cost_per_km: 0,
        service_plan: "",
        region: "Abu Dhabi",
        department: "Fleet",
        unit: "",
        alert_before: 0,
        vehicle_type_code: "",
        vehicle_type: "",
      };
    }

    // Ensure all properties are correctly typed and no nulls
    return {
      group_id: Number(data.group_id || 0),
      vehicle_type_name: String(data.vehicle_type_name || ""),
      manufacturer: String(data.manufacturer || ""),
      vehicle_model: String(data.vehicle_model || ""),
      model_year: Number(data.model_year || new Date().getFullYear()),
      color: String(data.color || ""),
      number_of_passengers: Number(data.number_of_passengers || 0),
      vehicle_capacity: Number(data.vehicle_capacity || 0),
      fuel_type: String(data.fuel_type || ""),
      fuel_efficiency: Number(String(data.fuel_efficiency) || 0),
      fuel_price_per_litre: Number(String(data.fuel_price_per_litre) || 0),
      idle_fuel_consumption: Number(String(data.idle_fuel_consumption) || 0),
      co2_emission_factor: Number(String(data.co2_emission_factor) || 0),
      cost_per_km: Number(String(data.cost_per_km) || 0),
      service_plan: String(data.service_plan || ""),
      region: String(data.region || "Abu Dhabi"),
      department: String(data.department || "Fleet"),
      unit: String(data.unit || ""),
      alert_before: Number(data.alert_before || 0),
      vehicle_type_code: String(data.vehicle_type_code || ""),
      vehicle_type: String(data.vehicle_type || ""),
    };
  };

  // Form with default values
  const form = useForm<InsertVehicleTypeMaster>({
    resolver: zodResolver(formSchema),
    defaultValues: cleanInitialData(initialData),
  });

  // Fetch master data (manufacturers, models, etc.)
  const { data: masterData, isLoading: isLoadingMasterData } = useQuery({
    queryKey: ["/api/masters"]
  });

  // Fetch vehicle groups
  const { data: vehicleGroups, isLoading: isLoadingVehicleGroups } = useQuery({
    queryKey: ["/api/vehicle-groups"]
  });

  // Fetch fuel types
  const { data: fuelTypes, isLoading: isLoadingFuelTypes } = useQuery({
    queryKey: ["/api/fuel-types"]
  });

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData && isEditing) {
      console.log("Setting initial form data:", initialData);
      
      const cleanedData = cleanInitialData(initialData);
      form.reset(cleanedData);
      
      setSelectedManufacturer(cleanedData.manufacturer);
      setSelectedModel(cleanedData.vehicle_model);
      setSelectedFuelType(cleanedData.fuel_type);
    }
  }, [initialData, isEditing, form]);

  // Handle manufacturer change
  const handleManufacturerChange = (value: string) => {
    setSelectedManufacturer(value);
    form.setValue("manufacturer", value);
    
    // Reset model when manufacturer changes
    setSelectedModel(null);
    form.setValue("vehicle_model", "");
  };

  // Handle model change
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    form.setValue("vehicle_model", value);
    form.setValue("vehicle_type", value); // Also set vehicle_type for compatibility
    
    // Generate a unique code including a timestamp for uniqueness
    if (selectedManufacturer && value) {
      const timestamp = new Date().getTime().toString().substring(9, 13); // Last 4 digits of timestamp
      const typeCode = `${selectedManufacturer.substring(0,3)}-${value.substring(0,3)}-${form.getValues("model_year")}-${timestamp}`.toUpperCase();
      form.setValue("vehicle_type_code", typeCode);
      form.setValue("vehicle_type_name", `${selectedManufacturer} ${value}`);
    }
    
    // Find model data to auto-populate fields
    if (selectedManufacturer && masterData?.vehicleModels && masterData.vehicleModels[selectedManufacturer]) {
      const models = masterData.vehicleModels[selectedManufacturer].models || [];
      const modelData = models.find((m: any) => m.name === value);
      
      if (modelData) {
        // Update form with model data
        if (modelData.efficiency) {
          const efficiency = parseFloat(modelData.efficiency);
          form.setValue("fuel_efficiency", efficiency);
        }
        
        if (modelData.capacity) {
          const capacity = parseFloat(modelData.capacity);
          form.setValue("vehicle_capacity", capacity);
        }
        
        if (modelData.idleConsumption) {
          const idleConsumption = parseFloat(modelData.idleConsumption);
          form.setValue("idle_fuel_consumption", idleConsumption);
        }
        
        if (modelData.passengerCapacity) {
          const passengers = parseInt(modelData.passengerCapacity);
          form.setValue("number_of_passengers", passengers);
        }
        
        // Recalculate cost per km
        updateCostPerKm();
      }
    }
  };

  // Handle fuel type change
  const handleFuelTypeChange = (value: string) => {
    if (!value) return;

    setSelectedFuelType(value);
    form.setValue("fuel_type", value);
    
    if (!fuelTypes || !Array.isArray(fuelTypes)) return;
    
    // Find the matching fuel type
    let fuelData = fuelTypes.find((ft: any) => 
      ft?.type && ft.type.toLowerCase() === value.toLowerCase()
    );

    // If no exact match, try partial match
    if (!fuelData) {
      fuelData = fuelTypes.find((ft: any) => 
        ft?.type && 
        (ft.type.toLowerCase().includes(value.toLowerCase()) ||
         value.toLowerCase().includes(ft.type.toLowerCase()))
      );
      
      if (fuelData) {
        setSelectedFuelType(fuelData.type);
        form.setValue("fuel_type", fuelData.type);
      }
    }
    
    if (fuelData) {
      // Extract price
      let price = 0;
      if (fuelData.price !== undefined) {
        price = typeof fuelData.price === 'string' 
          ? parseFloat(fuelData.price) 
          : typeof fuelData.price === 'number'
            ? fuelData.price
            : 0;
      }
      
      // Extract CO2 factor (try both snake_case and camelCase properties)
      let co2Factor = 0;
      if (fuelData.co2_factor !== undefined) {
        co2Factor = typeof fuelData.co2_factor === 'string'
          ? parseFloat(fuelData.co2_factor)
          : fuelData.co2_factor;
      } else if (fuelData.co2Factor !== undefined) {
        co2Factor = typeof fuelData.co2Factor === 'string'
          ? parseFloat(fuelData.co2Factor)
          : fuelData.co2Factor;
      } else {
        // Default values by fuel type if not found
        const knownFactors: Record<string, number> = {
          'petrol': 2.31,
          'diesel': 2.68,
          'electric': 0.05,
          'hybrid': 1.52
        };
        
        const fuelTypeLower = value.toLowerCase();
        for (const [key, factor] of Object.entries(knownFactors)) {
          if (fuelTypeLower.includes(key) || key.includes(fuelTypeLower)) {
            co2Factor = factor;
            break;
          }
        }
      }
      
      // Update form with extracted values
      form.setValue("fuel_price_per_litre", price);
      form.setValue("co2_emission_factor", co2Factor);
      
      // Calculate cost per km
      updateCostPerKm();
    }
  };

  // Update cost per km based on efficiency and fuel price
  const updateCostPerKm = () => {
    const fuelPrice = form.getValues("fuel_price_per_litre");
    const efficiency = form.getValues("fuel_efficiency");
    
    if (fuelPrice && efficiency && efficiency > 0) {
      const costPerKm = Number((fuelPrice / efficiency).toFixed(2));
      form.setValue("cost_per_km", costPerKm);
    }
  };

  // Format display values
  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  // Form submission handler
  const handleSubmit = async (data: InsertVehicleTypeMaster) => {
    try {
      setIsSubmitting(true);
      
      // Ensure vehicle_model is set from vehicle_type if not present
      if (!data.vehicle_model && data.vehicle_type) {
        data.vehicle_model = data.vehicle_type;
      }
      
      // Ensure all required fields are present
      if (!data.vehicle_type_code) throw new Error("Vehicle type code is required");
      if (!data.vehicle_type_name) throw new Error("Vehicle type name is required");
      if (!data.manufacturer) throw new Error("Manufacturer is required");
      if (!data.vehicle_model) throw new Error("Vehicle model is required");
      if (!data.fuel_type) throw new Error("Fuel type is required");
      
      // Format data for submission
      const formattedData = {
        ...data,
        group_id: Number(data.group_id),
        model_year: Number(data.model_year),
        number_of_passengers: Number(data.number_of_passengers || 0),
        vehicle_capacity: Number(data.vehicle_capacity || 0),
        fuel_efficiency: Number(data.fuel_efficiency || 0),
        fuel_price_per_litre: Number(data.fuel_price_per_litre || 0),
        idle_fuel_consumption: Number(data.idle_fuel_consumption || 0),
        co2_emission_factor: Number(data.co2_emission_factor || 0),
        cost_per_km: Number(data.cost_per_km || 0),
        alert_before: Number(data.alert_before || 0),
        // Ensure null values are converted to empty strings for text fields
        color: data.color || "",
        vehicle_model: data.vehicle_model || "",
        vehicle_type: data.vehicle_type || data.vehicle_model || "",
        vehicle_type_name: data.vehicle_type_name || `${data.manufacturer} ${data.vehicle_model}`,
        unit: data.unit || "",
        region: data.region || "Abu Dhabi",
        department: data.department || "Fleet",
        service_plan: data.service_plan || ""
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
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save vehicle type",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
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
                          value={field.value?.toString() || "0"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vehicleGroups && vehicleGroups.map((group: any) => (
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
                        {masterData?.manufacturers && masterData.manufacturers.map((manufacturer: string) => (
                          <SelectItem key={manufacturer} value={manufacturer}>
                            {manufacturer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedManufacturer &&
                          masterData?.vehicleModels && 
                          masterData.vehicleModels[selectedManufacturer]?.models?.map(
                            (model: any) => (
                              <SelectItem key={model.name} value={model.name}>
                                {model.name}
                              </SelectItem>
                            )
                          )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                            type="number"
                            {...field}
                            value={formatValue(field.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 3: Vehicle Type | Vehicle Type Name */}
              <tr>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="vehicle_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masterData?.vehicleTypes && masterData.vehicleTypes.map((type: string) => (
                              <SelectItem key={type} value={type}>
                                {type}
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
                    name="vehicle_type_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={formatValue(field.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 4: Fuel Type | Fuel Price */}
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
                        {fuelTypes && fuelTypes.map((ft: any) => (
                          <SelectItem key={ft.id} value={ft.type}>
                            {ft.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                            type="number"
                            step="0.01"
                            {...field}
                            value={formatValue(field.value)}
                            readOnly
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
                            type="number"
                            step="0.01"
                            {...field}
                            value={formatValue(field.value)}
                            onChange={(e) => {
                              field.onChange(e);
                              updateCostPerKm();
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
                            type="number"
                            step="0.01"
                            {...field}
                            value={formatValue(field.value)}
                            readOnly
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
                        <FormLabel>Idle Fuel Consumption</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={formatValue(field.value)}
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
                            type="number"
                            step="0.01"
                            {...field}
                            value={formatValue(field.value)}
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 7: Passengers | Vehicle Capacity */}
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
                            type="number"
                            {...field}
                            value={formatValue(field.value)}
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
                            type="number"
                            {...field}
                            value={formatValue(field.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 8: Service Plan | Alert Before */}
              <tr>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="service_plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Plan</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masterData?.servicePlans && masterData.servicePlans.map((plan: string) => (
                              <SelectItem key={plan} value={plan}>
                                {plan}
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
                    name="alert_before"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alert Before Value (KM)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={formatValue(field.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 9: Region | Department */}
              <tr>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "Abu Dhabi"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                            <SelectItem value="Dubai">Dubai</SelectItem>
                            <SelectItem value="Sharjah">Sharjah</SelectItem>
                            <SelectItem value="Ajman">Ajman</SelectItem>
                            <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                            <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                            <SelectItem value="Fujairah">Fujairah</SelectItem>
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
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "Fleet"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Fleet">Fleet</SelectItem>
                            <SelectItem value="Operations">Operations</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="IT">IT</SelectItem>
                            <SelectItem value="Logistics">Logistics</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              </tr>

              {/* Row 10: Unit | Vehicle Type Code */}
              <tr>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masterData?.units && masterData.units.map((unit: string) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
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
                    name="vehicle_type_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={formatValue(field.value)}
                            readOnly={isEditing}
                          />
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

        <div className="flex justify-end px-6 pb-3">
          <Button 
            type="submit" 
            className="mr-2" 
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Update" : "Create"} Vehicle Type
          </Button>
        </div>
      </form>
    </Form>
  );
}