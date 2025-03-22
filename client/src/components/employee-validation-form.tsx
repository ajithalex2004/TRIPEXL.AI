import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState, KeyboardEvent, FocusEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required")
});

interface EmployeeDetails {
  employeeId: string;
  employeeName: string;
  emailId: string;
  mobileNumber: string;
  employeeType: string;
  designation: string;
  department: string;
  nationality: string;
  region: string;
  communicationLanguage: string;
  unit: string;
}

export function EmployeeValidationForm() {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null);
  const [lastValidatedId, setLastValidatedId] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
    },
  });

  const validateEmployee = async (employeeId: string) => {
    if (!employeeId.trim()) return;
    if (employeeId === lastValidatedId) return;

    setIsValidating(true);
    setEmployeeDetails(null);

    try {
      console.log("Validating employee ID:", employeeId);
      const response = await fetch(`/api/employees/validate/${employeeId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to validate employee');
      }

      setEmployeeDetails(data);
      setLastValidatedId(employeeId);
      toast({
        title: "Employee Found",
        description: "Employee details retrieved successfully.",
      });
    } catch (error) {
      console.error('Error validating employee:', error);
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Failed to validate employee",
        variant: "destructive",
      });
      setEmployeeDetails(null);
      setLastValidatedId("");
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const employeeId = form.getValues('employeeId').trim();
      if (employeeId) {
        await validateEmployee(employeeId);
      }
    }
  };

  const handleBlur = async (e: FocusEvent<HTMLInputElement>) => {
    const employeeId = e.target.value.trim();
    if (employeeId) {
      await validateEmployee(employeeId);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Form {...form}>
        <form className="space-y-6">
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      onKeyDown={handleKeyDown}
                      onBlur={handleBlur}
                      placeholder="Enter Employee ID and press Enter"
                      disabled={isValidating}
                      className="pr-10"
                    />
                    {isValidating && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {employeeDetails && (
            <div className="space-y-4 border rounded-lg p-6 bg-background/50 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4">Employee Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm mt-1">{employeeDetails.employeeName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm mt-1">{employeeDetails.emailId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Mobile Number</label>
                  <p className="text-sm mt-1">{employeeDetails.mobileNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Employee Type</label>
                  <p className="text-sm mt-1">{employeeDetails.employeeType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Designation</label>
                  <p className="text-sm mt-1">{employeeDetails.designation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <p className="text-sm mt-1">{employeeDetails.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Nationality</label>
                  <p className="text-sm mt-1">{employeeDetails.nationality}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Region</label>
                  <p className="text-sm mt-1">{employeeDetails.region}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Communication Language</label>
                  <p className="text-sm mt-1">{employeeDetails.communicationLanguage}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Unit</label>
                  <p className="text-sm mt-1">{employeeDetails.unit}</p>
                </div>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}