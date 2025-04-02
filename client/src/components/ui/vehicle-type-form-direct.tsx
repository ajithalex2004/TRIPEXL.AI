import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
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
  
  // Local state for select fields
  const [manufacturer, setManufacturer] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [vehicleGroup, setVehicleGroup] = useState("");
  const [region, setRegion] = useState("Abu Dhabi");
  const [department, setDepartment] = useState("Fleet");
  const [serviceType, setServiceType] = useState("");
  const [unit, setUnit] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState("");

  // State for form values
  const [formData, setFormData] = useState<Partial<InsertVehicleTypeMaster>>({
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
  const { data: vehicleGroups } = useQuery({
    queryKey: ["/api/vehicle-groups"],
    select: (data) => data || [],
  });

  const { data: masters } = useQuery({
    queryKey: ["/api/masters"],
    select: (data) => data || {
      manufacturers: [],
      vehicleModels: {},
      vehicleTypes: [],
      servicePlans: [],
      units: [],
    },
  });

  const { data: fuelTypes } = useQuery({
    queryKey: ["/api/fuel-types"],
    select: (data) => data || [],
  });

  // Handle initial data
  useEffect(() => {
    if (initialData && isEditing) {
      console.log("Setting initial form data:", initialData);
      
      // Set select field values
      setManufacturer(initialData.manufacturer || "");
      setVehicleModel(initialData.vehicle_model || "");
      setFuelType(initialData.fuel_type || "");
      setVehicleGroup(initialData.group_id?.toString() || "");
      setRegion(initialData.region || "Abu Dhabi");
      setDepartment(initialData.department || "Fleet");
      setServiceType(initialData.service_plan || "");
      setUnit(initialData.unit || "");
      setVehicleCategory(initialData.vehicle_type || "");

      // Prepare numeric values
      const prepareNumber = (value: any) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'string') return parseFloat(value) || 0;
        return value;
      };

      // Prepare string values
      const prepareString = (value: any) => {
        if (value === null || value === undefined) return "";
        return String(value);
      };

      // Set form data with properly converted values
      setFormData({
        group_id: parseInt(initialData.group_id?.toString() || "0"),
        vehicle_type_code: prepareString(initialData.vehicle_type_code),
        vehicle_type_name: prepareString(initialData.vehicle_type_name),
        manufacturer: prepareString(initialData.manufacturer),
        vehicle_model: prepareString(initialData.vehicle_model),
        model_year: prepareNumber(initialData.model_year),
        number_of_passengers: prepareNumber(initialData.number_of_passengers),
        region: prepareString(initialData.region),
        fuel_efficiency: prepareNumber(initialData.fuel_efficiency),
        fuel_price_per_litre: prepareNumber(initialData.fuel_price_per_litre),
        fuel_type: prepareString(initialData.fuel_type),
        service_plan: prepareString(initialData.service_plan),
        cost_per_km: prepareNumber(initialData.cost_per_km),
        vehicle_type: prepareString(initialData.vehicle_type),
        department: prepareString(initialData.department),
        unit: prepareString(initialData.unit),
        alert_before: prepareNumber(initialData.alert_before),
        idle_fuel_consumption: prepareNumber(initialData.idle_fuel_consumption),
        vehicle_capacity: prepareNumber(initialData.vehicle_capacity),
        co2_emission_factor: prepareNumber(initialData.co2_emission_factor),
        color: prepareString(initialData.color),
      });
    }
  }, [initialData, isEditing]);

  // Handlers for form field changes
  const handleManufacturerChange = (value: string) => {
    setManufacturer(value);
    setFormData(prev => ({
      ...prev,
      manufacturer: value,
      // Clear model when manufacturer changes
      vehicle_model: "",
    }));
    setVehicleModel("");
  };

  const handleModelChange = (value: string) => {
    setVehicleModel(value);
    
    // Update form data
    setFormData(prev => {
      const updates: Partial<InsertVehicleTypeMaster> = {
        ...prev,
        vehicle_model: value,
        vehicle_type_name: `${prev.manufacturer || ""} ${value}`,
      };
      
      // Generate vehicle type code
      if (prev.manufacturer) {
        const timestamp = Date.now().toString().slice(-4);
        updates.vehicle_type_code = `${prev.manufacturer?.substring(0, 3)}-${value.substring(0, 3)}-${prev.model_year || new Date().getFullYear()}-${timestamp}`.toUpperCase();
      }
      
      return updates;
    });
    
    // Try to find model data to auto-populate fields
    if (manufacturer && masters?.vehicleModels && masters.vehicleModels[manufacturer]) {
      const models = masters.vehicleModels[manufacturer].models || [];
      const modelData = models.find((m: any) => m.name === value);
      
      if (modelData) {
        setFormData(prev => {
          const updates: Partial<InsertVehicleTypeMaster> = {...prev};
          
          if (modelData.efficiency) {
            updates.fuel_efficiency = parseFloat(modelData.efficiency);
          }
          
          if (modelData.capacity) {
            updates.vehicle_capacity = parseFloat(modelData.capacity);
          }
          
          if (modelData.idleConsumption) {
            updates.idle_fuel_consumption = parseFloat(modelData.idleConsumption);
          }
          
          if (modelData.passengerCapacity) {
            updates.number_of_passengers = parseInt(modelData.passengerCapacity);
          }
          
          // Recalculate cost per km
          if (updates.fuel_efficiency && prev.fuel_price_per_litre) {
            updates.cost_per_km = Number((prev.fuel_price_per_litre / updates.fuel_efficiency).toFixed(2));
          }
          
          return updates;
        });
      }
    }
  };

  const handleFuelTypeChange = (value: string) => {
    setFuelType(value);
    
    // First update the fuel type in form data
    setFormData(prev => ({
      ...prev,
      fuel_type: value
    }));
    
    // Get fuel price and CO2 factor
    if (fuelTypes && Array.isArray(fuelTypes)) {
      const fuelData = fuelTypes.find((ft: any) => 
        ft?.type && ft.type === value
      );
      
      if (fuelData) {
        // Update with fuel type data
        setFormData(prev => {
          const updates: Partial<InsertVehicleTypeMaster> = {...prev};
          
          // Get price
          if (fuelData.price !== undefined) {
            const price = typeof fuelData.price === 'string' 
              ? parseFloat(fuelData.price) 
              : fuelData.price;
            
            updates.fuel_price_per_litre = price;
          }
          
          // Get CO2 factor
          if (fuelData.co2_factor !== undefined) {
            const co2Factor = typeof fuelData.co2_factor === 'string'
              ? parseFloat(fuelData.co2_factor)
              : fuelData.co2_factor;
            
            updates.co2_emission_factor = co2Factor;
          }
          
          // Calculate cost per km if we have efficiency
          if (prev.fuel_efficiency && updates.fuel_price_per_litre) {
            updates.cost_per_km = Number((updates.fuel_price_per_litre / prev.fuel_efficiency).toFixed(2));
          }
          
          return updates;
        });
      }
    }
  };

  const updateCostPerKm = () => {
    setFormData(prev => {
      // Only update if we have both values
      if (prev.fuel_efficiency && prev.fuel_price_per_litre) {
        return {
          ...prev,
          cost_per_km: Number((prev.fuel_price_per_litre / prev.fuel_efficiency).toFixed(2))
        };
      }
      return prev;
    });
  };

  // Handler for fuel efficiency change
  const handleFuelEfficiencyChange = (value: string) => {
    const numValue = parseFloat(value);
    setFormData(prev => ({
      ...prev,
      fuel_efficiency: isNaN(numValue) ? 0 : numValue
    }));
    
    // Update cost per km when efficiency changes
    setTimeout(updateCostPerKm, 0);
  };

  // Handler for form submission
  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      setIsSubmitting(true);
      
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
      
      // Prepare data for submission
      const dataToSubmit: InsertVehicleTypeMaster = {
        group_id: Number(formData.group_id || 0),
        vehicle_type_code: formData.vehicle_type_code || "",
        vehicle_type_name: formData.vehicle_type_name || `${formData.manufacturer} ${formData.vehicle_model}`,
        manufacturer: formData.manufacturer || "",
        vehicle_model: formData.vehicle_model || "",
        model_year: Number(formData.model_year || new Date().getFullYear()),
        number_of_passengers: Number(formData.number_of_passengers || 0),
        region: formData.region || "Abu Dhabi",
        fuel_efficiency: Number(formData.fuel_efficiency || 0),
        fuel_price_per_litre: Number(formData.fuel_price_per_litre || 0),
        fuel_type: formData.fuel_type || "",
        service_plan: formData.service_plan || "",
        cost_per_km: Number(formData.cost_per_km || 0),
        vehicle_type: formData.vehicle_type || formData.vehicle_model || "",
        department: formData.department || "Fleet",
        unit: formData.unit || "",
        alert_before: Number(formData.alert_before || 0),
        idle_fuel_consumption: Number(formData.idle_fuel_consumption || 0),
        vehicle_capacity: Number(formData.vehicle_capacity || 0),
        co2_emission_factor: Number(formData.co2_emission_factor || 0),
        color: formData.color || "",
      };
      
      console.log("Submitting vehicle type data:", dataToSubmit);
      
      // Call the parent's submit handler
      await onSubmit(dataToSubmit);
      
      toast({
        title: "Success",
        description: isEditing ? "Vehicle type updated successfully" : "Vehicle type created successfully",
      });
      
      // Reset form if not editing
      if (!isEditing) {
        setManufacturer("");
        setVehicleModel("");
        setFuelType("");
        setVehicleGroup("");
        setRegion("Abu Dhabi");
        setDepartment("Fleet");
        setServiceType("");
        setUnit("");
        setVehicleCategory("");
        
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

  // Helper to safely display numeric values
  const displayNumber = (value: any) => {
    if (value === null || value === undefined) return "";
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    return "";
  };
  
  // Helper to safely display string values
  const displayString = (value: any) => {
    if (value === null || value === undefined) return "";
    return String(value);
  };
  
  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6">
        <table className="w-full border-collapse">
          <tbody>
            {/* Row 1: Vehicle Group | Manufacturer */}
            <tr>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Vehicle Group</FormLabel>
                  <Select
                    value={vehicleGroup}
                    onValueChange={(value) => {
                      setVehicleGroup(value);
                      setFormData(prev => ({
                        ...prev,
                        group_id: parseInt(value)
                      }));
                    }}
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
                </FormItem>
              </td>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <Select
                    value={manufacturer}
                    onValueChange={handleManufacturerChange}
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
                </FormItem>
              </td>
            </tr>

            {/* Row 2: Vehicle Model | Model Year */}
            <tr>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Vehicle Model</FormLabel>
                  <Select
                    value={vehicleModel}
                    onValueChange={handleModelChange}
                    disabled={!manufacturer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturer && masters?.vehicleModels && masters.vehicleModels[manufacturer]?.models?.map(
                        (model: any) => (
                          <SelectItem key={model.name} value={model.name}>
                            {model.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>
              </td>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Model Year</FormLabel>
                  <Input
                    type="number"
                    value={displayNumber(formData.model_year)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      model_year: parseInt(e.target.value) || new Date().getFullYear()
                    }))}
                  />
                </FormItem>
              </td>
            </tr>

            {/* Row 3: Vehicle Type | Vehicle Type Name */}
            <tr>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Vehicle Category</FormLabel>
                  <Select
                    value={vehicleCategory}
                    onValueChange={(value) => {
                      setVehicleCategory(value);
                      setFormData(prev => ({
                        ...prev,
                        vehicle_type: value
                      }));
                    }}
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
                </FormItem>
              </td>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Vehicle Type Name</FormLabel>
                  <Input
                    value={displayString(formData.vehicle_type_name)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vehicle_type_name: e.target.value
                    }))}
                  />
                </FormItem>
              </td>
            </tr>

            {/* Row 4: Fuel Type | Fuel Price */}
            <tr>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Fuel Type</FormLabel>
                  <Select
                    value={fuelType}
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
                </FormItem>
              </td>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Fuel Price Per Litre (AED)</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={displayNumber(formData.fuel_price_per_litre)}
                    readOnly
                  />
                </FormItem>
              </td>
            </tr>

            {/* Row 5: Fuel Efficiency | Cost Per KM */}
            <tr>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Fuel Efficiency (km/l)</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={displayNumber(formData.fuel_efficiency)}
                    onChange={(e) => handleFuelEfficiencyChange(e.target.value)}
                  />
                </FormItem>
              </td>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Cost Per KM</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={displayNumber(formData.cost_per_km)}
                    readOnly
                  />
                </FormItem>
              </td>
            </tr>

            {/* Row 6: Idle Fuel Consumption | CO2 Emission Factor */}
            <tr>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Idle Fuel Consumption</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={displayNumber(formData.idle_fuel_consumption)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      idle_fuel_consumption: parseFloat(e.target.value) || 0
                    }))}
                  />
                </FormItem>
              </td>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>CO2 Emission Factor</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={displayNumber(formData.co2_emission_factor)}
                    readOnly
                  />
                </FormItem>
              </td>
            </tr>

            {/* Row 7: Passengers | Vehicle Capacity */}
            <tr>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Number of Passengers</FormLabel>
                  <Input
                    type="number"
                    value={displayNumber(formData.number_of_passengers)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      number_of_passengers: parseInt(e.target.value) || 0
                    }))}
                  />
                </FormItem>
              </td>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Vehicle Capacity</FormLabel>
                  <Input
                    type="number"
                    value={displayNumber(formData.vehicle_capacity)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vehicle_capacity: parseInt(e.target.value) || 0
                    }))}
                  />
                </FormItem>
              </td>
            </tr>

            {/* Row 8: Service Plan | Alert Before */}
            <tr>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Service Plan</FormLabel>
                  <Select
                    value={serviceType}
                    onValueChange={(value) => {
                      setServiceType(value);
                      setFormData(prev => ({
                        ...prev,
                        service_plan: value
                      }));
                    }}
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
                </FormItem>
              </td>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Alert Before Value (KM)</FormLabel>
                  <Input
                    type="number"
                    value={displayNumber(formData.alert_before)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      alert_before: parseInt(e.target.value) || 0
                    }))}
                  />
                </FormItem>
              </td>
            </tr>

            {/* Row 9: Region | Department */}
            <tr>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <Select
                    value={region}
                    onValueChange={(value) => {
                      setRegion(value);
                      setFormData(prev => ({
                        ...prev,
                        region: value
                      }));
                    }}
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
                </FormItem>
              </td>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    value={department}
                    onValueChange={(value) => {
                      setDepartment(value);
                      setFormData(prev => ({
                        ...prev,
                        department: value
                      }));
                    }}
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
                </FormItem>
              </td>
            </tr>

            {/* Row 10: Unit | Vehicle Type Code */}
            <tr>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select
                    value={unit}
                    onValueChange={(value) => {
                      setUnit(value);
                      setFormData(prev => ({
                        ...prev,
                        unit: value
                      }));
                    }}
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
                </FormItem>
              </td>
              <td className="border p-2">
                <FormItem>
                  <FormLabel>Vehicle Type Code</FormLabel>
                  <Input
                    value={displayString(formData.vehicle_type_code)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vehicle_type_code: e.target.value
                    }))}
                    readOnly={isEditing}
                  />
                </FormItem>
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