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

// Define default passenger capacities for common vehicle models
const defaultPassengerCapacity: { [key: string]: number } = {
  // Sedans
  "Toyota Corolla": 5,
  "Honda Civic": 5,
  "Toyota Camry": 5,
  "Honda Accord": 5,
  "Nissan Altima": 5,

  // SUVs
  "Toyota RAV4": 5,
  "Honda CR-V": 5,
  "Nissan X-Trail": 7,
  "Ford Explorer": 7,
  "Hyundai Tucson": 5,

  // Vans
  "Toyota Hiace": 12,
  "Ford Transit": 15,
  "Mercedes Sprinter": 14,
  "Hyundai H1": 12,

  // Buses
  "Toyota Coaster": 23,
  "Mercedes Bus": 45,
  "Volvo Bus": 50,

  // Trucks
  "Toyota Tundra": 5,
  "Ford F-150": 5,
  "Chevrolet Silverado": 5,

  // Ambulances
  "Toyota Ambulance": 4,
  "Mercedes Ambulance": 4,
  "Ford Ambulance": 4
};

// Vehicle categories for passenger capacity matching
const vehicleCategoryPassengers: { [key: string]: number } = {
  "Sedan": 5,
  "SUV": 7,
  "Van": 12,
  "Bus": 30,
  "Truck": 5,
  "Ambulance": 4
};

function findPassengerCapacity(vehicleType: string): number {
  // Direct match
  if (defaultPassengerCapacity[vehicleType]) {
    return defaultPassengerCapacity[vehicleType];
  }

  // Case-insensitive search
  const lowerVehicleType = vehicleType.toLowerCase();

  // Check exact matches first
  for (const [model, capacity] of Object.entries(defaultPassengerCapacity)) {
    if (model.toLowerCase() === lowerVehicleType) {
      return capacity;
    }
  }

  // Check category matches
  for (const [category, capacity] of Object.entries(vehicleCategoryPassengers)) {
    if (lowerVehicleType.includes(category.toLowerCase())) {
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

function findVehicleEfficiency(vehicleType: string): number {
  // Direct match
  if (defaultFuelEfficiency[vehicleType]) {
    return defaultFuelEfficiency[vehicleType];
  }

  // Case-insensitive search
  const lowerVehicleType = vehicleType.toLowerCase();

  // Check exact matches first
  for (const [model, efficiency] of Object.entries(defaultFuelEfficiency)) {
    if (model.toLowerCase() === lowerVehicleType) {
      return efficiency;
    }
  }

  // Check category matches
  for (const [category, keywords] of Object.entries(vehicleCategories)) {
    if (keywords.some(keyword => lowerVehicleType.includes(keyword))) {
      // Return average efficiency for this category
      const categoryVehicles = Object.entries(defaultFuelEfficiency)
        .filter(([model]) => keywords.some(keyword => model.toLowerCase().includes(keyword)));

      if (categoryVehicles.length > 0) {
        const avgEfficiency = categoryVehicles.reduce((sum, [_, eff]) => sum + eff, 0) / categoryVehicles.length;
        return Number(avgEfficiency.toFixed(1));
      }
    }
  }

  // Default values based on broad categories
  if (lowerVehicleType.includes("suv")) return 11;
  if (lowerVehicleType.includes("van")) return 9;
  if (lowerVehicleType.includes("bus")) return 6;
  if (lowerVehicleType.includes("truck")) return 7.5;
  if (lowerVehicleType.includes("ambulance")) return 8;

  return 12; // Default to sedan-like efficiency
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
    enabled: true, // Enable the query to fetch prices
  });

  const form = useForm<InsertVehicleTypeMaster>({
    resolver: zodResolver(insertVehicleTypeMasterSchema),
    defaultValues: {
      groupId: 0,
      vehicleTypeCode: "",
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
      vehicleVolume: 0
    }
  });

  // Function to calculate cost per km
  const calculateCostPerKm = (fuelPrice: number, fuelEfficiency: number) => {
    if (fuelEfficiency <= 0) return 0;
    return Number((fuelPrice / fuelEfficiency).toFixed(2));
  };

  // Watch values
  const fuelEfficiency = form.watch("fuelEfficiency");
  const fuelPricePerLitre = form.watch("fuelPricePerLitre");
  const selectedFuelType = form.watch("fuelType");
  const vehicleType = form.watch("vehicleType");

  // Update cost per km when fuel efficiency or price changes
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

  // Update fuel efficiency and passenger capacity when vehicle type changes
  useEffect(() => {
    if (vehicleType) {
      const efficiency = findVehicleEfficiency(vehicleType);
      const capacity = findPassengerCapacity(vehicleType);
      form.setValue("fuelEfficiency", efficiency);
      form.setValue("numberOfPassengers", capacity);
    }
  }, [vehicleType, form]);

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

          {/* Vehicle Type Code field */}
          <FormField
            control={form.control}
            name="vehicleTypeCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Type Code *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter vehicle type code" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input 
                    placeholder="Enter vehicle type" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      const efficiency = findVehicleEfficiency(e.target.value);
                      const capacity = findPassengerCapacity(e.target.value);
                      form.setValue("fuelEfficiency", efficiency);
                      form.setValue("numberOfPassengers", capacity);
                    }}
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
        </div>

        <Button type="submit" className="w-full">
          {isEditing ? "Update Vehicle Type" : "Create Vehicle Type"}
        </Button>
      </form>
    </Form>
  );
}