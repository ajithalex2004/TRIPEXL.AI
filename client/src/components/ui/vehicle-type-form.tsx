import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertVehicleTypeMaster, Department, insertVehicleTypeMasterSchema, VehicleTypeMaster, VehicleGroup, VehicleType, VehicleTypeDefaults, VehicleFuelType } from "@shared/schema"; 
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

  // Watch fuel efficiency and price changes
  const fuelEfficiency = form.watch("fuelEfficiency");
  const fuelPricePerLitre = form.watch("fuelPricePerLitre");

  // Update cost per km when fuel efficiency or price changes
  useEffect(() => {
    const costPerKm = calculateCostPerKm(fuelPricePerLitre, fuelEfficiency);
    form.setValue("costPerKm", costPerKm);
  }, [fuelEfficiency, fuelPricePerLitre, form]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        fuelType: initialData.fuelType || "Petrol"
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (data: InsertVehicleTypeMaster) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Vehicle Group, Vehicle Type Code, and Vehicle Type at the top */}
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
          <FormField
            control={form.control}
            name="vehicleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Type *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    const defaults = VehicleTypeDefaults[value as keyof typeof VehicleTypeDefaults];
                    if (defaults) {
                      form.setValue('costPerKm', defaults.costPerKm);
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(VehicleType).map((type) => (
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

          {/* Moved Fuel Type before Fuel Efficiency */}
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
                    placeholder="Enter fuel price per litre"
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

          {/* Moved Number of Passengers after Service Plan */}
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
                <FormControl>
                  <Input placeholder="Enter region" {...field} />
                </FormControl>
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