import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import axios from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VehicleTypeMaster,
  InsertVehicleTypeMaster,
} from "@shared/schema";

interface VehicleTypeFormProps {
  onSubmit: (data: InsertVehicleTypeMaster) => Promise<void>;
  initialData?: VehicleTypeMaster;
  isEditing?: boolean;
}

export function VehicleTypeForm({
  onSubmit,
  initialData,
  isEditing = false,
}: VehicleTypeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formReady, setFormReady] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<any>({
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

  // Data queries
  const { data: vehicleGroups = [] } = useQuery<any[]>({
    queryKey: ["/api/vehicle-groups"],
  });

  const { data: masters = { 
    manufacturers: [], 
    vehicleModels: {}, 
    servicePlans: [], 
    vehicleTypes: [], 
    units: [] 
  } } = useQuery<any>({
    queryKey: ["/api/masters"],
  });

  const { data: fuelTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/fuel-types"],
  });

  // Use the special form-data endpoint if in edit mode
  useEffect(() => {
    const loadFormData = async () => {
      if (initialData && isEditing) {
        try {
          // Use our special form-ready endpoint
          const response = await axios.get(`/api/vehicle-types/${initialData.id}/form-data`);
          console.log("Received form-ready data:", response.data);
          setFormData(response.data);
        } catch (error) {
          console.error("Error loading form data:", error);
          toast({
            title: "Error",
            description: "Failed to load form data",
            variant: "destructive",
          });
        } finally {
          setFormReady(true);
        }
      } else {
        setFormReady(true);
      }
    };
    
    loadFormData();
  }, [initialData, isEditing, toast]);

  // Handler for form submission
  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      setIsSubmitting(true);
      console.log("Submitting form with data:", formData);
      
      // Validate required fields
      if (!formData.vehicle_type_code) {
        throw new Error("Vehicle type code is required");
      }
      if (!formData.manufacturer) {
        throw new Error("Manufacturer is required");
      }
      if (!formData.vehicle_model) {
        throw new Error("Vehicle model is required");
      }
      if (!formData.fuel_type) {
        throw new Error("Fuel type is required");
      }
      
      // Prepare the submission data
      const submissionData = {
        ...formData,
        // Ensure string values are not null
        vehicle_type_code: formData.vehicle_type_code || "",
        vehicle_type_name: formData.vehicle_type_name || "",
        manufacturer: formData.manufacturer || "",
        vehicle_model: formData.vehicle_model || "",
        region: formData.region || "Abu Dhabi",
        fuel_type: formData.fuel_type || "",
        service_plan: formData.service_plan || "",
        vehicle_type: formData.vehicle_type || "",
        department: formData.department || "Fleet",
        unit: formData.unit || "",
        color: formData.color || "",
        
        // Ensure numeric values
        group_id: formData.group_id || 0,
        model_year: formData.model_year || new Date().getFullYear(),
        number_of_passengers: Number(formData.number_of_passengers) || 0,
        fuel_efficiency: Number(formData.fuel_efficiency) || 0,
        fuel_price_per_litre: Number(formData.fuel_price_per_litre) || 0,
        cost_per_km: Number(formData.cost_per_km) || 0,
        alert_before: Number(formData.alert_before) || 0,
        idle_fuel_consumption: Number(formData.idle_fuel_consumption) || 0,
        vehicle_capacity: Number(formData.vehicle_capacity) || 0,
        co2_emission_factor: Number(formData.co2_emission_factor) || 0,
      };
      
      console.log("Prepared submission data:", submissionData);
      
      // Call the parent's submit handler
      await onSubmit(submissionData);
      
      // Show success message
      toast({
        title: "Success",
        description: isEditing ? "Vehicle type updated successfully" : "Vehicle type created successfully",
      });
      
      // Reset form if not editing
      if (!isEditing) {
        setFormData({
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
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save vehicle type",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helpers to update form data
  const updateFormField = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle fuel type change to get price and CO2 factor
  const handleFuelTypeChange = (value: string) => {
    updateFormField("fuel_type", value);
    
    if (fuelTypes && Array.isArray(fuelTypes)) {
      const fuelData = fuelTypes.find((ft: any) => 
        ft?.type && ft.type === value
      );
      
      if (fuelData) {
        // Extract price
        if (fuelData.price !== undefined) {
          const price = typeof fuelData.price === 'string' 
            ? parseFloat(fuelData.price) 
            : fuelData.price;
          
          updateFormField("fuel_price_per_litre", price);
        }
        
        // Extract CO2 factor
        if (fuelData.co2_factor !== undefined) {
          const co2Factor = typeof fuelData.co2_factor === 'string'
            ? parseFloat(fuelData.co2_factor)
            : fuelData.co2_factor;
          
          updateFormField("co2_emission_factor", co2Factor);
        }
        
        // Calculate cost per km
        setTimeout(updateCostPerKm, 0);
      }
    }
  };

  // Handle model change to find model data
  const handleModelChange = (value: string) => {
    updateFormField("vehicle_model", value);
    
    // Update vehicle type name
    updateFormField("vehicle_type_name", `${formData.manufacturer || ""} ${value}`);
    
    // Generate vehicle type code
    if (formData.manufacturer) {
      const timestamp = Date.now().toString().slice(-4);
      const typeCode = `${formData.manufacturer.substring(0,3)}-${value.substring(0,3)}-${formData.model_year || new Date().getFullYear()}-${timestamp}`.toUpperCase();
      updateFormField("vehicle_type_code", typeCode);
    }
    
    // Try to find model data
    if (formData.manufacturer && masters?.vehicleModels && masters.vehicleModels[formData.manufacturer]) {
      const models = masters.vehicleModels[formData.manufacturer].models || [];
      const modelData = models.find((m: any) => m.name === value);
      
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
        setTimeout(updateCostPerKm, 0);
      }
    }
  };

  // Update cost per km based on fuel efficiency and price
  const updateCostPerKm = () => {
    const efficiency = formData.fuel_efficiency;
    const price = formData.fuel_price_per_litre;
    
    if (efficiency && price && efficiency > 0) {
      const costPerKm = Number((price / efficiency).toFixed(2));
      updateFormField("cost_per_km", costPerKm);
    }
  };

  // Handle fuel efficiency change to update cost per km
  const handleFuelEfficiencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateFormField("fuel_efficiency", isNaN(value) ? 0 : value);
    
    // Update cost per km
    setTimeout(updateCostPerKm, 0);
  };

  // Format display values
  const displayValue = (value: any) => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  // Show loading state
  if (!formReady) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading form data...</span>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6">
        <table className="w-full border-collapse">
          <tbody>
            {/* Row 1: Vehicle Group | Manufacturer */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vehicle Group</label>
                  <Select
                    value={formData.group_id?.toString() || "0"}
                    onValueChange={(value) => updateFormField("group_id", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle group" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleGroups && vehicleGroups.map((group: any) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
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
                    value={formData.manufacturer || ""}
                    onValueChange={(value) => {
                      updateFormField("manufacturer", value);
                      updateFormField("vehicle_model", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {masters?.manufacturers && masters.manufacturers.map((mfr: string) => (
                        <SelectItem key={mfr} value={mfr}>
                          {mfr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </td>
            </tr>

            {/* Row 2: Vehicle Model | Model Year */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vehicle Model</label>
                  <Select
                    value={formData.vehicle_model || ""}
                    onValueChange={handleModelChange}
                    disabled={!formData.manufacturer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.manufacturer && masters?.vehicleModels && masters.vehicleModels[formData.manufacturer]?.models?.map(
                        (model: any) => (
                          <SelectItem key={model.name} value={model.name}>
                            {model.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Model Year</label>
                  <Input
                    type="number"
                    value={displayValue(formData.model_year)}
                    onChange={(e) => updateFormField("model_year", parseInt(e.target.value) || new Date().getFullYear())}
                  />
                </div>
              </td>
            </tr>

            {/* Row 3: Vehicle Type | Vehicle Type Name */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vehicle Category</label>
                  <Select
                    value={formData.vehicle_type || ""}
                    onValueChange={(value) => updateFormField("vehicle_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {masters?.vehicleTypes && masters.vehicleTypes.map((type: string) => (
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
                    value={displayValue(formData.vehicle_type_name)}
                    onChange={(e) => updateFormField("vehicle_type_name", e.target.value)}
                  />
                </div>
              </td>
            </tr>

            {/* Row 4: Fuel Type | Fuel Price */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fuel Type</label>
                  <Select
                    value={formData.fuel_type || ""}
                    onValueChange={handleFuelTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes && Array.isArray(fuelTypes) && fuelTypes.map((ft: any) => (
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
                    value={displayValue(formData.fuel_price_per_litre)}
                    readOnly
                  />
                </div>
              </td>
            </tr>

            {/* Row 5: Fuel Efficiency | Cost Per KM */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fuel Efficiency (km/l)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={displayValue(formData.fuel_efficiency)}
                    onChange={handleFuelEfficiencyChange}
                  />
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Cost Per KM</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={displayValue(formData.cost_per_km)}
                    readOnly
                  />
                </div>
              </td>
            </tr>

            {/* Row 6: Idle Fuel Consumption | CO2 Emission Factor */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Idle Fuel Consumption</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={displayValue(formData.idle_fuel_consumption)}
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
                    value={displayValue(formData.co2_emission_factor)}
                    readOnly
                  />
                </div>
              </td>
            </tr>

            {/* Row 7: Passengers | Vehicle Capacity */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Number of Passengers</label>
                  <Input
                    type="number"
                    value={displayValue(formData.number_of_passengers)}
                    onChange={(e) => updateFormField("number_of_passengers", parseInt(e.target.value) || 0)}
                  />
                </div>
              </td>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vehicle Capacity</label>
                  <Input
                    type="number"
                    value={displayValue(formData.vehicle_capacity)}
                    onChange={(e) => updateFormField("vehicle_capacity", parseInt(e.target.value) || 0)}
                  />
                </div>
              </td>
            </tr>

            {/* Row 8: Service Plan | Alert Before */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Service Plan</label>
                  <Select
                    value={formData.service_plan || ""}
                    onValueChange={(value) => updateFormField("service_plan", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {masters?.servicePlans && masters.servicePlans.map((plan: string) => (
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
                    value={displayValue(formData.alert_before)}
                    onChange={(e) => updateFormField("alert_before", parseInt(e.target.value) || 0)}
                  />
                </div>
              </td>
            </tr>

            {/* Row 9: Region | Department */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Region</label>
                  <Select
                    value={formData.region || "Abu Dhabi"}
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
                    value={formData.department || "Fleet"}
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

            {/* Row 10: Unit | Vehicle Type Code */}
            <tr>
              <td className="border p-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Unit</label>
                  <Select
                    value={formData.unit || ""}
                    onValueChange={(value) => updateFormField("unit", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {masters?.units && masters.units.map((unitItem: string) => (
                        <SelectItem key={unitItem} value={unitItem}>
                          {unitItem}
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
                    value={displayValue(formData.vehicle_type_code)}
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