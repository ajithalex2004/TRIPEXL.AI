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
} from "@shared/schema";
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
  const [selectedCategory, setSelectedCategory] = React.useState<string>(initialData?.plateCategory || "");

  // Query hook for vehicle types - keep this at top level
  const { data: vehicleTypes, isLoading: isLoadingVehicleTypes } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-type-master"],
  });

  // Initialize form with useForm hook - keep at top level
  const form = useForm({
    resolver: zodResolver(insertVehicleMasterSchema),
    defaultValues: {
      vehicleId: initialData?.vehicleId || "",
      emirate: initialData?.emirate || "",
      registrationNumber: initialData?.registrationNumber || "",
      plateCode: initialData?.plateCode || "",
      plateNumber: initialData?.plateNumber || "",
      currentOdometer: initialData?.currentOdometer?.toString() || "0",
      plateCategory: initialData?.plateCategory || "",
      vehicleTypeCode: initialData?.vehicleTypeCode || "",
      vehicleTypeName: initialData?.vehicleTypeName || "",
      vehicleModel: initialData?.vehicleModel || "",
      fuelType: initialData?.fuelType || "",
      transmissionType: initialData?.transmissionType || "",
      region: initialData?.region || "",
      department: initialData?.department || "",
      chassisNumber: initialData?.chassisNumber || "",
      engineNumber: initialData?.engineNumber || "",
      unit: initialData?.unit || "",
      modelYear: initialData?.modelYear || 0,
      assetType: initialData?.assetType || "",
      manufacturer: initialData?.manufacturer || "",
      vehicleUsage: initialData?.vehicleUsage || "",
      isCanConnected: initialData?.isCanConnected || YesNo.NO,
      isWeightSensorConnected: initialData?.isWeightSensorConnected || YesNo.NO,
      isTemperatureSensorConnected: initialData?.isTemperatureSensorConnected || YesNo.NO,
      isPtoConnected: initialData?.isPtoConnected || YesNo.NO,
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/vehicle-master/${initialData?.vehicleId}`, data);
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
  const updateRegistrationNumber = React.useCallback((emirate: string, plateCode: string, plateNumber: string) => {
    if (emirate && plateCode && plateNumber) {
      const emirateCode = getEmirateCode(emirate);
      const registrationNumber = `${emirateCode}-${plateCode}-${plateNumber}`;
      form.setValue("registrationNumber", registrationNumber);
    }
  }, [form, getEmirateCode]);

  const handleEmirateChange = React.useCallback((value: string) => {
    form.setValue("emirate", value);
    form.setValue("plateCategory", "");
    form.setValue("plateCode", "");
    setSelectedEmirate(value);
    setSelectedCategory("");
    updateRegistrationNumber(value, form.getValues("plateCode"), form.getValues("plateNumber"));
  }, [form, updateRegistrationNumber, setSelectedEmirate, setSelectedCategory]);

  const handlePlateCategoryChange = React.useCallback((value: string) => {
    form.setValue("plateCategory", value);
    form.setValue("plateCode", "");
    setSelectedCategory(value);
  }, [form, setSelectedCategory]);

  const handlePlateCodeChange = React.useCallback((value: string) => {
    form.setValue("plateCode", value);
    updateRegistrationNumber(form.getValues("emirate"), value, form.getValues("plateNumber"));
  }, [form, updateRegistrationNumber]);

  const handlePlateNumberChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("plateNumber", value);
    updateRegistrationNumber(form.getValues("emirate"), form.getValues("plateCode"), value);
  }, [form, updateRegistrationNumber]);

  const handleVehicleTypeSelect = React.useCallback((typeCode: string) => {
    const selectedType = vehicleTypes?.find(type => type.vehicleTypeCode === typeCode);
    if (selectedType) {
      form.setValue("vehicleTypeCode", selectedType.vehicleTypeCode);
      form.setValue("vehicleTypeName", `${selectedType.manufacturer} ${selectedType.vehicleType}`);
      form.setValue("fuelType", selectedType.fuelType);
      form.setValue("modelYear", selectedType.modelYear);
      form.setValue("manufacturer", selectedType.manufacturer);
    }
  }, [vehicleTypes, form]);

  const getAvailablePlateCodes = React.useCallback(() => {
    if (!selectedEmirate || !selectedCategory) return [];
    const emirateInfo = EmiratesPlateInfo[selectedEmirate as keyof typeof EmiratesPlateInfo];
    return emirateInfo.plateCodes[selectedCategory as keyof typeof EmiratesPlateInfo[keyof typeof EmiratesPlateInfo]['plateCodes']] || [];
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
                name="vehicleId"
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
                name="plateCategory"
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
                name="plateCode"
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
                name="plateNumber"
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
                name="registrationNumber"
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
                name="vehicleTypeCode"
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
                            key={type.vehicleTypeCode}
                            value={type.vehicleTypeCode}
                          >
                            {type.vehicleTypeCode}
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
                name="vehicleTypeName"
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

              {/* Fuel Type - Read only */}
              <FormField
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Fuel Type" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Model Year - Read only */}
              <FormField
                control={form.control}
                name="modelYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Year</FormLabel>
                    <FormControl>
                      <Input placeholder="Model Year" {...field} readOnly />
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
                      <Input placeholder="Manufacturer" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Current Odometer */}
              <FormField
                control={form.control}
                name="currentOdometer"
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
                name="transmissionType"
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

              {/* YES/NO Fields */}
              {["isCanConnected", "isWeightSensorConnected", "isTemperatureSensorConnected", "isPtoConnected"].map((fieldName) => (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {fieldName === "isCanConnected" ? "Is CAN Connected" :
                          fieldName === "isWeightSensorConnected" ? "Is Weight Sensor Connected" :
                            fieldName === "isTemperatureSensorConnected" ? "Is Temperature Sensor Connected" :
                              "Is PTO Connected"}
                      </FormLabel>
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
              ))}

              {/* Asset Type */}
              <FormField
                control={form.control}
                name="assetType"
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

              {/* Other required fields */}
              {[
                { name: "chassisNumber", label: "Chassis Number", type: "text" },
                { name: "engineNumber", label: "Engine Number", type: "text" },
                { name: "unit", label: "Unit", type: "text" },
                { name: "vehicleModel", label: "Vehicle Model", type: "text" },
                { name: "vehicleUsage", label: "Vehicle Usage", type: "text" },
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
  vehicleId: string;
  emirate: string;
  registrationNumber: string;
  plateCode: string;
  plateNumber: string;
  currentOdometer: number | null;
  plateCategory: string;
  vehicleTypeCode: string;
  vehicleTypeName: string;
  vehicleModel: string;
  fuelType: string;
  transmissionType: string;
  region: string;
  department: string;
  chassisNumber: string;
  engineNumber: string;
  unit: string;
  modelYear: number;
  assetType: string;
  manufacturer: string;
  vehicleUsage: string;
  isCanConnected: YesNo;
  isWeightSensorConnected: YesNo;
  isTemperatureSensorConnected: YesNo;
  isPtoConnected: YesNo;
}