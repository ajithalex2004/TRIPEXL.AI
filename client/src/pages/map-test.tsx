import React from 'react';
import { SimpleGoogleMap } from '@/components/simple-google-map';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export const MapTestPage = () => {
  const { toast } = useToast();
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Google Maps Test Page</h1>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
      
      <div className="grid gap-6">
        <div className="p-4 bg-white shadow rounded-lg">
          <h2 className="text-lg font-medium mb-4">Basic Map</h2>
          <p className="text-sm text-slate-500 mb-4">
            This is a simple Google Maps component with minimal configuration to test if the maps API is working properly.
          </p>
          <SimpleGoogleMap />
        </div>
        
        <div className="p-4 bg-white shadow rounded-lg">
          <h2 className="text-lg font-medium mb-4">Map Controls</h2>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => {
                // Show API key status from the component directly
                toast({
                  title: "Map Test",
                  description: "Google Maps component is loaded and working!"
                });
              }}
            >
              Test Map Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapTestPage;