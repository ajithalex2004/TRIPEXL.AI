import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InsertApprovalWorkflow,
  ApprovalWorkflow,
  Department,
  Region,
  insertApprovalWorkflowSchema,
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
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface WorkflowManagementFormProps {
  onSuccess?: () => void;
  initialData?: ApprovalWorkflow;
}

export function WorkflowManagementForm({ onSuccess, initialData }: WorkflowManagementFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<InsertApprovalWorkflow>({
    resolver: zodResolver(insertApprovalWorkflowSchema),
    defaultValues: {
      region: initialData?.region || "",
      department: initialData?.department || "",
      unit: initialData?.unit || "",
      level_1_approver_id: initialData?.level_1_approver_id,
      level_2_approver_id: initialData?.level_2_approver_id,
      is_active: initialData?.is_active ?? true,
    },
  });

  // Query to fetch available approvers (Level 1 and Level 2 employees)
  const { data: approvers } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      return response.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertApprovalWorkflow) => {
      const response = await fetch(
        initialData ? `/api/approval-workflows/${initialData.id}` : '/api/approval-workflows',
        {
          method: initialData ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${initialData ? 'update' : 'create'} workflow`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/approval-workflows'] });
      toast({
        title: "Success",
        description: `Workflow ${initialData ? 'updated' : 'created'} successfully`,
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

  const onSubmit = (data: InsertApprovalWorkflow) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
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
                  <Input {...field} placeholder="Enter unit name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="level_1_approver_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level 1 Approver</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Level 1 approver" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {approvers?.filter(e => e.hierarchy_level === "Level 1").map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.employee_name}
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
            name="level_2_approver_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level 2 Approver</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Level 2 approver" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {approvers?.filter(e => e.hierarchy_level === "Level 2").map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.employee_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? "Saving..."
            : initialData
            ? "Update Workflow"
            : "Create Workflow"}
        </Button>
      </form>
    </Form>
  );
}
