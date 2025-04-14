import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export function BookingDebugTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  
  const testDirectBookingCreate = async () => {
    setIsLoading(true);
    setResponse(null);
    
    try {
      console.log('Testing direct booking creation...');
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        toast({
          title: 'Authentication Required',
          description: 'You must be logged in to use this feature',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/debug/test-booking-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('Debug endpoint response status:', response.status);
      
      const data = await response.json();
      console.log('Debug endpoint response data:', data);
      
      setResponse(data);
      
      toast({
        title: data.success ? 'Test Successful' : 'Test Failed',
        description: data.message || 'No message provided',
        variant: data.success ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Error testing booking creation:', error);
      setResponse({ error: String(error) });
      
      toast({
        title: 'Test Failed',
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkBookingDatabase = async () => {
    setIsLoading(true);
    setResponse(null);
    
    try {
      console.log('Checking booking database...');
      const response = await fetch('/api/debug/booking-database-check');
      const data = await response.json();
      
      console.log('Database check response:', data);
      setResponse(data);
      
      toast({
        title: data.success ? 'Database Check Successful' : 'Database Check Failed',
        description: `${data.message || 'No message provided'}`,
        variant: data.success ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Error checking booking database:', error);
      setResponse({ error: String(error) });
      
      toast({
        title: 'Database Check Failed',
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const testRegularBookingCreate = async () => {
    setIsLoading(true);
    setResponse(null);
    
    try {
      console.log('Testing regular booking API...');
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        toast({
          title: 'Authentication Required',
          description: 'You must be logged in to use this feature',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }
      
      // Create a simple booking payload
      const bookingData = {
        employee_id: 1, // Using employee ID 1 which should exist
        booking_type: 'passenger',
        purpose: 'Testing Regular API',
        priority: 'MEDIUM',
        pickup_location: {
          address: 'API Test Pickup Location',
          coordinates: { lat: 25.1234, lng: 55.1234 }
        },
        dropoff_location: {
          address: 'API Test Dropoff Location',
          coordinates: { lat: 25.5678, lng: 55.5678 }
        }
      };
      
      console.log('Sending booking to regular API endpoint:', bookingData);
      
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(bookingData)
      });
      
      console.log('Regular API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Regular API response data:', data);
        setResponse(data);
        
        toast({
          title: 'Booking Created Successfully',
          description: `Booking ID: ${data.booking?.id || 'Unknown'}`,
          variant: 'default'
        });
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: await response.text() };
        }
        
        console.error('Error from regular API:', errorData);
        setResponse(errorData);
        
        toast({
          title: 'Booking Creation Failed',
          description: errorData.message || errorData.error || 'Unknown error',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error with regular booking API:', error);
      setResponse({ error: String(error) });
      
      toast({
        title: 'API Request Failed',
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Booking System Diagnostics</CardTitle>
        <CardDescription>Test booking creation and database functionality</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Button 
            onClick={testDirectBookingCreate} 
            disabled={isLoading}
            variant="outline"
          >
            Test Debug Endpoint
          </Button>
          
          <Button 
            onClick={checkBookingDatabase} 
            disabled={isLoading}
            variant="outline"
          >
            Check Database
          </Button>
          
          <Button 
            onClick={testRegularBookingCreate} 
            disabled={isLoading}
            variant="default"
          >
            Test Regular API
          </Button>
        </div>
        
        {isLoading && <div className="text-center my-4">Testing... please wait</div>}
        
        {response && (
          <div className="border p-4 rounded-md bg-muted">
            <h3 className="font-medium mb-2">Response:</h3>
            <pre className="text-xs overflow-auto max-h-[300px] p-2 bg-background rounded">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-sm text-muted-foreground">
        These tools help diagnose issues with the booking system.
      </CardFooter>
    </Card>
  );
}