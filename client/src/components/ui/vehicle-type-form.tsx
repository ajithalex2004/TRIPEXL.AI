import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertVehicleTypeMaster, Department, insertVehicleTypeMasterSchema, VehicleTypeMaster, VehicleFuelType, Region } from "@shared/schema"; 
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
import { ProgressIndicator, type SubmissionStatus } from "./progress-indicator";
import { Dialog, DialogContent } from "./dialog";

interface VehicleTypeFormProps {
  onSubmit: (data: InsertVehicleTypeMaster) => Promise<void>;
  initialData?: VehicleTypeMaster;
  isEditing?: boolean;
}

export function VehicleTypeForm({ onSubmit, initialData, isEditing }: VehicleTypeFormProps) {
  const { toast } = useToast();
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [submissionError, setSubmissionError] = useState<string>();
  const [showProgress, setShowProgress] = useState(false);

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
      description: isEditing ? "Updating vehicle type details" : "Creating new vehicle type"
    }
  ];

  // Fetch vehicle groups
  const { data: vehicleGroups } = useQuery({
    queryKey: ["/api/vehicle-groups"],
  });

  const form = useForm<InsertVehicleTypeMaster>({
    resolver: zodResolver(insertVehicleTypeMasterSchema),
    defaultValues: {
      group_id: initialData?.group_id || 0,
      vehicle_type_code: initialData?.vehicle_type_code || "",
      vehicle_type_name: initialData?.vehicle_type_name || "",
      manufacturer: initialData?.manufacturer || "",
      model_year: initialData?.model_year || new Date().getFullYear(),
      number_of_passengers: initialData?.number_of_passengers || 0,
      region: initialData?.region || Region.ABU_DHABI,
      fuel_efficiency: initialData?.fuel_efficiency || 0,
      fuel_price_per_litre: initialData?.fuel_price_per_litre || 0,
      fuel_type: initialData?.fuel_type || VehicleFuelType.PETROL,
      service_plan: initialData?.service_plan || "",
      cost_per_km: initialData?.cost_per_km || 0,
      vehicle_type: initialData?.vehicle_type || "",
      department: initialData?.department || Department.FLEET,
      unit: initialData?.unit || "",
      alert_before: initialData?.alert_before || 0,
      idle_fuel_consumption: initialData?.idle_fuel_consumption || 0,
      vehicle_capacity: initialData?.vehicle_capacity || 0,
      co2_emission_factor: initialData?.co2_emission_factor || 0
    }
  });

  const handleSubmit = async (data: InsertVehicleTypeMaster) => {
    try {
      setSubmissionStatus("submitting");
      setShowProgress(true);
      setSubmissionError(undefined);

      // Step 1: Validate form data
      setCurrentStep(0);
      console.log("Raw form data:", data);

      // Step 2: Process vehicle information
      setCurrentStep(1);
      const formattedData = {
        ...data,
        group_id: Number(data.group_id),
        model_year: Number(data.model_year),
        number_of_passengers: Number(data.number_of_passengers),
        fuel_efficiency: Number(data.fuel_efficiency),
        fuel_price_per_litre: Number(data.fuel_price_per_litre),
        cost_per_km: Number(data.cost_per_km),
        alert_before: Number(data.alert_before),
        idle_fuel_consumption: Number(data.idle_fuel_consumption),
        vehicle_capacity: Number(data.vehicle_capacity),
        co2_emission_factor: Number(data.co2_emission_factor)
      };

      console.log("Submitting formatted data:", formattedData);

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

      // Hide progress after success
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

            {/* Vehicle Type Code */}
            <FormField
              control={form.control}
              name="vehicle_type_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type Code *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter vehicle type code" />
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

            {/* Manufacturer */}
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter manufacturer" />
                  </FormControl>
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
                      {Object.values(Region).map((region) => (
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
                      {Object.values(VehicleFuelType).map((type) => (
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
                      {Object.values(Department).map((dept) => (
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

            {/* Vehicle Type */}
            <FormField
              control={form.control}
              name="vehicle_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter vehicle type" />
                  </FormControl>
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
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="Enter fuel efficiency"
                    />
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
                  <FormLabel>Fuel Price per Litre *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="Enter fuel price"
                    />
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
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="Enter cost per km"
                    />
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

            {/* Idle Fuel Consumption */}
            <FormField
              control={form.control}
              name="idle_fuel_consumption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idle Fuel Consumption *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="Enter idle fuel consumption"
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
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="Enter CO2 emission factor"
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
                  <FormControl>
                    <Input {...field} placeholder="Enter service plan" />
                  </FormControl>
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
                  <FormControl>
                    <Input {...field} placeholder="Enter unit" />
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
                  <FormLabel>Alert Before (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="Enter alert days"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

const highwayEfficiencyMultiplier = 1.15; // Highway efficiency is typically 15% better

// Updated fuel efficiency values with more precise data
const defaultFuelEfficiency: { [key: string]: number } = {
  // Toyota models
  "TOYOTA-COROLLA": 14.5,
  "TOYOTA-CAMRY": 13.2,
  "TOYOTA-LANDCRUISER": 8.5,
  "TOYOTA-PRADO": 9.5,
  "TOYOTA-RAV4": 11.8,
  "TOYOTA-FORTUNER": 10.2,
  "TOYOTA-HIACE": 9.8,
  "TOYOTA-COASTER": 6.5,
  "TOYOTA-INNOVA": 11.2,

  // Nissan models
  "NISSAN-PATROL": 7.8,
  "NISSAN-XTRAIL": 11.5,
  "NISSAN-URVAN": 9.2,
  "NISSAN-SUNNY": 15.2,
  "NISSAN-ALTIMA": 13.8,

  // Honda models
  "HONDA-CIVIC": 14.8,
  "HONDA-ACCORD": 13.5,
  "HONDA-CRV": 11.2,

  // Mercedes models
  "MERCEDES-BENZ-SPRINTER": 8.5,
  "MERCEDES-BENZ-GCLASS": 7.8,
  "MERCEDES-BENZ-CCLASS": 12.5,
  "MERCEDES-BENZ-ECLASS": 11.8
};

// Fuel type efficiency adjustments
const fuelTypeEfficiencyFactor: { [key: string]: number } = {
  "Petrol": 1.0,    // Base reference
  "Diesel": 1.25,   // Diesel engines are typically 25% more efficient
  "Electric": 3.5,  // Electric vehicles are significantly more efficient
  "Hybrid": 1.4,    // Hybrid vehicles are about 40% more efficient
  "CNG": 1.15,      // CNG is about 15% more efficient than petrol
  "LPG": 1.1        // LPG is about 10% more efficient than petrol
};

// Add after the fuelTypeEfficiencyFactor constant
const co2EmissionFactors: { [key: string]: number } = {
  "Petrol": 2.31,    // kg CO2/liter
  "Diesel": 2.68,    // kg CO2/liter
  "Electric": 0,     // Zero direct emissions
  "Hybrid": 1.85,    // Assumes 20% lower than petrol
  "CNG": 1.81,       // kg CO2/m³
  "LPG": 1.51        // kg CO2/liter
};

// Add function to calculate CO2 emission factor
function calculateCO2EmissionFactor(fuelType: string): number {
  return co2EmissionFactors[fuelType] || 0;
}

// Vehicle category baseline efficiencies
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

  // More granular efficiency degradation
  if (vehicleAge <= 1) return 1;           // New vehicles
  if (vehicleAge <= 3) return 0.98;        // 1-3 years: 2% reduction
  if (vehicleAge <= 5) return 0.95;        // 3-5 years: 5% reduction
  if (vehicleAge <= 7) return 0.92;        // 5-7 years: 8% reduction
  if (vehicleAge <= 10) return 0.88;       // 7-10 years: 12% reduction
  if (vehicleAge <= 15) return 0.85;       // 10-15 years: 15% reduction
  return 0.80;                             // 15+ years: 20% reduction
}

function findVehicleEfficiency(vehicleType: string, modelYear: number, fuelType: string): number {
  let baseEfficiency = 0;
  const vehicleCode = `${vehicleType}`.toUpperCase();

  // Try exact match first
  if (defaultFuelEfficiency[vehicleCode]) {
    baseEfficiency = defaultFuelEfficiency[vehicleCode];
  } else {
    // Find matching category
    for (const [category, efficiency] of Object.entries(categoryBaseEfficiency)) {
      if (vehicleCode.includes(category)) {
        baseEfficiency = efficiency;
        break;
      }
    }

    // If still no match, use sedan as default
    if (baseEfficiency === 0) {
      baseEfficiency = categoryBaseEfficiency.SEDAN;
    }
  }

  // Apply age-based adjustment
  const ageAdjustment = calculateAgeBasedEfficiencyAdjustment(modelYear);

  // Apply fuel type efficiency factor
  const fuelAdjustment = fuelTypeEfficiencyFactor[fuelType] || 1.0;

  // Calculate highway efficiency
  const highwayEfficiency = baseEfficiency * highwayEfficiencyMultiplier;

  // Calculate final efficiency (average of normal and highway, adjusted for age and fuel type)
  const finalEfficiency = ((baseEfficiency + highwayEfficiency) / 2) * ageAdjustment * fuelAdjustment;

  // Return with 1 decimal place precision
  return Number(finalEfficiency.toFixed(1));
}


// Vehicle categories for matching (No changes needed here)
const vehicleCategories: { [key: string]: string[] } = {
  "Sedan": ["corolla", "civic", "camry", "accord", "altima"],
  "SUV": ["rav4", "cr-v", "x-trail", "explorer", "tucson"],
  "Van": ["hiace", "transit", "sprinter", "h1"],
  "Bus": ["coaster", "bus"],
  "Truck": ["tundra", "f-150", "silverado"],
  "Ambulance": ["ambulance"]
};


// Define default idle fuel consumption values (L/H) for different vehicle types
const defaultIdleFuelConsumption: { [key: string]: number } = {
  // Toyota models
  "TOYOTA-COROLLA": 0.8,
  "TOYOTA-CAMRY": 0.9,
  "TOYOTA-LANDCRUISER": 1.5,
  "TOYOTA-PRADO": 1.3,
  "TOYOTA-RAV4": 1.0,
  "TOYOTA-FORTUNER": 1.2,
  "TOYOTA-HIACE": 1.4,
  "TOYOTA-COASTER": 2.0,
  "TOYOTA-INNOVA": 1.1,

  // Nissan models
  "NISSAN-PATROL": 1.6,
  "NISSAN-XTRAIL": 1.1,
  "NISSAN-URVAN": 1.4,
  "NISSAN-SUNNY": 0.7,
  "NISSAN-ALTIMA": 0.9,

  // Honda models
  "HONDA-CIVIC": 0.8,
  "HONDA-ACCORD": 0.9,
  "HONDA-CRV": 1.0,

  // Mercedes models
  "MERCEDES-BENZ-SPRINTER": 1.8,
  "MERCEDES-BENZ-GCLASS": 1.7,
  "MERCEDES-BENZ-CCLASS": 1.0,
  "MERCEDES-BENZ-ECLASS": 1.1,

  // Default values by category
  "SEDAN": 0.9,
  "SUV": 1.2,
  "VAN": 1.4,
  "BUS": 2.0,
  "TRUCK": 1.8,
  "AMBULANCE": 1.5
};

// Function to calculate idle fuel consumption based on vehicle code and fuel type
function calculateIdleFuelConsumption(vehicleTypeCode: string, fuelType: string): number {
  const code = vehicleTypeCode.toUpperCase();
  let baseConsumption = 0;

  // Try exact match first
  if (defaultIdleFuelConsumption[code]) {
    baseConsumption = defaultIdleFuelConsumption[code];
  } else {
    // Try to match by category
    for (const [category, consumption] of Object.entries(defaultIdleFuelConsumption)) {
      if (code.includes(category)) {
        baseConsumption = consumption;
        break;
      }
    }

    // If still no match, use sedan as default
    if (baseConsumption === 0) {
      baseConsumption = defaultIdleFuelConsumption.SEDAN;
    }
  }

  // Apply fuel type adjustment factor
  const fuelAdjustment = fuelTypeEfficiencyFactor[fuelType] || 1.0;

  // Calculate final consumption (adjusted for fuel type)
  const finalConsumption = baseConsumption / fuelAdjustment;

  // Return with 1 decimal place precision
  return Number(finalConsumption.toFixed(1));
}

// Updated UAE Vehicle Models by Manufacturer
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

// Define default passenger capacities for common vehicle models
const defaultPassengerCapacity: { [key: string]: number } = {
  // Toyota models
  "TOYOTA-COROLLA": 5,
  "TOYOTA-CAMRY": 5,
  "TOYOTA-LANDCRUISER": 8,
  "TOYOTA-PRADO": 7,
  "TOYOTA-RAV4": 5,
  "TOYOTA-FORTUNER": 7,
  "TOYOTA-HIACE": 12,
  "TOYOTA-COASTER": 23,
  "TOYOTA-INNOVA": 7,

  // Nissan models
  "NISSAN-PATROL": 8,
  "NISSAN-XTRAIL": 7,
  "NISSAN-URVAN": 12,

  // Honda models
  "HONDA-CIVIC": 5,
  "HONDA-ACCORD": 5,
  "HONDA-CRV": 5,

  // Mercedes models
  "MERCEDES-BENZ-SPRINTER": 14,
  "MERCEDES-BENZ-GCLASS": 5,

  // Default values by category
  "SEDAN": 5,
  "SUV": 7,
  "VAN": 12,
  "BUS": 30,
  "TRUCK": 3,
  "AMBULANCE": 4
};

// Define default vehicle capacities (in cubic feet)
const defaultVehicleCapacity: { [key: string]: number } = {
  // Toyota models
  "TOYOTA-COROLLA": 13,
  "TOYOTA-CAMRY": 15,
  "TOYOTA-LANDCRUISER": 82,
  "TOYOTA-PRADO": 64,
  "TOYOTA-RAV4": 37,
  "TOYOTA-FORTUNER": 54,
  "TOYOTA-HIACE": 280,
  "TOYOTA-COASTER": 180,
  "TOYOTA-INNOVA": 45,

  // Nissan models
  "NISSAN-PATROL": 95,
  "NISSAN-XTRAIL": 40,
  "NISSAN-URVAN": 250,

  // Honda models
  "HONDA-CIVIC": 14,
  "HONDA-ACCORD": 16,
  "HONDA-CRV": 39,

  // Mercedes models
  "MERCEDES-BENZ-SPRINTER": 533,
  "MERCEDES-BENZ-GCLASS": 79,

  // Default values by category
  "SEDAN": 15,
  "SUV": 40,
  "VAN": 300,
  "BUS": 200,
  "TRUCK": 150,
  "AMBULANCE": 400
};

function getVehicleCapacityFromCode(vehicleTypeCode: string): number {
  // Convert to uppercase for comparison
  const code = vehicleTypeCode.toUpperCase();

  // Direct match
  if (defaultVehicleCapacity[code]) {
    return defaultVehicleCapacity[code];
  }

  // Try to match by category
  for (const [category, capacity] of Object.entries(defaultVehicleCapacity)) {
    if (code.includes(category)) {
      return capacity;
    }
  }

  return 0; // Default capacity
}

function getPassengerCapacityFromCode(vehicleTypeCode: string): number {
  // Convert to uppercase for comparison
  const code = vehicleTypeCode.toUpperCase();

  // Direct match
  if (defaultPassengerCapacity[code]) {
    return defaultPassengerCapacity[code];
  }

  // Try to match by category
  for (const [category, capacity] of Object.entries(defaultPassengerCapacity)) {
    if (code.includes(category)) {
      return capacity;
    }
  }

  return 4; // Default passenger capacity
}

function calculateCostPerKm(fuelPrice: number, fuelEfficiency: number) {
  if (!fuelPrice || !fuelEfficiency || fuelEfficiency <= 0) return 0;
  return Number((fuelPrice / fuelEfficiency).toFixed(2));
}