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
  });

  // Fetch current fuel prices
  const { data: fuelPrices } = useQuery({
    queryKey: ["/api/fuel-prices"],
    enabled: true,
  });

  const form = useForm<InsertVehicleTypeMaster>({
    resolver: zodResolver(insertVehicleTypeMasterSchema),
    defaultValues: {
      groupId: 0,
      vehicleTypeCode: "",
      manufacturer: "",
      modelYear: 0,
      numberOfPassengers: 0,
      region: "",
      section: "",
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
      vehicleCapacity: 0
    }
  });

  // Watch form values
  const fuelEfficiency = form.watch("fuelEfficiency");
  const fuelPricePerLitre = form.watch("fuelPricePerLitre");
  const selectedFuelType = form.watch("fuelType");
  const vehicleType = form.watch("vehicleType");
  const selectedManufacturer = form.watch("manufacturer");

  // Update cost per km when fuel efficiency or price changes
  const calculateCostPerKm = (fuelPrice: number, fuelEfficiency: number) => {
    if (fuelEfficiency <= 0) return 0;
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
        fuelType: initialData.fuelType || "Petrol"
      });
    }
  }, [initialData, form]);

  // Update fuel price when fuel type changes
  useEffect(() => {
    if (fuelPrices && selectedFuelType) {
      const price = fuelPrices[selectedFuelType.toLowerCase()];
      if (price) {
        form.setValue("fuelPricePerLitre", price);
      }
    }
  }, [selectedFuelType, fuelPrices, form]);

  // Update vehicle details when vehicle type changes
  useEffect(() => {
    if (vehicleType && selectedManufacturer) {
      const modelYear = form.getValues("modelYear");
      const currentFuelType = form.getValues("fuelType");
      const efficiency = findVehicleEfficiency(
        `${selectedManufacturer}-${vehicleType}`, 
        modelYear,
        currentFuelType
      );
      const vehicleCapacity = getVehicleCapacityFromCode(`${selectedManufacturer}-${vehicleType}`);
      const passengerCapacity = getPassengerCapacityFromCode(`${selectedManufacturer}-${vehicleType}`);

      form.setValue("fuelEfficiency", efficiency);
      form.setValue("numberOfPassengers", passengerCapacity);
      form.setValue("vehicleCapacity", vehicleCapacity);
    }
  }, [vehicleType, form, selectedManufacturer]);

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
              <FormItem>
                <FormLabel>Model Year *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const year = Number(value);
                    field.onChange(year);
                    // Update vehicle type code when all fields are available
                    const currentManufacturer = form.getValues("manufacturer");
                    const currentType = form.getValues("vehicleType");
                    if (currentManufacturer && currentType && year) {
                      form.setValue("vehicleTypeCode", `${currentManufacturer.toUpperCase()}-${currentType.toUpperCase()}-${year}`);
                    }
                  }}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {modelYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* Other fields */}
          <FormField
            control={form.control}
            name="servicePlan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Plan *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter service plan" {...field} />
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

          <FormField
            control={form.control}
            name="alertBefore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alert Before *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter alert before"
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
            name="idleFuelConsumption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Idle Fuel Consumption *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter idle fuel consumption"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Region, Department, Section, Unit at the bottom */}
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
            name="section"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter section (optional)"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
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