import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertVehicleTypeMasterSchema, type InsertVehicleTypeMaster, type VehicleTypeMaster, type VehicleGroup } from "@shared/schema";

// UI components
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedProgressIndicator } from "@/components/ui/animated-progress-indicator";

interface VehicleTypeFormProps {
  onSubmit: (data: InsertVehicleTypeMaster) => Promise<void>;
  initialData?: VehicleTypeMaster;
  isEditing?: boolean;
}

type SubmissionStatus = "idle" | "submitting" | "success" | "error";

// Declare this interface outside the component to avoid re-declaration on each render
interface FuelTypeData {
  id: number;
  type: string;
  price: number;
  co2_factor: number;
  efficiency: number;
  idle_consumption: number;
  updated_at: string;
  last_fetched_at: string;
  historical_prices: Array<{date: string, price: number}>;
}

export function VehicleTypeForm({ onSubmit, initialData, isEditing = false }: VehicleTypeFormProps) {
  const { toast } = useToast();
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("idle");
  const [submissionError, setSubmissionError] = useState<string | undefined>();
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | undefined>(initialData?.manufacturer);

  // Fetch vehicle groups
  const { data: vehicleGroups } = useQuery<VehicleGroup[]>({
    queryKey: ["/api/vehicle-groups"]
  });

  // Fetch master data for dropdowns
  const { data: masterData, isLoading: isLoadingMasterData } = useQuery<any>({
    queryKey: ["/api/vehicle-masters"]
  });
  
  // For debugging
  useEffect(() => {
    if (masterData) {
      console.log("Fetched master data:", masterData);
    }
  }, [masterData]);

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
        form.setValue("fuel_efficiency", Number(modelData.efficiency));
        form.setValue("vehicle_capacity", Number(modelData.capacity));
        form.setValue("idle_fuel_consumption", Number(modelData.idleConsumption));
        form.setValue("number_of_passengers", Number(modelData.passengerCapacity));
      }
    }
  }, [selectedManufacturer, selectedModel, masterData, form]);

  // Calculate cost per km when fuel price or efficiency changes
  useEffect(() => {
    const fuelPrice = form.watch("fuel_price_per_litre");
    const fuelEfficiency = form.watch("fuel_efficiency");
    
    if (fuelPrice && fuelEfficiency && fuelEfficiency > 0) {
      const costPerKm = Number((fuelPrice / fuelEfficiency).toFixed(2));
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
        vehicle_capacity: Number(data.vehicle_capacity),
        fuel_efficiency: Number(data.fuel_efficiency),
        fuel_price_per_litre: Number(data.fuel_price_per_litre),
        idle_fuel_consumption: Number(data.idle_fuel_consumption),
        co2_emission_factor: Number(data.co2_emission_factor)
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

  // This function is used by the fuel type selection to update form values
  const updateFormValuesFromFuelType = (fuelType: string) => {
    if (fuelTypes && fuelTypes.length > 0) {
      console.log("Fuel types available:", fuelTypes);
      const selectedFuelData = fuelTypes.find(ft => 
        ft.type.toLowerCase() === fuelType.toLowerCase()
      );
      
      if (selectedFuelData) {
        console.log("Selected fuel data:", selectedFuelData);
        
        // Convert all string values to numbers explicitly
        const price = typeof selectedFuelData.price === 'string' ? 
          parseFloat(selectedFuelData.price) : selectedFuelData.price;
          
        const efficiency = typeof selectedFuelData.efficiency === 'string' ? 
          parseFloat(selectedFuelData.efficiency) : selectedFuelData.efficiency;
          
        const co2Factor = typeof selectedFuelData.co2_factor === 'string' ? 
          parseFloat(selectedFuelData.co2_factor) : selectedFuelData.co2_factor;
          
        const idleConsumption = typeof selectedFuelData.idle_consumption === 'string' ? 
          parseFloat(selectedFuelData.idle_consumption) : selectedFuelData.idle_consumption;
        
        // Update form values with proper numeric types
        console.log("Setting fuel price to:", price);
        form.setValue("fuel_price_per_litre", price);
        form.setValue("co2_emission_factor", co2Factor);
        
        if (efficiency) {
          console.log("Setting fuel efficiency to:", efficiency);
          form.setValue("fuel_efficiency", efficiency);
        }
        
        if (idleConsumption) {
          console.log("Setting idle consumption to:", idleConsumption);
          form.setValue("idle_fuel_consumption", idleConsumption);
        }
        
        // Calculate cost per km
        if (price && efficiency && efficiency > 0) {
          const costPerKm = Number((price / efficiency).toFixed(2));
          console.log("Setting cost per km to:", costPerKm);
          form.setValue("cost_per_km", costPerKm);
        }
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6">
          {/* Create a table layout exactly matching the image */}
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
                </td>
                <td className="border p-2">
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
                </td>
              </tr>

              {/* Row 2: Vehicle Model | Model Year */}
              <tr>
                <td className="border p-2">
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
                  {/* This field doesn't exist in the schema */}
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
                  <FormField
                    control={form.control}
                    name="fuel_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Type *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            updateFormValuesFromFuelType(value);
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
                </td>
                <td className="border p-2">
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
                          <Input {...field} type="number" step="0.01" />
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
                          <Input {...field} type="number" step="0.01" readOnly />
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
                          <Input {...field} type="number" step="0.01" />
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
                          <Input {...field} type="number" step="0.01" />
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
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Enter alert distance"
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
                </td>
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
                </td>
                <td className="border p-2">
                  <FormField
                    control={form.control}
                    name="vehicle_type_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type Code</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly placeholder="Auto-generated" />
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

        {/* Progress indicator for form submission */}
        {showProgress && (
          <div className="mt-6 mb-2">
            <AnimatedProgressIndicator 
              steps={[
                { label: "Validating data...", description: "Checking form values" },
                { label: "Processing vehicle information...", description: "Preparing data for submission" },
                { label: "Saving vehicle type...", description: "Sending to server" }
              ]}
              currentStep={currentStep}
              status={submissionStatus}
              error={submissionError}
            />
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button 
            variant="outline" 
            type="button"
            onClick={() => {
              if (isEditing && initialData) {
                const formattedData = {
                  ...initialData,
                  fuel_efficiency: Number(initialData.fuel_efficiency),
                  fuel_price_per_litre: Number(initialData.fuel_price_per_litre),
                  cost_per_km: Number(initialData.cost_per_km),
                  idle_fuel_consumption: Number(initialData.idle_fuel_consumption),
                  co2_emission_factor: Number(initialData.co2_emission_factor)
                };
                form.reset(formattedData);
              } else {
                form.reset();
              }
            }}
          >
            Reset
          </Button>
          <Button 
            type="submit"
            disabled={submissionStatus === "submitting"}
          >
            {isEditing ? "Update" : "Create"} Vehicle Type
          </Button>
        </div>
      </form>
    </Form>
  );
}