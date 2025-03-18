import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema, BookingType, Priority, BoxSize, TripType, BookingPurpose, CargoType } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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

export function BookingForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = React.useState(1);

  // Fetch logged in employee data
  const { data: employee, isLoading: isEmployeeLoading } = useQuery({
    queryKey: ["/api/employee/current"],
    retry: false
  });

  const form = useForm({
    resolver: zodResolver(insertBookingSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      employeeId: "",
      bookingType: "",
      purpose: "",
      priority: "",
      pickupLocation: {
        address: "",
        coordinates: { lat: 0, lng: 0 }
      },
      dropoffLocation: {
        address: "",
        coordinates: { lat: 0, lng: 0 }
      },
      pickupWindow: {
        start: "",
        end: ""
      },
      dropoffWindow: {
        start: "",
        end: ""
      },
      cargoType: "",
      numBoxes: 0,
      weight: 0,
      boxSize: [],
      tripType: "",
      numPassengers: 0,
      passengerInfo: [],
      referenceNo: "",
      remarks: "",
    }
  });

  // Watch form values for conditional validation
  const bookingType = form.watch("bookingType");
  const numBoxes = form.watch("numBoxes");

  // Update form when employee data is loaded
  React.useEffect(() => {
    if (employee?.employeeId) {
      form.setValue("employeeId", employee.employeeId);
    }
  }, [employee, form]);

  // Check if current step is valid before allowing to proceed
  const isStepValid = async (step: number) => {
    const fields = {
      1: ["employeeId", "bookingType"],
      2: ["purpose", "priority"],
      3: ["pickupLocation", "dropoffLocation"],
      4: ["pickupWindow", "dropoffWindow"],
      5: bookingType === BookingType.FREIGHT 
         ? ["cargoType", "numBoxes", "weight", "boxSize"] 
         : ["tripType", "numPassengers"]
    }[step];

    const result = await form.trigger(fields as any);
    return result;
  };

  // Handle next step
  const handleNextStep = async () => {
    const isValid = await isStepValid(currentStep);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive"
      });
    }
  };

  const createBooking = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bookings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
      form.reset();
      setCurrentStep(1);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    createBooking.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">New Booking</h2>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Employee Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEmployeeLoading ? (
                    <div className="col-span-2 flex justify-center">
                      <LoadingIndicator />
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

                {/* Booking Type */}
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
              </div>
            )}

            {/* Step 2: Purpose and Priority */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(BookingPurpose)
                            .sort()
                            .map((purpose) => (
                              <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
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
                      <FormLabel>Priority *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Show Critical and Emergency first */}
                          <SelectItem value={Priority.CRITICAL}>Critical</SelectItem>
                          <SelectItem value={Priority.EMERGENCY}>Emergency</SelectItem>
                          {/* Then show rest of the priorities */}
                          <SelectItem value={Priority.HIGH}>High</SelectItem>
                          <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                          <SelectItem value={Priority.NORMAL}>Normal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Locations */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormLabel>Pickup Location *</FormLabel>
                    <MapView
                      onLocationSelect={(location) => {
                        form.setValue("pickupLocation", location);
                      }}
                    />
                    <FormMessage>{form.formState.errors.pickupLocation?.message}</FormMessage>
                  </div>
                  <div className="space-y-4">
                    <FormLabel>Dropoff Location *</FormLabel>
                    <MapView
                      onLocationSelect={(location) => {
                        form.setValue("dropoffLocation", location);
                      }}
                    />
                    <FormMessage>{form.formState.errors.dropoffLocation?.message}</FormMessage>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Time Windows */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormLabel>Pickup Time Window *</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="pickupWindow.start"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pickupWindow.end"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <FormLabel>Dropoff Time Window *</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="dropoffWindow.start"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dropoffWindow.end"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Type-specific Fields */}
            {currentStep === 5 && (
              <>
                {/* Freight specific fields */}
                {bookingType === BookingType.FREIGHT && (
                  <div className="space-y-4">
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
                                  // Initialize box sizes array with empty values
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
                              <Input type="number" {...field} min={0} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Dynamic Box Size Fields */}
                    {Array.from({ length: numBoxes || 0 }).map((_, index) => (
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
                  </div>
                )}

                {/* Passenger specific fields */}
                {bookingType === BookingType.PASSENGER && (
                  <div className="space-y-4">
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
                    <FormField
                      control={form.control}
                      name="numPassengers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Passengers *</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} min={1} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </>
            )}

            {/* Step 6: Optional Fields */}
            {currentStep === 6 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  Previous
                </Button>
              )}
              {currentStep < 6 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="ml-auto"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="ml-auto"
                  disabled={createBooking.isPending}
                >
                  {createBooking.isPending ? (
                    <div className="w-full flex justify-center">
                      <LoadingIndicator size="sm" />
                    </div>
                  ) : (
                    "Create Booking"
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}