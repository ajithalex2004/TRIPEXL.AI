import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import debounce from 'lodash.debounce';

// Form schema for email input
const emailSearchSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),
});

// Form schema for employee ID input
const employeeIdSearchSchema = z.object({
  employeeId: z
    .string()
    .min(1, { message: "Employee ID is required" }),
});

type EmailSearchFormValues = z.infer<typeof emailSearchSchema>;
type EmployeeIdSearchFormValues = z.infer<typeof employeeIdSearchSchema>;

interface EmployeeSearchProps {
  onEmployeeFound: (employeeData: any) => void;
  defaultEmail?: string;
  defaultEmployeeId?: string;
  className?: string;
  disabled?: boolean;
}

export function EmployeeEmailSearch({
  onEmployeeFound,
  defaultEmail = "",
  defaultEmployeeId = "",
  className = "",
  disabled = false
}: EmployeeSearchProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(defaultEmail);
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId);
  const [searchMethod, setSearchMethod] = useState<"email" | "id">("email");
  const [isSearching, setIsSearching] = useState(false);

  // Initialize form with default values
  const emailForm = useForm<EmailSearchFormValues>({
    resolver: zodResolver(emailSearchSchema),
    defaultValues: {
      email: defaultEmail,
    },
  });

  // Initialize form for employee ID search
  const employeeIdForm = useForm<EmployeeIdSearchFormValues>({
    resolver: zodResolver(employeeIdSearchSchema),
    defaultValues: {
      employeeId: defaultEmployeeId,
    },
  });

  // Set up the email search query but don't enable it until we need it
  const { isFetching: isEmailFetching, refetch: refetchByEmail } = useQuery({
    queryKey: ["/api/employee/search", email],
    queryFn: async () => {
      if (!email) return null;
      
      const response = await apiRequest("GET", `/api/employee/search?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch employee data");
      }
      
      return response.json();
    },
    enabled: false, // We'll manually trigger this
    retry: false,
  });

  // Set up the employee ID search query
  const { isFetching: isIdFetching, refetch: refetchById } = useQuery({
    queryKey: ["/api/users/by-employee", employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      
      const response = await apiRequest("GET", `/api/users/by-employee/${encodeURIComponent(employeeId)}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to find employee by ID");
      }
      
      return response.json();
    },
    enabled: false, // We'll manually trigger this
    retry: false,
  });

  // Debounced search function for email
  const debouncedEmailSearch = useCallback(
    debounce((email: string) => {
      setIsSearching(true);
      refetchByEmail().then((result) => {
        setIsSearching(false);
        if (result.data) {
          // Log the employee data for debugging
          console.log("Employee data from email search:", result.data);
          console.log("Employee ID (internal database ID):", result.data.id);
          console.log("Employee ID (display ID):", result.data.employee_id);
          
          // Create a properly formatted employee data object
          // IMPORTANT: Make sure we use the internal database ID (id) as the primary ID
          // for database relations, not the display ID (employee_id)
          const formattedData = {
            // Internal database ID - crucial for database relations
            id: result.data.id,
            // Display ID - used for UI display purposes
            employee_id: result.data.employee_id,
            // Other employee fields
            employee_name: result.data.employee_name,
            email_id: result.data.email_id,
            department: result.data.department,
            designation: result.data.designation,
            // Include any user mapping data
            user: result.data.user
          };
          
          // Call the parent component's callback with the properly formatted employee data
          onEmployeeFound(formattedData);
          
          // Show success indicator briefly
          setEmployeeFound(true);
          
          // Hide the success indicator after 2 seconds (reduced from 3)
          setTimeout(() => {
            setEmployeeFound(false);
          }, 2000);
        }
      }).catch((error) => {
        setIsSearching(false);
        toast({
          title: "Employee Not Found",
          description: error.message || "No employee found with this email address",
          variant: "destructive",
        });
      });
    }, 500),
    [refetchByEmail, onEmployeeFound, toast]
  );

  // Debounced search function for employee ID
  const debouncedIdSearch = useCallback(
    debounce((id: string) => {
      setIsSearching(true);
      refetchById().then((result) => {
        setIsSearching(false);
        if (result.data && result.data.employee) {
          // Format the employee data to match the expected structure
          const formattedData = {
            id: result.data.employee.id,
            employee_id: result.data.employee.employee_id,
            employee_name: result.data.employee.employee_name,
            email_id: result.data.employee.email_id,
            department: result.data.employee.department,
            designation: result.data.employee.designation,
            user: result.data.user
          };
          
          // Call the parent component's callback with the employee data
          onEmployeeFound(formattedData);
          
          // Show success indicator briefly
          setEmployeeFound(true);
          
          // Hide the success indicator after 3 seconds
          setTimeout(() => {
            setEmployeeFound(false);
          }, 3000);
        }
      }).catch((error) => {
        setIsSearching(false);
        toast({
          title: "Employee Not Found",
          description: error.message || "No employee found with this ID",
          variant: "destructive",
        });
      });
    }, 500),
    [refetchById, onEmployeeFound, toast]
  );

  // Handle email form submission
  const onEmailSubmit = (values: EmailSearchFormValues) => {
    setEmail(values.email);
    setIsSearching(true);
    refetchByEmail().then((result) => {
      setIsSearching(false);
      if (result.data) {
        // Log the employee data for debugging
        console.log("Email form submit - Employee data:", result.data);
        console.log("Email form submit - Internal database ID:", result.data.id);
        console.log("Email form submit - Display ID:", result.data.employee_id);
        
        // Create a properly formatted employee data object
        const formattedData = {
          // Internal database ID - crucial for database relations
          id: result.data.id,
          // Display ID - used for UI display purposes
          employee_id: result.data.employee_id,
          // Other employee fields
          employee_name: result.data.employee_name,
          email_id: result.data.email_id,
          department: result.data.department,
          designation: result.data.designation,
          // Include any user mapping data
          user: result.data.user
        };
        
        // Call the parent component's callback with the formatted employee data
        onEmployeeFound(formattedData);
        
        // Show success indicator briefly
        setEmployeeFound(true);
        
        // Hide the success indicator after 2 seconds (reduced from 3)
        setTimeout(() => {
          setEmployeeFound(false);
        }, 2000);
      }
    }).catch((error) => {
      setIsSearching(false);
      toast({
        title: "Employee Not Found",
        description: error.message || "No employee found with this email address",
        variant: "destructive",
      });
    });
  };

  // Handle employee ID form submission
  const onIdSubmit = (values: EmployeeIdSearchFormValues) => {
    setEmployeeId(values.employeeId);
    setIsSearching(true);
    refetchById().then((result) => {
      setIsSearching(false);
      if (result.data && result.data.employee) {
        // Log the employee data for debugging
        console.log("ID form submit - Employee data:", result.data.employee);
        console.log("ID form submit - Internal database ID:", result.data.employee.id);
        console.log("ID form submit - Display ID:", result.data.employee.employee_id);
        
        // Format the employee data to match the expected structure
        const formattedData = {
          // Internal database ID - crucial for database relations
          id: result.data.employee.id,
          // Display ID - used for UI display purposes
          employee_id: result.data.employee.employee_id,
          // Other employee fields
          employee_name: result.data.employee.employee_name,
          email_id: result.data.employee.email_id,
          department: result.data.employee.department,
          designation: result.data.employee.designation,
          // Include any user mapping data
          user: result.data.user
        };
        
        // Call the parent component's callback with the employee data
        onEmployeeFound(formattedData);
        
        // Show success indicator briefly
        setEmployeeFound(true);
        
        // Hide the success indicator after 2 seconds (reduced from 3)
        setTimeout(() => {
          setEmployeeFound(false);
        }, 2000);
      }
    }).catch((error) => {
      setIsSearching(false);
      toast({
        title: "Employee Not Found",
        description: error.message || "No employee found with this ID",
        variant: "destructive",
      });
    });
  };

  // When the email changes, update the search
  React.useEffect(() => {
    if (email && email !== emailForm.getValues().email) {
      emailForm.setValue("email", email);
      if (searchMethod === "email") {
        debouncedEmailSearch(email);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, searchMethod]);

  // When the employee ID changes, update the search
  React.useEffect(() => {
    if (employeeId && employeeId !== employeeIdForm.getValues().employeeId) {
      employeeIdForm.setValue("employeeId", employeeId);
      if (searchMethod === "id") {
        debouncedIdSearch(employeeId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, searchMethod]);

  // When component unmounts, cancel any pending debounced searches
  React.useEffect(() => {
    return () => {
      debouncedEmailSearch.cancel();
      debouncedIdSearch.cancel();
    };
  }, [debouncedEmailSearch, debouncedIdSearch]);

  const isFetching = searchMethod === "email" ? isEmailFetching : isIdFetching;

  // We'll use a ref to maintain a hidden flag that tracks if we've successfully populated
  // employee data, but we don't want to show the window
  const [employeeFound, setEmployeeFound] = React.useState(false);
  
  return (
    <div className={`w-full ${className}`}>
      <Tabs
        defaultValue="email"
        onValueChange={(value) => setSearchMethod(value as "email" | "id")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-2">
          <TabsTrigger value="email">Search by Email</TabsTrigger>
          <TabsTrigger value="id">Search by Employee ID</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              className="flex flex-col space-y-2"
            >
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input
                          placeholder="Enter email address"
                          {...field}
                          disabled={disabled || isSearching || isFetching}
                          onChange={(e) => {
                            field.onChange(e);
                            // Reset employee found status when input changes
                            setEmployeeFound(false);
                            
                            // Trigger the debounced search on each keystroke for better UX
                            const newValue = e.target.value;
                            if (newValue && newValue.includes('@')) {
                              setEmail(newValue);
                              debouncedEmailSearch(newValue);
                            }
                          }}
                        />
                      </FormControl>
                      <Button 
                        type="submit" 
                        disabled={disabled || isSearching || isFetching}
                        variant="secondary"
                      >
                        Search
                      </Button>
                    </div>
                    <FormDescription>
                      Enter the employee's corporate email address to look up their details
                    </FormDescription>
                    <FormMessage />
                    
                    {/* Success indicator that appears briefly */}
                    {employeeFound && (
                      <div className="text-sm font-medium text-green-600 animate-pulse mt-2">
                        ✓ Employee details found and populated
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="id">
          <Form {...employeeIdForm}>
            <form
              onSubmit={employeeIdForm.handleSubmit(onIdSubmit)}
              className="flex flex-col space-y-2"
            >
              <FormField
                control={employeeIdForm.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input
                          placeholder="Enter employee ID"
                          {...field}
                          disabled={disabled || isSearching || isFetching}
                          onChange={(e) => {
                            field.onChange(e);
                            // Reset employee found status when input changes
                            setEmployeeFound(false);
                            
                            // Only search if there's actual input
                            const newValue = e.target.value;
                            if (newValue && newValue.length >= 3) {
                              setEmployeeId(newValue);
                              debouncedIdSearch(newValue);
                            }
                          }}
                        />
                      </FormControl>
                      <Button 
                        type="submit" 
                        disabled={disabled || isSearching || isFetching}
                        variant="secondary"
                      >
                        Search
                      </Button>
                    </div>
                    <FormDescription>
                      Enter the employee's ID number to look up their details (e.g., 1001, 1002)
                    </FormDescription>
                    <FormMessage />
                    
                    {/* Success indicator that appears briefly */}
                    {employeeFound && (
                      <div className="text-sm font-medium text-green-600 animate-pulse mt-2">
                        ✓ Employee details found and populated
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      {/* Loading indicator */}
      {(isSearching || isFetching) && (
        <div className="space-y-2 mt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}
    </div>
  );
}