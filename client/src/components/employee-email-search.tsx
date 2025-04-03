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
} from "@/components/ui/form";
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

type EmailSearchFormValues = z.infer<typeof emailSearchSchema>;

interface EmployeeEmailSearchProps {
  onEmployeeFound: (employeeData: any) => void;
  defaultEmail?: string;
  className?: string;
  disabled?: boolean;
}

export function EmployeeEmailSearch({
  onEmployeeFound,
  defaultEmail = "",
  className = "",
  disabled = false
}: EmployeeEmailSearchProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(defaultEmail);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize form with default values
  const form = useForm<EmailSearchFormValues>({
    resolver: zodResolver(emailSearchSchema),
    defaultValues: {
      email: defaultEmail,
    },
  });

  // Set up the query but don't enable it until we need it
  const { data: employee, isFetching, refetch } = useQuery({
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

  // Debounced search function to prevent too many API calls
  const debouncedSearch = useCallback(
    debounce((email: string) => {
      setIsSearching(true);
      refetch().then((result) => {
        setIsSearching(false);
        if (result.data) {
          onEmployeeFound(result.data);
        }
      }).catch((error) => {
        setIsSearching(false);
        toast({
          title: "Error",
          description: error.message || "Failed to find employee with this email",
          variant: "destructive",
        });
      });
    }, 500),
    [refetch, onEmployeeFound, toast]
  );

  // Handle form submission
  const onSubmit = (values: EmailSearchFormValues) => {
    setEmail(values.email);
    debouncedSearch(values.email);
  };

  // When the email changes, update the search
  React.useEffect(() => {
    if (email && email !== form.getValues().email) {
      form.setValue("email", email);
      debouncedSearch(email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // When component unmounts, cancel any pending debounced searches
  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className={`w-full ${className}`}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col space-y-2"
        >
          <FormField
            control={form.control}
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
                        // Don't trigger search on every keystroke, let the form submission handle it
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
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {/* Employee data display */}
      {(isSearching || isFetching) && (
        <div className="space-y-2 mt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}
      
      {employee && !isSearching && !isFetching && (
        <div className="mt-4 p-3 bg-secondary/30 rounded-md border">
          <p className="font-medium">Employee found:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-sm font-medium">Employee ID:</p>
              <p className="text-sm">{employee.employeeId}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Name:</p>
              <p className="text-sm">{employee.employeeName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Department:</p>
              <p className="text-sm">{employee.department || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Designation:</p>
              <p className="text-sm">{employee.designation || "N/A"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}