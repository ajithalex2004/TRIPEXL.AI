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

  // Fetch master data
  const { data: masterData, isLoading: isMasterDataLoading } = useQuery({
    queryKey: ["/api/vehicle-masters"],
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
                        {masterData?.groups?.map((group) => (
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
                        form.setValue("vehicle_type", "");
                      }}
                      value={field.value}
                      disabled={isMasterDataLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isMasterDataLoading ? "Loading..." : "Select manufacturer"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!isMasterDataLoading && masterData?.manufacturers?.map((manufacturer) => (
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
                        type="number"
                        {...field}
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

              {/* Fuel Price per Litre */}
              <FormField
                control={form.control}
                name="fuel_price_per_litre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Price per Litre (AED) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost per KM */}
              <FormField
                control={form.control}
                name="cost_per_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per KM *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
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
                    <FormLabel>CO2 Emission Factor (kg/km) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
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
                    <FormLabel>Vehicle Capacity *</FormLabel>
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

              {/* Alert Before */}
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
                        placeholder="Enter alert value"
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
                        {masterData?.departments?.map((dept) => (
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

              {/* Vehicle Type Code */}
              <FormField
                control={form.control}
                name="vehicle_type_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type Code *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Auto-generated" disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 py-4 px-6 border-t bg-background">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={submissionStatus === "submitting"}>
            {isEditing ? "Update Vehicle Type" : "Create Vehicle Type"}
          </Button>
        </div>
      </form>

      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="sm:max-w-md">
          <ProgressIndicator
            status={submissionStatus}
            steps={submissionSteps}
            currentStep={currentStep}
            error={submissionError}
          />
        </DialogContent>
      </Dialog>
    </Form>
  );
}

const highwayEfficiencyMultiplier = 1.15; 

const defaultFuelEfficiency: { [key: string]: number } = {
  "TOYOTA-COROLLA": 14.5,
  "TOYOTA-CAMRY": 13.2,
  "TOYOTA-LANDCRUISER": 8.5,
  "TOYOTA-PRADO": 9.5,
  "TOYOTA-RAV4": 11.8,
  "TOYOTA-FORTUNER": 10.2,
  "TOYOTA-HIACE": 9.8,
  "TOYOTA-COASTER": 6.5,
  "TOYOTA-INNOVA": 11.2,
  "NISSAN-PATROL": 7.8,
  "NISSAN-XTRAIL": 11.5,
  "NISSAN-URVAN": 9.2,
  "NISSAN-SUNNY": 15.2,
  "NISSAN-ALTIMA": 13.8,
  "HONDA-CIVIC": 14.8,
  "HONDA-ACCORD": 13.5,
  "HONDA-CRV": 11.2,
  "MERCEDES-BENZ-SPRINTER": 8.5,
  "MERCEDES-BENZ-GCLASS": 7.8,
  "MERCEDES-BENZ-CCLASS": 12.5,
  "MERCEDES-BENZ-ECLASS": 11.8
};

const fuelTypeEfficiencyFactor: { [key: string]: number } = {
  "Petrol": 1.0,    
  "Diesel": 1.25,   
  "Electric": 3.5,  
  "Hybrid": 1.4,    
  "CNG": 1.15,      
  "LPG": 1.1        
};

const co2EmissionFactors: { [key: string]: number } = {
  "Petrol": 2.31,    
  "Diesel": 2.68,    
  "Electric": 0,     
  "Hybrid": 1.85,    
  "CNG": 1.81,       
  "LPG": 1.51        
};

function calculateCO2EmissionFactor(fuelType: string): number {
  return co2EmissionFactors[fuelType] || 0;
}

const categoryBaseEfficiency: { [key: string]: number } = {
  "SEDAN": 13.5,
  "SUV": 10.5,
  "VAN": 9.0,
  "BUS": 6.0,
  "TRUCK": 7.5,
  "AMBULANCE": 8.0
};

function calculateAgeBasedEfficiencyAdjustment(modelYear: number): number {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - modelYear;

  if (vehicleAge <= 1) return 1;           
  if (vehicleAge <= 3) return 0.98;        
  if (vehicleAge <= 5) return 0.95;        
  if (vehicleAge <= 7) return 0.92;        
  if (vehicleAge <= 10) return 0.88;       
  if (vehicleAge <= 15) return 0.85;       
  return 0.80;                             
}

function findVehicleEfficiency(vehicleType: string, modelYear: number, fuelType: string): number {
  let baseEfficiency = 0;
  const vehicleCode = `${vehicleType}`.toUpperCase();

  if (defaultFuelEfficiency[vehicleCode]) {
    baseEfficiency = defaultFuelEfficiency[vehicleCode];
  } else {
    for (const [category, efficiency] of Object.entries(categoryBaseEfficiency)) {
      if (vehicleCode.includes(category)) {
        baseEfficiency = efficiency;
        break;
      }
    }
    if (baseEfficiency === 0) {
      baseEfficiency = categoryBaseEfficiency.SEDAN;
    }
  }

  const ageAdjustment = calculateAgeBasedEfficiencyAdjustment(modelYear);
  const fuelAdjustment = fuelTypeEfficiencyFactor[fuelType] || 1.0;
  const highwayEfficiency = baseEfficiency * highwayEfficiencyMultiplier;
  const finalEfficiency = ((baseEfficiency + highwayEfficiency) / 2) * ageAdjustment * fuelAdjustment;
  return Number(finalEfficiency.toFixed(1));
}


const vehicleCategories: { [key: string]: string[] } = {
  "Sedan": ["corolla", "civic", "camry", "accord", "altima"],
  "SUV": ["rav4", "cr-v", "x-trail", "explorer", "tucson"],
  "Van": ["hiace", "transit", "sprinter", "h1"],
  "Bus": ["coaster", "bus"],
  "Truck": ["tundra", "f-150", "silverado"],
  "Ambulance": ["ambulance"]
};

const defaultIdleFuelConsumption: { [key: string]: number } = {
  "TOYOTA-COROLLA": 0.8,
  "TOYOTA-CAMRY": 0.9,
  "TOYOTA-LANDCRUISER": 1.5,
  "TOYOTA-PRADO": 1.3,
  "TOYOTA-RAV4": 1.0,
  "TOYOTA-FORTUNER": 1.2,
  "TOYOTA-HIACE": 1.4,
  "TOYOTA-COASTER": 2.0,
  "TOYOTA-INNOVA": 1.1,
  "NISSAN-PATROL": 1.6,
  "NISSAN-XTRAIL": 1.1,
  "NISSAN-URVAN": 1.4,
  "NISSAN-SUNNY": 0.7,
  "NISSAN-ALTIMA": 0.9,
  "HONDA-CIVIC": 0.8,
  "HONDA-ACCORD": 0.9,
  "HONDA-CRV": 1.0,
  "MERCEDES-BENZ-SPRINTER": 1.8,
  "MERCEDES-BENZ-GCLASS": 1.7,
  "MERCEDES-BENZ-CCLASS": 1.0,
  "MERCEDES-BENZ-ECLASS": 1.1,
  "SEDAN": 0.9,
  "SUV": 1.2,
  "VAN": 1.4,
  "BUS": 2.0,
  "TRUCK": 1.8,
  "AMBULANCE": 1.5
};

function calculateIdleFuelConsumption(vehicleTypeCode: string, fuelType: string): number {
  const code = vehicleTypeCode.toUpperCase();
  let baseConsumption = 0;

  if (defaultIdleFuelConsumption[code]) {
    baseConsumption = defaultIdleFuelConsumption[code];
  } else {
    for (const [category, consumption] of Object.entries(defaultIdleFuelConsumption)) {
      if (code.includes(category)) {
        baseConsumption = consumption;
        break;
      }
    }
    if (baseConsumption === 0) {
      baseConsumption = defaultIdleFuelConsumption.SEDAN;
    }
  }

  const fuelAdjustment = fuelTypeEfficiencyFactor[fuelType] || 1.0;
  const finalConsumption = baseConsumption / fuelAdjustment;
  return Number(finalConsumption.toFixed(1));
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
  ],
  "Mitsubishi": [
    "Pajero",
    "Montero Sport",
    "ASX",
    "L200",
    "Attrage"
  ],
  "Lexus": [
    "ES",
    "LS",
    "RX",
    "LX",
    "GX",
    "IS"
  ],
  "Mercedes-Benz": [
    "C-Class",
    "E-Class",
    "S-Class",
    "GLE",
    "GLS",
    "G-Class",
    "Sprinter"
  ],
  "BMW": [
    "3 Series",
    "5 Series",
    "7 Series",
    "X3",
    "X5",
    "X7"
  ],
  "Audi": [
    "A4",
    "A6",
    "A8",
    "Q5",
    "Q7",
    "Q8"
  ],
  "Ford": [
    "Edge",
    "Explorer",
    "Expedition",
    "F-150",
    "Ranger",
    "Transit"
  ],
  "Chevrolet": [
    "Tahoe",
    "Suburban",
    "Silverado",
    "Traverse",
    "Captiva"
  ],
  "Hyundai": [
    "Accent",
    "Elantra",
    "Sonata",
    "Tucson",
    "Santa Fe",
    "H1"
  ],
  "Kia": [
    "Picanto",
    "Cerato",
    "K5",
    "Sportage",
    "Sorento",
    "Carnival"
  ]
};

const uaeManufacturers = Object.keys(uaeVehicleModels);

const defaultPassengerCapacity: { [key: string]: number } = {
  "TOYOTA-COROLLA": 5,
  "TOYOTA-CAMRY": 5,
  "TOYOTA-LANDCRUISER": 8,
  "TOYOTA-PRADO": 7,
  "TOYOTA-RAV4": 5,
  "TOYOTA-FORTUNER": 7,
  "TOYOTA-HIACE": 12,
  "TOYOTA-COASTER": 23,
  "TOYOTA-INNOVA": 7,
  "NISSAN-PATROL": 8,
  "NISSAN-XTRAIL": 7,
  "NISSAN-URVAN": 12,
  "HONDA-CIVIC": 5,
  "HONDA-ACCORD": 5,
  "HONDA-CRV": 5,
  "MERCEDES-BENZ-SPRINTER": 14,
  "MERCEDES-BENZ-GCLASS": 5,
  "SEDAN": 5,
  "SUV": 7,
  "VAN": 12,
  "BUS": 30,
  "TRUCK": 3,
  "AMBULANCE": 4
};

const defaultVehicleCapacity: { [key: string]: number } = {
  "TOYOTA-COROLLA": 13,
  "TOYOTA-CAMRY": 15,
  "TOYOTA-LANDCRUISER": 82,
  "TOYOTA-PRADO": 64,
  "TOYOTA-RAV4": 37,
  "TOYOTA-FORTUNER": 54,
  "TOYOTA-HIACE": 280,
  "TOYOTA-COASTER": 180,
  "TOYOTA-INNOVA": 45,
  "NISSAN-PATROL": 95,
  "NISSAN-XTRAIL": 40,
  "NISSAN-URVAN": 250,
  "HONDA-CIVIC": 14,
  "HONDA-ACCORD": 16,
  "HONDA-CRV": 39,
  "MERCEDES-BENZ-SPRINTER": 533,
  "MERCEDES-BENZ-GCLASS": 79,
  "SEDAN": 15,
  "SUV": 40,
  "VAN": 300,
  "BUS": 200,
  "TRUCK": 150,
  "AMBULANCE": 400
};

function getVehicleCapacityFromCode(vehicleTypeCode: string): number {
  const code = vehicleTypeCode.toUpperCase();

  if (defaultVehicleCapacity[code]) {
    return defaultVehicleCapacity[code];
  }

  for (const [category, capacity] of Object.entries(defaultVehicleCapacity)) {
    if (code.includes(category)) {
      return capacity;
    }
  }

  return 0; 
}

function getPassengerCapacityFromCode(vehicleTypeCode: string): number {
  const code = vehicleTypeCode.toUpperCase();

  if (defaultPassengerCapacity[code]) {
    return defaultPassengerCapacity[code];
  }

  for (const [category, capacity] of Object.entries(defaultPassengerCapacity)) {
    if (code.includes(category)) {
      return capacity;
    }
  }

  return 4; 
}

function calculateCostPerKm(fuelPrice: number, fuelEfficiency: number) {
  if (!fuelPrice || !fuelEfficiency || fuelEfficiency <= 0) return 0;
  return Number((fuelPrice / fuelEfficiency).toFixed(2));
}
}