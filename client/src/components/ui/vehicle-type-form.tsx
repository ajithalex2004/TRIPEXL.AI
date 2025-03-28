import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertVehicleTypeMaster, insertVehicleTypeMasterSchema, VehicleTypeMaster } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProgressIndicator } from "./progress-indicator";
import { Dialog, DialogContent } from "./dialog";

interface VehicleTypeFormProps {
  onSubmit: (data: InsertVehicleTypeMaster) => Promise<void>;
  initialData?: VehicleTypeMaster;
  isEditing?: boolean;
}

// Define submission steps
const submissionSteps = [
  {
    label: "Validating Form Data",
    description: "Ensuring all required fields are properly filled"
  },
  {
    label: "Processing Vehicle Information",
    description: "Preparing vehicle type data for submission"
  },
  {
    label: "Saving Vehicle Type",
    description: "Creating new vehicle type"
  }
];

export function VehicleTypeForm({ onSubmit, initialData, isEditing }: VehicleTypeFormProps) {
  const { toast } = useToast();
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [submissionError, setSubmissionError] = useState<string>();
  const [showProgress, setShowProgress] = useState(false);

  // Fetch master data
  const { data: masterData, isLoading: isMasterDataLoading } = useQuery({
    queryKey: ["/api/vehicle-masters"],
  });
  
  // Fetch vehicle groups directly with proper typing
  const { data: vehicleGroups, isLoading: isLoadingGroups, error: groupsError } = useQuery<
    { id: number; name: string; group_code: string }[]
  >({
    queryKey: ["/api/vehicle-groups"]
  });
  
  // Log data for debugging
  useEffect(() => {
    if (vehicleGroups) {
      console.log("Vehicle groups data:", vehicleGroups);
    }
    if (groupsError) {
      console.error("Error fetching vehicle groups:", groupsError);
    }
  }, [vehicleGroups, groupsError]);

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
      region: initialData?.region || "",
      fuel_efficiency: initialData?.fuel_efficiency || "0",
      fuel_price_per_litre: initialData?.fuel_price_per_litre || "0",
      fuel_type: initialData?.fuel_type || "",
      service_plan: initialData?.service_plan || "",
      cost_per_km: initialData?.cost_per_km || 0,
      department: initialData?.department || "",
      unit: initialData?.unit || "",
      alert_before: initialData?.alert_before || 0,
      idle_fuel_consumption: initialData?.idle_fuel_consumption || "0",
      vehicle_capacity: initialData?.vehicle_capacity || 0,
      co2_emission_factor: initialData?.co2_emission_factor || "0"
    }
  });

  // Watch form values
  const selectedFuelType = form.watch("fuel_type");
  const selectedModel = form.watch("vehicle_type");
  const modelYear = form.watch("model_year");

  // Auto-generate vehicle type code
  useEffect(() => {
    if (selectedManufacturer && selectedModel && modelYear) {
      const typeCode = `${selectedManufacturer}-${selectedModel}-${modelYear}`.toUpperCase();
      form.setValue("vehicle_type_code", typeCode);
    }
  }, [selectedManufacturer, selectedModel, modelYear, form]);

  // Update vehicle specs when model changes
  useEffect(() => {
    if (masterData?.vehicleModels && selectedManufacturer && selectedModel) {
      const modelData = masterData.vehicleModels[selectedManufacturer]?.models.find(
        m => m.name === selectedModel
      );

      if (modelData) {
        form.setValue("fuel_efficiency", modelData.efficiency.toString());
        form.setValue("vehicle_capacity", modelData.capacity);
        form.setValue("idle_fuel_consumption", modelData.idleConsumption.toString());
        form.setValue("number_of_passengers", modelData.passengerCapacity);
      }
    }
  }, [selectedManufacturer, selectedModel, masterData?.vehicleModels, form]);

  // Update fuel-related fields when fuel type changes
  useEffect(() => {
    if (masterData?.fuelTypes && selectedFuelType) {
      const fuelData = masterData.fuelTypes.find(f => f.type === selectedFuelType);
      if (fuelData) {
        form.setValue("fuel_price_per_litre", fuelData.price.toString());
        form.setValue("co2_emission_factor", fuelData.co2Factor.toString());
      }
    }
  }, [selectedFuelType, masterData?.fuelTypes, form]);

  // Calculate cost per km
  useEffect(() => {
    const fuelPrice = Number(form.watch("fuel_price_per_litre"));
    const fuelEfficiency = Number(form.watch("fuel_efficiency"));
    if (fuelPrice && fuelEfficiency && fuelEfficiency > 0) {
      const costPerKm = Number((fuelPrice / fuelEfficiency).toFixed(2));
      form.setValue("cost_per_km", costPerKm);
    }
  }, [form.watch("fuel_price_per_litre"), form.watch("fuel_efficiency"), form]);

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
            {/* Left Column */}
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
                          masterData.vehicleModels[selectedManufacturer].models.map((model) => (
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

              {/* Vehicle Category */}
              <FormField
                control={form.control}
                name="vehicle_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["SEDAN", "SUV", "VAN", "BUS", "TRUCK", "AMBULANCE"].map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {masterData?.fuelTypes?.map((type) => (
                          <SelectItem key={type.type} value={type.type}>
                            {type.type}
                          </SelectItem>
                        ))}
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
                      <Input {...field} type="number" />
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
                      <Input {...field} type="number" />
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
                        {masterData?.servicePlans?.map((plan) => (
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
                        {masterData?.regions?.map((region) => (
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
                        {masterData?.units?.map((unit) => (
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
                        {masterData?.manufacturers?.map((manufacturer) => (
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
                        {masterData?.departments?.map((department) => (
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

// Helper functions
function calculateCostPerKm(fuelPrice: number, fuelEfficiency: number): number {
  if (!fuelPrice || !fuelEfficiency || fuelEfficiency === 0) {
    return 0;
  }
  return Number((fuelPrice / fuelEfficiency).toFixed(2));
}

const uaeVehicleModels: { [key: string]: string[] } = {
  "Toyota": [
    "Corolla",
    "Camry",
    "Land Cruiser",
    "Prado",
    "RAV4",
    "Fortuner",
    "Hiace",
    "Yaris",
    "Hilux",
    "Coaster",
    "Innova"
  ],
  "Nissan": [
    "Altima",
    "Patrol",
    "X-Trail",
    "Sunny",
    "Kicks",
    "Pathfinder",
    "Urvan",
    "Navara"
  ],
  "Honda": [
    "Civic",
    "Accord",
    "CR-V",
    "Pilot",
    "HR-V",
    "City"
  ]
};