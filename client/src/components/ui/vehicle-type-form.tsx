import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  Select,
  SelectContent,
  SelectItem as BaseSelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Create a safe version of SelectItem that guarantees the value is not an empty string
const SelectItem = (props: React.ComponentProps<typeof BaseSelectItem>) => {
  // If value is empty or undefined, use a default value
  const safeValue = props.value && String(props.value).trim() !== '' 
    ? props.value 
    : `item-${Math.random().toString(36).substring(2, 11)}`;
  
  return <BaseSelectItem {...props} value={safeValue} />;
};

interface VehicleTypeFormProps {
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isEditing?: boolean;
}

export function VehicleTypeForm({
  onSubmit,
  initialData,
  isEditing = false,
}: VehicleTypeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);
  
  // Basic form data
  const [formState, setFormState] = useState({
    group_id: 0,
    vehicle_type_code: "",
    vehicle_type_name: "",
    manufacturer: "",
    vehicle_model: "",
    model_year: new Date().getFullYear(),
    number_of_passengers: 0,
    region: "Abu Dhabi",
    fuel_efficiency: 0,
    fuel_price_per_litre: 0,
    fuel_type: "",
    service_plan: "",
    cost_per_km: 0,
    vehicle_type: "",
    department: "Fleet",
    unit: "",
    alert_before: 0,
    idle_fuel_consumption: 0,
    vehicle_capacity: 0,
    co2_emission_factor: 0,
    color: "",
  });

  // Form options
  const [vehicleGroups, setVehicleGroups] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [vehicleModels, setVehicleModels] = useState<any>({});
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [servicePlans, setServicePlans] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<any[]>([]);

  // Load all form options on mount
  useEffect(() => {
    async function loadOptions() {
      try {
        // Load vehicle groups
        const groupsResponse = await fetch('/api/vehicle-groups');
        const groupsData = await groupsResponse.json();
        
        // Ensure we have valid vehicle groups with IDs
        const validGroups = (groupsData || []).filter((group: any) => 
          group && group.id !== undefined && group.id !== null
        );
        setVehicleGroups(validGroups);
        
        // Load masters data (manufacturers, models, etc.)
        const mastersResponse = await fetch('/api/vehicle-masters');
        const mastersData = await mastersResponse.json();
        console.log("Loaded masters data:", mastersData);
        
        // Ensure manufacturers are valid strings
        const validManufacturers = (mastersData?.manufacturers || [])
          .filter((m: any) => m && typeof m === 'string' && m.trim() !== '');
        setManufacturers(validManufacturers);
        
        setVehicleModels(mastersData?.vehicleModels || {});
        
        // Extract vehicle types or use defaults, ensuring no empty values
        const extractedTypes = mastersData?.vehicleModels ? 
          Array.from(new Set([].concat(...Object.values(mastersData.vehicleModels)
            .flatMap((brand: any) => brand.models?.flatMap((model: any) => model.categories) || [])))) 
          : [];
        
        const defaultVehicleTypes = [
          "SEDAN", "SUV", "VAN", "TRUCK", "COUPE", "HATCHBACK", "WAGON", "CONVERTIBLE", 
          "MINIVAN", "PICKUP", "BUS", "CROSSOVER", "LUXURY", "SPORT"
        ];
        
        let vehicleTypesToUse = extractedTypes.length > 0 ? extractedTypes : defaultVehicleTypes;
        vehicleTypesToUse = vehicleTypesToUse.filter((vt: any) => 
          vt && typeof vt === 'string' && vt.trim() !== ''
        );
        
        // If we filtered everything out, use default types
        if (vehicleTypesToUse.length === 0) {
          vehicleTypesToUse = defaultVehicleTypes;
        }
        
        setVehicleTypes(vehicleTypesToUse);
        
        // Extract service plans or use defaults, ensuring no empty values
        const extractedPlans = (mastersData?.servicePlans || [])
          .map((plan: any) => plan.name)
          .filter((name: any) => name && typeof name === 'string' && name.trim() !== '');
        
        const defaultServicePlans = [
          "Basic Service Plan", "Standard Service Plan", "Premium Service Plan", 
          "BASIC", "STANDARD", "PREMIUM"
        ];
        
        setServicePlans(extractedPlans.length > 0 ? extractedPlans : defaultServicePlans);
        
        // Extract units or use defaults, ensuring no empty values
        const extractedUnits = (mastersData?.units || [])
          .filter((unit: any) => unit && typeof unit === 'string' && unit.trim() !== '');
        
        const defaultUnits = [
          "Fleet Operations", "Maintenance", "Emergency Response", "Patient Transport",
          "Special Operations", "General Transport", "VIP Services"
        ];
        
        setUnits(extractedUnits.length > 0 ? extractedUnits : defaultUnits);
        
        // Load fuel types
        const fuelResponse = await fetch('/api/fuel-types');
        const fuelData = await fuelResponse.json();
        
        // Ensure all fuel types have valid values
        const validFuelTypes = (fuelData || []).filter((ft: any) => 
          ft && ft.id !== undefined && ft.id !== null && 
          ft.type && typeof ft.type === 'string' && ft.type.trim() !== ''
        );
        
        console.log("Filtered fuel types:", validFuelTypes);
        setFuelTypes(validFuelTypes);
        
        // Load existing data if we're editing
        if (initialData && isEditing) {
          if (initialData.id) {
            const response = await fetch(`/api/vehicle-types/${initialData.id}/form-data`);
            if (response.ok) {
              const data = await response.json();
              console.log("Loaded form data:", data);
              setFormState({
                ...formState,
                ...data,
                group_id: data.group_id || 0,
                vehicle_type_code: data.vehicle_type_code || "",
                vehicle_type_name: data.vehicle_type_name || "",
                manufacturer: data.manufacturer || "",
                vehicle_model: data.vehicle_model || "",
                model_year: data.model_year || new Date().getFullYear(),
                number_of_passengers: data.number_of_passengers || 0,
                region: data.region || "Abu Dhabi",
                fuel_efficiency: typeof data.fuel_efficiency === 'string' ? 
                  parseFloat(data.fuel_efficiency) : (data.fuel_efficiency || 0),
                fuel_price_per_litre: typeof data.fuel_price_per_litre === 'string' ? 
                  parseFloat(data.fuel_price_per_litre) : (data.fuel_price_per_litre || 0),
                fuel_type: data.fuel_type || "",
                service_plan: data.service_plan || "",
                cost_per_km: typeof data.cost_per_km === 'string' ? 
                  parseFloat(data.cost_per_km) : (data.cost_per_km || 0),
                vehicle_type: data.vehicle_type || "",
                department: data.department || "Fleet",
                unit: data.unit || "",
                alert_before: data.alert_before || 0,
                idle_fuel_consumption: typeof data.idle_fuel_consumption === 'string' ? 
                  parseFloat(data.idle_fuel_consumption) : (data.idle_fuel_consumption || 0),
                vehicle_capacity: data.vehicle_capacity || 0,
                co2_emission_factor: typeof data.co2_emission_factor === 'string' ? 
                  parseFloat(data.co2_emission_factor) : (data.co2_emission_factor || 0),
                color: data.color || "",
              });
            } else {
              console.error("Failed to load form data:", await response.text());
              toast({
                title: "Error",
                description: "Failed to load vehicle type data",
                variant: "destructive",
              });
            }
          }
        }
        
      } catch (err) {
        console.error("Error loading form options:", err);
        toast({
          title: "Error",
          description: "Failed to load form options",
          variant: "destructive",
        });
      } finally {
        setIsFormReady(true);
      }
    }
    
    loadOptions();
  }, [initialData, isEditing, toast]);

  // Form value updater
  const updateFormField = (field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for fuel type change
  const handleFuelTypeChange = (value: string) => {
    if (value === "default-fuel-option") {
      // Don't update if it's the default placeholder option
      return;
    }
    
    updateFormField("fuel_type", value);
    
    const fuelTypeData = fuelTypes.find(ft => ft.type === value);
    if (fuelTypeData) {
      const price = typeof fuelTypeData.price === 'string' ? 
        parseFloat(fuelTypeData.price) : fuelTypeData.price;
      updateFormField("fuel_price_per_litre", price || 0);
      
      const co2Factor = typeof fuelTypeData.co2_factor === 'string' ?
        parseFloat(fuelTypeData.co2_factor) : fuelTypeData.co2_factor;
      updateFormField("co2_emission_factor", co2Factor || 0);
      
      // Update cost per km
      setTimeout(calculateCostPerKm, 0);
    }
  };

  // Function to update vehicle type code
  const updateVehicleTypeCode = (manufacturer: string, model: string, year: number) => {
    if (!manufacturer || !model || !year) {
      console.log("Missing data for code generation");
      return;
    }
    
    // Update code format to MFR-MODEL-YEAR
    const mfr = manufacturer.substring(0, 3);
    const modelPrefix = model.substring(0, 3);
    
    // Generate code combining manufacturer, model, and year
    const uniqueCode = `${mfr}-${modelPrefix}-${year}`.toUpperCase();
    updateFormField("vehicle_type_code", uniqueCode);
    
    console.log("Generated vehicle type code:", uniqueCode);
  };

  // Calculate cost per km based on fuel efficiency and price
  const calculateCostPerKm = () => {
    const efficiency = formState.fuel_efficiency;
    const price = formState.fuel_price_per_litre;
    
    if (efficiency && price && efficiency > 0) {
      const costPerKm = Number((price / efficiency).toFixed(2));
      updateFormField("cost_per_km", costPerKm);
    }
  };

  // Handle manufacturer change
  const handleManufacturerChange = (value: string) => {
    updateFormField("manufacturer", value);
    updateFormField("vehicle_model", "");
    
    // Don't generate code yet, wait for model year to be selected
    console.log("Manufacturer changed, waiting for model year to update vehicle type code");
  };

  // Handle model change
  const handleModelChange = (value: string) => {
    updateFormField("vehicle_model", value);
    
    // Auto-generate vehicle type name
    updateFormField("vehicle_type_name", `${formState.manufacturer} ${value}`);
    
    // Only generate the code if we have manufacturer, model and year
    if (formState.manufacturer && value && formState.model_year) {
      updateVehicleTypeCode(formState.manufacturer, value, formState.model_year);
    } else {
      console.log("Need manufacturer, model and year to generate vehicle type code");
    }
    
    // Load model data if available
    if (vehicleModels[formState.manufacturer]) {
      const modelData = vehicleModels[formState.manufacturer].models?.find(
        (m: any) => m.name === value
      );
      
      if (modelData) {
        if (modelData.efficiency) {
          updateFormField("fuel_efficiency", parseFloat(modelData.efficiency));
        }
        if (modelData.capacity) {
          updateFormField("vehicle_capacity", parseFloat(modelData.capacity));
        }
        if (modelData.idleConsumption) {
          updateFormField("idle_fuel_consumption", parseFloat(modelData.idleConsumption));
        }
        if (modelData.passengerCapacity) {
          updateFormField("number_of_passengers", parseInt(modelData.passengerCapacity));
        }
        
        // Recalculate cost per km
        setTimeout(calculateCostPerKm, 0);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formState.vehicle_type_code) throw new Error("Vehicle type code is required");
      if (!formState.manufacturer) throw new Error("Manufacturer is required");
      if (!formState.vehicle_model) throw new Error("Vehicle model is required");
      if (!formState.fuel_type) throw new Error("Fuel type is required");
      
      console.log("Submitting form with data:", formState);
      
      // Format data for API
      const submissionData = {
        ...formState,
        // Ensure correct data types
        group_id: Number(formState.group_id),
        model_year: Number(formState.model_year),
        number_of_passengers: Number(formState.number_of_passengers),
        alert_before: Number(formState.alert_before),
        vehicle_capacity: Number(formState.vehicle_capacity),
        
        // Convert numbers to strings for database
        fuel_efficiency: formState.fuel_efficiency.toString(),
        fuel_price_per_litre: formState.fuel_price_per_litre.toString(),
        cost_per_km: formState.cost_per_km.toString(),
        idle_fuel_consumption: formState.idle_fuel_consumption.toString(),
        co2_emission_factor: formState.co2_emission_factor.toString(),
      };
      
      console.log("Prepared submission data:", submissionData);
      
      // Submit to parent
      await onSubmit(submissionData);
      
      // Show success toast
      toast({
        title: "Success",
        description: isEditing ? "Vehicle type updated" : "New vehicle type created",
      });
      
      // Reset form if it's a new record
      if (!isEditing) {
        setFormState({
          group_id: 0,
          vehicle_type_code: "",
          vehicle_type_name: "",
          manufacturer: "",
          vehicle_model: "",
          model_year: new Date().getFullYear(),
          number_of_passengers: 0,
          region: "Abu Dhabi",
          fuel_efficiency: 0,
          fuel_price_per_litre: 0,
          fuel_type: "",
          service_plan: "",
          cost_per_km: 0,
          vehicle_type: "",
          department: "Fleet",
          unit: "",
          alert_before: 0,
          idle_fuel_consumption: 0,
          vehicle_capacity: 0,
          co2_emission_factor: 0,
          color: "",
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save vehicle type",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state if form isn't ready
  if (!isFormReady) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading form data...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6">
        <table className="w-full border-collapse">
          <tbody>
            {/* Row 1: Vehicle Group and Manufacturer */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vehicle Group</label>
                  <Select
                    value={String(formState.group_id || 0)}
                    onValueChange={(value) => updateFormField("group_id", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      {vehicleGroups.map((group) => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Manufacturer</label>
                  <Select
                    value={formState.manufacturer}
                    onValueChange={handleManufacturerChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map((mfr) => (
                        <SelectItem key={mfr} value={mfr}>
                          {mfr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </td>
            </tr>

            {/* Row 2: Vehicle Model and Model Year */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vehicle Model</label>
                  <Select
                    value={formState.vehicle_model}
                    onValueChange={handleModelChange}
                    disabled={!formState.manufacturer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {formState.manufacturer &&
                        vehicleModels[formState.manufacturer]?.models.map((model: any) => (
                          <SelectItem key={model.name} value={model.name}>
                            {model.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Model Year</label>
                  <Input
                    type="number"
                    value={formState.model_year}
                    onChange={(e) => {
                      const year = parseInt(e.target.value) || new Date().getFullYear();
                      updateFormField("model_year", year);
                      
                      if (formState.manufacturer && formState.vehicle_model && year) {
                        updateVehicleTypeCode(formState.manufacturer, formState.vehicle_model, year);
                      }
                    }}
                    min={1950}
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </td>
            </tr>

            {/* Row 3: Vehicle Category and Vehicle Type Name */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vehicle Category</label>
                  <Select
                    value={formState.vehicle_type}
                    onValueChange={(value) => updateFormField("vehicle_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle category" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vehicle Type Name</label>
                  <Input
                    value={formState.vehicle_type_name}
                    onChange={(e) => updateFormField("vehicle_type_name", e.target.value)}
                  />
                </div>
              </td>
            </tr>

            {/* Row 4: Fuel Type and Fuel Price */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fuel Type</label>
                  <Select
                    value={formState.fuel_type || "default-fuel-option"}
                    onValueChange={handleFuelTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Add a default option with a guaranteed non-empty value */}
                      <SelectItem value="default-fuel-option">Select fuel type</SelectItem>
                      
                      {/* Only map over fuel types that have valid non-empty type values */}
                      {fuelTypes
                        .filter(ft => ft && ft.id && ft.type && typeof ft.type === 'string' && ft.type.trim() !== '')
                        .map((ft) => (
                          <SelectItem key={ft.id} value={ft.type}>
                            {ft.type}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fuel Price Per Litre (AED)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formState.fuel_price_per_litre}
                    readOnly
                  />
                </div>
              </td>
            </tr>

            {/* Row 5: Fuel Efficiency and Cost per KM */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fuel Efficiency (km/l)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formState.fuel_efficiency}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      updateFormField("fuel_efficiency", value);
                      setTimeout(calculateCostPerKm, 0);
                    }}
                  />
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Cost Per KM</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formState.cost_per_km}
                    readOnly
                  />
                </div>
              </td>
            </tr>

            {/* Row 6: Idle Fuel Consumption and CO2 */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Idle Fuel Consumption</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formState.idle_fuel_consumption}
                    onChange={(e) => updateFormField("idle_fuel_consumption", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">CO2 Emission Factor</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formState.co2_emission_factor}
                    readOnly
                  />
                </div>
              </td>
            </tr>

            {/* Row 7: Passengers and Capacity */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Number of Passengers</label>
                  <Input
                    type="number"
                    value={formState.number_of_passengers}
                    onChange={(e) => updateFormField("number_of_passengers", parseInt(e.target.value) || 0)}
                  />
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vehicle Capacity</label>
                  <Input
                    type="number"
                    value={formState.vehicle_capacity}
                    onChange={(e) => updateFormField("vehicle_capacity", parseInt(e.target.value) || 0)}
                  />
                </div>
              </td>
            </tr>

            {/* Row 8: Service Plan and Alert Before */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Service Plan</label>
                  <Select
                    value={formState.service_plan}
                    onValueChange={(value) => updateFormField("service_plan", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicePlans.map((plan) => (
                        <SelectItem key={plan} value={plan}>
                          {plan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Alert Before Value (KM)</label>
                  <Input
                    type="number"
                    value={formState.alert_before}
                    onChange={(e) => updateFormField("alert_before", parseInt(e.target.value) || 0)}
                  />
                </div>
              </td>
            </tr>

            {/* Row 9: Region and Department */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Region</label>
                  <Select
                    value={formState.region}
                    onValueChange={(value) => updateFormField("region", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                      <SelectItem value="Sharjah">Sharjah</SelectItem>
                      <SelectItem value="Ajman">Ajman</SelectItem>
                      <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                      <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                      <SelectItem value="Fujairah">Fujairah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={formState.department}
                    onValueChange={(value) => updateFormField("department", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fleet">Fleet</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Logistics">Logistics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </td>
            </tr>

            {/* Row 10: Unit and Type Code */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Unit</label>
                  <Select
                    value={formState.unit}
                    onValueChange={(value) => updateFormField("unit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vehicle Type Code</label>
                  <Input
                    value={formState.vehicle_type_code}
                    onChange={(e) => updateFormField("vehicle_type_code", e.target.value)}
                    readOnly={isEditing}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end px-6 pb-3">
        <Button 
          type="submit" 
          className="mr-2" 
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditing ? "Update" : "Create"} Vehicle Type
        </Button>
      </div>
    </form>
  );
}