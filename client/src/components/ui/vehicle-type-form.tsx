import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { insertVehicleTypeMasterSchema, type InsertVehicleTypeMaster, type VehicleTypeMaster } from "@shared/schema";

import { Button } from "./button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Input } from "./input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "./dialog";
import { ProgressIndicator } from "./progress-indicator";

interface VehicleTypeFormProps {
  onSubmit: (data: InsertVehicleTypeMaster) => Promise<void>;
  initialData?: VehicleTypeMaster;
  isEditing?: boolean;
}

// FuelTypeData interface to ensure proper typing
interface FuelTypeData {
  id: number;
  type: string;
  price: string | number;
  co2_factor: string | number;
  efficiency: string | number;
  idle_consumption: string | number;
  updated_at: string;
  last_fetched_at: string;
  historical_prices: Array<{date: string, price: number}>;
}

export function VehicleTypeForm({ onSubmit, initialData, isEditing = false }: VehicleTypeFormProps) {
  const { toast } = useToast();
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>(initialData?.manufacturer || "");
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submissionError, setSubmissionError] = useState<string | undefined>();

  const submissionSteps = [
    { label: "Validating Data", description: "Validating form data" },
    { label: "Processing", description: "Processing vehicle information" },
    { label: "Saving", description: "Saving vehicle type" },
  ];

  // Master data for manufacturers, models, etc.
  const { data: masterData } = useQuery<any>({
    queryKey: ["/api/masters/vehicle-data"]
  });

  // Fetch vehicle groups for dropdown
  const { data: vehicleGroups, error: groupsError } = useQuery<any[]>({
    queryKey: ["/api/vehicle-groups"]
  });

  // Fetch fuel types directly from API
  const { data: fuelTypes } = useQuery<FuelTypeData[]>({
    queryKey: ["/api/fuel-types"]
  });

  // Initialize form with the correct types that match the zod schema
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
      region: initialData?.region || "ABU_DHABI", // Default region
      fuel_efficiency: initialData?.fuel_efficiency ? Number(initialData.fuel_efficiency) : 0,
      fuel_price_per_litre: initialData?.fuel_price_per_litre ? Number(initialData.fuel_price_per_litre) : 3.75, // Default fuel price
      fuel_type: initialData?.fuel_type || "SPECIAL_95", // Default fuel type
      service_plan: initialData?.service_plan || "",
      cost_per_km: initialData?.cost_per_km ? Number(initialData.cost_per_km) : 0, // Fix type conversion
      department: initialData?.department || "FLEET", // Default department
      unit: initialData?.unit || "",
      alert_before: initialData?.alert_before || 0,
      idle_fuel_consumption: initialData?.idle_fuel_consumption ? Number(initialData.idle_fuel_consumption) : 0,
      vehicle_capacity: initialData?.vehicle_capacity || 0,
      co2_emission_factor: initialData?.co2_emission_factor ? Number(initialData.co2_emission_factor) : 0
    }
  });

  // Watch form values
  const selectedFuelType = form.watch("fuel_type");
  const selectedModel = form.watch("vehicle_type");
  const modelYear = form.watch("model_year");

  // Auto-generate vehicle type code
  useEffect(() => {
    if (selectedManufacturer && selectedModel && modelYear) {
      // Generate a unique code including a timestamp for uniqueness
      const timestamp = new Date().getTime().toString().substring(9, 13); // Last 4 digits of timestamp
      const typeCode = `${selectedManufacturer.substring(0,3)}-${selectedModel.substring(0,3)}-${modelYear}-${timestamp}`.toUpperCase();
      form.setValue("vehicle_type_code", typeCode);
    }
  }, [selectedManufacturer, selectedModel, modelYear, form]);

  // Update vehicle specs when model changes
  useEffect(() => {
    if (masterData?.vehicleModels && selectedManufacturer && selectedModel) {
      const modelData = masterData.vehicleModels[selectedManufacturer]?.models.find(
        (m: any) => m.name === selectedModel
      );

      if (modelData) {
        form.setValue("fuel_efficiency", modelData.efficiency.toString());
        form.setValue("vehicle_capacity", modelData.capacity);
        form.setValue("idle_fuel_consumption", modelData.idleConsumption.toString());
        form.setValue("number_of_passengers", modelData.passengerCapacity);
      }
    }
  }, [selectedManufacturer, selectedModel, masterData, form]);

  // Calculate cost per km when fuel price or efficiency changes
  useEffect(() => {
    const fuelPrice = form.watch("fuel_price_per_litre");
    const fuelEfficiency = form.watch("fuel_efficiency");
    
    // Ensure values are numbers
    const priceValue = typeof fuelPrice === 'string' ? parseFloat(fuelPrice) : fuelPrice;
    const efficiencyValue = typeof fuelEfficiency === 'string' ? parseFloat(fuelEfficiency) : fuelEfficiency;
    
    if (priceValue && efficiencyValue && efficiencyValue > 0) {
      const costPerKm = Number((priceValue / efficiencyValue).toFixed(2));
      form.setValue("cost_per_km", costPerKm);
    }
  }, [form.watch("fuel_price_per_litre"), form.watch("fuel_efficiency"), form]);

  // Handle form submission
  const handleSubmit = async (data: InsertVehicleTypeMaster) => {
    try {
      setSubmissionStatus("submitting");
      setShowProgress(true);
      setSubmissionError(undefined);

      // Step 1: Validate form data
      setCurrentStep(0);

      // Step 2: Process vehicle information
      setCurrentStep(1);
      const formattedData = {
        ...data,
        group_id: Number(data.group_id),
        model_year: Number(data.model_year),
        number_of_passengers: Number(data.number_of_passengers),
        cost_per_km: Number(data.cost_per_km),
        alert_before: Number(data.alert_before),
        vehicle_capacity: Number(data.vehicle_capacity)
      };

      // Step 3: Save vehicle type
      setCurrentStep(2);
      await onSubmit(formattedData);

      setSubmissionStatus("success");
      toast({
        title: "Success",
        description: isEditing ? "Vehicle type updated successfully" : "Vehicle type created successfully",
      });

      if (!isEditing) {
        form.reset();
      }

      setTimeout(() => {
        setShowProgress(false);
        setCurrentStep(0);
        setSubmissionStatus("idle");
      }, 1500);

    } catch (error) {
      console.error("Form submission error:", error);
      setSubmissionStatus("error");
      setSubmissionError(error instanceof Error ? error.message : "Failed to save vehicle type");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save vehicle type",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Exactly matching the table layout from the image */}
            <div className="space-y-6">
              {/* Vehicle Group */}
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
                        {vehicleGroups?.map((group) => (
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

              {/* Vehicle Model */}
              <FormField
                control={form.control}
                name="vehicle_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Model *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedManufacturer}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedManufacturer ? "Select model" : "Select manufacturer first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedManufacturer && masterData?.vehicleModels &&
                          masterData.vehicleModels[selectedManufacturer].models.map((model: any) => (
                            <SelectItem key={model.name} value={model.name}>
                              {model.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fuel Type */}
              <FormField
                control={form.control}
                name="fuel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        // Set the form value
                        field.onChange(value);
                        console.log("Fuel type selected:", value);
                        
                        // Find selected fuel data and set related fields
                        if (fuelTypes && fuelTypes.length > 0) {
                          const selectedFuelData = fuelTypes.find(ft => 
                            ft.type.toLowerCase() === value.toLowerCase()
                          );
                          
                          if (selectedFuelData) {
                            console.log("Found fuel data:", selectedFuelData);
                            
                            // Convert values to proper types
                            const price = typeof selectedFuelData.price === 'string' 
                              ? parseFloat(selectedFuelData.price) 
                              : selectedFuelData.price;
                              
                            const co2Factor = typeof selectedFuelData.co2_factor === 'string'
                              ? parseFloat(selectedFuelData.co2_factor)
                              : selectedFuelData.co2_factor;
                              
                            const efficiency = typeof selectedFuelData.efficiency === 'string'
                              ? parseFloat(selectedFuelData.efficiency)
                              : selectedFuelData.efficiency;
                              
                            const idleConsumption = typeof selectedFuelData.idle_consumption === 'string'
                              ? parseFloat(selectedFuelData.idle_consumption)
                              : selectedFuelData.idle_consumption;
                            
                            // Update form values with proper numeric types
                            form.setValue("fuel_price_per_litre", Number(price));
                            form.setValue("co2_emission_factor", Number(co2Factor));
                            
                            if (efficiency) {
                              form.setValue("fuel_efficiency", Number(efficiency));
                            }
                            
                            if (idleConsumption) {
                              form.setValue("idle_fuel_consumption", Number(idleConsumption));
                            }
                            
                            // Calculate cost per km
                            if (price && efficiency && efficiency > 0) {
                              const costPerKm = parseFloat((price / efficiency).toFixed(2));
                              form.setValue("cost_per_km", costPerKm);
                            }
                          }
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Use fetched fuel types if available */}
                        {fuelTypes && fuelTypes.length > 0 ? (
                          fuelTypes.map((type) => (
                            <SelectItem 
                              key={type.id} 
                              value={type.type}
                              className="relative flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{type.type}</span>
                                <span className="text-xs text-muted-foreground">
                                  {typeof type.price === 'string' ? parseFloat(type.price).toFixed(2) : type.price.toFixed(2)} AED/L
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          // Fall back to master data if direct API call hasn't returned yet
                          masterData?.fuelTypes?.map((type: any) => (
                            <SelectItem key={type.type} value={type.type}>
                              {type.type}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fuel Efficiency */}
              <FormField
                control={form.control}
                name="fuel_efficiency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Efficiency (km/l) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Idle Fuel Consumption */}
              <FormField
                control={form.control}
                name="idle_fuel_consumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idle Fuel Consumption (l/h) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Number of Passengers */}
              <FormField
                control={form.control}
                name="number_of_passengers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Passengers *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="Enter passenger capacity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Plan */}
              <FormField
                control={form.control}
                name="service_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {masterData?.servicePlans?.map((plan: any) => (
                          <SelectItem key={plan.code} value={plan.code}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Region */}
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
                        {masterData?.regions?.map((region: any) => (
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

              {/* Unit */}
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {masterData?.units?.map((unit: any) => (
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
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Manufacturer */}
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedManufacturer(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manufacturer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {masterData?.manufacturers?.map((manufacturer: any) => (
                          <SelectItem key={manufacturer} value={manufacturer}>
                            {manufacturer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Model Year */}
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

              {/* Vehicle Type Name */}
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

              {/* Fuel Price Per Litre */}
              <FormField
                control={form.control}
                name="fuel_price_per_litre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Price Per Litre (AED) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost Per KM */}
              <FormField
                control={form.control}
                name="cost_per_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Per KM *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        className="bg-gray-50"
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CO2 Emission Factor */}
              <FormField
                control={form.control}
                name="co2_emission_factor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CO2 Emission Factor *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vehicle Capacity */}
              <FormField
                control={form.control}
                name="vehicle_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Capacity (litres) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="Enter vehicle capacity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Alert Before Value */}
              <FormField
                control={form.control}
                name="alert_before"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Before Value (KM) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="Enter alert threshold"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Department */}
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
                        {masterData?.departments?.map((department: any) => (
                          <SelectItem key={department} value={department}>
                            {department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vehicle Type Code */}
              <FormField
                control={form.control}
                name="vehicle_type_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type Code *</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-gray-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 px-6 py-4 border-t">
          <Button
            type="submit"
            disabled={submissionStatus === "submitting"}
          >
            {isEditing ? "Update" : "Save"} Vehicle Type
          </Button>
        </div>

        {showProgress && (
          <Dialog open={showProgress} onOpenChange={setShowProgress}>
            <DialogContent className="sm:max-w-md">
              <ProgressIndicator
                steps={submissionSteps}
                currentStep={currentStep}
                status={submissionStatus}
                error={submissionError}
              />
            </DialogContent>
          </Dialog>
        )}
      </form>
    </Form>
  );
}