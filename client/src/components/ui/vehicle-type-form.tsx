import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertVehicleTypeMaster, Department, insertVehicleTypeMasterSchema, VehicleTypeMaster, VehicleGroup, VehicleFuelType, Region } from "@shared/schema"; 
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";


const currentYear = new Date().getFullYear();
const modelYears = Array.from(
  { length: currentYear - 2000 + 1 },
  (_, i) => currentYear - i
).sort((a, b) => a - b); // Sort ascending

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

interface VehicleTypeFormProps {
  onSubmit: (data: InsertVehicleTypeMaster) => void;
  initialData?: VehicleTypeMaster;
  isEditing?: boolean;
}

export function VehicleTypeForm({ onSubmit, initialData, isEditing }: VehicleTypeFormProps) {
  const { toast } = useToast();

  // Fetch vehicle groups for the dropdown
  const { data: vehicleGroups, isLoading: loadingGroups } = useQuery<VehicleGroup[]>({
    queryKey: ["/api/vehicle-groups"],
    enabled: true,
    staleTime: 30000, // Cache for 30 seconds
    cacheTime: 60000, // Keep in cache for 1 minute
    retry: 3,
    onError: (error) => {
      toast({
        title: "Error fetching vehicle groups",
        description: "Failed to load vehicle groups",
        variant: "destructive",
      });
    }
  });

  // Update fuel prices query and handling
  const { data: fuelPrices, isLoading: loadingFuelPrices } = useQuery({
    queryKey: ["/api/fuel-prices"],
    enabled: true,
    retry: 3,
    onError: (error) => {
      toast({
        title: "Error fetching fuel prices",
        description: "Failed to load current fuel prices",
        variant: "destructive",
      });
    }
  });

  const form = useForm<InsertVehicleTypeMaster>({
    resolver: zodResolver(insertVehicleTypeMasterSchema),
    defaultValues: {
      groupId: initialData?.groupId || 0,
      vehicleTypeCode: "",
      manufacturer: "",
      modelYear: 0,
      numberOfPassengers: 0,
      region: "",
      fuelEfficiency: 0,
      fuelPricePerLitre: 0,
      fuelType: "Petrol",
      servicePlan: "",
      costPerKm: 0,
      vehicleType: "",
      department: "",
      unit: "",
      alertBefore: 0,
      idleFuelConsumption: 0,
      vehicleCapacity: 0,
      co2EmissionFactor: 0
    }
  });

  // Watch form values
  const selectedFuelType = form.watch("fuelType");
  const fuelEfficiency = form.watch("fuelEfficiency");
  const fuelPricePerLitre = form.watch("fuelPricePerLitre");
  const vehicleType = form.watch("vehicleType");
  const selectedManufacturer = form.watch("manufacturer");

  // Update cost per km when fuel efficiency or price changes
  const calculateCostPerKm = (fuelPrice: number, fuelEfficiency: number) => {
    if (!fuelPrice || !fuelEfficiency || fuelEfficiency <= 0) return 0;
    return Number((fuelPrice / fuelEfficiency).toFixed(2));
  };

  useEffect(() => {
    const costPerKm = calculateCostPerKm(fuelPricePerLitre, fuelEfficiency);
    form.setValue("costPerKm", costPerKm);
  }, [fuelEfficiency, fuelPricePerLitre, form]);

  // Set initial data
  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        groupId: initialData.groupId || 0,
        fuelType: initialData.fuelType || "Petrol"
      });
    }
  }, [initialData, form]);

  // Update fuel price when fuel type changes
  useEffect(() => {
    if (fuelPrices && selectedFuelType) {
      const normalizedType = selectedFuelType.toLowerCase();
      const price = fuelPrices[normalizedType];

      if (price !== undefined) {
        form.setValue("fuelPricePerLitre", price);

        // Recalculate cost per km
        const efficiency = form.getValues("fuelEfficiency");
        if (efficiency > 0) {
          const costPerKm = calculateCostPerKm(price, efficiency);
          form.setValue("costPerKm", costPerKm);
        }
      }
    }
  }, [selectedFuelType, fuelPrices, form]);

  // Separate useEffect for cost per km updates
  useEffect(() => {
    if (fuelPricePerLitre && fuelEfficiency > 0) {
      const costPerKm = calculateCostPerKm(fuelPricePerLitre, fuelEfficiency);
      form.setValue("costPerKm", costPerKm);
    }
  }, [fuelPricePerLitre, fuelEfficiency, form]);

  // Update vehicle details when vehicle type changes
  useEffect(() => {
    if (vehicleType && selectedManufacturer) {
      const modelYear = form.getValues("modelYear");
      const currentFuelType = form.getValues("fuelType");
      const typeCode = `${selectedManufacturer}-${vehicleType}`;

      const efficiency = findVehicleEfficiency(
        typeCode, 
        modelYear,
        currentFuelType
      );
      const vehicleCapacity = getVehicleCapacityFromCode(typeCode);
      const passengerCapacity = getPassengerCapacityFromCode(typeCode);
      const idleConsumption = calculateIdleFuelConsumption(typeCode, currentFuelType);

      form.setValue("fuelEfficiency", efficiency);
      form.setValue("numberOfPassengers", passengerCapacity);
      form.setValue("vehicleCapacity", vehicleCapacity);
      form.setValue("idleFuelConsumption", idleConsumption);
    }
  }, [vehicleType, form, selectedManufacturer]);

  // Update useEffect for fuel type changes
  useEffect(() => {
    const selectedFuelType = form.watch("fuelType");
    if (selectedFuelType && vehicleType && selectedManufacturer) {
      const typeCode = `${selectedManufacturer}-${vehicleType}`;
      const idleConsumption = calculateIdleFuelConsumption(typeCode, selectedFuelType);
      form.setValue("idleFuelConsumption", idleConsumption);
    }
  }, [form.watch("fuelType"), vehicleType, selectedManufacturer]);

  // Update fuel efficiency when model year or fuel type changes
  useEffect(() => {
    const modelYear = form.watch("modelYear");
    const currentType = form.getValues("vehicleType");
    const currentFuelType = form.getValues("fuelType");
    if (modelYear && currentType && selectedManufacturer && currentFuelType) {
      const efficiency = findVehicleEfficiency(
        `${selectedManufacturer}-${currentType}`,
        modelYear,
        currentFuelType
      );
      form.setValue("fuelEfficiency", efficiency);
    }
  }, [form.watch("modelYear"), form.watch("fuelType"), selectedManufacturer]);

  // Add effect to update CO2 emission factor when fuel type changes
  useEffect(() => {
    const selectedFuelType = form.watch("fuelType");
    if (selectedFuelType) {
      const co2Factor = calculateCO2EmissionFactor(selectedFuelType);
      form.setValue("co2EmissionFactor", co2Factor);
    }
  }, [form.watch("fuelType")]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Vehicle Group */}
          <FormField
            control={form.control}
            name="groupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Group *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                  disabled={loadingGroups}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select vehicle group"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingGroups ? (
                      <SelectItem value="loading" disabled>
                        Loading vehicle groups...
                      </SelectItem>
                    ) : vehicleGroups?.length ? (
                      vehicleGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No vehicle groups available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Manufacturer/Make field */}
          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer/Make *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear vehicle type when manufacturer changes
                    form.setValue("vehicleType", "");
                    form.setValue("vehicleTypeCode", "");
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {uaeManufacturers.map((manufacturer) => (
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

          {/* Model Year field */}
          <FormField
            control={form.control}
            name="modelYear"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Model Year *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value || "Select or type model year"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search or enter year..."
                        onValueChange={(search) => {
                          // Allow empty input for deletion
                          if (!search) {
                            field.onChange(undefined);
                            return;
                          }

                          // Convert to number and validate
                          const year = parseInt(search);
                          if (!isNaN(year) && year >= 1900 && year <= currentYear) {
                            field.onChange(year);

                            // Update vehicle type code if all required fields are present
                            const currentManufacturer = form.getValues("manufacturer");
                            const currentType = form.getValues("vehicleType");
                            if (currentManufacturer && currentType) {
                              form.setValue(
                                "vehicleTypeCode",
                                `${currentManufacturer.toUpperCase()}-${currentType.toUpperCase()}-${year}`
                              );
                            }
                          }
                        }}
                      />
                      <CommandEmpty>No matching year found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-auto">
                        {modelYears.map((year) => (
                          <CommandItem
                            value={year.toString()}
                            key={year}
                            onSelect={() => {
                              field.onChange(year);

                              // Update vehicle type code if all required fields are present
                              const currentManufacturer = form.getValues("manufacturer");
                              const currentType = form.getValues("vehicleType");
                              if (currentManufacturer && currentType) {
                                form.setValue(
                                  "vehicleTypeCode",
                                  `${currentManufacturer.toUpperCase()}-${currentType.toUpperCase()}-${year}`
                                );
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === year ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {year}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vehicle Type field */}
          <FormField
            control={form.control}
            name="vehicleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Type *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    const modelYear = form.getValues("modelYear");
                    const fuelType = form.getValues("fuelType"); 
                    const efficiency = findVehicleEfficiency(value, modelYear, fuelType); 
                    const currentManufacturer = form.getValues("manufacturer");

                    // Update vehicle type code and capacities
                    if (currentManufacturer && value && modelYear) {
                      const typeCode = `${currentManufacturer.toUpperCase()}-${value.toUpperCase()}-${modelYear}`;
                      form.setValue("vehicleTypeCode", typeCode);

                      // Update capacities based on the new type code
                      const passengerCapacity = getPassengerCapacityFromCode(typeCode);
                      const vehicleCapacity = getVehicleCapacityFromCode(typeCode);

                      form.setValue("numberOfPassengers", passengerCapacity);
                      form.setValue("vehicleCapacity", vehicleCapacity);
                      form.setValue("fuelEfficiency", efficiency);
                    }
                  }}
                  value={field.value}
                  disabled={!selectedManufacturer}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedManufacturer ? "Select vehicle model" : "Select manufacturer first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedManufacturer &&
                      uaeVehicleModels[selectedManufacturer]?.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vehicle Type Code field */}
          <FormField
            control={form.control}
            name="vehicleTypeCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Type Code *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Auto-generated from Manufacturer, Vehicle Type and Year"
                    {...field}
                    disabled
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fuel-related fields */}
          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuel Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
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
          <FormField
            control={form.control}
            name="fuelEfficiency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuel Efficiency (KM/L) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter fuel efficiency"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fuelPricePerLitre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuel Price Per Litre *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Current fuel price will be loaded"
                    {...field}
                    disabled
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CO2 Emission Factor field */}
          <FormField
            control={form.control}
            name="co2EmissionFactor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CO2 Emission Factor (kg/L) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Auto-calculated from fuel type"
                    {...field}
                    disabled
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Service Plan field */}
          <FormField
            control={form.control}
            name="servicePlan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Plan</FormLabel>
                <FormControl>
                  <Input placeholder="Enter service plan (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="costPerKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Per KM (Calculated) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    disabled
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numberOfPassengers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Passengers *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter number of passengers"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Alert Before field */}
          <FormField
            control={form.control}
            name="alertBefore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alert Before</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter alert before (optional)"
                    {...field}
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="idleFuelConsumption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Idle Fuel Consumption (L/H) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter idle fuel consumption"
                    {...field}
                    disabled
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Region, Department, Unit at the bottom */}
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
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

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter unit (optional)"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Added Vehicle Capacity Field */}
          <FormField
            control={form.control}
            name="vehicleCapacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Capacity (cubic feet) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter vehicle capacity"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">
          {isEditing ? "Update Vehicle Type" : "Create Vehicle Type"}
        </Button>
      </form>
    </Form>
  );
}