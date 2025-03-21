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

interface VehicleMasterFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VehicleMasterForm({ isOpen, onClose }: VehicleMasterFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmirate, setSelectedEmirate] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");

  const { data: vehicleTypes } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-type-master"],
  });

  const form = useForm({
    resolver: zodResolver(insertVehicleMasterSchema),
    defaultValues: {
      vehicleId: "",
      emirate: "",
      registrationNumber: "",
      plateCode: "",
      currentOdometer: "0",
      plateCategory: "",
      vehicleTypeName: "",
      vehicleTypeCode: "",
      vehicleModel: "",
      fuelType: "",
      transmissionType: "",
      region: "",
      department: "",
      chassisNumber: "",
      engineNumber: "",
      unit: "",
      modelYear: 0,
      assetType: "",
      manufacturer: "",
      vehicleUsage: "",
      isCanConnected: YesNo.NO,
      isWeightSensorConnected: YesNo.NO,
      isTemperatureSensorConnected: YesNo.NO,
      isPtoConnected: YesNo.NO,
    },
  });

  const createVehicle = useMutation({
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create vehicle",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createVehicle.mutate(data);
  };

  const handleEmirateChange = (value: string) => {
    form.setValue("emirate", value);
    form.setValue("plateCategory", "");
    form.setValue("plateCode", "");
    setSelectedEmirate(value);
    setSelectedCategory("");
  };

  const handlePlateCategoryChange = (value: string) => {
    form.setValue("plateCategory", value);
    form.setValue("plateCode", "");
    setSelectedCategory(value);
  };

  const handleVehicleTypeSelect = (typeCode: string) => {
    const selectedType = vehicleTypes?.find(type => type.vehicleTypeCode === typeCode);
    if (selectedType) {
      form.setValue("vehicleTypeCode", selectedType.vehicleTypeCode);
      form.setValue("vehicleTypeName", selectedType.vehicleType);
    }
  };

  const getAvailablePlateCodes = () => {
    if (!selectedEmirate || !selectedCategory) return [];
    return EmiratesPlateInfo[selectedEmirate as keyof typeof EmiratesPlateInfo]
      .plateCodes[selectedCategory as keyof typeof EmiratesPlateInfo[keyof typeof EmiratesPlateInfo]['plateCodes']] || [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

              {/* Registration Number */}
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Registration Number" {...field} />
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
                          <SelectItem key={type.vehicleTypeCode} value={type.vehicleTypeCode}>
                            {type.vehicleTypeCode} - {type.vehicleType}
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
                      <Input placeholder="Vehicle Type Name" {...field} readOnly />
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

              {/* Fuel Type */}
              <FormField
                control={form.control}
                name="fuelType"
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

              {/* Other required fields */}
              {[
                { name: "chassisNumber", label: "Chassis Number", type: "text" },
                { name: "engineNumber", label: "Engine Number", type: "text" },
                { name: "unit", label: "Unit", type: "text" },
                { name: "modelYear", label: "Model Year", type: "number" },
                { name: "assetType", label: "Asset Type", type: "text" },
                { name: "manufacturer", label: "Manufacturer", type: "text" },
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
                Add Vehicle
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}