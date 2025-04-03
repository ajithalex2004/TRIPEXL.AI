import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema, type InsertEmployee, type Employee } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Department, EmployeeDesignation, EmployeeType, EmployeeRole, HierarchyLevel, Region } from "@shared/schema";
import { useState } from "react";

interface AddEmployeeFormProps {
  onSuccess?: () => void;
  initialData?: Employee;
}

// Helper functions (outside component to avoid redeclaration issues)
const extractCountryCode = (mobileNumber: string | null | undefined): string => {
  if (!mobileNumber) return "+971";
  const codes = ["+971", "+966", "+974", "+973", "+968", "+965"];
  for (const code of codes) {
    if (mobileNumber.startsWith(code)) {
      return code;
    }
  }
  return "+971"; // Default to UAE
};

const extractMobileNumber = (mobileNumber: string | null | undefined): string => {
  if (!mobileNumber) return "";
  const codes = ["+971", "+966", "+974", "+973", "+968", "+965"];
  for (const code of codes) {
    if (mobileNumber.startsWith(code)) {
      return mobileNumber.substring(code.length);
    }
  }
  return mobileNumber;
};

export function AddEmployeeForm({ onSuccess, initialData }: AddEmployeeFormProps) {
  const queryClient = useQueryClient();
  
  // Initialize country code from mobile number or default to UAE
  const [countryCode, setCountryCode] = useState(
    extractCountryCode(initialData?.mobile_number)
  );
  
  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      employee_type: initialData?.employee_type || EmployeeType.PERMANENT,
      employee_role: initialData?.employee_role || EmployeeRole.EMPLOYEE,
      is_active: initialData?.is_active ?? true, // Default to true for new employees
      employee_id: initialData?.employee_id || undefined,
      employee_name: initialData?.employee_name || "",
      email_id: initialData?.email_id || "",
      // Extract the mobile number without country code
      mobile_number: extractMobileNumber(initialData?.mobile_number) || "",
      designation: initialData?.designation || "",
      department: initialData?.department || "",
      region: initialData?.region || "",
      unit: initialData?.unit || "",
      hierarchy_level: initialData?.hierarchy_level || "",
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await fetch(initialData ? `/api/employees/${initialData.id}` : '/api/employees', {
        method: initialData ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${initialData ? 'update' : 'create'} employee`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Success",
        description: `Employee ${initialData ? 'updated' : 'created'} successfully`,
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmployee) => {
    // Combine country code with mobile number
    const formattedData = {
      ...data,
      mobile_number: data.mobile_number ? `${countryCode}${data.mobile_number}` : ""
    };
    
    console.log("Submitting employee data:", formattedData);
    mutation.mutate(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 min-w-[600px] pb-6">
        {/* Add is_active switch at the top */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Employee Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  {field.value ? "Active" : "Inactive"}
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employee_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="email_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="col-span-2">
            <div className="flex gap-2">
              <FormItem className="w-1/3">
                <FormLabel>Code</FormLabel>
                <Select onValueChange={setCountryCode} defaultValue={countryCode}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="+971">+971 (UAE)</SelectItem>
                    <SelectItem value="+966">+966 (KSA)</SelectItem>
                    <SelectItem value="+974">+974 (Qatar)</SelectItem>
                    <SelectItem value="+973">+973 (Bahrain)</SelectItem>
                    <SelectItem value="+968">+968 (Oman)</SelectItem>
                    <SelectItem value="+965">+965 (Kuwait)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
              
              <FormField
                control={form.control}
                name="mobile_number"
                render={({ field }) => (
                  <FormItem className="w-2/3">
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={9}
                        placeholder="5XXXXXXXX"
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 9) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="designation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Designation</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(EmployeeDesignation).map((designation) => (
                      <SelectItem key={designation} value={designation}>
                        {designation}
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
            name="hierarchy_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hierarchy Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hierarchy level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={HierarchyLevel.LEVEL_1}>
                      Level 1 - Approval Authority/Dept Head
                    </SelectItem>
                    <SelectItem value={HierarchyLevel.LEVEL_2}>
                      Level 2 - Senior Management
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employee_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(EmployeeType).map((type) => (
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
            name="employee_role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(EmployeeRole).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-6"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : initialData ? "Update Employee" : "Create Employee"}
        </Button>
      </form>
    </Form>
  );
}