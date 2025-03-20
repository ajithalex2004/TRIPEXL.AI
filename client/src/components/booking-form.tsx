import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema, BookingType, Priority, BoxSize, TripType, BookingPurpose, CargoType } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LocationInput } from "@/components/location-input";
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
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { MapView } from "@/components/map-view";
import { motion, AnimatePresence } from "framer-motion";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { format } from "date-fns";

// Update the Location interface to match schema requirements
export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

// Add these helper functions at the top of the file
function getMinimumPickupTime(): Date {
  const now = new Date();
  const today = new Date();
  today.setHours(now.getHours());
  today.setMinutes(now.getMinutes());
  today.setSeconds(now.getSeconds());
  today.setMilliseconds(now.getMilliseconds()); //Added to ensure complete time copy
  return today;
}

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

// Add interface for passenger details
interface PassengerDetail {
  name: string;
  contact: string;
}

const DEFAULT_PICKUP_LOCATION = {
  address: "Al Wahda Mall",
  coordinates: {
    lat: 24.4697,
    lng: 54.3773
  },
  name: "Al Wahda Mall",
  formatted_address: "Al Wahda Mall, Hazza Bin Zayed The First St, Al Wahda, Abu Dhabi",
  place_id: "ChIJr2sMKkxdXj4RFG1JCQ935hw"
};

const DEFAULT_DROPOFF_LOCATION = {
  address: "Deira City Centre",
  coordinates: {
    lat: 25.2524,
    lng: 55.3300
  },
  name: "Deira City Centre",
  formatted_address: "Deira City Centre, 8 Street, Port Saeed, Dubai",
  place_id: "ChIJz3l4CkxcXj4R2yG4hHC9yjc"
};

export function BookingForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [activeLocation, setActiveLocation] = React.useState<"pickup" | "dropoff" | null>(null);
  const [routeDuration, setRouteDuration] = React.useState<number>(0);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [createdReferenceNo, setCreatedReferenceNo] = React.useState<string>("");
  const [, setLocation] = useLocation();

  const { data: employee, isLoading: isEmployeeLoading } = useQuery({
    queryKey: ["/api/employee/current"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");

      const response = await fetch("/api/employee/current", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch employee data");
      }

      return response.json();
    }
  });

  const form = useForm({
    resolver: zodResolver(insertBookingSchema),
    mode: "onChange",
    defaultValues: {
      employeeId: "",
      bookingType: "",
      purpose: "",
      priority: "",
      pickupLocation: DEFAULT_PICKUP_LOCATION,
      dropoffLocation: DEFAULT_DROPOFF_LOCATION,
      pickupTime: getMinimumPickupTime().toISOString(), // Set default to current time
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

  React.useEffect(() => {
    if (employee?.employeeId) {
      form.setValue("employeeId", employee.employeeId);
    }
  }, [employee, form]);

  const bookingType = form.watch("bookingType");
  const numBoxes = form.watch("numBoxes");

  React.useEffect(() => {
    if (bookingType === "freight") {
      form.setValue("purpose", BookingPurpose.FREIGHT_TRANSPORT);
      form.setValue("priority", Priority.NORMAL);
    }
  }, [bookingType, form]);

  const isStepValid = async (step: number) => {
    const fields = {
      1: ["employeeId", "bookingType"] as const,
      2: bookingType === "freight"
        ? ["cargoType", "numBoxes", "weight"] as const
        : bookingType === "passenger"
          ? ["tripType", "numPassengers", "withDriver", "bookingForSelf", "passengerDetails"] as const
          : [],
      3: ["purpose", "priority"] as const,
      4: ["pickupLocation", "dropoffLocation"] as const,
      5: ["pickupTime", "dropoffTime"] as const,
      6: [] as const
    }[step] || [];

    // Additional validation for passenger booking
    if (step === 2 && bookingType === "passenger") {
      const numPassengers = form.getValues("numPassengers");
      const passengerDetails = form.getValues("passengerDetails");

      if (numPassengers === 0) {
        toast({
          title: "Please enter passenger count",
          description: "At least one passenger is required.",
          variant: "destructive"
        });
        return false;
      }

      if (!passengerDetails || passengerDetails.length < numPassengers) {
        toast({
          title: "Incomplete passenger details",
          description: "Please provide details for all passengers.",
          variant: "destructive"
        });
        return false;
      }

      // Validate that all passenger details are filled
      const hasEmptyDetails = passengerDetails.some(
        (passenger, idx) => idx < numPassengers && (!passenger.name || !passenger.contact)
      );
      if (hasEmptyDetails) {
        toast({
          title: "Incomplete passenger details",
          description: "Please fill in all required passenger information.",
          variant: "destructive"
        });
        return false;
      }
    }

    return await form.trigger(fields);
  };

  const handleNextStep = async () => {
    const isValid = await isStepValid(currentStep);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    } else {
      toast({
        title: "Please complete required fields",
        description: "Some required information is missing or incorrect.",
        variant: "destructive"
      });
    }
  };

  const createBooking = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bookings", data);
      return res.json();
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setCreatedReferenceNo(response.referenceNo);
      setShowSuccessDialog(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    form.reset();
    setCurrentStep(1);
    setLocation("/"); // Redirect to home page after closing dialog
  };

  const onSubmit = async (data: any) => {
    try {
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please check all required fields and try again.",
          variant: "destructive"
        });
        return;
      }

      // Ensure we have all required data
      if (!data.pickupLocation || !data.dropoffLocation) {
        toast({
          title: "Missing Location Data",
          description: "Please select both pickup and dropoff locations.",
          variant: "destructive"
        });
        return;
      }

      if (!data.pickupTime || !data.dropoffTime) {
        toast({
          title: "Missing Time Data",
          description: "Please select both pickup and dropoff times.",
          variant: "destructive"
        });
        return;
      }

      // Format the data to match the schema
      const bookingData = {
        ...data,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        referenceNo: `BK${Date.now().toString().slice(-6)}`,
        employeeId: data.employeeId || employee?.employeeId,
        // Ensure passenger details are properly formatted
        passengerDetails: data.bookingType === "passenger"
          ? data.passengerDetails.slice(0, data.numPassengers)
          : [],
        // Ensure box sizes are properly formatted
        boxSize: data.bookingType === "freight"
          ? data.boxSize.slice(0, data.numBoxes)
          : []
      };

      console.log("Submitting booking data:", bookingData);
      createBooking.mutate(bookingData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting your booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getPriorityForPurpose = (purpose: string) => {
    if (bookingType === "freight") {
      return Priority.NORMAL;
    }

    const criticalPurposes = [
      BookingPurpose.BLOOD_BANK,
      BookingPurpose.ON_CALL,
      BookingPurpose.EQUIPMENT
    ];

    const emergencyPurposes = [
      BookingPurpose.BLOOD_SAMPLES,
      BookingPurpose.AMBULANCE,
      BookingPurpose.MORTUARY
    ];

    const highPurposes = [
      BookingPurpose.DRUG_COLLECTION
    ];

    if (criticalPurposes.includes(purpose)) {
      return Priority.CRITICAL;
    } else if (emergencyPurposes.includes(purpose)) {
      return Priority.EMERGENCY;
    } else if (highPurposes.includes(purpose)) {
      return Priority.HIGH;
    }
    return Priority.NORMAL;
  };

  const purpose = form.watch("purpose");
  React.useEffect(() => {
    if (purpose) {
      form.setValue("priority", getPriorityForPurpose(purpose));
    }
  }, [purpose, form]);

  // Update useEffect for handling priority changes to set immediate time for Critical
  React.useEffect(() => {
    const priority = form.watch("priority");
    if (priority) {
      const currentTime = new Date();

      if (priority === Priority.CRITICAL) {
        // For Critical priority, set to current time
        form.setValue("pickupTime", currentTime.toISOString(), {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });

        // Update dropoff time if route duration is available
        if (routeDuration) {
          const estimatedDropoff = new Date(currentTime.getTime() + (routeDuration * 1000));
          form.setValue("dropoffTime", estimatedDropoff.toISOString(), {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
        }
      } else {
        const minPickupTime = getMinimumPickupTime();
        const minOffset = getMinimumOffset(priority);
        const currentPickupTime = form.watch("pickupTime");

        if (currentPickupTime) {
          const currentDate = new Date(currentPickupTime);
          if (currentDate < minPickupTime) {
            const adjustedTime = new Date(minPickupTime.getTime() + minOffset);
            form.setValue("pickupTime", adjustedTime.toISOString(), {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true
            });
          }
        }
      }
    }
  }, [form.watch("priority"), routeDuration, form]);


  // Update the handleRouteCalculated function to properly set dropoff time
  const handleRouteCalculated = (durationInSeconds: number) => {
    console.log("Route duration received:", durationInSeconds);
    setRouteDuration(durationInSeconds);

    const pickupTime = form.watch("pickupTime");
    if (pickupTime) {
      const pickupDate = new Date(pickupTime);
      const estimatedDropoff = new Date(pickupDate.getTime() + (durationInSeconds * 1000));
      console.log("Setting minimum dropoff time to:", estimatedDropoff.toISOString());

      // Only set dropoff time automatically if it hasn't been manually set yet
      // or if the current dropoff time is earlier than the new ETA
      const currentDropoffTime = form.watch("dropoffTime");
      if (!currentDropoffTime || new Date(currentDropoffTime) < estimatedDropoff) {
        form.setValue("dropoffTime", estimatedDropoff.toISOString(), {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
      }
    }
  };

  // Add useEffect to update dropoff time when pickup time changes
  React.useEffect(() => {
    const pickupTime = form.watch("pickupTime");
    if (pickupTime && routeDuration > 0) {
      const pickupDate = new Date(pickupTime);
      const estimatedDropoff = new Date(pickupDate.getTime() + (routeDuration * 1000));

      form.setValue("dropoffTime", estimatedDropoff.toISOString(), {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
    }
  }, [form.watch("pickupTime"), routeDuration]);

  // Update DateTimePicker implementation for dropoff time
  const renderDropoffDateTimePicker = (field: any) => {
    const pickupTime = form.watch("pickupTime");
    const minDropoffTime = pickupTime && routeDuration
      ? new Date(new Date(pickupTime).getTime() + (routeDuration * 1000))
      : pickupTime
        ? new Date(pickupTime)
        : new Date();

    return (
      <DateTimePicker
        value={field.value ? new Date(field.value) : null}
        onChange={(date) => {
          if (date) {
            const selectedDate = new Date(date);
            if (pickupTime && routeDuration && selectedDate < minDropoffTime) {
              toast({
                title: "Please select a later time",
                description: `Dropoff time must be after ${format(minDropoffTime, "HH:mm")} based on estimated travel time`,
                variant: "destructive"
              });
              return;
            }
            field.onChange(date.toISOString());
          }
        }}
        onBlur={field.onBlur}
        // Enable if pickup time is set
        disabled={!pickupTime}
      />
    );
  };

  // Update DateTimePicker implementation
  const renderDateTimePicker = (field: any) => (
    <DateTimePicker
      value={field.value ? new Date(field.value) : new Date()}
      onChange={(date) => {
        if (date) {
          const selectedDate = new Date(date);
          const now = getMinimumPickupTime();
          const minOffset = getMinimumOffset(form.watch("priority"));

          // Only apply time restrictions if the selected date is today
          if (selectedDate.toDateString() === now.toDateString()) {
            const minTime = now.getTime() + minOffset;

            if (selectedDate.getTime() < minTime) {
              selectedDate.setHours(now.getHours());
              selectedDate.setMinutes(now.getMinutes() + minOffset / (60 * 1000));
            }
          }

          field.onChange(selectedDate.toISOString());
        } else {
          field.onChange(new Date().toISOString());
        }
      }}
      onBlur={field.onBlur}
      disabled={field.disabled}
    />
  );

  // Update useEffect for handling bookingForSelf changes
  React.useEffect(() => {
    const bookingForSelf = form.watch("bookingForSelf");

    if (bookingForSelf) {
      // Set passenger count to 1 and fill in employee details
      form.setValue("numPassengers", 1, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      if (employee) {
        form.setValue("passengerDetails", [{
          name: employee.name,
          contact: employee.phone
        }], {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
      }
    } else {
      // Reset passenger count and details when unchecked
      form.setValue("numPassengers", 0, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      form.setValue("passengerDetails", [], {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
    }
  }, [form.watch("bookingForSelf"), employee, form]);

  return (
    <>
      <Card className="transform transition-all duration-200 hover:shadow-lg">
        <CardHeader>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold"
          >
            New Booking
          </motion.h2>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isEmployeeLoading ? (
                        <div className="col-span-2 flex justify-center">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5 }}
                          >
                            <VehicleLoadingIndicator size="md" />
                          </motion.div>
                        </div>
                      ) : (
                        <>
                          <FormField
                            control={form.control}
                            name="employeeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employee ID *</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled value={employee?.employeeId || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormItem>
                            <FormLabel>Employee Name</FormLabel>
                            <FormControl>
                              <Input disabled value={employee?.name || ""} />
                            </FormControl>
                          </FormItem>
                        </>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="bookingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select booking type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={BookingType.FREIGHT}>Freight</SelectItem>
                              <SelectItem value={BookingType.PASSENGER}>Passenger</SelectItem>
                              <SelectItem value={BookingType.AMBULANCE}>Ambulance</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
                {currentStep === 2 && bookingType === "freight" && (
                  <motion.div
                    key="step2-freight"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="cargoType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="numBoxes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Boxes *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  field.onChange(value);
                                  form.setValue(
                                    "boxSize",
                                    Array(value).fill("")
                                  );
                                }}
                                min={1}
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
                            <FormLabel>Approximate Weight (kg) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                                  field.onChange(value);
                                }}
                                min={0}
                                step={1}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {numBoxes > 0 && Array.from({ length: numBoxes }).map((_, index) => (
                      <FormField
                        key={index}
                        control={form.control}
                        name={`boxSize.${index}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Box Size {index + 1} (in inches) *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select size for box ${index + 1}`} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(BoxSize).map((size) => (
                                  <SelectItem key={size} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </motion.div>
                )}
                {currentStep === 2 && bookingType === "passenger" && (
                  <motion.div
                    key="step2-passenger"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="tripType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trip Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select trip type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={TripType.ONE_WAY}>One Way</SelectItem>
                              <SelectItem value={TripType.ROUND_TRIP}>Round Trip</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-6">
                      <FormField
                        control={form.control}
                        name="withDriver"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                With Driver
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

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
                              <FormLabel>
                                Booking For Self
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="numPassengers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Passengers *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                                field.onChange(value);
                                // Initialize passenger details array
                                form.setValue(
                                  "passengerDetails",
                                  Array(value).fill({ name: "", contact: "" })
                                );
                              }}
                              min={1}
                              step={1}
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dynamic Passenger Details Fields */}
                    {Array.from({ length: form.watch("numPassengers") || 0 }).map((_, index) => (
                      <div key={index} className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-medium">Passenger {index + 1} Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`passengerDetails.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Passenger Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter passenger name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`passengerDetails.${index}.contact`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Details *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter contact number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Priority is set automatically" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={Priority.CRITICAL}>Critical</SelectItem>
                              <SelectItem value={Priority.EMERGENCY}>Emergency</SelectItem>
                              <SelectItem value={Priority.HIGH}>High</SelectItem>
                              <SelectItem value={Priority.NORMAL}>Normal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose * (Priority will be set automatically)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select purpose" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(BookingPurpose).map((purpose) => (
                                <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name="pickupLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pickup Location *</FormLabel>
                              <FormControl>
                                <LocationInput
                                  inputId="pickup-location"
                                  value={field.value?.formatted_address || field.value?.address || ""}
                                  placeholder="Enter pickup location"
                                  onLocationSelect={(location) => {
                                    form.setValue("pickupLocation", location, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                      shouldTouch: true
                                    });
                                  }}
                                  onSearchChange={(query) => {
                                    form.setValue("pickupLocation", {
                                      ...field.value,
                                      address: query
                                    });
                                  }}
                                  onFocus={() => setActiveLocation("pickup")}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />                        <FormField
                          control={form.control}
                          name="dropoffLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dropoff Location *</FormLabel>
                              <FormControl>
                                <LocationInput
                                  inputId="dropoff-location"
                                  value={field.value?.formatted_address || field.value?.address || ""}
                                  placeholder="Enter dropoff location"
                                  onLocationSelect={(location) => {
                                    form.setValue("dropoffLocation", location, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                      shouldTouch: true
                                    });
                                  }}
                                  onSearchChange={(query) => {
                                    form.setValue("dropoffLocation", {
                                      ...field.value,
                                      address: query
                                    });
                                  }}
                                  onFocus={() => setActiveLocation("dropoff")}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="h-[400px] relative">
                        <MapView
                          pickupLocation={form.watch("pickupLocation")}
                          dropoffLocation={form.watch("dropoffLocation")}
                          onLocationSelect={(location, type) => {
                            const fieldName = type === 'pickup' ? "pickupLocation" : "dropoffLocation";
                            form.setValue(fieldName, location, {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true
                            });
                          }}
                          onRouteCalculated={(duration) => {
                            handleRouteCalculated(duration);
                          }}
                        />
                      </div>
                      {/* Time Selection Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="pickupTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pickup Time *</FormLabel>
                              <FormControl>
                                {renderDateTimePicker(field)}
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
                              <FormLabel>Time of Dropoff *</FormLabel>
                              <FormControl>
                                {renderDropoffDateTimePicker(field)}
                              </FormControl>
                              <FormDescription>
                                {routeDuration > 0 && form.watch("pickupTime")
                                  ? `Minimum time: ${format(new Date(form.watch("pickupTime")).getTime() + (routeDuration * 1000), "HH:mm")}`
                                  : 'Select pickup time and route first'}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormMessage>{form.formState.errors.pickupLocation?.message}</FormMessage>
                      <FormMessage>{form.formState.errors.dropoffLocation?.message}</FormMessage>
                    </div>
                  </motion.div>
                )}
                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pickupTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pickup Time *</FormLabel>
                            <FormControl>
                              {renderDateTimePicker(field)}
                            </FormControl>
                            <FormDescription>
                              {form.watch("priority") === Priority.CRITICAL && "Pickup time: Immediate"}
                              {form.watch("priority") === Priority.EMERGENCY && "Pickup time: Minimum 30 minutes from now"}
                              {form.watch("priority") === Priority.HIGH && "Pickup time: Minimum 1 hour from now"}
                              {form.watch("priority") === Priority.NORMAL && "Pickup time: Minimum 3 hours from now"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Dropoff Time Field */}
                      <FormField
                        control={form.control}
                        name="dropoffTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time of Dropoff *</FormLabel>
                            <FormControl>
                              {renderDropoffDateTimePicker(field)}
                            </FormControl>
                            <FormDescription>
                              {routeDuration > 0
                                ? `Must be after ${format(new Date(form.watch("pickupTime")).getTime() + (routeDuration * 1000), "PPP HH:mm")} (estimated arrival time)`
                                : 'First select pickup location and destination to see minimum dropoff time'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </motion.div>
                )}
                {currentStep === 6 && (
                  <motion.div
                    key="step6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <FormField
                      control={form.control}
                      name="referenceNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference No.</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                <motion.div
                  className="flex justify-between pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="transform transition-all duration-200 hover:scale-105"
                    >
                      Previous
                    </Button>
                  )}
                  {currentStep < 6 ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="ml-auto transform transition-all duration-2000 hover:scale-105"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="ml-auto transform transition-all duration-200 hover:scale-105"
                      disabled={createBooking.isPending}
                    >
                      {createBooking.isPending ? (
                        <div className="flex items-center gap-2">
                          <VehicleLoadingIndicator size="sm" />
                          <span>Creating Booking...</span>
                        </div>
                      ) : (
                        "Create Booking"
                      )}
                    </Button>
                  )}
                </motion.div>
              </AnimatePresence>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-center">Order has been Created!</AlertDialogTitle>
            <AlertDialogDescription className="text-center py-4">
              Your booking reference number is:
              <span className="block text-xl font-semibold text-primary mt-2">
                {createdReferenceNo}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction
              onClick={handleSuccessDialogClose}
              className="w-24"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}