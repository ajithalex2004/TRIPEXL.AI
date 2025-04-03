import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle } from "lucide-react";

// Interface for location data
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

// Props for the component
export interface SimpleMapViewProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
  onRouteCalculated?: (duration: number) => void;
}

// Fallback component that shows UI for location input without actual map
export function SimpleMapView({
  pickupLocation,
  dropoffLocation,
  onLocationSelect,
  onRouteCalculated
}: SimpleMapViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  useEffect(() => {
    // Log the API key status for debugging
    console.log("Google Maps API Key available:", MAPS_API_KEY ? "Yes (key length: " + MAPS_API_KEY.length + ")" : "No");
    
    // Check if we have both pickup and dropoff locations to calculate duration
    if (pickupLocation && dropoffLocation && onRouteCalculated) {
      // Simulate a route calculation with a fixed duration (30 minutes = 1800 seconds)
      onRouteCalculated(1800);
    }
  }, [pickupLocation, dropoffLocation, onRouteCalculated, MAPS_API_KEY]);

  // Provide a manual location selection form
  const handleManualLocationInput = (type: 'pickup' | 'dropoff') => {
    // Create a default location based on UAE coordinates
    const defaultLocation = {
      address: type === 'pickup' ? "Abu Dhabi City Center" : "Dubai Downtown",
      coordinates: {
        lat: type === 'pickup' ? 24.466667 : 25.276987,
        lng: type === 'pickup' ? 54.366667 : 55.296249
      },
      name: type === 'pickup' ? "Abu Dhabi" : "Dubai",
      formatted_address: type === 'pickup' ? "Abu Dhabi, UAE" : "Dubai, UAE"
    };

    // Call the location select handler
    if (onLocationSelect) {
      onLocationSelect(defaultLocation, type);
    }
  };

  return (
    <Card className="p-4 h-full relative shadow-lg">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <VehicleLoadingIndicator size="lg" />
        </div>
      )}
      
      {showError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Maps Integration Issue</AlertTitle>
          <AlertDescription>
            We're experiencing technical difficulties with map integration. Please use the manual location entry.
          </AlertDescription>
        </Alert>
      )}

      <div className="h-[500px] flex flex-col items-center justify-center border border-dashed rounded-md p-5 bg-muted/10">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">Location Selection</h3>
          <p className="text-muted-foreground mb-4">
            Please use the buttons below to select your pickup and drop-off locations
          </p>
        </div>
        
        <div className="space-y-6 w-full max-w-md">
          {/* Pickup Location */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-medium">Pickup Location</h4>
            </div>
            
            {pickupLocation ? (
              <div className="pl-10">
                <p className="font-medium">{pickupLocation.name || "Selected Location"}</p>
                <p className="text-sm text-muted-foreground">{pickupLocation.address}</p>
                <Button 
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onLocationSelect && onLocationSelect(
                    {...pickupLocation, coordinates: {lat: 0, lng: 0}},
                    'pickup'
                  )}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="pl-10">
                <p className="text-sm text-muted-foreground mb-2">No pickup location selected</p>
                <Button
                  onClick={() => handleManualLocationInput('pickup')}
                  variant="default"
                  className="w-full"
                >
                  Select Pickup Location
                </Button>
              </div>
            )}
          </div>

          {/* Dropoff Location - only enable when pickup is selected */}
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-red-600" />
              </div>
              <h4 className="font-medium">Drop-off Location</h4>
            </div>
            
            {dropoffLocation ? (
              <div className="pl-10">
                <p className="font-medium">{dropoffLocation.name || "Selected Location"}</p>
                <p className="text-sm text-muted-foreground">{dropoffLocation.address}</p>
                <Button 
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onLocationSelect && onLocationSelect(
                    {...dropoffLocation, coordinates: {lat: 0, lng: 0}},
                    'dropoff'
                  )}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="pl-10">
                <p className="text-sm text-muted-foreground mb-2">
                  {pickupLocation 
                    ? "No drop-off location selected" 
                    : "Please select a pickup location first"}
                </p>
                <Button
                  onClick={() => handleManualLocationInput('dropoff')}
                  variant="default"
                  className="w-full"
                  disabled={!pickupLocation}
                >
                  Select Drop-off Location
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Show a message about route calculation */}
        {pickupLocation && dropoffLocation && (
          <div className="mt-6 text-center">
            <p className="text-sm font-medium">Route Information</p>
            <p className="text-xs text-muted-foreground">
              Estimated travel time: 30 minutes
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}