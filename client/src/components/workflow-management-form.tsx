import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  InsertApprovalWorkflow,
  ApprovalWorkflow,
  Department,
  Region,
  WorkflowLevels,
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
      workflow_name: initialData?.workflow_name || "",
      region: initialData?.region || "",
      department: initialData?.department || "",
      unit: initialData?.unit || "",
      level_1_approver_id: initialData?.level_1_approver_id || undefined,
      level_2_approver_id: initialData?.level_2_approver_id || undefined,
      levels_required: initialData?.levels_required || WorkflowLevels.LEVEL_1_ONLY,
      is_active: initialData?.is_active ?? true,
    },
  });

  // Query to fetch available approvers (Level 1 and Level 2 employees)
  const { data: approversData } = useQuery({
    queryKey: ['/api/employees/approvers'],
    queryFn: async () => {
      try {
        console.log("Fetching approvers...");
        const response = await fetch('/api/employees/approvers');
        if (!response.ok) {
          throw new Error('Failed to fetch approvers');
        }
        const data = await response.json();
        console.log(`Found ${data.length} approvers`);
        return data;
      } catch (error) {
        console.error('Error fetching approvers:', error);
        throw error;
      }
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

  const watchLevelsRequired = form.watch("levels_required");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="workflow_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workflow Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter workflow name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="levels_required"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Approval Levels Required</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select required levels" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(WorkflowLevels).map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    {approversData?.filter(employee => 
                      employee.hierarchy_level === 'Level 1' || employee.designation === 'Approval Authority'
                    ).map((employee) => (
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

          {watchLevelsRequired === WorkflowLevels.BOTH_LEVELS && (
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
                      {approversData?.filter(employee => 
                        employee.hierarchy_level === 'Level 2'
                      ).map((employee) => (
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
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-[#004990] to-[#0066cc]"
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