import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema, BookingType, Priority, BoxSize, TripType, BookingPurpose, CargoType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LocationInput } from "@/components/location-input";
import { UAELocationAutocomplete } from "@/components/uae-location-autocomplete";
import { refreshBookings, switchToTab } from "@/lib/booking-refresh";
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
  const form = useForm({
    resolver: zodResolver(insertBookingSchema),
    mode: "onChange",
    defaultValues: {
      employee_id: "",
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
      console.log("Submitting booking data:", data);

      // Format the data for API submission
      const bookingData = {
        employee_id: Number(data.employee_id || data.employeeId),
        booking_type: data.bookingType,
        purpose: data.purpose,
        priority: data.priority,
        pickup_location: data.pickupLocation,
        dropoff_location: data.dropoffLocation,
        pickup_time: new Date(data.pickupTime).toISOString(),
        dropoff_time: new Date(data.dropoffTime).toISOString(),
        remarks: data.remarks || "",
        reference_no: data.referenceNo || undefined,

        // Passenger-specific fields
        ...(data.bookingType === "passenger" ? {
          trip_type: data.tripType,
          num_passengers: Number(data.numPassengers),
          with_driver: data.withDriver,
          booking_for_self: data.bookingForSelf,
          passenger_details: data.passengerDetails
        } : {}),

        // Freight-specific fields
        ...(data.bookingType === BookingType.FREIGHT ? {
          cargo_type: data.cargoType,
          num_boxes: Number(data.numBoxes),
          weight: Number(data.weight),
          box_size: data.boxSize
        } : {})
      };

      // Get the auth token
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        toast({
          title: "Authentication error",
          description: "Please log in again.",
          variant: "destructive"
        });
        return;
      }

      // Make the API request
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(bookingData),
      });

      console.log("API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(errorText || "Failed to create booking");
      }

      const responseData = await response.json();
      console.log("Booking created successfully:", responseData);

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
        await refreshBookings();
      } catch (refreshError) {
        console.warn("Failed to refresh bookings:", refreshError);
      }

    } catch (error: any) {
      console.error("Form submission error:", error);
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
      await refreshBookings();
      switchToTab("history");
      setLocation("/booking-history");
    } catch (error) {
      console.error("Error navigating to history:", error);
      setLocation("/booking-history");
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
                        console.log("Employee found:", employeeData);
                        
                        if (employeeData?.employee_id) {
                          const employeeIdValue = Number(employeeData.employee_id);
                          
                          if (!isNaN(employeeIdValue)) {
                            form.setValue("employee_id", String(employeeIdValue) as any, {
                              shouldValidate: true,
                              shouldDirty: true
                            });
                            
                            form.setValue("employeeId", String(employeeIdValue) as any, {
                              shouldValidate: true,
                              shouldDirty: true
                            });
                            
                            const employeeName = employeeData?.employee_name || employeeData?.employeeName;
                            if (employeeName) {
                              form.setValue("employeeName", employeeName, {
                                shouldValidate: true,
                                shouldDirty: true
                              });
                            }
                            
                            setSelectedEmployee(employeeData);
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