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
import { motion, AnimatePresence } from "framer-motion";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";

export function BookingForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [activeLocation, setActiveLocation] = React.useState<"pickup" | "dropoff" | null>(null);
  const [inputValue, setInputValue] = React.useState('');

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
      tempLocation: {
        address: "",
        coordinates: { lat: 0, lng: 0 }
      }
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
      1: ["employeeId", "bookingType"],
      2: bookingType === "freight"
        ? ["cargoType", "numBoxes", "weight"]
        : bookingType === "passenger"
          ? ["tripType", "numPassengers"]
          : [],
      3: ["purpose", "priority"],
      4: ["pickupLocation", "dropoffLocation"],
      5: ["pickupWindow.start", "pickupWindow.end", "dropoffWindow.start", "dropoffWindow.end"],
      6: []
    }[step] || [];

    if (fields.length === 0) return true;

    const result = await form.trigger(fields);
    return result;
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
    try {
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please check all fields and try again.",
          variant: "destructive"
        });
        return;
      }

      if (!data.employeeId) {
        data.employeeId = employee?.employeeId;
      }

      createBooking.mutate(data);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting your booking.",
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

  return (
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
                        name="pickupLocation.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pickup Location *</FormLabel>
                            <FormControl>
                              <LocationInput
                                value={field.value}
                                placeholder="Enter pickup location"
                                onLocationSelect={(location) => {
                                  form.setValue("pickupLocation", location, { shouldValidate: true });
                                  setActiveLocation(null);
                                  setInputValue(location.address);
                                }}
                                onSearchChange={(query) => {
                                  if (query && window.google?.maps?.places) {
                                    const placesService = new google.maps.places.PlacesService(
                                      document.createElement('div')
                                    );
                                    placesService.textSearch({
                                      query,
                                      bounds: new google.maps.LatLngBounds(
                                        new google.maps.LatLng(24.3, 54.2),
                                        new google.maps.LatLng(24.6, 54.5)
                                      )
                                    }, (results, status) => {
                                      if (
                                        status === google.maps.places.PlacesServiceStatus.OK &&
                                        results?.[0]?.geometry?.location
                                      ) {
                                        const location = results[0];
                                        form.setValue("tempLocation", {
                                          address: location.formatted_address || location.name || "",
                                          coordinates: {
                                            lat: location.geometry.location.lat(),
                                            lng: location.geometry.location.lng()
                                          }
                                        });
                                      } else {
                                        console.error("Places Service Error:", status);
                                      }
                                    });
                                  }
                                }}
                                onFocus={() => setActiveLocation("pickup")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dropoffLocation.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dropoff Location *</FormLabel>
                            <FormControl>
                              <LocationInput
                                value={field.value}
                                placeholder="Enter dropoff location"
                                onLocationSelect={(location) => {
                                  form.setValue("dropoffLocation", location, { shouldValidate: true });
                                  setActiveLocation(null);
                                  setInputValue(location.address);
                                }}
                                onSearchChange={(query) => {
                                  if (query && window.google?.maps?.places) {
                                    const placesService = new google.maps.places.PlacesService(
                                      document.createElement('div')
                                    );
                                    placesService.textSearch({
                                      query,
                                      bounds: new google.maps.LatLngBounds(
                                        new google.maps.LatLng(24.3, 54.2),
                                        new google.maps.LatLng(24.6, 54.5)
                                      )
                                    }, (results, status) => {
                                      if (
                                        status === google.maps.places.PlacesServiceStatus.OK &&
                                        results?.[0]?.geometry?.location
                                      ) {
                                        const location = results[0];
                                        form.setValue("tempLocation", {
                                          address: location.formatted_address || location.name || "",
                                          coordinates: {
                                            lat: location.geometry.location.lat(),
                                            lng: location.geometry.location.lng()
                                          }
                                        });
                                      } else {
                                        console.error("Places Service Error:", status);
                                      }
                                    });
                                  }
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
                        tempLocation={form.watch("tempLocation")}
                        onLocationSelect={(location, type) => {
                          if (type === 'pickup') {
                            form.setValue("pickupLocation.address", location.address);
                            form.setValue("pickupLocation.coordinates", location.coordinates);
                            form.setValue("pickupLocation", location, { shouldValidate: true });
                            const pickupInput = document.querySelector('input[placeholder="Enter pickup location"]') as HTMLInputElement;
                            if (pickupInput) {
                              pickupInput.value = location.address;
                            }
                          } else {
                            form.setValue("dropoffLocation.address", location.address);
                            form.setValue("dropoffLocation.coordinates", location.coordinates);
                            form.setValue("dropoffLocation", location, { shouldValidate: true });
                            const dropoffInput = document.querySelector('input[placeholder="Enter dropoff location"]') as HTMLInputElement;
                            if (dropoffInput) {
                              dropoffInput.value = location.address;
                            }
                          }
                        }}
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
                    className="ml-auto transform transition-all duration-200 hover:scale-105"
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
                      <motion.div
                        className="w-full flex justify-center"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        <VehicleLoadingIndicator size="sm" />
                      </motion.div>
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
  );
}