import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InsertVehicleGroup,
  Department,
  VehicleGroupType,
  insertVehicleGroupSchema,
  VehicleGroup,
  Region
} from "@shared/schema";
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

interface VehicleGroupFormProps {
  onSubmit: (data: InsertVehicleGroup) => Promise<void>;
  initialData?: VehicleGroup | null;
  isEditing?: boolean;
}

export function VehicleGroupForm({ onSubmit, initialData, isEditing }: VehicleGroupFormProps) {
  const { toast } = useToast();

  const form = useForm<InsertVehicleGroup>({
    resolver: zodResolver(insertVehicleGroupSchema),
    defaultValues: {
      group_code: "",
      region: "",
      name: "",
      type: "",
      department: "",
      image_url: "",
      description: ""
    }
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        group_code: initialData.group_code,
        region: initialData.region,
        name: initialData.name,
        type: initialData.type,
        department: initialData.department,
        image_url: initialData.image_url || "",
        description: initialData.description || ""
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (data: InsertVehicleGroup) => {
    try {
      await onSubmit(data);
      if (!isEditing) {
        form.reset();
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit form",
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="group_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Code *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter group code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter group name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(VehicleGroupType).map((type) => (
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
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="Enter image URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Enter description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit"
          className="w-full"
        >
          {isEditing ? "Update Vehicle Group" : "Create Vehicle Group"}
        </Button>
      </form>
    </Form>
  );
}