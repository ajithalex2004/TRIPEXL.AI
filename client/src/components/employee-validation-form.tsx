import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState, KeyboardEvent, FocusEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { LoadingAnimation } from "./loading-animation";
import { motion, AnimatePresence } from "framer-motion";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";

const formSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required")
});

const registrationSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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
  const [, setLocation] = useLocation();
  const [isValidating, setIsValidating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null);
  const [lastValidatedId, setLastValidatedId] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
    },
  });

  const registrationForm = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
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
        description: "Employee details retrieved successfully. You can now register.",
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

  const handleRegistration = async (values: z.infer<typeof registrationSchema>) => {
    if (!employeeDetails) return;

    setIsRegistering(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employeeDetails.employeeId,
          email: employeeDetails.emailId,
          password: values.password,
          name: employeeDetails.employeeName,
          department: employeeDetails.department,
          designation: employeeDetails.designation,
          region: employeeDetails.region,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration failed');
      }

      toast({
        title: "Registration Successful",
        description: "You can now login with your email and password",
      });

      setLocation("/auth/login");
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
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
                    <AnimatePresence>
                      {isValidating && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          <LoadingAnimation size="sm" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <AnimatePresence mode="wait">
            {employeeDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 border rounded-lg p-6 bg-background/50 backdrop-blur-sm"
              >
                <h3 className="text-xl font-semibold mb-4">Employee Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(employeeDetails).map(([key, value]) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <p className="text-sm mt-1">{value}</p>
                    </motion.div>
                  ))}
                </div>

                <Form {...registrationForm}>
                  <form onSubmit={registrationForm.handleSubmit(handleRegistration)} className="space-y-4 mt-6">
                    <FormField
                      control={registrationForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registrationForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isRegistering}
                    >
                      {isRegistering ? (
                        <LoadingAnimation size="sm" />
                      ) : (
                        "Register with Employee Details"
                      )}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </Form>
    </div>
  );
}