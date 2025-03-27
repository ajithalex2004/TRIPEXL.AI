import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertVehicleTypeMaster, insertVehicleTypeMasterSchema, VehicleTypeMaster } from "@shared/schema";
import { motion } from "framer-motion";
import { Dialog, DialogContent } from "./dialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AnimatedFormContainer } from "./animated-form-container";
import { AnimatedProgressIndicator } from "./animated-progress-indicator";
import { AnimatedSelectField, AnimatedInputField, AnimatedNumberInputField } from "./animated-form-field";
import * as animationUtils from "@/lib/animation-utils";

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

export function VehicleTypeFormAnimated({ onSubmit, initialData, isEditing }: VehicleTypeFormProps) {
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
      await new Promise(resolve => setTimeout(resolve, 500)); // Artificial delay for animation

      // Step 2: Process vehicle information
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 500)); // Artificial delay for animation
      
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
  
  if (isMasterDataLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <motion.div
          animate={animationUtils.pulse}
          className="flex flex-col items-center"
        >
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading form data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatedFormContainer 
          form={form} 
          onSubmit={handleSubmit} 
          isSubmitting={submissionStatus === "submitting"}
          isEditing={isEditing}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <AnimatedSelectField
                name="group_id"
                control={form.control}
                label="Vehicle Group"
                placeholder="Select vehicle group"
                required
                options={
                  masterData?.groups?.map(group => ({
                    value: group.id.toString(),
                    label: group.name
                  })) || []
                }
                onValueChange={(value) => {
                  form.setValue("group_id", Number(value));
                }}
              />

              <AnimatedSelectField
                name="vehicle_type"
                control={form.control}
                label="Vehicle Model"
                placeholder={selectedManufacturer ? "Select model" : "Select manufacturer first"}
                required
                disabled={!selectedManufacturer}
                options={
                  selectedManufacturer && masterData?.vehicleModels
                    ? masterData.vehicleModels[selectedManufacturer].models.map(model => ({
                        value: model.name,
                        label: model.name
                      }))
                    : []
                }
              />

              <AnimatedSelectField
                name="vehicle_category"
                control={form.control}
                label="Vehicle Category"
                placeholder="Select category"
                required
                options={
                  ["SEDAN", "SUV", "VAN", "BUS", "TRUCK", "AMBULANCE"].map(category => ({
                    value: category,
                    label: category
                  }))
                }
              />

              <AnimatedSelectField
                name="fuel_type"
                control={form.control}
                label="Fuel Type"
                placeholder="Select fuel type"
                required
                options={
                  masterData?.fuelTypes?.map(type => ({
                    value: type.type,
                    label: type.type
                  })) || []
                }
              />

              <AnimatedInputField
                name="fuel_efficiency"
                control={form.control}
                label="Fuel Efficiency (km/l)"
                type="number"
                required
              />

              <AnimatedInputField
                name="idle_fuel_consumption"
                control={form.control}
                label="Idle Fuel Consumption (l/h)"
                type="number"
                required
              />

              <AnimatedNumberInputField
                name="number_of_passengers"
                control={form.control}
                label="Number of Passengers"
                required
                min={0}
                max={100}
              />

              <AnimatedSelectField
                name="service_plan"
                control={form.control}
                label="Service Plan"
                placeholder="Select service plan"
                options={
                  masterData?.servicePlans?.map(plan => ({
                    value: plan.code,
                    label: plan.name
                  })) || []
                }
              />

              <AnimatedSelectField
                name="region"
                control={form.control}
                label="Region"
                placeholder="Select region"
                required
                options={
                  masterData?.regions?.map(region => ({
                    value: region,
                    label: region
                  })) || []
                }
              />

              <AnimatedSelectField
                name="unit"
                control={form.control}
                label="Unit"
                placeholder="Select unit"
                options={
                  masterData?.units?.map(unit => ({
                    value: unit,
                    label: unit
                  })) || []
                }
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <AnimatedSelectField
                name="manufacturer"
                control={form.control}
                label="Manufacturer"
                placeholder="Select manufacturer"
                required
                options={
                  masterData?.manufacturers?.map(manufacturer => ({
                    value: manufacturer,
                    label: manufacturer
                  })) || []
                }
                onValueChange={(value) => {
                  setSelectedManufacturer(value);
                }}
              />

              <AnimatedNumberInputField
                name="model_year"
                control={form.control}
                label="Model Year"
                min={2000}
                max={new Date().getFullYear() + 1}
                required
              />

              <AnimatedInputField
                name="vehicle_type_name"
                control={form.control}
                label="Vehicle Type Name"
                placeholder="Enter vehicle type name"
                required
              />

              <AnimatedInputField
                name="fuel_price_per_litre"
                control={form.control}
                label="Fuel Price Per Litre (AED)"
                type="number"
                required
              />

              <AnimatedInputField
                name="cost_per_km"
                control={form.control}
                label="Cost Per KM"
                type="number"
                readOnly
                required
              />

              <AnimatedInputField
                name="co2_emission_factor"
                control={form.control}
                label="CO2 Emission Factor"
                type="number"
                required
              />

              <AnimatedNumberInputField
                name="vehicle_capacity"
                control={form.control}
                label="Vehicle Capacity (litres)"
                min={0}
                required
              />

              <AnimatedNumberInputField
                name="alert_before"
                control={form.control}
                label="Alert Before Value (KM)"
                placeholder="Enter alert threshold"
                min={0}
                required
              />

              <AnimatedSelectField
                name="department"
                control={form.control}
                label="Department"
                placeholder="Select department"
                required
                options={
                  masterData?.departments?.map(department => ({
                    value: department,
                    label: department
                  })) || []
                }
              />

              <AnimatedInputField
                name="vehicle_type_code"
                control={form.control}
                label="Vehicle Type Code"
                readOnly
                required
              />
            </div>
          </div>
        </AnimatedFormContainer>
      </motion.div>

      {showProgress && (
        <Dialog open={showProgress} onOpenChange={setShowProgress}>
          <DialogContent className="sm:max-w-md">
            <AnimatedProgressIndicator
              steps={submissionSteps}
              currentStep={currentStep}
              status={submissionStatus}
              error={submissionError}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}