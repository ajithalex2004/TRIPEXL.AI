import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema, BookingType, Priority, BoxSize, TripType, BookingPurpose, CargoType } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

// Interface for passenger details
export interface PassengerDetail {
  name: string;
  contact: string;
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

// PassengerDetail interface is defined above

// Removed default locations as per user request
const DEFAULT_PICKUP_LOCATION = null;
const DEFAULT_DROPOFF_LOCATION = null;

export function BookingForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [activeLocation, setActiveLocation] = React.useState<"pickup" | "dropoff" | null>(null);
  const [waypoints, setWaypoints] = React.useState<Location[]>([]);
  const [routeDuration, setRouteDuration] = React.useState<number>(0);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [createdReferenceNo, setCreatedReferenceNo] = React.useState<string>("");
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = React.useState("booking");
  
  // Employee selection state - important for proper employee_id handling
  const [selectedEmployee, setSelectedEmployee] = React.useState<any>(null);
  
  // Location state
  // Use component state as backup storage for locations - use proper type definition
  const [pickupLocation, setPickupLocation] = React.useState<Location | undefined>(undefined);
  const [dropoffLocation, setDropoffLocation] = React.useState<Location | undefined>(undefined);

  // We'll add the purpose-based priority effect after the form is defined
  
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

  // Create default values with proper typing
  const defaultEmptyLocation: Location = {
    address: "",
    coordinates: { lat: 0, lng: 0 },
    place_id: "",
    name: "",
    formatted_address: "",
    district: "",
    city: "",
    area: "",
    place_types: []
  };

  // Define form type with explicit Location types
  type BookingFormValues = {
    employee_id: string | number;
    employeeId: string | number;
    employeeName: string;
    bookingType: string;
    purpose: string;
    priority: string;
    pickupLocation: Location | undefined;
    dropoffLocation: Location | undefined;
    pickupTime: Date;
    dropoffTime: Date | null;
    cargoType: string;
    numBoxes: number;
    weight: number;
    boxSize: any[];
    tripType: string;
    numPassengers: number;
    passengerInfo: any[];
    referenceNo: string;
    remarks: string;
    withDriver: boolean;
    bookingForSelf: boolean;
    passengerDetails: PassengerDetail[];
  };
  
  const form = useForm<BookingFormValues>({
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
      pickupLocation: undefined, // Use undefined instead of null for proper type handling
      dropoffLocation: undefined, // Use undefined instead of null for proper type handling
      pickupTime: getMinimumPickupTime(), // Store as Date object directly
      dropoffTime: null, // Use null instead of empty string for proper timestamp handling
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
  
  // Purpose-based Priority Setting Effect - This must be placed after form is defined
  React.useEffect(() => {
    const currentPurpose = form.watch("purpose");
    if (!currentPurpose) return;
    
    console.log("Setting priority based on purpose:", currentPurpose);
    // Set priorities according to the provided table
    if (currentPurpose === "Blood Bank" || 
        currentPurpose === "On Call" || 
        currentPurpose === "Instrument & Equipment Collection/Delivery") {
      form.setValue("priority", Priority.CRITICAL);
    } 
    else if (currentPurpose === "Blood Samples Collection/Delivery" || 
              currentPurpose === "Ambulance Service") {
      form.setValue("priority", Priority.EMERGENCY);
    }
    else if (currentPurpose === "Drugs/Medicine Delivery or Collection") {
      form.setValue("priority", Priority.HIGH);
    }
    else {
      form.setValue("priority", Priority.NORMAL);
    }
  }, [form]);

  // Enhanced useEffect to set purpose based on booking type
  React.useEffect(() => {
    console.log("Booking type changed to:", bookingType);
    
    // Clear timeout if it exists
    const timeoutId = setTimeout(() => {
      if (bookingType) {
        // Map booking types to their default purposes
        if (bookingType === "freight") {
          console.log("Setting purpose for freight booking");
          form.setValue("purpose", BookingPurpose.FREIGHT_TRANSPORT, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
          form.setValue("priority", Priority.NORMAL);
        } 
        else if (bookingType === "passenger") {
          console.log("Setting purpose for passenger booking");
          form.setValue("purpose", BookingPurpose.STAFF_TRANSPORTATION, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
        }
        else if (bookingType === "medical") {
          console.log("Setting purpose for medical booking");
          form.setValue("purpose", BookingPurpose.HOSPITAL_VISIT, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
        }
        else if (bookingType === "emergency") {
          console.log("Setting purpose for emergency booking");
          form.setValue("purpose", BookingPurpose.AMBULANCE, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
          form.setValue("priority", Priority.EMERGENCY);
        }
        
        // Force re-render
        form.trigger("purpose");
      }
    }, 50); // Small delay to ensure form is ready
    
    return () => clearTimeout(timeoutId);
  }, [bookingType, form]);
  
  // Monitor form location fields and sync with state
  React.useEffect(() => {
    const formPickup = form.getValues("pickupLocation");
    if (formPickup && typeof formPickup === 'object' && 'address' in formPickup && !pickupLocation) {
      console.log("Syncing pickup from form to state");
      setPickupLocation(formPickup as Location);
    }
    
    const formDropoff = form.getValues("dropoffLocation");
    if (formDropoff && typeof formDropoff === 'object' && 'address' in formDropoff && !dropoffLocation) {
      console.log("Syncing dropoff from form to state");
      setDropoffLocation(formDropoff as Location);
    }
  }, [form, pickupLocation, dropoffLocation]);

  const isStepValid = async (step: number) => {
    const fields = {
      1: ["employeeId", "bookingType"] as const,
      2: bookingType === "freight"
        ? ["cargoType", "numBoxes", "weight"] as const
        : bookingType === "passenger"
          ? ["tripType", "numPassengers", "withDriver", "bookingForSelf", "passengerDetails"] as const
          : [],
      3: ["purpose", "priority"] as const,
      4: [] as const, // Special handling for location fields below
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
        (passenger: PassengerDetail, idx) => idx < numPassengers && (!passenger.name || !passenger.contact)
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

    // Completely redesigned and simplified handling for locations in step 4
    if (step === 4) {
      console.log("%c ENHANCED LOCATION VALIDATION", "background: #673ab7; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;");
      
      try {
        // 1. First try getting locations directly from form 
        let formPickup = form.getValues("pickupLocation");
        let formDropoff = form.getValues("dropoffLocation");
        
        // 2. Extract coordinates as early as possible - will be used for validation
        const pickupCoords = formPickup?.coordinates || pickupLocation?.coordinates;
        const dropoffCoords = formDropoff?.coordinates || dropoffLocation?.coordinates;
  
        // 3. Use component state variables as backup/source of truth
        const statePickup = pickupLocation;
        const stateDropoff = dropoffLocation;
  
        console.log("Location data from all sources:", {
          formPickupRaw: formPickup,
          formDropoffRaw: formDropoff,
          statePickupRaw: statePickup, 
          stateDropoffRaw: stateDropoff,
          pickupCoords,
          dropoffCoords
        });
        
        // 4. Multiple fallback sources for location data
        // Prioritize form values, then component state
        const finalPickup = formPickup?.address ? formPickup : statePickup;
        const finalDropoff = formDropoff?.address ? formDropoff : stateDropoff;
  
        console.log("Final location data after fallbacks:", {
          finalPickup,
          finalDropoff,
          hasPickupAddress: Boolean(finalPickup?.address),
          hasDropoffAddress: Boolean(finalDropoff?.address)
        });
  
        // 5. Auto-sync form with component state if needed
        let needsFormUpdate = false;
        
        if (statePickup?.address && (!formPickup || !formPickup.address)) {
          console.log("Syncing pickup location from state to form");
          form.setValue("pickupLocation", statePickup, { 
            shouldDirty: true, 
            shouldValidate: true,
            shouldTouch: true
          });
          formPickup = statePickup;
          needsFormUpdate = true;
        }
        
        if (stateDropoff?.address && (!formDropoff || !formDropoff.address)) {
          console.log("Syncing dropoff location from state to form");
          form.setValue("dropoffLocation", stateDropoff, { 
            shouldDirty: true, 
            shouldValidate: true,
            shouldTouch: true 
          });
          formDropoff = stateDropoff;
          needsFormUpdate = true;
        }
        
        // 6. RELAXED VALIDATION: Require at least some location data
        // Instead of requiring perfect data, accept what we have and allow user to proceed
        
        if (!finalPickup?.address && !finalDropoff?.address) {
          console.warn("No location data found at all - required fields are missing");
          toast({
            title: "Location Required",
            description: "Please select at least the pickup and dropoff locations",
            variant: "destructive"
          });
          return false;
        }
        
        // If we've reached this point, we have at least one location.
        // This is more permissive than before.
        
        // 7. Auto-fix coordinates if needed but addresses are valid
        if ((finalPickup?.address && !pickupCoords) || (finalDropoff?.address && !dropoffCoords)) {
          console.warn("Addresses found but coordinates missing - generating placeholder coordinates");
          // Create placeholder coordinates for locations with addresses but no coordinates
          if (finalPickup?.address && !pickupCoords) {
            // Start with Dubai's coordinates as fallback
            const placeholderCoords = { lat: 25.276987, lng: 55.296249 };
            form.setValue("pickupLocation", { 
              ...finalPickup, 
              coordinates: placeholderCoords 
            });
          }
          
          if (finalDropoff?.address && !dropoffCoords) {
            // Slightly offset coordinates for dropoff (so they're distinct)
            const placeholderCoords = { lat: 25.276987 + 0.01, lng: 55.296249 + 0.01 };
            form.setValue("dropoffLocation", { 
              ...finalDropoff, 
              coordinates: placeholderCoords 
            });
          }
        }
        
        // 8. Validation passed - prioritize progress over perfect data
        console.log("Location validation succeeded with available data");
        return true;
      }
      catch (error) {
        console.error("Error during location validation:", error);
        // Even if validation fails, let the user proceed since we've implemented
        // fallbacks and safety timeouts in handleNextStep
        return true;
      }
    }

    return await form.trigger(fields);
  };

  // Ref to track if we're processing the next step request
  const isProcessingNextStep = React.useRef(false);
  
  // A timeout to prevent UI from freezing
  const progressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const handleNextStep = async () => {
    // Double prevention for multiple clicks - both with ref and state
    if (isProcessingNextStep.current) {
      console.log("Already processing next step, ignoring duplicate request");
      return;
    }
    
    // Set processing flag
    isProcessingNextStep.current = true;
    console.log("Next button clicked on step:", currentStep);
    
    // IMPROVED: Shorter timeout for critical responsiveness (3 seconds)
    // This ensures we don't leave the UI frozen for too long
    progressTimeoutRef.current = setTimeout(() => {
      console.log("SAFETY TIMEOUT: Ensuring UI remains responsive");
      
      // Reset processing state
      isProcessingNextStep.current = false;
      
      // Advance to next step with guaranteed UI responsiveness
      setCurrentStep(prev => Math.min(prev + 1, 6));
      
      // Notify user
      toast({
        title: "Moving to next step",
        description: "Your information has been saved. You can return to previous steps if needed.",
      });
    }, 3000);
    
    try {
      // SIMPLIFIED APPROACH: Focus on UI responsiveness over perfect validation
      
      // Special case for location step (step 4) - fast path approach
      if (currentStep === 4) {
        try {
          // Quick check for any location data
          const formPickup = form.getValues("pickupLocation");
          const formDropoff = form.getValues("dropoffLocation");
          const statePickup = pickupLocation;
          const stateDropoff = dropoffLocation;
          
          // Do we have enough data to continue?
          const hasMinimumPickupData = Boolean(formPickup?.address || statePickup?.address);
          const hasMinimumDropoffData = Boolean(formDropoff?.address || stateDropoff?.address);
          
          console.log("Fast location check:", {
            hasMinimumPickupData,
            hasMinimumDropoffData,
            formPickup,
            formDropoff,
            statePickup,
            stateDropoff
          });
          
          // IMPORTANT: Always sync state to form to prevent data loss
          if (statePickup?.address && (!formPickup || !formPickup.address)) {
            form.setValue("pickupLocation", statePickup, {
              shouldValidate: false, // Skip validation to avoid freezes
              shouldDirty: true,
              shouldTouch: true
            });
          }
          
          if (stateDropoff?.address && (!formDropoff || !formDropoff.address)) {
            form.setValue("dropoffLocation", stateDropoff, {
              shouldValidate: false, // Skip validation to avoid freezes
              shouldDirty: true,
              shouldTouch: true
            });
          }
          
          // If we have any location data at all, just proceed
          if ((formPickup || statePickup) && (formDropoff || stateDropoff)) {
            // Clean up timeout
            if (progressTimeoutRef.current) {
              clearTimeout(progressTimeoutRef.current);
              progressTimeoutRef.current = null;
            }
            
            // We have some location data, so continue
            isProcessingNextStep.current = false;
            setCurrentStep(prev => Math.min(prev + 1, 6));
            return;
          }
          
          // We've reached this point: not enough location data
          if (!hasMinimumPickupData || !hasMinimumDropoffData) {
            // Clear timeout and reset state
            if (progressTimeoutRef.current) {
              clearTimeout(progressTimeoutRef.current);
              progressTimeoutRef.current = null;
            }
            
            isProcessingNextStep.current = false;
            
            toast({
              title: "Location Required",
              description: "Please select both pickup and dropoff locations",
              variant: "destructive"
            });
            return;
          }
        } catch (locationError) {
          // Log but continue - don't let location errors freeze the UI
          console.error("Non-fatal location validation error:", locationError);
          // Just continue to normal validation below
        }
      }
      
      // Simplified validation for all steps
      try {
        const isValid = await isStepValid(currentStep);
        console.log("Step validation result:", isValid);
        
        // Clear timeout since validation completed
        if (progressTimeoutRef.current) {
          clearTimeout(progressTimeoutRef.current);
          progressTimeoutRef.current = null;
        }
        
        // Always reset the processing flag to prevent UI freezes
        isProcessingNextStep.current = false;
        
        if (isValid) {
          // Success path - move to next step
          setCurrentStep(prev => Math.min(prev + 1, 6));
        } else {
          // Failed validation but UI is responsive
          toast({
            title: "Please complete required fields",
            description: "Some required information is missing or incorrect.",
            variant: "destructive"
          });
        }
      } catch (validationError) {
        // Handle validation errors but keep UI responsive
        console.error("Validation error:", validationError);
        
        // Clear timeout
        if (progressTimeoutRef.current) {
          clearTimeout(progressTimeoutRef.current);
          progressTimeoutRef.current = null;
        }
        
        // Always reset processing flag to prevent UI freeze
        isProcessingNextStep.current = false;
        
        toast({
          title: "Validation Error",
          description: "Please check your information and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Catch-all error handler for any unexpected issues
      console.error("Unexpected error during next step handling:", error);
      
      // ALWAYS ensure timeout is cleared and flags are reset
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
        progressTimeoutRef.current = null;
      }
      
      // Reset flags to restore UI responsiveness
      isProcessingNextStep.current = false;
      
      // Notify user
      toast({
        title: "An error occurred",
        description: "There was a problem moving to the next step. Please try again.",
        variant: "destructive"
      });
    } finally {
      isProcessingNextStep.current = false;
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
        
        // CRITICAL DEBUGGING - Add auth token check
        const token = localStorage.getItem('auth_token');
        console.log("Auth token available:", token ? "Yes (length: " + token.length + ")" : "No");
        if (!token) {
          console.error("CRITICAL ERROR: No authentication token found in localStorage");
          throw new Error("Authentication token missing. Please log in again.");
        }
        
        console.log("Sending API request to /api/bookings with data:", JSON.stringify(data, null, 2));
        
        // Log complete headers being sent for debugging
        console.log("API request headers:", {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.substring(0, 10)}...`
        });
        
        // Regular API request using our helper
        const response = await apiRequest("POST", "/api/bookings", data);
        console.log("%c Booking API response status:", "font-weight: bold;", response.status, response.statusText);
        
        // Enhanced error logging
        if (!response.ok) {
          try {
            const errorResponse = await response.clone().json();
            console.error("BOOKING API ERROR DETAILS:", JSON.stringify(errorResponse, null, 2));
          } catch (e) {
            console.error("Could not parse error response as JSON:", e);
            const textResponse = await response.clone().text();
            console.error("Raw error response:", textResponse);
          }
        }
        
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
      setPickupLocation(undefined);
      setDropoffLocation(undefined);
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
      console.log("%c FORM SUBMISSION", "background: #ff0000; color: white; padding: 2px 4px; border-radius: 2px;");
      console.log("Full form data:", JSON.stringify(data, null, 2));
      
      // Log key field names from the form data for debugging 
      console.log("Key fields check:");
      console.log("- bookingType:", data.bookingType);
      console.log("- booking_type:", data.booking_type);
      console.log("- purpose:", data.purpose);
      console.log("- priority:", data.priority);
      console.log("- pickupLocation:", data.pickupLocation ? "✓" : "✗");
      console.log("- dropoffLocation:", data.dropoffLocation ? "✓" : "✗");
      console.log("- employee_id:", data.employee_id);
      console.log("- employeeId:", data.employeeId);
      
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
      
      // Enhanced validation: check for coordinates in pickup location
      if (!data.pickupLocation.coordinates || 
          typeof data.pickupLocation.coordinates.lat !== 'number' || 
          typeof data.pickupLocation.coordinates.lng !== 'number' ||
          isNaN(data.pickupLocation.coordinates.lat) ||
          isNaN(data.pickupLocation.coordinates.lng)) {
        console.error("Invalid pickup location coordinates:", data.pickupLocation);
        toast({
          title: "Invalid pickup location",
          description: "Please select a valid pickup location with the map",
          variant: "destructive"
        });
        return;
      }
      
      // Enhanced validation: check for coordinates in dropoff location
      if (!data.dropoffLocation.coordinates || 
          typeof data.dropoffLocation.coordinates.lat !== 'number' || 
          typeof data.dropoffLocation.coordinates.lng !== 'number' ||
          isNaN(data.dropoffLocation.coordinates.lat) ||
          isNaN(data.dropoffLocation.coordinates.lng)) {
        console.error("Invalid dropoff location coordinates:", data.dropoffLocation);
        toast({
          title: "Invalid dropoff location",
          description: "Please select a valid dropoff location with the map",
          variant: "destructive"
        });
        return;
      }
      
      // Check for employee data - we can use either the selectedEmployee object or the employee prop
      // First check in form data
      let employeeIdForBooking = data.employee_id || data.employeeId;
      
      // Then check selectedEmployee (preferred source from email search)
      if (!employeeIdForBooking && selectedEmployee?.id) {
        employeeIdForBooking = Number(selectedEmployee.id);
      }
      
      // Lastly check employee prop (might be from props)
      if (!employeeIdForBooking && employee?.id) {
        employeeIdForBooking = Number(employee.id);
      }
      
      // Ensure we have a valid employee ID
      if (!employeeIdForBooking || isNaN(Number(employeeIdForBooking))) {
        console.error("No valid employee ID available - this will cause booking creation to fail");
        toast({
          title: "Missing Employee Information",
          description: "Please select an employee by searching with their email ID first.",
          variant: "destructive",
        });
        return;
      }
      
      // Convert to number for API submission
      const finalEmployeeId = Number(employeeIdForBooking);
      console.log("Using employee ID for booking:", finalEmployeeId, "Type:", typeof finalEmployeeId);
      
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
        employee_id: data.employee_id || data.employeeId,
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
      
      // The actual form submission will happen when the user confirms in the preview modal via handleConfirmBooking

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
        waypoints: waypoints.map(wp => ({
          address: wp.address,
          coordinates: {
            lat: Number(wp.coordinates.lat),
            lng: Number(wp.coordinates.lng)
          }
        })),
        pickup_time: data.pickupTime 
          ? (data.pickupTime instanceof Date 
             ? data.pickupTime.toISOString() 
             : new Date(data.pickupTime).toISOString()) 
          : null,
        dropoff_time: data.dropoffTime 
          ? (data.dropoffTime instanceof Date 
             ? data.dropoffTime.toISOString() 
             : new Date(data.dropoffTime).toISOString()) 
          : null,
        // Add debug information to help track date conversion
        _debug_pickup_date: data.pickupTime 
          ? (data.pickupTime instanceof Date 
             ? data.pickupTime.toString() 
             : new Date(data.pickupTime).toString()) 
          : "no pickup date",
        _debug_dropoff_date: data.dropoffTime 
          ? (data.dropoffTime instanceof Date 
             ? data.dropoffTime.toString() 
             : new Date(data.dropoffTime).toString()) 
          : "no dropoff date",
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

  const handleSuccessDialogClose = async () => {
    setShowSuccessDialog(false);
    setCurrentStep(1);
    form.reset();

    // Refresh the bookings data in booking-history component
    console.log("Refreshing bookings after successful creation...");
    try {
      // First refresh bookings data
      await refreshBookings();
      // Navigate to the booking history page after creation
      console.log("Redirecting to booking history page...");
      setLocation("/bookings");
    } catch (error) {
      console.error("Error refreshing bookings:", error);
      // Still navigate even if refresh fails
      console.log("Error in refreshing, still redirecting to booking history page...");
      setLocation("/bookings");
    }
  };
  
  // Handle booking preview confirmation
  const handleBookingConfirmation = async () => {
    try {
      console.log("%c 🔍 BOOKING CONFIRMATION FUNCTION ENTERED", "background: #ff0000; color: white; padding: 4px 8px; font-size: 16px; font-weight: bold; border-radius: 4px;");
      console.log("🔍 Stack trace:", new Error().stack);
      
      // Check if this function is actually being called by the confirmation modal
      console.log("🔍 Function call timestamp:", new Date().toISOString());
      
      // IMPORTANT: Adding global window alert to verify this function is actually called
      window.alert("Booking confirmation handler triggered - creating booking now");
      
      if (!bookingDataForPreview) {
        console.error("Error: bookingDataForPreview is null or undefined");
        toast({
          title: "Error",
          description: "Booking data is missing. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Display a loading toast to indicate processing
      console.log("Showing processing toast");
      toast({
        title: "Processing booking",
        description: "Please wait while we process your request...",
      });
      
      const formData = form.getValues();
      console.log("%c BOOKING CONFIRMATION - START", "background: #ff0000; color: white; padding: 2px 4px; border-radius: 2px;");
      console.log("Raw form data:", JSON.stringify(formData, null, 2));
      
      // Validate required fields
      if (!formData.pickupLocation || !formData.dropoffLocation || !formData.pickupTime || !formData.dropoffTime) {
        toast({
          title: "Missing required information",
          description: "Please ensure all required fields are filled",
          variant: "destructive"
        });
        return;
      }
      
      // CRITICAL FIX: Get the employee internal database ID (not the employee_id field)
      // This needs to be the ID that matches the primary key in the employees table
      let employeeId = null;
      
      // First try to get ID from selectedEmployee (from email search)
      if (selectedEmployee?.id) {
        employeeId = Number(selectedEmployee.id);
        console.log("Using employee ID from selectedEmployee:", employeeId);
      } 
      // Then try form data
      else if (formData.employee_id) {
        employeeId = Number(formData.employee_id);
        console.log("Using employee ID from form data (employee_id):", employeeId);
      } 
      // Then try camelCase variant
      else if (formData.employeeId) {
        employeeId = Number(formData.employeeId);
        console.log("Using employee ID from form data (employeeId):", employeeId);
      }
      // Finally try employee prop
      else if (employee?.id) {
        employeeId = Number(employee.id);
        console.log("Using employee ID from employee prop:", employeeId);
      }
      
      if (!employeeId || isNaN(employeeId) || employeeId <= 0) {
        toast({
          title: "Invalid employee ID",
          description: "Please select a valid employee",
          variant: "destructive"
        });
        return;
      }
      
      // Close the preview modal
      setShowBookingPreview(false);
      
      // IMPORTANT FIX: Make sure we're using the expected field names
      // Prepare the simplified data object for API - using snake_case for all property names
      
      // Parse employeeId as integer since DB schema expects an integer
      const employeeIdNumber = typeof employeeId === 'string' 
        ? parseInt(employeeId, 10) 
        : (employeeId || 0);
      
      console.log("🔍 Employee ID conversion:", {
        original: employeeId,
        converted: employeeIdNumber,
        originalType: typeof employeeId,
        convertedType: typeof employeeIdNumber
      });
      
      if (isNaN(employeeIdNumber)) {
        console.error("🔍 Employee ID conversion failed - invalid ID:", employeeId);
      }
      
      const bookingData = {
        // Basic required fields - ENSURE snake_case for API compatibility
        employee_id: employeeIdNumber, // Use the parsed integer value
        booking_type: formData.bookingType.toLowerCase() || "passenger", // Convert to lowercase
        purpose: formData.purpose || "general",
        priority: formData.priority || "Normal",
        
        // Location data - ensure it has the exact format expected by the schema
        pickup_location: {
          address: String(formData.pickupLocation.address || ''),
          coordinates: {
            lat: parseFloat(String(formData.pickupLocation.coordinates?.lat || 0)),
            lng: parseFloat(String(formData.pickupLocation.coordinates?.lng || 0))
          }
        },
        
        dropoff_location: {
          address: String(formData.dropoffLocation.address || ''),
          coordinates: {
            lat: parseFloat(String(formData.dropoffLocation.coordinates?.lat || 0)),
            lng: parseFloat(String(formData.dropoffLocation.coordinates?.lng || 0))
          }
        },
        
        // Format times explicitly as strings per database schema definition
        pickup_time: formData.pickupTime ? new Date(formData.pickupTime).toISOString() : null,
        dropoff_time: formData.dropoffTime ? new Date(formData.dropoffTime).toISOString() : null,
        
        // Common fields
        remarks: formData.remarks || "",
        
        // Type-specific fields with proper conversions
        ...(formData.bookingType.toLowerCase() === "freight" ? {
          cargo_type: formData.cargoType || "general",
          num_boxes: parseInt(formData.numBoxes || "1", 10),
          weight: parseInt(formData.weight || "0", 10),
          // Ensure box_size is always an array as required by schema
          box_size: Array.isArray(formData.boxSize) ? formData.boxSize : [formData.boxSize || "medium"]
        } : {}),
        
        ...(formData.bookingType.toLowerCase() === "passenger" ? {
          trip_type: formData.tripType || "one_way",
          num_passengers: parseInt(formData.numPassengers || "1", 10),
          with_driver: formData.withDriver === true,
          booking_for_self: formData.bookingForSelf === true,
          // Ensure passenger_details is always an array of the expected format
          passenger_details: Array.isArray(formData.passengerDetails) 
            ? formData.passengerDetails.map((p: PassengerDetail) => ({
                name: String(p.name || ''),
                contact: String(p.contact || '')
              })) 
            : []
        } : {})
      };
      
      // Add waypoints if any
      if (waypoints.length > 0) {
        // Ensure waypoints have the correct format expected by the schema
        const formattedWaypoints = waypoints.map(wp => ({
          address: String(wp.address || ''),
          coordinates: {
            lat: parseFloat(String(wp.coordinates?.lat || 0)),
            lng: parseFloat(String(wp.coordinates?.lng || 0))
          },
          // Include all optional fields that are present in the Location interface
          ...(wp.place_id && { place_id: String(wp.place_id) }),
          ...(wp.name && { name: String(wp.name) }),
          ...(wp.formatted_address && { formatted_address: String(wp.formatted_address) }),
          ...(wp.district && { district: String(wp.district) }),
          ...(wp.city && { city: String(wp.city) }),
          ...(wp.area && { area: String(wp.area) }),
          ...(wp.place_types && { place_types: wp.place_types })
        }));
        
        // Add to booking data
        bookingData.waypoints = formattedWaypoints;
      }
      
      console.log("Submitting booking data:", JSON.stringify(bookingData, null, 2));
      
      // ENHANCED VALIDATION CHECKS
      console.log("VALIDATION: Checking critical fields:");
      console.log("- employee_id present:", bookingData.employee_id !== undefined && bookingData.employee_id !== null);
      console.log("- employee_id type:", typeof bookingData.employee_id);
      console.log("- employee_id value:", bookingData.employee_id);
      console.log("- booking_type:", bookingData.booking_type);
      console.log("- purpose:", bookingData.purpose);
      console.log("- priority:", bookingData.priority);
      console.log("- pickup_location present:", bookingData.pickup_location !== undefined);
      console.log("- pickup_location has address:", bookingData.pickup_location?.address);
      console.log("- pickup_location type:", typeof bookingData.pickup_location);
      console.log("- pickup_location coordinates type:", typeof bookingData.pickup_location?.coordinates);
      console.log("- pickup_location has coordinates:", 
        bookingData.pickup_location?.coordinates?.lat !== undefined && 
        bookingData.pickup_location?.coordinates?.lng !== undefined);
      console.log("- dropoff_location present:", bookingData.dropoff_location !== undefined);
      console.log("- dropoff_location has address:", bookingData.dropoff_location?.address);
      console.log("- dropoff_location has coordinates:", 
        bookingData.dropoff_location?.coordinates?.lat !== undefined && 
        bookingData.dropoff_location?.coordinates?.lng !== undefined);
      console.log("- pickup_time:", bookingData.pickup_time);
      console.log("- dropoff_time:", bookingData.dropoff_time);
      
      try {
        console.log("%c SIMPLIFIED BOOKING SUBMISSION 🚀", "background: #ff0000; color: white; padding: 4px 8px; font-size: 16px; font-weight: bold; border-radius: 4px;");
        
        // Submit the booking to the API with enhanced debugging
        console.time('Booking API Call');
        
        try {
          // Get the auth token from localStorage
          const authToken = localStorage.getItem('auth_token');
          
          if (!authToken) {
            console.error("CRITICAL ERROR: No auth token found in localStorage");
            throw new Error("Authentication token missing. Please log in again.");
          }
          
          // Prepare the final booking data with proper types
          const finalBookingData = {
            ...bookingData,
            booking_type: bookingData.booking_type.toLowerCase(),
            employee_id: Number(bookingData.employee_id)
          };
          
          console.log("SENDING DIRECT API REQUEST:", JSON.stringify(finalBookingData, null, 2));
          
          // Make a simple, direct API call
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(finalBookingData),
          });
          
          console.log(`API Response Status: ${response.status}`);
          
          // Handle error response
          if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Response:", errorText);
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
          }
          
          // Parse the successful response
          const bookingResponse = await response.json();
          console.log("BOOKING CREATED SUCCESSFULLY:", bookingResponse);
          
          // Show success message
          toast({
            title: "Booking created successfully",
            description: `Reference No: ${bookingResponse.reference_no || "Generated"}`,
          });
          
          // Refresh bookings data and show success dialog
          try {
            refreshBookings().catch(e => console.warn("Refresh warning:", e));
          } catch (refreshError) {
            console.warn("Non-critical error refreshing bookings:", refreshError);
          }
          
          // Reset form and show success dialog
          setCreatedReferenceNo(bookingResponse.reference_no || "Unknown");
          setShowSuccessDialog(true);
        } finally {
          console.timeEnd('Booking API Call');
        }
      } catch (apiError: any) {
        console.error("API Error in booking creation:", apiError);
        
        // Show error message with detailed information if available
        let errorMessage = "Failed to create booking";
        
        if (apiError.message) {
          errorMessage = apiError.message;
          
          // Check for specific error patterns
          if (errorMessage.includes("employee_id")) {
            errorMessage = "Employee ID not found or invalid. Please select a valid employee.";
          } else if (errorMessage.includes("location")) {
            errorMessage = "Invalid location data. Please ensure both pickup and dropoff locations are set.";
          } else if (errorMessage.includes("time")) {
            errorMessage = "Invalid time data. Please ensure pickup and dropoff times are valid.";
          }
        }
        
        toast({
          title: "Booking Creation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Booking confirmation error:", error);
      
      toast({
        title: "Error processing booking",
        description: error.message || "Failed to process booking data. Please try again.",
        variant: "destructive",
      });
    }
  };


  const getPriorityForPurpose = (purpose: string): string => {
    if (bookingType === "freight") {
      return Priority.NORMAL;
    }

    // Log purpose value before comparison
    console.log("Checking priority for purpose:", purpose);

    // Critical Priority Purposes (using direct string comparison)
    const criticalPurposes = [
      "Blood Bank", 
      "Ambulance", 
      "Mortuary", 
      "Oncology Patient Pick Up/ Drop off"
    ];
    
    if (criticalPurposes.includes(purpose)) {
      console.log("Priority set to CRITICAL for:", purpose);
      return Priority.CRITICAL;
    }

    // Emergency Priority Purposes
    const emergencyPurposes = [
      "Blood Samples Collection/Delivery",
      "Drug Collection",
      "Medicine Collection/Delivery",
      "Vaccine Collection/Delivery",
      "Instrument & Equipment Collection/Delivery"
    ];
    
    if (emergencyPurposes.includes(purpose)) {
      console.log("Priority set to EMERGENCY for:", purpose);
      return Priority.EMERGENCY;
    }

    // High Priority Purposes
    const highPriorityPurposes = [
      "Hospital Visit",
      "On Call",
      "Patient Pick Up/Drop Off",
      "Maintenance",
      "VIP Transfer"
    ];
    
    if (highPriorityPurposes.includes(purpose)) {
      console.log("Priority set to HIGH for:", purpose);
      return Priority.HIGH;
    }

    // All other purposes are Normal priority
    console.log("Priority set to NORMAL for:", purpose);
    return Priority.NORMAL;
  };

  // Watch for purpose changes to update priority
  React.useEffect(() => {
    const currentPurpose = form.watch("purpose");
    console.log("Purpose changed to:", currentPurpose);
    if (currentPurpose) {
      const calculatedPriority = getPriorityForPurpose(currentPurpose);
      console.log("Setting priority based on purpose:", currentPurpose, "->", calculatedPriority);
      form.setValue("priority", calculatedPriority, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
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
  // Updated for proper timestamp data type handling
  const renderDropoffDateTimePicker = (field: any) => {
    const pickupTime = form.watch("pickupTime");
    const minDropoffTime = pickupTime && routeDuration
      ? (pickupTime instanceof Date 
         ? new Date(pickupTime.getTime() + (routeDuration * 1000))
         : new Date(new Date(pickupTime).getTime() + (routeDuration * 1000)))
      : pickupTime
        ? (pickupTime instanceof Date ? pickupTime : new Date(pickupTime))
        : new Date();

    return (
      <DateTimePicker
        value={field.value instanceof Date ? field.value : field.value ? new Date(field.value) : null}
        onChange={(date) => {
          if (date) {
            // The date is already a Date object from the DateTimePicker
            // Store it directly for timestamp field
            field.onChange(date);
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

  // Updated DateTimePicker implementation for proper timestamp data type
  const renderDateTimePicker = (field: any) => (
    <DateTimePicker
      value={field.value instanceof Date ? field.value : field.value ? new Date(field.value) : new Date()}
      onChange={(date) => {
        if (date) {
          // The date is already a Date object from the DateTimePicker
          const selectedDate = date; // Use Date object directly
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

          // Send the Date object directly instead of ISO string
          // This will work better with timestamp fields in the database
          field.onChange(selectedDate);
        } else {
          field.onChange(new Date());
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
          name: employee.name || '',
          contact: employee.phone || ''
        } as PassengerDetail], {
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
      form.setValue("passengerDetails", ([] as PassengerDetail[]), {
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
            <form 
              onSubmit={(e) => {
                console.log("FORM SUBMIT EVENT TRIGGERED");
                // Call the original handler
                form.handleSubmit((data) => {
                  console.log("FORM VALIDATION PASSED:", data);
                  onSubmit(data);
                })(e);
              }} 
              className="space-y-6">
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
                          
                          // Store the full employee object
                          setSelectedEmployee(employeeData);
                          
                          // Extract all needed employee fields
                          const databaseId = employeeData?.id; // Internal database ID (used for DB relationships)
                          const displayEmployeeId = employeeData?.employee_id || employeeData?.employeeId; // Display employee ID (what users see)
                          const employeeName = employeeData?.employee_name || employeeData?.employeeName;
                          
                          console.log("Employee field values:", {
                            databaseId,
                            displayEmployeeId,
                            employeeName
                          });
                          
                          // Important distinction:
                          // - 'employee_id' in DB schema is the internal DB relationship field (number)
                          // - What users see as "Employee ID" is actually the displayEmployeeId

                          // For the database relationship (employee_id in the DB schema)
                          if (databaseId) {
                            const dbIdValue = Number(databaseId);
                            if (!isNaN(dbIdValue)) {
                              console.log("Setting internal DB ID for relationship:", dbIdValue);
                              form.setValue("employee_id", dbIdValue, {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true
                              });
                            }
                          }
                          
                          // For the display Employee ID (what users see)
                          if (displayEmployeeId) {
                            console.log("Setting display Employee ID:", displayEmployeeId);
                            form.setValue("employeeId", displayEmployeeId, {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true
                            });
                          }
                          
                          // Set employee name field
                          if (employeeName) {
                            form.setValue("employeeName", employeeName, {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true
                            });
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
                      render={({ field }) => {
                        // Determine which purposes to show based on booking type
                        const currentBookingType = form.watch("bookingType");
                        let purposeOptions = [];
                        
                        // Filter purposes based on booking type - using hardcoded values
                        if (currentBookingType === "freight") {
                          purposeOptions = [
                            { key: BookingPurpose.FREIGHT_TRANSPORT, value: BookingPurpose.FREIGHT_TRANSPORT }
                          ];
                        } 
                        else if (currentBookingType === "passenger") {
                          purposeOptions = [
                            { key: BookingPurpose.HOSPITAL_VISIT, value: BookingPurpose.HOSPITAL_VISIT },
                            { key: BookingPurpose.BLOOD_BANK, value: BookingPurpose.BLOOD_BANK },
                            { key: BookingPurpose.BLOOD_SAMPLES, value: BookingPurpose.BLOOD_SAMPLES },
                            { key: "AIRPORT_PICKUP_DROPOFF", value: "Airport Pickup & Dropoff" },
                            { key: BookingPurpose.BANK_VISIT, value: BookingPurpose.BANK_VISIT },
                            { key: "DRUGS_MEDICINE_DELIVERY", value: "Drugs/Medicine Delivery or Collection" },
                            { key: "MEETING_TRAINING", value: "Meeting /Training" },
                            { key: "SEMINAR_EVENTS", value: "Seminar & Events" },
                            { key: BookingPurpose.ON_CALL, value: BookingPurpose.ON_CALL },
                            { key: BookingPurpose.STAFF_TRANSPORTATION, value: BookingPurpose.STAFF_TRANSPORTATION },
                            { key: BookingPurpose.MARKETING, value: BookingPurpose.MARKETING },
                            { key: BookingPurpose.STORE_ITEMS, value: BookingPurpose.STORE_ITEMS },
                            { key: BookingPurpose.EQUIPMENT, value: BookingPurpose.EQUIPMENT },
                            { key: BookingPurpose.DOCUMENT, value: BookingPurpose.DOCUMENT },
                            { key: BookingPurpose.PATIENT, value: BookingPurpose.PATIENT },
                            { key: "HOME_VISIT", value: "Home Visit" },
                            { key: "AMBULANCE_SERVICE", value: "Ambulance Service" },
                            { key: BookingPurpose.VISA_MEDICAL, value: BookingPurpose.VISA_MEDICAL },
                            { key: BookingPurpose.MAINTENANCE, value: BookingPurpose.MAINTENANCE },
                            { key: BookingPurpose.VACCINE, value: BookingPurpose.VACCINE },
                            { key: BookingPurpose.ONCOLOGY, value: BookingPurpose.ONCOLOGY },
                            { key: BookingPurpose.MORTUARY, value: BookingPurpose.MORTUARY },
                            { key: "GUEST_TRANSFER", value: "Guest Transfer" },
                            { key: BookingPurpose.VIP_TRANSFER, value: BookingPurpose.VIP_TRANSFER }
                          ];
                        }
                        else if (currentBookingType === "medical") {
                          purposeOptions = [
                            { key: BookingPurpose.HOSPITAL_VISIT, value: BookingPurpose.HOSPITAL_VISIT },
                            { key: BookingPurpose.PATIENT, value: BookingPurpose.PATIENT },
                            { key: BookingPurpose.BLOOD_BANK, value: BookingPurpose.BLOOD_BANK },
                            { key: BookingPurpose.BLOOD_SAMPLES, value: BookingPurpose.BLOOD_SAMPLES },
                            { key: BookingPurpose.MEDICINE, value: BookingPurpose.MEDICINE },
                            { key: BookingPurpose.VISA_MEDICAL, value: BookingPurpose.VISA_MEDICAL },
                            { key: BookingPurpose.ONCOLOGY, value: BookingPurpose.ONCOLOGY }
                          ];
                        }
                        else if (currentBookingType === "emergency") {
                          purposeOptions = [
                            { key: BookingPurpose.AMBULANCE, value: BookingPurpose.AMBULANCE },
                            { key: BookingPurpose.MORTUARY, value: BookingPurpose.MORTUARY }
                          ];
                        }
                        
                        // Log the options for debugging
                        React.useEffect(() => {
                          console.log(`[TripXL-DEBUG] Using ${purposeOptions.length} hardcoded purpose options for booking type: ${currentBookingType}`);
                        }, [purposeOptions.length, currentBookingType]);
                        
                        return (
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
                                {purposeOptions.length === 0 ? (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    No purposes available for this booking type
                                  </div>
                                ) : (
                                  purposeOptions.map((option) => (
                                    <SelectItem key={option.key} value={option.value}>
                                      {option.value}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    {/* Priority Field - Auto-set by the useEffect near the top of the component */}

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
                                    onClear={() => {
                                      console.log("Clearing pickup location");
                                      form.setValue("pickupLocation", undefined, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                        shouldTouch: true
                                      });
                                    }}
                                    inputId="pickup-location"
                                    isPickup={true}
                                    allowClear={true}
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
                                    onClear={() => {
                                      console.log("Clearing dropoff location");
                                      form.setValue("dropoffLocation", undefined, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                        shouldTouch: true
                                      });
                                    }}
                                    inputId="dropoff-location"
                                    isPickup={false}
                                    allowClear={true}
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
                              apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}
                              pickupLocation={form.watch("pickupLocation")}
                              dropoffLocation={form.watch("dropoffLocation")}
                              waypoints={waypoints}
                              editable={true} // Force editable mode
                              onLocationSelect={(location, type) => {
                                // Handle pickup or dropoff location
                                const fieldName = type === 'pickup' ? "pickupLocation" : "dropoffLocation";
                                console.log(`Map onLocationSelect: Setting ${fieldName} with:`, JSON.stringify(location));
                                
                                // Verify coordinates are valid numbers
                                if (!location.coordinates || 
                                    typeof location.coordinates.lat !== 'number' || 
                                    typeof location.coordinates.lng !== 'number' ||
                                    isNaN(location.coordinates.lat) ||
                                    isNaN(location.coordinates.lng)) {
                                  console.error("Invalid coordinates in location:", location);
                                  toast({
                                    title: "Invalid location coordinates",
                                    description: "Please try selecting this location again",
                                    variant: "destructive"
                                  });
                                  return;
                                }
                                
                                // Create a fixed & complete location object with enforced type safety
                                const completeLocation: Location = {
                                  address: location.address || "",
                                  coordinates: {
                                    lat: Number(location.coordinates.lat),
                                    lng: Number(location.coordinates.lng)
                                  },
                                  place_id: location.place_id || "",
                                  name: location.name || location.address || "",
                                  formatted_address: location.formatted_address || location.address || "",
                                  district: location.district || "",
                                  city: location.city || "",
                                  area: location.area || "",
                                  place_types: location.place_types || []
                                };
                                
                                console.log("%c MAP LOCATION SELECT: " + type.toUpperCase(), "background: #9c27b0; color: white; padding: 2px 4px; border-radius: 2px;");
                                console.log(`Setting ${fieldName} with:`, JSON.stringify(completeLocation, null, 2));
                                
                                // Wrap in try/catch for extra safety
                                try {
                                  // First update the component state immediately
                                  if (type === 'pickup') {
                                    setPickupLocation(completeLocation);
                                    console.log("Updated pickupLocation in state", completeLocation);
                                  } else {
                                    setDropoffLocation(completeLocation);
                                    console.log("Updated dropoffLocation in state", completeLocation);
                                  }
                                  
                                  // Then update the form with a slight delay to ensure state is updated first
                                  setTimeout(() => {
                                    // Update the form with the location - first clone to avoid reference issues
                                    const locationForForm = { ...completeLocation };
                                    
                                    form.setValue(fieldName, locationForForm, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                      shouldTouch: true
                                    });
                                    
                                    const formValueAfter = form.getValues(fieldName);
                                    console.log(`Form value for ${fieldName} after update:`, formValueAfter);
                                    
                                    // Verify the update was successful
                                    if (!formValueAfter || !formValueAfter.address) {
                                      console.error(`Form update for ${fieldName} may have failed`);
                                      toast({
                                        title: "Warning",
                                        description: "Location was selected but the form may not have updated correctly. Please try again.",
                                        variant: "destructive"
                                      });
                                    } else {
                                      console.log(`Map Picker: Successfully set ${fieldName}`);
                                    }
                                  }, 100); // Slightly longer timeout for reliability
                                } catch (error) {
                                  console.error(`Error setting ${fieldName} from map:`, error);
                                }
                                
                                // Calculate route if both pickup and dropoff are set with valid coordinates
                                const pickupLoc = form.watch("pickupLocation");
                                const dropoffLoc = form.watch("dropoffLocation");
                                
                                if (pickupLoc && pickupLoc.coordinates && dropoffLoc && dropoffLoc.coordinates) {
                                  // Calculate an estimate for route duration with safe access
                                  const p1 = pickupLoc.coordinates;
                                  const p2 = dropoffLoc.coordinates;
                                  
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
                        
                        // Critical check for the required employee ID
                        if (!formData.employee_id && !selectedEmployee?.id) {
                          console.error("Missing employee ID - cannot submit booking without it");
                          toast({
                            title: "Missing Employee Information",
                            description: "Please search for and select an employee by email before proceeding.",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Ensure booking type is set
                        if (!formData.bookingType) {
                          console.error("Missing booking type");
                          toast({
                            title: "Missing Booking Type",
                            description: "Please select a booking type (Passenger, Freight, etc.)",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Location validation
                        if (currentStep === 3 && (!formData.pickupLocation || !formData.dropoffLocation)) {
                          console.error("Missing location data");
                          toast({
                            title: "Missing Location Information",
                            description: "Please select both pickup and dropoff locations",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Manual validation
                        form.trigger().then(isValid => {
                          console.log("Form validation result:", isValid);
                          if (isValid) {
                            console.log("Form is valid, submitting directly...");
                            
                            // Force correct employee ID (use selectedEmployee if available)
                            if (selectedEmployee?.id) {
                              form.setValue("employee_id", Number(selectedEmployee.id), {
                                shouldValidate: true,
                                shouldDirty: true
                              });
                            }
                            
                            // Make sure booking type is lowercase
                            const bookingType = formData.bookingType?.toLowerCase() || "passenger";
                            form.setValue("bookingType", bookingType, {
                              shouldValidate: true,
                              shouldDirty: true
                            });
                            
                            // Submit the form with our enhanced onSubmit function
                            console.log("Calling onSubmit directly with form data...");
                            try {
                              onSubmit(form.getValues());
                            } catch (error) {
                              console.error("Error during direct form submission:", error);
                              alert("Error during form submission: " + (error?.message || "Unknown error"));
                            }
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