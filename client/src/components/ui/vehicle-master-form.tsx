import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertVehicleMasterSchema,
  YesNo,
  TransmissionType,
  VehicleFuelType,
  Region,
  Department,
  Emirates,
  EmiratesPlateInfo,
  VehicleTypeMaster,
  AssetType,
  FuelType,
} from "@shared/schema";
import { 
  DEFAULT_MANUFACTURERS, 
  DEFAULT_VEHICLE_MODELS, 
  DEFAULT_YEARS, 
  generateVehicleTypeCode,
  type VehicleModelInfo
} from "@/lib/vehicle-constants";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmiratesSpinner } from "@/components/ui/emirates-spinner";

interface VehicleMasterFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: VehicleMaster | null;
}

export function VehicleMasterForm({ isOpen, onClose, initialData }: VehicleMasterFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Keep all useState hooks at the top level
  const [selectedEmirate, setSelectedEmirate] = React.useState<string>(initialData?.emirate || "");
  const [selectedCategory, setSelectedCategory] = React.useState<string>(initialData?.plate_category || "");

  // Query hooks - keep at top level
  const { data: vehicleTypes, isLoading: isLoadingVehicleTypes } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-type-master"],
  });
  
  const { data: fuelTypes, isLoading: isLoadingFuelTypes } = useQuery<FuelType[]>({
    queryKey: ["/api/fuel-types"],
  });

  // Initialize form with useForm hook - keep at top level
  const form = useForm({
    resolver: zodResolver(insertVehicleMasterSchema),
    defaultValues: {
      vehicle_id: initialData?.vehicle_id || "",
      emirate: initialData?.emirate || "",
      registration_number: initialData?.registration_number || "",
      plate_code: initialData?.plate_code || "",
      plate_number: initialData?.plate_number || "",
      current_odometer: initialData?.current_odometer?.toString() || "0",
      plate_category: initialData?.plate_category || "",
      vehicle_type_code: initialData?.vehicle_type_code || "",
      vehicle_type_name: initialData?.vehicle_type_name || "",
      vehicle_model: initialData?.vehicle_model || "",
      fuel_type: initialData?.fuel_type || "",
      transmission_type: initialData?.transmission_type || "",
      region: initialData?.region || "",
      department: initialData?.department || "",
      chassis_number: initialData?.chassis_number || "",
      engine_number: initialData?.engine_number || "",
      unit: initialData?.unit || "",
      model_year: initialData?.model_year || 0,
      asset_type: initialData?.asset_type || "",
      manufacturer: initialData?.manufacturer || "",
      vehicle_usage: initialData?.vehicle_usage || "",
      is_can_connected: initialData?.is_can_connected || YesNo.NO,
      is_weight_sensor_connected: initialData?.is_weight_sensor_connected || YesNo.NO,
      is_temperature_sensor_connected: initialData?.is_temperature_sensor_connected || YesNo.NO,
      is_pto_connected: initialData?.is_pto_connected || YesNo.NO,
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/vehicle-master/${initialData?.vehicle_id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update vehicle");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-master"] });
      toast({
        title: "Success",
        description: "Vehicle updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/vehicle-master", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create vehicle");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-master"] });
      toast({
        title: "Success",
        description: "Vehicle created successfully",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = React.useCallback((data: any) => {
    if (initialData) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }, [initialData, updateMutation, createMutation]);

  // Extract emirate code from the full emirate name (e.g., "AUH" from "Abu Dhabi (AUH)")
  const getEmirateCode = React.useCallback((emirate: string): string => {
    const match = emirate.match(/\(([^)]+)\)/);
    return match ? match[1] : "";
  }, []);

  // Update registration number whenever emirate, plate code, or plate number changes
  const updateRegistrationNumber = React.useCallback((emirate: string, plate_code: string, plate_number: string) => {
    if (emirate && plate_code && plate_number) {
      const emirateCode = getEmirateCode(emirate);
      const registrationNumber = `${emirateCode}-${plate_code}-${plate_number}`;
      form.setValue("registration_number", registrationNumber);
    }
  }, [form, getEmirateCode]);

  const handleEmirateChange = React.useCallback((value: string) => {
    form.setValue("emirate", value);
    form.setValue("plate_category", "");
    form.setValue("plate_code", "");
    setSelectedEmirate(value);
    setSelectedCategory("");
    updateRegistrationNumber(value, form.getValues("plate_code"), form.getValues("plate_number"));
  }, [form, updateRegistrationNumber, setSelectedEmirate, setSelectedCategory]);

  const handlePlateCategoryChange = React.useCallback((value: string) => {
    form.setValue("plate_category", value);
    form.setValue("plate_code", "");
    setSelectedCategory(value);
  }, [form, setSelectedCategory]);

  const handlePlateCodeChange = React.useCallback((value: string) => {
    form.setValue("plate_code", value);
    updateRegistrationNumber(form.getValues("emirate"), value, form.getValues("plate_number"));
  }, [form, updateRegistrationNumber]);

  const handlePlateNumberChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("plate_number", value);
    updateRegistrationNumber(form.getValues("emirate"), form.getValues("plate_code"), value);
  }, [form, updateRegistrationNumber]);

  const handleVehicleTypeSelect = React.useCallback((typeCode: string) => {
    const selectedType = vehicleTypes?.find(type => type.vehicle_type_code === typeCode);
    if (selectedType) {
      form.setValue("vehicle_type_code", selectedType.vehicle_type_code);
      form.setValue("vehicle_type_name", `${selectedType.manufacturer} ${selectedType.vehicle_type_name}`);
      form.setValue("fuel_type", selectedType.fuel_type);
      form.setValue("model_year", selectedType.model_year);
      form.setValue("manufacturer", selectedType.manufacturer);
    }
  }, [vehicleTypes, form]);

  const getAvailablePlateCodes = React.useCallback(() => {
    if (!selectedEmirate || !selectedCategory) return [];
    const emirateInfo = EmiratesPlateInfo[selectedEmirate as keyof typeof EmiratesPlateInfo];
    return emirateInfo.plate_codes[selectedCategory as keyof typeof EmiratesPlateInfo[keyof typeof EmiratesPlateInfo]['plate_codes']] || [];
  }, [selectedEmirate, selectedCategory]);

  // Show loading spinner while vehicle types are being fetched
  if (isLoadingVehicleTypes) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <EmiratesSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Vehicle ID */}
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle ID *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Vehicle ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Emirate */}
              <FormField
                control={form.control}
                name="emirate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emirate *</FormLabel>
                    <Select onValueChange={handleEmirateChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select emirate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(Emirates).map((emirate) => (
                          <SelectItem key={emirate} value={emirate}>
                            {emirate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Plate Category */}
              <FormField
                control={form.control}
                name="plate_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plate Category *</FormLabel>
                    <Select onValueChange={handlePlateCategoryChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plate category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedEmirate && EmiratesPlateInfo[selectedEmirate as keyof typeof EmiratesPlateInfo].categories.map((category) => (
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

              {/* Plate Code */}
              <FormField
                control={form.control}
                name="plate_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plate Code *</FormLabel>
                    <Select onValueChange={handlePlateCodeChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plate code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailablePlateCodes().map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Plate Number */}
              <FormField
                control={form.control}
                name="plate_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plate Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Plate Number"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handlePlateNumberChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Registration Number - Read only */}
              <FormField
                control={form.control}
                name="registration_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Registration Number" {...field} readOnly />
                    </FormControl>
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
                    <Select onValueChange={handleVehicleTypeSelect} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicleTypes?.map((type) => (
                          <SelectItem
                            key={type.vehicle_type_code}
                            value={type.vehicle_type_code}
                          >
                            {type.vehicle_type_code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vehicle Type Name - Read only */}
              <FormField
                control={form.control}
                name="vehicle_type_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Vehicle Type Name"
                        {...field}
                        readOnly
                        className="bg-muted"
                      />
                    </FormControl>
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
                        {isLoadingFuelTypes ? (
                          <SelectItem value="loading" disabled>
                            Loading fuel types...
                          </SelectItem>
                        ) : fuelTypes && fuelTypes.length > 0 ? (
                          fuelTypes.map((fuelType) => (
                            <SelectItem key={fuelType.id} value={fuelType.type}>
                              {fuelType.type}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No fuel types available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Model Year - Read only */}
              <FormField
                control={form.control}
                name="model_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Year</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Model Year" 
                        {...field} 
                        readOnly 
                        value={field.value ? field.value.toString() : ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Manufacturer - Read only */}
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Manufacturer" 
                        {...field} 
                        readOnly 
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Current Odometer */}
              <FormField
                control={form.control}
                name="current_odometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Odometer *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter Current Odometer"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {/* Transmission Type */}
              <FormField
                control={form.control}
                name="transmission_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transmission Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transmission type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TransmissionType).map((type) => (
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

              {/* Is CAN Connected */}
              <FormField
                control={form.control}
                name="is_can_connected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Is CAN Connected</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Yes/No" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(YesNo).map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Is Weight Sensor Connected */}
              <FormField
                control={form.control}
                name="is_weight_sensor_connected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Is Weight Sensor Connected</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Yes/No" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(YesNo).map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Is Temperature Sensor Connected */}
              <FormField
                control={form.control}
                name="is_temperature_sensor_connected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Is Temperature Sensor Connected</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Yes/No" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(YesNo).map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Is PTO Connected */}
              <FormField
                control={form.control}
                name="is_pto_connected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Is PTO Connected</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Yes/No" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(YesNo).map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Asset Type */}
              <FormField
                control={form.control}
                name="asset_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AssetType).map((type) => (
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

              {/* Vehicle Model - Read only */}
              <FormField
                control={form.control}
                name="vehicle_model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Model</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Vehicle Model" 
                        {...field} 
                        readOnly 
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Other required fields */}
              {[
                { name: "chassis_number", label: "Chassis Number", type: "text" },
                { name: "engine_number", label: "Engine Number", type: "text" },
                { name: "unit", label: "Unit", type: "text" },
                { name: "vehicle_usage", label: "Vehicle Usage", type: "text" },
              ].map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name as any}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label} *</FormLabel>
                      <FormControl>
                        <Input
                          type={field.type}
                          placeholder={`Enter ${field.label}`}
                          {...formField}
                          onChange={(e) => {
                            if (field.type === "number") {
                              formField.onChange(parseInt(e.target.value, 10));
                            } else {
                              formField.onChange(e.target.value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit">
                {initialData ? "Update Vehicle" : "Add Vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface VehicleMaster {
  id?: number;
  vehicle_id: string;
  emirate: string;
  registration_number: string;
  plate_code: string;
  plate_number: string;
  current_odometer: number | null;
  plate_category: string;
  vehicle_type_code: string;
  vehicle_type_name: string;
  vehicle_model: string;
  fuel_type: string;
  transmission_type: string;
  region: string;
  department: string;
  chassis_number: string;
  engine_number: string;
  unit: string;
  model_year: number;
  asset_type: string;
  manufacturer: string;
  vehicle_usage: string;
  is_can_connected: string; // Using string type because schema uses text
  is_weight_sensor_connected: string;
  is_temperature_sensor_connected: string;
  is_pto_connected: string;
  created_at?: Date;
  updated_at?: Date;
}