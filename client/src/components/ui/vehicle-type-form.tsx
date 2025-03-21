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


// Define default fuel efficiency values for common vehicle models
const defaultFuelEfficiency: { [key: string]: number } = {
  // Sedans
  "Toyota Corolla": 14,
  "Honda Civic": 13.5,
  "Toyota Camry": 12.5,
  "Honda Accord": 12,
  "Nissan Altima": 13,

  // SUVs
  "Toyota RAV4": 11,
  "Honda CR-V": 10.5,
  "Nissan X-Trail": 10,
  "Ford Explorer": 9,
  "Hyundai Tucson": 11.5,

  // Vans
  "Toyota Hiace": 9,
  "Ford Transit": 8.5,
  "Mercedes Sprinter": 8,
  "Hyundai H1": 9.5,

  // Buses
  "Toyota Coaster": 6,
  "Mercedes Bus": 5.5,
  "Volvo Bus": 5,

  // Trucks
  "Toyota Tundra": 7,
  "Ford F-150": 8,
  "Chevrolet Silverado": 7.5,

  // Ambulances
  "Toyota Ambulance": 8,
  "Mercedes Ambulance": 7.5,
  "Ford Ambulance": 8
};

// Vehicle categories for matching
const vehicleCategories: { [key: string]: string[] } = {
  "Sedan": ["corolla", "civic", "camry", "accord", "altima"],
  "SUV": ["rav4", "cr-v", "x-trail", "explorer", "tucson"],
  "Van": ["hiace", "transit", "sprinter", "h1"],
  "Bus": ["coaster", "bus"],
  "Truck": ["tundra", "f-150", "silverado"],
  "Ambulance": ["ambulance"]
};

// Add after default fuel efficiency
function calculateAgeBasedEfficiencyAdjustment(modelYear: number): number {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - modelYear;

  // Efficiency degradation based on age:
  // - New to 3 years: 100% efficiency
  // - 3-5 years: 97% efficiency
  // - 5-7 years: 95% efficiency
  // - 7-10 years: 92% efficiency
  // - 10+ years: 90% efficiency
  if (vehicleAge <= 3) return 1;
  if (vehicleAge <= 5) return 0.97;
  if (vehicleAge <= 7) return 0.95;
  if (vehicleAge <= 10) return 0.92;
  return 0.90;
}

function findVehicleEfficiency(vehicleType: string, modelYear: number): number {
  let baseEfficiency = 0;

  // Direct match
  if (defaultFuelEfficiency[vehicleType]) {
    baseEfficiency = defaultFuelEfficiency[vehicleType];
  } else {
    // Case-insensitive search
    const lowerVehicleType = vehicleType.toLowerCase();

    // Check exact matches first
    for (const [model, efficiency] of Object.entries(defaultFuelEfficiency)) {
      if (model.toLowerCase() === lowerVehicleType) {
        baseEfficiency = efficiency;
        break;
      }
    }

    // If no exact match, check category matches
    if (baseEfficiency === 0) {
      for (const [category, keywords] of Object.entries(vehicleCategories)) {
        if (keywords.some(keyword => lowerVehicleType.includes(keyword))) {
          // Return average efficiency for this category
          const categoryVehicles = Object.entries(defaultFuelEfficiency)
            .filter(([model]) => keywords.some(keyword => model.toLowerCase().includes(keyword)));

          if (categoryVehicles.length > 0) {
            baseEfficiency = categoryVehicles.reduce((sum, [_, eff]) => sum + eff, 0) / categoryVehicles.length;
          }
          break;
        }
      }
    }

    // If still no match, use default values based on broad categories
    if (baseEfficiency === 0) {
      if (lowerVehicleType.includes("suv")) baseEfficiency = 11;
      else if (lowerVehicleType.includes("van")) baseEfficiency = 9;
      else if (lowerVehicleType.includes("bus")) baseEfficiency = 6;
      else if (lowerVehicleType.includes("truck")) baseEfficiency = 7.5;
      else if (lowerVehicleType.includes("ambulance")) baseEfficiency = 8;
      else baseEfficiency = 12; // Default to sedan-like efficiency
    }
  }

  // Apply age-based efficiency adjustment
  const ageAdjustment = calculateAgeBasedEfficiencyAdjustment(modelYear);
  const adjustedEfficiency = baseEfficiency * ageAdjustment;

  // Return with 1 decimal place precision
  return Number(adjustedEfficiency.toFixed(1));
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
    if (vehicleType) {
      const modelYear = form.getValues("modelYear");
      const efficiency = findVehicleEfficiency(vehicleType, modelYear);
      const capacity = findPassengerCapacity(vehicleType);
      const vehicleCapacity = findVehicleCapacity(vehicleType);
      form.setValue("fuelEfficiency", efficiency);
      form.setValue("numberOfPassengers", capacity);
      form.setValue("vehicleCapacity", vehicleCapacity);
    }
  }, [vehicleType, form]);

  // Update fuel efficiency when model year changes
  useEffect(() => {
    const modelYear = form.watch("modelYear");
    const currentType = form.getValues("vehicleType");
    if (modelYear && currentType) {
      const efficiency = findVehicleEfficiency(currentType, modelYear);
      form.setValue("fuelEfficiency", efficiency);
    }
  }, [form.watch("modelYear")]);

  // Add watchers for vehicle type code updates
  useEffect(() => {
    const vehicleTypeCode = form.watch("vehicleTypeCode");
    if (vehicleTypeCode) {
      const passengerCapacity = getPassengerCapacityFromCode(vehicleTypeCode);
      const vehicleCapacity = getVehicleCapacityFromCode(vehicleTypeCode);

      form.setValue("numberOfPassengers", passengerCapacity);
      form.setValue("vehicleCapacity", vehicleCapacity);
    }
  }, [form.watch("vehicleTypeCode")]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Vehicle Group at the top */}
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
                    // Update vehicle type code
                    const currentType = form.getValues("vehicleType");
                    const currentYear = form.getValues("modelYear");
                    if (value && currentType && currentYear) {
                      form.setValue("vehicleTypeCode", `${value.toUpperCase()}-${currentType.toUpperCase()}-${currentYear}`);
                    }
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
                    const efficiency = findVehicleEfficiency(value, modelYear);
                    const capacity = findPassengerCapacity(value);
                    const vehicleCapacity = findVehicleCapacity(value);
                    form.setValue("fuelEfficiency", efficiency);
                    form.setValue("numberOfPassengers", capacity);
                    form.setValue("vehicleCapacity", vehicleCapacity);

                    // Update vehicle type code when all fields are available
                    const currentManufacturer = form.getValues("manufacturer");
                    const currentYear = form.getValues("modelYear");
                    if (currentManufacturer && value && currentYear) {
                      form.setValue("vehicleTypeCode", `${currentManufacturer.toUpperCase()}-${value.toUpperCase()}-${currentYear}`);
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

          {/* Vehicle Type Code field - moved after Vehicle Type */}
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
          <FormField
            control={form.control}
            name="vehicleVolume"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Volume *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter vehicle volume"
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