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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { EmiratesSpinner } from "@/components/ui/emirates-spinner";

interface VehicleMasterFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: VehicleMaster | null;
}

// Define a custom interface extending VehicleTypeMaster for our component
interface ExtendedVehicleType extends VehicleTypeMaster {
  // Add missing fields that we're trying to access but are not in the original type
  transmission_type?: string;
  vehicle_usage?: string;
}

export function VehicleMasterForm({ isOpen, onClose, initialData }: VehicleMasterFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Keep all useState hooks at the top level
  const [selectedEmirate, setSelectedEmirate] = React.useState<string>(initialData?.emirate || "");
  const [selectedCategory, setSelectedCategory] = React.useState<string>(initialData?.plate_category || "");
  const [selectedManufacturer, setSelectedManufacturer] = React.useState<string>(initialData?.manufacturer || "");
  const [selectedModelYear, setSelectedModelYear] = React.useState<number>(initialData?.model_year || 0);
  const [availableModels, setAvailableModels] = React.useState<string[]>([]);
  const [selectedModel, setSelectedModel] = React.useState<string>(initialData?.vehicle_model || "");
  
  // Query hooks - keep at top level
  const { data: vehicleTypes, isLoading: isLoadingVehicleTypes } = useQuery<ExtendedVehicleType[]>({
    queryKey: ["/api/vehicle-types"],
    queryFn: async () => {
      const response = await fetch("/api/vehicle-types");
      if (!response.ok) {
        throw new Error("Failed to fetch vehicle types");
      }
      const data = await response.json();
      console.log("Vehicle types data received:", data);
      console.log("Number of vehicle types:", data?.length);
      if (data && data.length > 0) {
        // Inspect the first item to understand its structure
        console.log("First vehicle type:", data[0]);
        console.log("Vehicle type code:", data[0].vehicle_type_code);
      }
      return data;
    }
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

  const onFormSubmit = React.useCallback((data: any) => {
    if (initialData) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }, [initialData, updateMutation, createMutation]);

  // Handle model year change
  const handleModelYearChange = React.useCallback((value: string) => {
    const yearValue = parseInt(value, 10);
    setSelectedModelYear(yearValue);
    form.setValue("model_year", yearValue);
  }, [form]);

  // Handle vehicle model change
  const handleVehicleModelChange = React.useCallback((value: string) => {
    console.log("Setting vehicle model directly:", value);
    setSelectedModel(value);
    form.setValue("vehicle_model", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setTimeout(() => form.trigger("vehicle_model"), 0);
  }, [form]);
  
  // Direct handler for fuel type changes
  const handleFuelTypeChange = React.useCallback((value: string) => {
    console.log("Setting fuel type directly:", value);
    form.setValue("fuel_type", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  }, [form]);
  
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

  // Handle vehicle type selection - which populates multiple other fields
  const handleVehicleTypeSelect = React.useCallback((typeCode: string) => {
    const selectedType = vehicleTypes && vehicleTypes.find((type: ExtendedVehicleType) => type.vehicle_type_code === typeCode);
    if (selectedType) {
      console.log("Vehicle Type selected:", selectedType);
      
      // Store the fuel_type and vehicle_model values to apply later
      const fuelTypeToSet = selectedType.fuel_type || "";
      const vehicleModelToSet = selectedType.vehicle_model || "";
      
      // Set the form fields based on the selected vehicle type
      form.setValue("vehicle_type_code", selectedType.vehicle_type_code);
      form.setValue("vehicle_type_name", selectedType.vehicle_type_name || `${selectedType.manufacturer} ${selectedType.vehicle_model}`);
      
      // Force form revalidation to update UI state
      form.trigger("vehicle_type_code");
      form.trigger("vehicle_type_name");
      
      // IMPORTANT: Set manufacturer first so available models can be populated
      if (selectedType.manufacturer) {
        setSelectedManufacturer(selectedType.manufacturer);
        form.setValue("manufacturer", selectedType.manufacturer, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        form.trigger("manufacturer");
        
        // Update available models for the selected manufacturer
        const modelInfo = DEFAULT_VEHICLE_MODELS[selectedType.manufacturer as keyof typeof DEFAULT_VEHICLE_MODELS];
        const modelNames = modelInfo ? Object.keys(modelInfo) : [];
        setAvailableModels(modelNames);
      }
      
      // Only set model_year if it's not null
      if (selectedType.model_year) {
        handleModelYearChange(selectedType.model_year.toString());
      }
      
      // Set region if available
      if (selectedType.region) {
        form.setValue("region", selectedType.region, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        form.trigger("region");
      }
      
      // Set department if available
      if (selectedType.department) {
        form.setValue("department", selectedType.department, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        form.trigger("department");
      }
      
      // Set default values for fields that exist in vehicle master but not in vehicle type
      form.setValue("transmission_type", "AUTOMATIC", { shouldDirty: true, shouldTouch: true, shouldValidate: true }); // Default transmission type
      form.setValue("vehicle_usage", "OPERATIONAL", { shouldDirty: true, shouldTouch: true, shouldValidate: true }); // Default vehicle usage
      
      // Force rerender of these fields
      form.trigger("transmission_type");
      form.trigger("vehicle_usage");
      
      // IMPORTANT: Now set the fuel_type after the form updates are completed
      if (fuelTypeToSet) {
        console.log("Setting fuel type to:", fuelTypeToSet);
        
        // Short delay to ensure field updates are processed
        setTimeout(() => {
          // Set directly in the useState field value first
          form.setValue("fuel_type", fuelTypeToSet, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
          
          // Force trigger to update the UI
          form.trigger("fuel_type");
          
          toast({
            title: "Fuel Type Set",
            description: `Fuel type set to ${fuelTypeToSet}`,
            variant: "default",
            duration: 2000,
          });
        }, 50);
      }
      
      // Set vehicle_model with a slightly longer delay to ensure manufacturer has been processed
      if (vehicleModelToSet) {
        console.log("Setting vehicle model to:", vehicleModelToSet);
        
        // Longer delay to ensure manufacturer and available models are updated
        setTimeout(() => {
          // Set directly in the useState field value first
          setSelectedModel(vehicleModelToSet);
          form.setValue("vehicle_model", vehicleModelToSet, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
          
          // Force trigger to update the UI
          form.trigger("vehicle_model");
          
          toast({
            title: "Vehicle Model Set",
            description: `Vehicle model set to ${vehicleModelToSet}`,
            variant: "default",
            duration: 2000,
          });
        }, 100);
      }
    }
  }, [vehicleTypes, form, toast, setSelectedManufacturer, setAvailableModels, setSelectedModel, handleModelYearChange]);

  const getAvailablePlateCodes = React.useCallback(() => {
    if (!selectedEmirate || !selectedCategory) return [];
    const emirateInfo = EmiratesPlateInfo[selectedEmirate as keyof typeof EmiratesPlateInfo];
    return emirateInfo.plate_codes[selectedCategory as keyof typeof EmiratesPlateInfo[keyof typeof EmiratesPlateInfo]['plate_codes']] || [];
  }, [selectedEmirate, selectedCategory]);

  // Handle manufacturer change
  const handleManufacturerChange = React.useCallback((value: string) => {
    setSelectedManufacturer(value);
    form.setValue("manufacturer", value);
    
    // Reset vehicle model when manufacturer changes
    setSelectedModel("");
    form.setValue("vehicle_model", "");
    
    // Update available models for the selected manufacturer
    const modelInfo = DEFAULT_VEHICLE_MODELS[value as keyof typeof DEFAULT_VEHICLE_MODELS];
    const modelNames = modelInfo ? Object.keys(modelInfo) : [];
    setAvailableModels(modelNames);
    
    // Reset vehicle type code and name if manufacturer changes
    form.setValue("vehicle_type_code", "");
    form.setValue("vehicle_type_name", "");
  }, [form]);

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
          <DialogDescription>
            Enter the vehicle details below. You can select an existing vehicle type to auto-fill many fields.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Vehicle Type Code *</FormLabel>
                      <span className="text-xs text-primary inline-flex items-center">
                        <span className="animate-pulse mr-1">•</span> 
                        Recommended selection
                      </span>
                    </div>
                    <Select onValueChange={handleVehicleTypeSelect} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-primary/5 border-primary/20 font-medium">
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!vehicleTypes || vehicleTypes.length === 0 ? (
                          <SelectItem value="no-types" disabled>
                            No vehicle types available. Create one first.
                          </SelectItem>
                        ) : vehicleTypes.filter((type: ExtendedVehicleType) => type.vehicle_type_code && type.vehicle_type_code.trim() !== '').length === 0 ? (
                          <SelectItem value="no-valid-types" disabled>
                            No valid vehicle types found with codes.
                          </SelectItem>
                        ) : (
                          vehicleTypes
                            .filter((type: ExtendedVehicleType) => type.vehicle_type_code && type.vehicle_type_code.trim() !== '')
                            .sort((a: ExtendedVehicleType, b: ExtendedVehicleType) => 
                              (a.manufacturer || '').localeCompare(b.manufacturer || '') || 
                              (a.vehicle_model || '').localeCompare(b.vehicle_model || '')
                            )
                            .map((type: ExtendedVehicleType) => (
                              <SelectItem
                                key={type.vehicle_type_code}
                                value={type.vehicle_type_code || ''}
                              >
                                {type.vehicle_type_code} - {type.vehicle_type_name || `${type.manufacturer || ''} ${type.vehicle_model || ''}`}
                              </SelectItem>
                            ))
                        )}
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
                render={({ field }) => {
                  // Force re-render when field.value changes
                  return (
                    <FormItem key={`fuel_type_${field.value}`}>
                      <FormLabel>Fuel Type *</FormLabel>
                      <Select 
                        onValueChange={handleFuelTypeChange}
                        value={field.value || ""}
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className={field.value ? "bg-primary/5 border-primary/20" : ""}>
                            <SelectValue placeholder="Select fuel type">
                              {field.value || "Select fuel type"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingFuelTypes ? (
                            <SelectItem value="loading" disabled>
                              Loading fuel types...
                            </SelectItem>
                          ) : fuelTypes && fuelTypes.length > 0 ? (
                            fuelTypes
                              .filter((fuelType: FuelType) => fuelType && fuelType.type && typeof fuelType.type === 'string' && fuelType.type.trim() !== '')
                              .map((fuelType: FuelType) => (
                                <SelectItem key={fuelType.id} value={fuelType.type}>
                                  {fuelType.type || "Unknown Fuel Type"}
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
                  );
                }}
              />

              {/* Manufacturer */}
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer *</FormLabel>
                    <Select 
                      onValueChange={handleManufacturerChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manufacturer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEFAULT_MANUFACTURERS.map((manufacturer) => (
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
                    <Select
                      onValueChange={handleModelYearChange}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEFAULT_YEARS.map((year) => (
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

              {/* Vehicle Model */}
              <FormField
                control={form.control}
                name="vehicle_model"
                render={({ field }) => {
                  // Force re-render when field.value changes
                  return (
                    <FormItem key={`vehicle_model_${field.value}`}>
                      <FormLabel>Vehicle Model *</FormLabel>
                      <Select
                        onValueChange={handleVehicleModelChange}
                        value={field.value || ""}
                        defaultValue={field.value || ""}
                        disabled={!selectedManufacturer || availableModels.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className={field.value ? "bg-primary/5 border-primary/20" : ""}>
                            <SelectValue placeholder="Select vehicle model">
                              {field.value || "Select vehicle model"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableModels.length === 0 ? (
                            <SelectItem value="none" disabled>
                              {selectedManufacturer ? "No models available" : "Select manufacturer first"}
                            </SelectItem>
                          ) : (
                            availableModels.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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