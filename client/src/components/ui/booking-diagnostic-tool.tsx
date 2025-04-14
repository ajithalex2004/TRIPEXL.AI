import React, { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Helper function to get the auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const BookingDiagnosticTool: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Simple diagnostic test booking
  const testBooking = {
    employee_id: 1, // Using a simple ID for testing
    booking_type: "passenger",
    purpose: "Test Booking",
    priority: "Normal",
    pickup_location: {
      address: "Test Pickup Location",
      coordinates: {
        lat: 25.197197,
        lng: 55.274376
      }
    },
    dropoff_location: {
      address: "Test Dropoff Location",
      coordinates: {
        lat: 25.198994, 
        lng: 55.279236
      }
    },
    pickup_time: new Date().toISOString(),
    dropoff_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
    remarks: "Diagnostic test booking"
  };

  // Test API response
  const runDiagnosticTest = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Check authentication token
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      // Execute the test using our advanced diagnostic endpoint
      const response = await fetch("/api/booking-debug-advanced/test-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(testBooking)
      });

      // Get response data
      const data = await response.json();

      // Update state with results
      setResult(data);
      setIsLoading(false);

      // Show success or error toast
      if (response.ok) {
        toast({
          title: "Diagnostic test successful",
          description: "The booking request passed validation checks."
        });
      } else {
        toast({
          title: "Diagnostic test failed",
          description: data.error || "Something went wrong with the diagnostic test.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during the diagnostic test");
      setIsLoading(false);
      
      toast({
        title: "Error running diagnostic",
        description: err.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  // Run a simple API health check
  const runApiHealthCheck = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/health");
      const data = await response.json();

      setResult({ 
        healthCheck: data, 
        message: "API health check successful"
      });
      setIsLoading(false);

      toast({
        title: "API Health Check",
        description: "The API server is responsive."
      });
    } catch (err: any) {
      setError(err.message || "API health check failed");
      setIsLoading(false);
      
      toast({
        title: "API Health Check Failed",
        description: err.message || "The API server is not responding properly",
        variant: "destructive"
      });
    }
  };

  // Check employee lookup functionality
  const testEmployeeLookup = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/employee/search?employee_id=1");
      const data = await response.json();

      setResult({
        employeeLookup: data,
        message: "Employee lookup test complete"
      });
      setIsLoading(false);

      if (response.ok) {
        toast({
          title: "Employee Lookup Test",
          description: "Successfully looked up employee."
        });
      } else {
        toast({
          title: "Employee Lookup Failed",
          description: data.error || "Could not find the test employee ID",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      setError(err.message || "Employee lookup test failed");
      setIsLoading(false);
      
      toast({
        title: "Employee Lookup Error",
        description: err.message || "An error occurred during employee lookup",
        variant: "destructive"
      });
    }
  };

  // Check database schema for bookings
  const checkBookingSchema = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/booking-debug-advanced/schema");
      const data = await response.json();

      setResult({
        schema: data,
        message: "Schema check complete"
      });
      setIsLoading(false);

      toast({
        title: "Booking Schema Check",
        description: "Retrieved booking schema information."
      });
    } catch (err: any) {
      setError(err.message || "Schema check failed");
      setIsLoading(false);
      
      toast({
        title: "Schema Check Error",
        description: err.message || "An error occurred while checking the booking schema",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Booking System Diagnostic</CardTitle>
        <CardDescription>
          Run tests to diagnose booking creation issues
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button onClick={runApiHealthCheck} disabled={isLoading} variant="outline">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            API Health Check
          </Button>
          
          <Button onClick={testEmployeeLookup} disabled={isLoading} variant="outline">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Employee Lookup
          </Button>
          
          <Button onClick={checkBookingSchema} disabled={isLoading} variant="outline">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Check Booking Schema
          </Button>
          
          <Button onClick={runDiagnosticTest} disabled={isLoading} variant="outline">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Booking Creation
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700 mb-4">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-auto max-h-[400px]">
            <p className="font-semibold mb-2">{result.message || "Result:"}</p>
            <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <p className="text-xs text-gray-500">
          Auth token available: {getAuthToken() ? "Yes" : "No"}
        </p>
      </CardFooter>
    </Card>
  );
};