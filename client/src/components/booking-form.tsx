import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema, BookingType, Priority, BoxSize, TripType, BookingPurpose, CargoType } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LocationInput } from "@/components/location-input";
import { UAELocationAutocomplete } from "@/components/uae-location-autocomplete";
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
import IframeGoogleMaps from "@/components/iframe-google-maps";
import BasicGoogleMaps from "@/components/basic-google-maps";
import SimpleGoogleMaps from "@/components/simple-google-maps";
import GoogleMapsWithSearch from "@/components/google-maps-with-search";
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
import { BookingConfirmationAnimation } from "@/components/booking-confirmation-animation";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeEmailSearch } from "@/components/employee-email-search";
import { BookingConfirmationPreview } from "@/components/booking-confirmation-preview";

// Update the Location interface to match schema requirements with UAE-specific properties
export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
  // UAE-specific location properties
  district?: string;
  city?: string;
  area?: string;
  place_types?: string[];
}

// Helper function to get minimum pickup time
function getMinimumPickupTime(): Date {
  const now = new Date();
  const today = new Date();
  today.setHours(now.getHours());
  today.setMinutes(now.getMinutes());
  today.setSeconds(now.getSeconds());
  today.setMilliseconds(now.getMilliseconds()); //Added to ensure complete time copy
  return today;
}

// Helper function to get minimum offset based on priority
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

// Removed default locations as per user request
const DEFAULT_PICKUP_LOCATION = null;
const DEFAULT_DROPOFF_LOCATION = null;

export function BookingForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [activeLocation, setActiveLocation] = React.useState<"pickup" | "dropoff" | null>(null);
  const [waypoints, setWaypoints] = React.useState<any[]>([]);
  const [routeDuration, setRouteDuration] = React.useState<number>(0);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [createdReferenceNo, setCreatedReferenceNo] = React.useState<string>("");
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = React.useState("booking");
  
  // Employee selection state - important for proper employee_id handling
  const [selectedEmployee, setSelectedEmployee] = React.useState<any>(null);
  
  // Location state
  const [pickupLocation, setPickupLocation] = React.useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = React.useState<Location | null>(null);
  
  // Booking confirmation preview state
  const [showBookingPreview, setShowBookingPreview] = React.useState(false);
  const [bookingDataForPreview, setBookingDataForPreview] = React.useState<any>(null);

  // Employee data query with logging
  const { data: employee, isLoading: employeeLoading, error: employeeError } = useQuery({
    queryKey: ["/api/employee/current"],
    queryFn: async () => {
      console.log("Fetching employee data...");
      const response = await apiRequest("GET", "/api/employee/current");
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching employee data:", errorData);
        throw new Error(errorData.error || "Failed to fetch employee data");
      }
      const data = await response.json();
      console.log("Employee data received:", data);
      return data;
    },
    retry: false,
    staleTime: Infinity // Only fetch once per session
  });
  
  // Debug output for employee data
  React.useEffect(() => {
    console.log("Current employee data in component:", employee);
    if (employeeError) {
      console.error("Employee data error:", employeeError);
    }
  }, [employee, employeeError]);

  const form = useForm({
    resolver: zodResolver(insertBookingSchema),
    mode: "onChange",
    defaultValues: {
      // Support both snake_case and camelCase for employee IDs to ensure compatibility
      employee_id: employee?.employee_id || employee?.employeeId || "",  // Use snake_case (DB format)
      employeeId: employee?.employeeId || employee?.employee_id || "",   // Keep camelCase for compatibility
      employeeName: employee?.employeeName || employee?.employee_name || "", // Add employee name field for UI display
      bookingType: "",
      purpose: "",
      priority: "",
      pickupLocation: null, // No default pickup location
      dropoffLocation: null, // No default dropoff location
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
      passengerDetails: [],
    }
  });

  // Set employee ID once available
  React.useEffect(() => {
    // Get employee ID from either camelCase or snake_case property
    const employeeId = employee?.employee_id || employee?.employeeId;
    
    if (employeeId) {
      console.log("Setting employee ID:", employeeId, "Type:", typeof employeeId);
      
      // Set both snake_case and camelCase versions to ensure compatibility
      form.setValue("employee_id", employeeId);  // snake_case (DB format)
      form.setValue("employeeId", employeeId);   // camelCase (compatibility)
      
      // Also set employee name if available
      const employeeName = employee?.employee_name || employee?.employeeName;
      if (employeeName) {
        console.log("Setting employee name:", employeeName);
        form.setValue("employeeName", employeeName);
      }
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

  // Update the mutation and onSubmit handlers
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      // Enhanced logging for debugging
      console.log("%c BOOKING SUBMISSION - START", "background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;");
      console.log("%c Booking Data:", "font-weight: bold;", JSON.stringify(data, null, 2));
      
      // STEP 1: Validate and normalize employee ID
      // This is critical for the database foreign key relationship
      if (data.employee_id !== undefined && data.employee_id !== null) {
        // Force convert to number if it's not already
        if (typeof data.employee_id !== 'number') {
          const employeeIdNum = Number(data.employee_id);
          if (isNaN(employeeIdNum)) {
            throw new Error(`Invalid employee ID format: '${data.employee_id}' cannot be converted to a number`);
          }
          data.employee_id = employeeIdNum;
          console.log("Converted employee_id to number:", data.employee_id);
        }
      } else {
        throw new Error("Employee ID is required for booking creation");
      }
      
      // STEP 2: Validate all required fields are present
      const requiredFields = [
        'booking_type', 'purpose', 'priority',
        'pickup_location', 'dropoff_location',
        'pickup_time', 'dropoff_time'
      ];
      
      const missingFields = requiredFields.filter(field => {
        return data[field] === undefined || data[field] === null;
      });
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // STEP 3: Location data validation
      if (!data.pickup_location.coordinates || !data.pickup_location.address) {
        throw new Error("Pickup location must include both coordinates and address");
      }
      
      if (!data.dropoff_location.coordinates || !data.dropoff_location.address) {
        throw new Error("Dropoff location must include both coordinates and address");
      }
      
      // Ensure coordinates are numbers
      if (data.pickup_location.coordinates) {
        data.pickup_location.coordinates.lat = Number(data.pickup_location.coordinates.lat);
        data.pickup_location.coordinates.lng = Number(data.pickup_location.coordinates.lng);
      }
      
      if (data.dropoff_location.coordinates) {
        data.dropoff_location.coordinates.lat = Number(data.dropoff_location.coordinates.lat);
        data.dropoff_location.coordinates.lng = Number(data.dropoff_location.coordinates.lng);
      }
      
      // STEP 4: Normalize priority - this is critical for enum validation on the server
      if (data.priority) {
        if (typeof data.priority === 'string') {
          // Make first letter uppercase and rest lowercase for consistent format
          // (e.g., "normal" becomes "Normal", "CRITICAL" becomes "Critical")
          data.priority = data.priority.charAt(0).toUpperCase() + data.priority.slice(1).toLowerCase();
          
          // Validate it's one of the accepted values
          const validPriorities = ['Normal', 'High', 'Emergency', 'Critical', 'Medium'];
          if (!validPriorities.includes(data.priority)) {
            console.warn(`Unexpected priority value: ${data.priority}, defaulting to 'Normal'`);
            data.priority = 'Normal';
          }
        } else {
          console.warn(`Non-string priority value: ${data.priority}, defaulting to 'Normal'`);
          data.priority = 'Normal';
        }
      } else {
        console.warn("No priority specified, defaulting to 'Normal'");
        data.priority = 'Normal';
      }
      
      console.log("- priority:", data.priority ? "✓" : "✗", data.priority);
      console.log("- pickup_location:", data.pickup_location ? "✓" : "✗", JSON.stringify(data.pickup_location));
      console.log("- dropoff_location:", data.dropoff_location ? "✓" : "✗", JSON.stringify(data.dropoff_location));
      console.log("- pickup_time:", data.pickup_time ? "✓" : "✗", data.pickup_time);
      console.log("- dropoff_time:", data.dropoff_time ? "✓" : "✗", data.dropoff_time);
      
      try {
        toast({
          title: "Submitting booking",
          description: "Please wait while we process your booking request...",
        });
        
        console.log("Sending API request to /api/bookings...");
        const response = await apiRequest("POST", "/api/bookings", data);
        console.log("%c Booking API response status:", "font-weight: bold;", response.status, response.statusText);
        
        if (!response.ok) {
          let errorMessage = `Failed to create booking: ${response.status} ${response.statusText}`;
          
          try {
            const errorData = await response.json();
            console.error("Booking API error response:", errorData);
            
            if (errorData.error) {
              errorMessage = errorData.error;
            }
            
            if (errorData.details) {
              if (typeof errorData.details === 'string') {
                errorMessage += `: ${errorData.details}`;
              } else if (Array.isArray(errorData.details)) {
                errorMessage += `: ${errorData.details.join(", ")}`;
              } else if (typeof errorData.details === 'object') {
                errorMessage += `: ${JSON.stringify(errorData.details)}`;
              }
            }
          } catch (jsonError) {
            console.error("Could not parse error response as JSON:", jsonError);
          }
          
          throw new Error(errorMessage);
        }
        
        let responseData;
        try {
          // Get the JSON response if available
          const responseText = await response.text();
          if (responseText) {
            try {
              // Try to parse the JSON response
              responseData = JSON.parse(responseText);
              console.log("%c Booking API success response:", "background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;", responseData);
            } catch (parseError) {
              // If JSON parsing fails, use the text response as-is
              console.warn("Could not parse response as JSON, using text response instead:", responseText);
              responseData = { message: responseText, raw: responseText };
            }
          } else {
            // Handle empty response
            console.log("Empty response received, but status code indicates success");
            responseData = { message: "Booking created successfully", raw: "" };
          }
        } catch (responseError) {
          console.error("Error handling response:", responseError);
          throw new Error("Error processing server response");
        }
        
        // Add timestamp for debugging
        responseData = { 
          ...responseData, 
          _clientTimestamp: new Date().toISOString(),
          _status: response.status,
          _statusText: response.statusText
        };
        
        return responseData;
      } catch (error) {
        console.error("Error in booking mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("%c BOOKING CREATION SUCCESS", "background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;");
      console.log("Response data:", data);
      
      // Store reference number from response (snake_case) or fall back to camelCase
      const referenceNo = data.reference_no || data.referenceNo || "Generated";
      setCreatedReferenceNo(referenceNo);
      
      // Show detailed success message
      toast({
        title: "Booking created successfully!",
        description: `Reference No: ${referenceNo}`,
      });
      
      // Clear cached data to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      
      // Reset form state and show success dialog
      form.reset();
      setShowSuccessDialog(true);
      
      // Reset location fields
      setPickupLocation(null);
      setDropoffLocation(null);
      setWaypoints([]);
      
      // Log user action for analytics
      console.log("User completed booking creation with reference:", referenceNo);
    },
    onError: (error: Error) => {
      console.error("Booking creation error:", error);
      
      // Detailed error logging
      console.log("%c BOOKING ERROR DETAILS", "background: #f44336; color: white; padding: 2px 4px; border-radius: 2px;");
      console.log("Error type:", typeof error);
      console.log("Error message:", error.message);
      console.log("Error stack:", error.stack);
      
      // Provide specific error messages for common issues
      let errorMessage = error.message || "Failed to create booking. Please try again.";
      
      // Enhance error message based on content
      if (errorMessage.includes("employee") && errorMessage.includes("not found")) {
        errorMessage = "Employee ID not found in the system. Please search for a valid employee.";
      } else if (errorMessage.includes("employee") && errorMessage.includes("required")) {
        errorMessage = "Employee information is required. Please search for an employee using the email search.";
      } else if (errorMessage.includes("location")) {
        errorMessage = "Location information is incomplete. Please select valid pickup and dropoff locations.";
      }
      
      toast({
        title: "Error creating booking",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    try {
      console.log("%c FORM SUBMISSION", "background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;");
      console.log("Full form data:", data);
      
      // Show form errors if any
      if (Object.keys(form.formState.errors).length > 0) {
        console.error("Form has validation errors:", form.formState.errors);
        toast({
          title: "Form validation failed",
          description: "Please check the form for errors",
          variant: "destructive"
        });
        return;
      }
      
      // Prepare data for the confirmation preview
      const previewData = {
        bookingType: data.bookingType,
        purpose: data.purpose,
        priority: data.priority,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        pickupTime: data.pickupTime,
        dropoffTime: data.dropoffTime,
        employeeName: data.employeeName,
        employeeId: data.employeeId || data.employee_id,
        // Freight specific fields
        cargoType: data.cargoType,
        numBoxes: data.numBoxes,
        weight: data.weight,
        boxSize: data.boxSize,
        // Passenger specific fields
        tripType: data.tripType,
        numPassengers: data.numPassengers,
        passengerDetails: data.passengerDetails,
        withDriver: data.withDriver,
        // Common additional fields
        remarks: data.remarks,
        referenceNo: data.referenceNo
      };
      
      // Show the booking confirmation preview
      setBookingDataForPreview(previewData);
      setShowBookingPreview(true);
      
      // The actual form submission will happen when the user confirms in the preview modal
      return;
      
      // Format waypoints data for API submission
      const formattedWaypoints = waypoints.map(wp => ({
        address: wp.address,
        coordinates: {
          lat: Number(wp.coordinates.lat),
          lng: Number(wp.coordinates.lng)
        }
      }));

      // Validate that we have pickup and dropoff locations before submitting
      if (!data.pickupLocation || !data.dropoffLocation) {
        console.error("Missing location data:", {
          pickupLocation: data.pickupLocation,
          dropoffLocation: data.dropoffLocation
        });
        toast({
          title: "Missing location information",
          description: "Please select both pickup and dropoff locations",
          variant: "destructive"
        });
        return;
      }

      // Check for required fields
      if (!data.bookingType || !data.purpose || !data.priority) {
        console.error("Missing required booking form fields:", {
          bookingType: data.bookingType,
          purpose: data.purpose,
          priority: data.priority
        });
        toast({
          title: "Missing booking information",
          description: "Please fill in all required booking details",
          variant: "destructive"
        });
        return;
      }
      
      // Get the employee ID and ensure it's valid
      // Note: we prefer employee_id (snake_case) as it matches DB column
      let employeeIdValue = data.employee_id || data.employeeId;
      
      console.log("Raw employee ID value from form:", employeeIdValue, "Type:", typeof employeeIdValue);
      
      // Employee ID must be present
      if (employeeIdValue === undefined || employeeIdValue === null || employeeIdValue === "") {
        console.error("Missing employee ID in form data");
        toast({
          title: "Employee information required",
          description: "Please search for and select a valid employee using the email search field",
          variant: "destructive"
        });
        return;
      }
      
      // Check if employeeId is already a number or can be converted to one
      if (typeof employeeIdValue === 'string') {
        const employeeIdNum = Number(employeeIdValue);
        if (!isNaN(employeeIdNum)) {
          employeeIdValue = employeeIdNum;
          console.log("Converted employee ID to number:", employeeIdValue);
        }
      }
      
      // Validate pickup and dropoff times
      if (!data.pickupTime || !data.dropoffTime) {
        console.error("Missing time information:", {
          pickupTime: data.pickupTime,
          dropoffTime: data.dropoffTime
        });
        toast({
          title: "Time information required",
          description: "Please select valid pickup and dropoff times",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Final employee ID for booking:", employeeIdValue, "Type:", typeof employeeIdValue);
      console.log("Pickup location:", data.pickupLocation);
      console.log("Dropoff location:", data.dropoffLocation);
      
      // Use snake_case for all keys in the API request as required by the backend
      const bookingData = {
        employee_id: employeeIdValue, // Snake case version
        employeeId: employeeIdValue,  // Camel case version for redundancy
        booking_type: data.bookingType,
        purpose: data.purpose,
        // Fix priority value - ensure it's in the exact format expected by the backend (capitalized)
        priority: data.priority, // The enum value matches the expected format in the schema
        pickup_location: {
          address: data.pickupLocation.address,
          coordinates: {
            lat: Number(data.pickupLocation.coordinates.lat),
            lng: Number(data.pickupLocation.coordinates.lng)
          }
        },
        dropoff_location: {
          address: data.dropoffLocation.address,
          coordinates: {
            lat: Number(data.dropoffLocation.coordinates.lat),
            lng: Number(data.dropoffLocation.coordinates.lng)
          }
        },
        waypoints: formattedWaypoints,
        pickup_time: new Date(data.pickupTime).toISOString(),
        dropoff_time: new Date(data.dropoffTime).toISOString(),
        remarks: data.remarks || "",
        ...(data.bookingType === "freight" ? {
          cargo_type: data.cargoType,
          num_boxes: Number(data.numBoxes || 0),
          weight: Number(data.weight || 0),
          box_size: data.boxSize || "medium"
        } : {}),
        ...(data.bookingType === "passenger" ? {
          trip_type: data.tripType || "one_way",
          num_passengers: Number(data.numPassengers || 1),
          with_driver: Boolean(data.withDriver),
          booking_for_self: Boolean(data.bookingForSelf),
          passenger_details: data.passengerDetails || []
        } : {})
      };

      console.log("About to submit booking data:", bookingData);
      toast({
        title: "Submitting booking",
        description: "Please wait while your booking is being processed...",
      });
      
      // Explicitly call the mutation function
      await createBookingMutation.mutateAsync(bookingData);
      
      console.log("Booking submission successful!");
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setCurrentStep(1);
    form.reset();
    setActiveTab("history");
    setLocation("/booking-history");
  };
  
  // Handle booking preview confirmation
  const handleBookingConfirmation = async () => {
    try {
      if (!bookingDataForPreview) {
        toast({
          title: "Error",
          description: "Booking data is missing. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Display a loading toast to indicate processing
      toast({
        title: "Processing booking",
        description: "Please wait while we process your request...",
      });
      
      const data = form.getValues();
      console.log("%c BOOKING CONFIRMATION - START", "background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;");
      console.log("Form data:", data);
      
      // STEP 1: Validate pickup/dropoff locations
      if (!data.pickupLocation || !data.dropoffLocation) {
        console.error("Missing location data:", {
          pickupLocation: data.pickupLocation,
          dropoffLocation: data.dropoffLocation
        });
        toast({
          title: "Missing location information",
          description: "Please select both pickup and dropoff locations",
          variant: "destructive"
        });
        return;
      }
      
      // STEP 2: Format waypoints data for API submission
      const formattedWaypoints = waypoints.map(wp => ({
        address: wp.address,
        coordinates: {
          lat: Number(wp.coordinates.lat),
          lng: Number(wp.coordinates.lng)
        }
      }));
      
      // STEP 3: Handle employee ID - this is critical for database relations
      // First, try to get the ID from the form data in either format
      let employeeIdValue = data.employee_id || data.employeeId;
      
      console.log("Raw employee ID value:", employeeIdValue, "Type:", typeof employeeIdValue);
      
      // If that fails, try to get it from the logged-in employee object
      if (employeeIdValue === undefined || employeeIdValue === null) {
        if (employee?.id) {
          employeeIdValue = employee.id;
          console.log("Using logged-in employee.id:", employeeIdValue);
        } else if (employee?.employeeId) {
          employeeIdValue = employee.employeeId; 
          console.log("Using logged-in employee.employeeId:", employeeIdValue);
        } else {
          // No employee ID available at all
          toast({
            title: "Employee information missing",
            description: "Please search for and select a valid employee using the email search field",
            variant: "destructive"
          });
          console.error("Could not find employee ID in any available source");
          return;
        }
      }
      
      // STEP 4: Type conversion - ensure employee ID is a number
      if (typeof employeeIdValue !== 'number') {
        const employeeIdNum = Number(employeeIdValue);
        if (!isNaN(employeeIdNum)) {
          employeeIdValue = employeeIdNum;
          console.log("Converted employee ID to number:", employeeIdValue);
        } else {
          console.error("Invalid employee ID format:", employeeIdValue);
          toast({
            title: "Invalid employee ID format",
            description: "Please search for a valid employee using the email search field",
            variant: "destructive"
          });
          return;
        }
      }
      
      // STEP 5: Safely access location properties with null checks
      const pickupLocation = data.pickupLocation ? {
        address: data.pickupLocation.address || "",
        coordinates: {
          lat: Number(data.pickupLocation.coordinates?.lat || 0),
          lng: Number(data.pickupLocation.coordinates?.lng || 0)
        },
        // Include UAE-specific fields if available
        ...(data.pickupLocation.district && { district: data.pickupLocation.district }),
        ...(data.pickupLocation.city && { city: data.pickupLocation.city }),
        ...(data.pickupLocation.area && { area: data.pickupLocation.area }),
        ...(data.pickupLocation.place_id && { place_id: data.pickupLocation.place_id }),
        ...(data.pickupLocation.name && { name: data.pickupLocation.name })
      } : null;
      
      const dropoffLocation = data.dropoffLocation ? {
        address: data.dropoffLocation.address || "",
        coordinates: {
          lat: Number(data.dropoffLocation.coordinates?.lat || 0),
          lng: Number(data.dropoffLocation.coordinates?.lng || 0)
        },
        // Include UAE-specific fields if available
        ...(data.dropoffLocation.district && { district: data.dropoffLocation.district }),
        ...(data.dropoffLocation.city && { city: data.dropoffLocation.city }),
        ...(data.dropoffLocation.area && { area: data.dropoffLocation.area }),
        ...(data.dropoffLocation.place_id && { place_id: data.dropoffLocation.place_id }),
        ...(data.dropoffLocation.name && { name: data.dropoffLocation.name })
      } : null;
      
      if (!pickupLocation || !dropoffLocation) {
        toast({
          title: "Incomplete location data",
          description: "Please ensure both pickup and dropoff locations are fully specified",
          variant: "destructive"
        });
        return;
      }
      
      // STEP 6: Normalize priority value - capitalize first letter, lowercase rest
      // This ensures compatibility with the enum values in the schema (e.g., "Normal", "High", etc.)
      let normalizedPriority = data.priority;
      if (typeof normalizedPriority === 'string') {
        normalizedPriority = normalizedPriority.charAt(0).toUpperCase() + normalizedPriority.slice(1).toLowerCase();
        console.log("Normalized priority value:", normalizedPriority);
      }
      
      // STEP 7: Construct the booking data with proper formatting
      const bookingData = {
        // Employee information - employee_id MUST be a number for DB compatibility
        // Critical: Ensure employee ID is a valid number - database expects this!
        employee_id: Number(employeeIdValue),
        
        // Explicitly include the employee ID as a string to help with matching
        employee_code: selectedEmployee?.employee_id || String(employeeIdValue) || "",
        
        // Employee name for record-keeping
        employee_name: selectedEmployee?.employee_name || employee?.employeeName || "",

        // Booking details - convert to snake_case for backend
        booking_type: data.bookingType,
        purpose: data.purpose,
        priority: normalizedPriority,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        waypoints: formattedWaypoints,
        
        // Time fields - ensure proper ISO format
        pickup_time: new Date(data.pickupTime).toISOString(),
        dropoff_time: new Date(data.dropoffTime).toISOString(),
        
        // Optional fields
        remarks: data.remarks || "",
        
        // Booking type specific fields - ensure all are properly typed
        ...(data.bookingType === "freight" ? {
          cargo_type: data.cargoType,
          num_boxes: Number(data.numBoxes || 0),
          weight: Number(data.weight || 0),
          box_size: data.boxSize || "medium" // Default to medium if not specified
        } : {}),
        
        ...(data.bookingType === "passenger" ? {
          trip_type: data.tripType || "one_way",
          num_passengers: Number(data.numPassengers || 1),
          with_driver: Boolean(data.withDriver),
          booking_for_self: Boolean(data.bookingForSelf),
          passenger_details: Array.isArray(data.passengerDetails) ? data.passengerDetails : []
        } : {})
      };
      
      // Close the preview modal
      setShowBookingPreview(false);
      
      // STEP 8: Enhanced logging before submission
      console.log("%c FINAL BOOKING DATA TO SUBMIT:", "background: #ff9800; color: white; padding: 2px 4px; border-radius: 2px;");
      console.log("Employee ID:", bookingData.employee_id, "(type:", typeof bookingData.employee_id, ")");
      console.log("Booking Type:", bookingData.booking_type);
      console.log("Priority:", bookingData.priority, "(type:", typeof bookingData.priority, ")");
      console.log("Full booking data:", JSON.stringify(bookingData, null, 2));
      
      // Final validation - check employee_id is numeric and valid
      if (isNaN(bookingData.employee_id) || !bookingData.employee_id) {
        const error = new Error("Invalid employee ID format. Please select a valid employee.");
        console.error("Employee ID validation failed:", error);
        throw error;
      }
      
      // Submit the booking
      console.log("%c SUBMITTING BOOKING DATA:", "background: #ff9800; color: white; padding: 2px 4px; border-radius: 2px;", JSON.stringify(bookingData, null, 2));
      const response = await createBookingMutation.mutateAsync(bookingData);
      console.log("%c BOOKING CREATION RESPONSE:", "background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;", response);
      
      // Show success message with booking information
      toast({
        title: "Booking created successfully",
        description: `Reference No: ${response.reference_no || response.referenceNo || "Generated"}`,
      });
      
      // Reset form and show success dialog
      setCreatedReferenceNo(response.reference_no || response.referenceNo || "Unknown");
      setShowSuccessDialog(true);
      
    } catch (error: any) {
      console.error("Booking confirmation error:", error);
      
      // Show detailed error message
      toast({
        title: "Error creating booking",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    }
  };


  const getPriorityForPurpose = (purpose: string): string => {
    if (bookingType === "freight") {
      return Priority.NORMAL;
    }

    // Critical Priority Purposes
    if ([
      BookingPurpose.BLOOD_BANK,
      BookingPurpose.AMBULANCE,
      BookingPurpose.MORTUARY,
      BookingPurpose.ONCOLOGY
    ].includes(purpose)) {
      return Priority.CRITICAL;
    }

    // Emergency Priority Purposes
    if ([
      BookingPurpose.BLOOD_SAMPLES,
      BookingPurpose.DRUG_COLLECTION,
      BookingPurpose.MEDICINE,
      BookingPurpose.VACCINE,
      BookingPurpose.EQUIPMENT
    ].includes(purpose)) {
      return Priority.EMERGENCY;
    }

    // High Priority Purposes
    if ([
      BookingPurpose.HOSPITAL_VISIT,
      BookingPurpose.ON_CALL,
      BookingPurpose.PATIENT,
      BookingPurpose.MAINTENANCE,
      BookingPurpose.VIP_TRANSFER
    ].includes(purpose)) {
      return Priority.HIGH;
    }

    // All other purposes are Normal priority
    return Priority.NORMAL;
  };

  const purpose = form.watch("purpose");
  React.useEffect(() => {
    const purpose = form.watch("purpose");
    if (purpose) {
      const calculatedPriority = getPriorityForPurpose(purpose);
      form.setValue("priority", calculatedPriority, {
        shouldValidate: true,
        shouldDirty: true
      });
    }
  }, [form.watch("purpose"), bookingType, form]);

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
  }, [form.watch("pickupTime"), routeDuration, form]);

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
            field.onChange(date.toISOString());
          }
        }}
        onBlur={() => {
          const selectedDate = field.value ? new Date(field.value) : null;
          const pickupDate = pickupTime ? new Date(pickupTime) : null;

          if (selectedDate && pickupDate) {
            // Validation when leaving the control
            if (selectedDate <= pickupDate) {
              toast({
                title: "Invalid Time Selection",
                description: "Dropoff time must be after pickup time",
                variant: "destructive"
              });
              field.onChange(null);
              return;
            }

            if (routeDuration) {
              const eta = new Date(pickupDate.getTime() + (routeDuration * 1000));
              if (selectedDate < eta) {
                toast({
                  title: "Invalid Time Selection",
                  description: `Dropoff time must be after estimated arrival (${format(eta, "HH:mm")})`,
                  variant: "destructive"
                });
                field.onChange(null);
                return;
              }
            }
          }
        }}
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
      {/* Booking Confirmation Preview Modal */}
      {bookingDataForPreview && (
        <BookingConfirmationPreview
          open={showBookingPreview}
          onClose={() => setShowBookingPreview(false)}
          onConfirm={handleBookingConfirmation}
          bookingData={bookingDataForPreview}
          isSubmitting={createBookingMutation.isPending}
        />
      )}
      <Card className="transform transition-all duration-200 hover:shadow-lg">
        <CardHeader>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-lg font-medium"
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
                    {/* Email Search component with auto-population of employee details */}
                    <div className="mb-4">
                      <EmployeeEmailSearch 
                        onEmployeeFound={(employeeData) => {
                          console.log("Employee found via email search:", employeeData);
                          
                          // First, use the internal database ID for the employee - this is the most reliable way
                          // This is the ID field from the employees table, not the employee_id field which is a display value
                          const employeeId = employeeData?.id;
                          
                          if (employeeId) {
                            // Always convert to number since database expects a numeric ID
                            const employeeIdValue = Number(employeeId);
                            
                            if (!isNaN(employeeIdValue)) {
                              console.log("Setting employee_id in form:", employeeIdValue, "(type:", typeof employeeIdValue, ")");
                              
                              // Set both snake_case and camelCase versions to ensure they're in the form data
                              form.setValue("employee_id", employeeIdValue, {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true
                              });
                              
                              // Also set camelCase version for compatibility
                              form.setValue("employeeId", employeeIdValue, {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true
                              });
                              
                              // Also set employee name for display
                              const employeeName = employeeData?.employee_name || employeeData?.employeeName;
                              if (employeeName) {
                                form.setValue("employeeName", employeeName, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                  shouldTouch: true
                                });
                              }
                              
                              toast({
                                title: "Employee Found",
                                description: `Employee details for ${employeeName || 'employee'} automatically populated`,
                                variant: "default",
                              });
                            }
                          }
                        }}
                        defaultEmail={employee?.emailId || ""}
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
                                value={field.value || employee?.employeeId || ""} 
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
                                value={field.value || employee?.employeeName || employee?.name || ""}
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
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={form.watch("bookingType") === "freight"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select booking purpose" />
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
                          <FormLabel>Priority Level *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={true}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Priority is automatically set" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(Priority).map((priority) => (
                                <SelectItem key={priority} value={priority}>
                                  {priority}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Priority is automatically determined based on booking purpose
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="remarks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Remarks</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter any additional notes or requirements"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div></motion.div>
                )}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="spacey-6"
                  >
                    <div className="space-y-2">
                      {/* Location and MapSection */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Location Inputs */}
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="pickupLocation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pickup Location *</FormLabel>
                                <FormControl>
                                  <UAELocationAutocomplete
                                    value={field.value?.address || ""}
                                    placeholder="Enter pickup location"
                                    onLocationSelect={(location) => {
                                      // Ensure all optional properties are present with default values
                                      const completeLocation = {
                                        ...location,
                                        place_id: location.place_id || "",
                                        name: location.name || location.address,
                                        formatted_address: location.formatted_address || location.address
                                      };
                                      console.log("Setting pickupLocation with:", completeLocation);
                                      form.setValue("pickupLocation", completeLocation, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                        shouldTouch: true
                                      });
                                    }}
                                    onSearchChange={(query) => {
                                      form.setValue("pickupLocation", {
                                        ...(field.value || {}),
                                        address: query
                                      });
                                    }}
                                    inputId="pickup-location"
                                    isPickup={true}
                                    className="w-full"
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
                                <FormLabel>Dropoff Location *</FormLabel>
                                <FormControl>
                                  <UAELocationAutocomplete
                                    value={field.value?.address || ""}
                                    placeholder="Enter dropoff location"
                                    onLocationSelect={(location) => {
                                      // Ensure all optional properties are present with default values
                                      const completeLocation = {
                                        ...location,
                                        place_id: location.place_id || "",
                                        name: location.name || location.address,
                                        formatted_address: location.formatted_address || location.address
                                      };
                                      console.log("Setting dropoffLocation with:", completeLocation);
                                      form.setValue("dropoffLocation", completeLocation, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                        shouldTouch: true
                                      });
                                    }}
                                    onSearchChange={(query) => {
                                      form.setValue("dropoffLocation", {
                                        ...(field.value || {}),
                                        address: query
                                      });
                                    }}
                                    inputId="dropoff-location"
                                    isPickup={false}
                                    className="w-full"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Time Selection Fields */}
                          <div className="space-y-4 mt-6">
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
                                    {routeDuration > 0 && form.watch("pickupTime") ? (
                                      <div className="space-y-1">
                                        <p>Selected pickup: {format(new Date(form.watch("pickupTime")), "HH:mm")}</p>
                                        <p className="font-medium text-primary">
                                          Earliest dropoff: {format(new Date(new Date(form.watch("pickupTime")).getTime() + (routeDuration * 1000)), "HH:mm")}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Choose any time after the earliest dropoff time
                                        </p>
                                      </div>
                                    ) : (
                                      'Select pickup location and time first'
                                    )}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Map View */}
                        <div className="space-y-4">
                          {waypoints.length > 0 && (
                            <div className="flex items-center justify-between px-2 py-2 bg-primary/10 rounded-md border border-primary/20">
                              <div className="text-sm">
                                <span className="font-medium">{waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''} added</span>
                                <span className="text-muted-foreground ml-2">These will be stops between pickup and dropoff locations</span>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setWaypoints([]);
                                  toast({
                                    title: "Waypoints cleared",
                                    description: "All waypoints have been removed"
                                  });
                                }}
                              >
                                Clear All Waypoints
                              </Button>
                            </div>
                          )}
                          <div className="h-[500px] relative rounded-lg overflow-hidden border">
                            {/* Key attribute forces re-render when step changes */}
                            <MapView
                              key={`map-view-step-${currentStep}`}
                              pickupLocation={form.watch("pickupLocation")}
                              dropoffLocation={form.watch("dropoffLocation")}
                              waypoints={waypoints}
                              editable={true} // Force editable mode
                              onLocationSelect={(location, type) => {
                                // Handle pickup or dropoff location
                                const fieldName = type === 'pickup' ? "pickupLocation" : "dropoffLocation";
                                console.log(`Map onLocationSelect: Setting ${fieldName} with:`, location);
                                
                                // Ensure all optional properties are present with default values
                                const completeLocation = {
                                  ...location,
                                  place_id: location.place_id || "",
                                  name: location.name || location.address,
                                  formatted_address: location.formatted_address || location.address
                                };
                                
                                console.log(`Map Picker onLocationSelect: Setting ${fieldName} with:`, completeLocation);
                                form.setValue(fieldName, completeLocation, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                  shouldTouch: true
                                });
                                
                                // Calculate route if both pickup and dropoff are set
                                if (form.watch("pickupLocation") && form.watch("dropoffLocation")) {
                                  // Calculate an estimate for route duration
                                  const p1 = form.watch("pickupLocation").coordinates;
                                  const p2 = form.watch("dropoffLocation").coordinates;
                                  
                                  // Haversine formula for distance calculation
                                  const R = 6371; // Earth's radius in km
                                  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
                                  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
                                  const a = 
                                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                                    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
                                    Math.sin(dLon/2) * Math.sin(dLon/2);
                                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                  const distance = R * c;
                                  
                                  // Assume average speed of 40 km/h in UAE cities
                                  const durationInSeconds = (distance / 40) * 60 * 60;
                                  
                                  // Call the route calculation handler
                                  handleRouteCalculated(durationInSeconds);
                                }
                                
                                // Log the form values after setting to verify it was updated
                                console.log(`Form field "${fieldName}" current value:`, form.getValues(fieldName));
                                console.log("All form values:", form.getValues());
                              }}
                              onRouteCalculated={(durationSeconds, distanceMeters) => {
                                // Use the route calculation results for better estimates
                                handleRouteCalculated(durationSeconds);
                                
                                // Log the calculated route details
                                console.log("Route calculated:", {
                                  distance: `${(distanceMeters / 1000).toFixed(1)} km`,
                                  duration: `${Math.floor(durationSeconds / 60)} minutes`
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Time Selection Section */}

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

                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  {currentStep < 6 ? (
                    <Button type="button" onClick={handleNextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="button" 
                      onClick={() => {
                        console.log("Create Booking Button clicked");
                        const formData = form.getValues();
                        console.log("Current form values:", formData);
                        
                        // Manual validation
                        form.trigger().then(isValid => {
                          console.log("Form validation result:", isValid);
                          if (isValid) {
                            console.log("Form is valid, submitting...");
                            form.handleSubmit(onSubmit)();
                          } else {
                            console.error("Form validation failed:", form.formState.errors);
                            toast({
                              title: "Form validation failed",
                              description: "Please check the form for errors",
                              variant: "destructive"
                            });
                          }
                        });
                      }}
                      disabled={createBookingMutation.isPending}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      {createBookingMutation.isPending ? (
                        <>
                          <LoadingIndicator className="mr-2" />
                          Creating Booking...
                        </>
                      ) : (
                        "Create Booking"
                      )}
                    </Button>
                  )}
                </div>
              </AnimatePresence>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="sm:max-w-[500px] overflow-hidden bg-background/95 backdrop-blur-sm p-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <AlertDialogHeader className="p-6">
              <AlertDialogTitle className="text-center">
                <BookingConfirmationAnimation
                  bookingDetails={{
                    vehicleType: form.getValues("bookingType"),
                    date: new Date(form.getValues("pickupTime")).toLocaleDateString(),
                    location: form.getValues("pickupLocation")?.address || "Selected location"
                  }}
                />
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter className="px-6 pb-6">
              <AlertDialogAction
                onClick={handleSuccessDialogClose}
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                View Booking History
              </AlertDialogAction>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}