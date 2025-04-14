import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { insertBookingSchema, BookingType, Priority, BoxSize, TripType, BookingPurpose, CargoType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LocationInput } from "@/components/location-input";
import { UAELocationAutocomplete } from "@/components/uae-location-autocomplete";
import { refreshBookings } from "@/lib/booking-refresh";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { BookingConfirmationAnimation } from "@/components/booking-confirmation-animation";
import { EmployeeEmailSearch } from "@/components/employee-email-search";

// Location interface matching schema requirements
export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
  district?: string;
  city?: string;
  area?: string;
  place_types?: string[];
}

// Interface for passenger details
export interface PassengerDetail {
  name: string;
  contact: string;
}

// Get minimum pickup time (now)
function getMinimumPickupTime(): Date {
  const now = new Date();
  return now;
}

// Get minimum offset based on priority
function getMinimumOffset(priority: string): number {
  switch (priority) {
    case Priority.EMERGENCY:
      return 30 * 60 * 1000; // 30 minutes
    case Priority.HIGH:
      return 60 * 60 * 1000; // 1 hour
    case Priority.NORMAL:
      return 3 * 60 * 60 * 1000; // 3 hours
    default:
      return 0;
  }
}

export function SimplifiedBookingForm() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [pickupLocation, setPickupLocation] = React.useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = React.useState<Location | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [createdReferenceNo, setCreatedReferenceNo] = React.useState<string>("");
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<any>(null);

  // Forms
  // Create a customized schema that enforces employee_id is required
  const bookingFormSchema = insertBookingSchema.extend({
    // For employee ID validation - ensure it's a valid number
    employee_id: z.union([
      z.number().int().positive().transform(val => Number(val)), // Ensure it's always a number type
      z.string()
        .refine(val => !isNaN(Number(val)) && Number(val) > 0, { 
          message: "A valid employee ID is required" 
        })
        .transform(val => Number(val)) // Convert string to number
    ]).transform(val => {
      console.log("🛠️ Schema transform - employee_id:", val, "Type:", typeof val);
      const numVal = Number(val);
      if (isNaN(numVal)) {
        throw new Error("Invalid employee ID - must be a valid number");
      }
      return numVal;
    }),
    // Add validation for UI fields that are not in the base schema
    employeeId: z.string().min(1, { message: "Employee ID is required" }),
    employeeName: z.string().min(1, { message: "Employee name is required" }),
  });

  const form = useForm({
    resolver: zodResolver(bookingFormSchema),
    mode: "onChange",
    defaultValues: {
      employee_id: undefined as any, // Using undefined to trigger validation
      employeeId: "",
      employeeName: "",
      bookingType: BookingType.PASSENGER,
      purpose: BookingPurpose.HOSPITAL_VISIT,
      priority: Priority.NORMAL,
      pickupLocation: undefined as any,
      dropoffLocation: undefined as any,
      pickupTime: getMinimumPickupTime().toISOString(),
      dropoffTime: "",
      cargoType: "",
      numBoxes: 0,
      weight: 0,
      boxSize: [],
      tripType: "",
      numPassengers: 0,
      passengerInfo: [],
      referenceNo: "",
      remarks: "",
      withDriver: false,
      bookingForSelf: false,
      passengerDetails: [] as PassengerDetail[],
    }
  });

  const bookingType = form.watch("bookingType") as string;
  const purpose = form.watch("purpose");
  const priority = form.watch("priority");

  // Update form when location is selected
  React.useEffect(() => {
    if (pickupLocation) {
      form.setValue("pickupLocation", pickupLocation as any, { shouldValidate: true });
    }
  }, [pickupLocation, form]);

  React.useEffect(() => {
    if (dropoffLocation) {
      form.setValue("dropoffLocation", dropoffLocation as any, { shouldValidate: true });
    }
  }, [dropoffLocation, form]);

  // Step validation
  const isStepValid = async (step: number) => {
    const fields = {
      1: ["employeeId", "bookingType"],
      2: ["purpose", "priority"],
      3: ["pickupLocation", "dropoffLocation"],
      4: ["pickupTime", "dropoffTime"]
    }[step] || [];

    return await form.trigger(fields as any);
  };

  // Navigate between steps
  const handleNextStep = async () => {
    const isValid = await isStepValid(currentStep);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast({
        title: "Please complete required fields",
        description: "Some required information is missing or incorrect.",
        variant: "destructive"
      });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Form submission handler
  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      console.log("🚀 BOOKING FORM - Submitting booking data:", data);
      console.log("🚀 BOOKING FORM - Employee ID (from form):", data.employee_id || data.employeeId);
      console.log("🚀 BOOKING FORM - Selected Employee Object:", selectedEmployee);
      console.log("🚀 BOOKING FORM - Pickup Location:", data.pickupLocation);
      console.log("🚀 BOOKING FORM - Dropoff Location:", data.dropoffLocation);

      // Check if employee ID is available and valid
      let employeeId = null;
      
      // Get employee ID from form data first
      if (data.employee_id && !isNaN(Number(data.employee_id))) {
        employeeId = Number(data.employee_id);
        console.log("🚀 BOOKING FORM - Using employee_id from form data:", employeeId);
      } 
      // Fall back to employeeId field (camelCase variant)
      else if (data.employeeId && !isNaN(Number(data.employeeId))) {
        employeeId = Number(data.employeeId);
        console.log("🚀 BOOKING FORM - Using employeeId from form data:", employeeId);
      }
      // Fall back to selectedEmployee object
      else if (selectedEmployee) {
        // Try to get ID from selectedEmployee
        if (selectedEmployee.id && !isNaN(Number(selectedEmployee.id))) {
          employeeId = Number(selectedEmployee.id);
          console.log("🚀 BOOKING FORM - Using id from selectedEmployee:", employeeId);
        } 
        // Or try to get employee_id from selectedEmployee
        else if (selectedEmployee.employee_id && !isNaN(Number(selectedEmployee.employee_id))) {
          employeeId = Number(selectedEmployee.employee_id);
          console.log("🚀 BOOKING FORM - Using employee_id from selectedEmployee:", employeeId);
        }
      }
      
      // Validate that we have an employee ID
      if (!employeeId || isNaN(employeeId) || employeeId <= 0) {
        console.error("🚀 BOOKING FORM - Invalid employee ID:", employeeId);
        toast({
          title: "Employee ID is required",
          description: "Please search and select a valid employee from the search box",
          variant: "destructive"
        });
        return;
      }

      // Check authentication token next
      const authToken = localStorage.getItem('auth_token');
      console.log("🚀 BOOKING FORM - Auth token exists:", !!authToken);
      
      if (!authToken) {
        console.error("🚀 BOOKING FORM - No auth token found!");
        toast({
          title: "Authentication error",
          description: "Please log in again.",
          variant: "destructive"
        });
        return;
      }

      // Validate pickup and dropoff locations
      if (!pickupLocation || !pickupLocation.address || !pickupLocation.coordinates) {
        console.error("🚀 BOOKING FORM - Invalid pickup location:", pickupLocation);
        toast({
          title: "Pickup location required",
          description: "Please select a valid pickup location from the map",
          variant: "destructive"
        });
        return;
      }

      if (!dropoffLocation || !dropoffLocation.address || !dropoffLocation.coordinates) {
        console.error("🚀 BOOKING FORM - Invalid dropoff location:", dropoffLocation);
        toast({
          title: "Dropoff location required",
          description: "Please select a valid dropoff location from the map",
          variant: "destructive"
        });
        return;
      }

      // Validate dates
      const pickupTime = new Date(data.pickupTime);
      const dropoffTime = new Date(data.dropoffTime);

      if (isNaN(pickupTime.getTime())) {
        console.error("🚀 BOOKING FORM - Invalid pickup time:", data.pickupTime);
        toast({
          title: "Invalid pickup time",
          description: "Please select a valid date and time for pickup",
          variant: "destructive"
        });
        return;
      }

      if (isNaN(dropoffTime.getTime())) {
        console.error("🚀 BOOKING FORM - Invalid dropoff time:", data.dropoffTime);
        toast({
          title: "Invalid dropoff time",
          description: "Please select a valid date and time for dropoff",
          variant: "destructive"
        });
        return;
      }

      // Ensure employee ID is a proper number (not a string or other type)
      const finalEmployeeId = Number(employeeId);
      if (isNaN(finalEmployeeId) || !isFinite(finalEmployeeId)) {
        console.error("🚀 BOOKING FORM - Final employee ID is not a valid number:", employeeId);
        toast({
          title: "Invalid employee ID",
          description: "Please select a valid employee from the search box",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log("🚀 BOOKING FORM - Final numeric employee ID:", finalEmployeeId, "Type:", typeof finalEmployeeId);
            
      // Format the data for API submission with special attention to the employee ID
      const bookingData = {
        employee_id: finalEmployeeId, // Use the validated numeric employee ID
        booking_type: data.bookingType,
        purpose: data.purpose,
        priority: data.priority,
        pickup_location: pickupLocation, // Use the state variable for consistent structure
        dropoff_location: dropoffLocation, // Use the state variable for consistent structure
        pickup_time: pickupTime.toISOString(),
        dropoff_time: dropoffTime.toISOString(),
        remarks: data.remarks || "",
        reference_no: data.referenceNo || undefined,

        // Passenger-specific fields
        ...(data.bookingType === "passenger" ? {
          trip_type: data.tripType,
          num_passengers: Number(data.numPassengers) || 1,
          with_driver: data.withDriver === true,
          booking_for_self: data.bookingForSelf === true,
          passenger_details: data.passengerDetails || []
        } : {}),

        // Freight-specific fields
        ...(data.bookingType === "freight" ? {
          cargo_type: data.cargoType,
          num_boxes: Number(data.numBoxes) || 1,
          weight: Number(data.weight) || 0,
          box_size: data.boxSize || []
        } : {})
      };

      console.log("🚀 BOOKING FORM - FINAL Formatted booking data for API:", JSON.stringify(bookingData, null, 2));
      console.log("🚀 BOOKING FORM - Sending to endpoint: /api/bookings/create");

      // Make the API request to our dedicated create endpoint
      console.log("🚀 BOOKING FORM - Starting API request...");
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(bookingData),
      });

      console.log("🚀 BOOKING FORM - API Response status:", response.status);
      console.log("🚀 BOOKING FORM - API Response status text:", response.statusText);

      // Handle error responses
      if (!response.ok) {
        const errorContentType = response.headers.get('content-type');
        let errorDetails = '';
        
        if (errorContentType && errorContentType.includes('application/json')) {
          const errorJson = await response.json();
          errorDetails = JSON.stringify(errorJson);
          console.error("🚀 BOOKING FORM - API Error (JSON):", errorJson);
        } else {
          errorDetails = await response.text();
          console.error("🚀 BOOKING FORM - API Error (Text):", errorDetails);
        }
        
        throw new Error(`API Error (${response.status}): ${errorDetails}`);
      }

      // Handle successful response
      const responseData = await response.json();
      console.log("🚀 BOOKING FORM - Booking created successfully:", responseData);
      console.log("🚀 BOOKING FORM - Booking ID:", responseData.id);
      console.log("🚀 BOOKING FORM - Reference No:", responseData.reference_no);

      // Show success message
      toast({
        title: "Booking created successfully",
        description: `Reference No: ${responseData.reference_no || "Generated"}`,
      });

      // Save reference number and show success dialog
      setCreatedReferenceNo(responseData.reference_no || "Generated");
      setShowSuccessDialog(true);

      // Refresh bookings data
      try {
        console.log("🚀 BOOKING FORM - Refreshing bookings data...");
        await refreshBookings();
        console.log("🚀 BOOKING FORM - Bookings data refreshed");
      } catch (refreshError) {
        console.warn("🚀 BOOKING FORM - Failed to refresh bookings:", refreshError);
      }

    } catch (error: any) {
      console.error("🚀 BOOKING FORM - Form submission error:", error);
      console.error("🚀 BOOKING FORM - Error details:", error.message);
      console.error("🚀 BOOKING FORM - Error stack:", error.stack);
      
      toast({
        title: "Error creating booking",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle success dialog close
  const handleSuccessDialogClose = async () => {
    setShowSuccessDialog(false);
    
    // Reset form
    form.reset();
    setCurrentStep(1);
    
    // Navigate to history page
    try {
      console.log("Refreshing bookings and navigating to history page...");
      await refreshBookings();
      // Use the correct route from the App.tsx
      setLocation("/bookings");
    } catch (error) {
      console.error("Error navigating to history:", error);
      // Still navigate even if there is an error
      setLocation("/bookings");
    }
  };

  // Render pickup date/time picker
  const renderPickupDateTimePicker = (field: any) => (
    <DateTimePicker
      value={field.value ? new Date(field.value) : new Date()}
      onChange={(date) => {
        if (date) {
          field.onChange(date.toISOString());
        }
      }}
      onBlur={field.onBlur}
    />
  );

  // Render dropoff date/time picker
  const renderDropoffDateTimePicker = (field: any) => (
    <DateTimePicker
      value={field.value ? new Date(field.value) : null}
      onChange={(date) => {
        if (date) {
          field.onChange(date.toISOString());
        }
      }}
      disabled={!form.watch("pickupTime")}
    />
  );

  return (
    <>
      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <BookingConfirmationAnimation />
            <AlertDialogTitle className="text-center text-xl">
              Booking Confirmed!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your booking has been successfully created.
              <div className="mt-2 font-medium">
                Reference Number: <span className="text-primary">{createdReferenceNo}</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              onClick={handleSuccessDialogClose}
            >
              View Bookings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Form Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <h2 className="text-xl font-semibold">New Booking</h2>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <EmployeeEmailSearch 
                      onEmployeeFound={(employeeData) => {
                        console.log("🚀 Employee found:", JSON.stringify(employeeData, null, 2));
                        
                        // First identify which field contains the employee ID
                        let empId = null;
                        
                        // Dump all fields for debugging
                        console.log("EMPLOYEE DATA FIELDS:", Object.keys(employeeData));
                        
                        // IMPORTANT: Always prioritize using employee_id field, which is the actual employee ID
                        // The 'id' field is the internal database record ID and should not be used for bookings
                        if (employeeData?.employee_id) {
                          // Try to convert to number if it's a string
                          if (typeof employeeData.employee_id === 'string') {
                            const idValue = parseInt(employeeData.employee_id, 10);
                            if (!isNaN(idValue)) {
                              empId = idValue;
                              console.log("🚀 Converted string employee_id to number:", empId);
                            } else {
                              console.error("🚀 Failed to convert employee_id to number:", employeeData.employee_id);
                            }
                          } else if (typeof employeeData.employee_id === 'number') {
                            empId = employeeData.employee_id;
                            console.log("🚀 Using numeric employee_id field:", empId);
                          }
                        }
                        // Only as a last resort fallback to internal id if employee_id is not available
                        else if (employeeData?.id && typeof employeeData.id === 'number') {
                          empId = employeeData.id;
                          console.log("🚀 Using internal database ID as fallback:", empId, "Type:", typeof empId);
                        }
                        
                        // Make sure we have a valid employee ID
                        if (empId !== null && !isNaN(empId)) {
                          // Log details for debugging
                          console.log("🚀 Valid employee ID found:", {
                            value: empId,
                            type: typeof empId,
                            isNumber: typeof empId === 'number',
                            isInteger: Number.isInteger(empId),
                            isFinite: isFinite(empId)
                          });
                          
                          // Ensure it's a proper number
                          const numericId = Number(empId);
                          
                          // Set both properties to ensure the form has the employee ID in all expected formats
                          console.log("🚀 Setting employee_id to:", numericId);
                          console.log("🚀 Type of employee_id:", typeof numericId);
                          
                          // Set in snake_case format - ensure it's a number
                          form.setValue("employee_id", numericId, {
                            shouldValidate: true,
                            shouldDirty: true
                          });
                          
                          // Also set in camelCase format for compatibility - as string
                          form.setValue("employeeId", String(numericId), {
                            shouldValidate: true,
                            shouldDirty: true
                          });
                          
                          // Set the employee name if available
                          const employeeName = employeeData?.employee_name || employeeData?.employeeName;
                          if (employeeName) {
                            form.setValue("employeeName", employeeName, {
                              shouldValidate: true,
                              shouldDirty: true
                            });
                          }
                          
                          console.log("🚀 Employee data successfully set:", {
                            id: numericId,
                            name: employeeName
                          });
                          
                          // Log current form values
                          console.log("🚀 Current form values:", form.getValues());
                          
                          // Save complete employee data for reference
                          setSelectedEmployee({
                            ...employeeData,
                            id: numericId, // Ensure ID is a number in the stored object
                          });
                        } else {
                          console.error("🚀 ERROR: Could not find valid employee ID in:", employeeData);
                          // Try to look in all nested properties
                          if (employeeData) {
                            Object.entries(employeeData).forEach(([key, value]) => {
                              console.log(`Property ${key}:`, value, "Type:", typeof value);
                              if (key === 'id' || key === 'employee_id' || key.includes('id')) {
                                console.log(`Potential ID field found: ${key} =`, value);
                              }
                            });
                          }
                        }
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee ID</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              readOnly 
                              className={field.value ? "bg-muted" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="employeeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              readOnly 
                              className={field.value ? "bg-muted" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bookingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select booking type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(BookingType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(BookingPurpose).map((purpose) => (
                              <SelectItem key={purpose} value={purpose}>
                                {purpose}
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(Priority).map((priority) => (
                              <SelectItem key={priority} value={priority}>
                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {bookingType === "passenger" && (
                    <>
                      <FormField
                        control={form.control}
                        name="numPassengers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Passengers</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center space-x-2">
                        <FormField
                          control={form.control}
                          name="bookingForSelf"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Booking for Self</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  {bookingType === "freight" && (
                    <>
                      <FormField
                        control={form.control}
                        name="cargoType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select cargo type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(CargoType).map((type) => (
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
                        name="numBoxes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Boxes</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Remarks</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any special instructions or notes here"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="pickupLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Location</FormLabel>
                        <FormControl>
                          <UAELocationAutocomplete
                            value={pickupLocation?.address || ""}
                            placeholder="Enter pickup location"
                            onLocationSelect={(location) => {
                              setPickupLocation(location);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dropoffLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dropoff Location</FormLabel>
                        <FormControl>
                          <UAELocationAutocomplete
                            value={dropoffLocation?.address || ""}
                            placeholder="Enter dropoff location"
                            onLocationSelect={(location) => {
                              setDropoffLocation(location);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="pickupTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Time</FormLabel>
                        <FormControl>
                          {renderPickupDateTimePicker(field)}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dropoffTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dropoff Time</FormLabel>
                        <FormControl>
                          {renderDropoffDateTimePicker(field)}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Booking Summary</h3>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium mb-1">Employee</p>
                        <p className="text-sm">{form.getValues("employeeName")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Employee ID</p>
                        <p className="text-sm">{form.getValues("employeeId")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Booking Type</p>
                        <p className="text-sm">{form.getValues("bookingType")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Purpose</p>
                        <p className="text-sm">{form.getValues("purpose")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Priority</p>
                        <p className="text-sm">{form.getValues("priority")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Pickup Time</p>
                        <p className="text-sm">
                          {form.getValues("pickupTime") 
                            ? format(new Date(form.getValues("pickupTime")), "MMM d, yyyy h:mm a") 
                            : "Not set"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium mb-1">Pickup Location</p>
                        <p className="text-sm">{(form.getValues("pickupLocation") as any)?.address || "Not set"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium mb-1">Dropoff Location</p>
                        <p className="text-sm">{(form.getValues("dropoffLocation") as any)?.address || "Not set"}</p>
                      </div>
                      {form.getValues("remarks") && (
                        <div className="col-span-2">
                          <p className="text-sm font-medium mb-1">Remarks</p>
                          <p className="text-sm">{form.getValues("remarks")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handlePrevStep}>
                    Previous
                  </Button>
                )}
                {currentStep < 5 ? (
                  <Button type="button" className="ml-auto" onClick={handleNextStep}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="ml-auto bg-primary" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating Booking..." : "Create Booking"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}