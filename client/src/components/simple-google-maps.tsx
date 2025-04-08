import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { AlertCircle } from "lucide-react";
import MapFallback from "@/components/map-fallback";
import { Button } from "@/components/ui/button";

// Simple interface for location
interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

interface SimpleGoogleMapsProps {
  pickupLocation?: Location;
  dropoffLocation?: Location;
  waypoints?: Location[];
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff' | 'waypoint') => void;
  editable?: boolean;
}

// A fallback component that uses direct iframe embedding
const SimpleGoogleMaps: React.FC<SimpleGoogleMapsProps> = ({
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onLocationSelect,
  editable = true
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // UAE default center
  const defaultCenter = { lat: 24.466667, lng: 54.366667 }; // Abu Dhabi
  
  // Check if we have a valid API key
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  
  // Log API key availability for debugging
  useEffect(() => {
    console.log("Google Maps API Key:", API_KEY ? `exists with length ${API_KEY.length}` : "missing");
    if (!API_KEY) {
      setError("Google Maps API key is missing");
    }
  }, [API_KEY]);

  // Returns a Google Maps src URL based on provided parameters
  const getMapSrc = () => {
    let mapSrc = `https://www.google.com/maps/embed/v1/view?key=${API_KEY}&center=${defaultCenter.lat},${defaultCenter.lng}&zoom=10`;
    
    // If we have pickup and dropoff, use directions mode
    if (pickupLocation && dropoffLocation) {
      const origin = `${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}`;
      const destination = `${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`;
      
      // Generate waypoints string if any exist
      const waypointsString = waypoints.length > 0 
        ? `&waypoints=${waypoints.map(wp => `${wp.coordinates.lat},${wp.coordinates.lng}`).join('|')}` 
        : '';
        
      mapSrc = `https://www.google.com/maps/embed/v1/directions?key=${API_KEY}&origin=${origin}&destination=${destination}${waypointsString}&mode=driving`;
    }
    // If we only have pickup, show that as place
    else if (pickupLocation) {
      const location = `${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}`;
      mapSrc = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${location}&center=${location}&zoom=15`;
    }
    // If we only have dropoff, show that as place
    else if (dropoffLocation) {
      const location = `${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`;
      mapSrc = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${location}&center=${location}&zoom=15`;
    }
    
    return mapSrc;
  };

  // Function to handle setting pickup location
  const handleSetPickup = () => {
    if (!onLocationSelect) return;
    
    // Prompt user for address
    const address = prompt("Enter pickup address (e.g., Dubai Mall, UAE):");
    if (!address) return;
    
    setIsLoading(true);
    
    // Use geocoding to get coordinates
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=ae&key=${API_KEY}`)
      .then(response => response.json())
      .then(data => {
        setIsLoading(false);
        if (data.status === "OK" && data.results && data.results.length > 0) {
          const result = data.results[0];
          const location: Location = {
            address: result.formatted_address,
            coordinates: {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            },
            place_id: result.place_id,
            formatted_address: result.formatted_address
          };
          onLocationSelect(location, 'pickup');
        } else {
          alert("Could not find that location. Please try again with a more specific address.");
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error("Error geocoding address:", err);
        alert("Error finding location. Please try again.");
      });
  };
  
  // Function to handle setting dropoff location
  const handleSetDropoff = () => {
    if (!onLocationSelect) return;
    
    // Prompt user for address
    const address = prompt("Enter dropoff address (e.g., Abu Dhabi Airport, UAE):");
    if (!address) return;
    
    setIsLoading(true);
    
    // Use geocoding to get coordinates
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=ae&key=${API_KEY}`)
      .then(response => response.json())
      .then(data => {
        setIsLoading(false);
        if (data.status === "OK" && data.results && data.results.length > 0) {
          const result = data.results[0];
          const location: Location = {
            address: result.formatted_address,
            coordinates: {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            },
            place_id: result.place_id,
            formatted_address: result.formatted_address
          };
          onLocationSelect(location, 'dropoff');
        } else {
          alert("Could not find that location. Please try again with a more specific address.");
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error("Error geocoding address:", err);
        alert("Error finding location. Please try again.");
      });
  };

  // Show fallback if errors occur
  if (error) {
    return (
      <Card className="overflow-hidden">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Map Error</AlertTitle>
          <AlertDescription>
            {error}. Using fallback view.
          </AlertDescription>
        </Alert>
        <MapFallback
          message="Using a simplified map view due to temporary issues with map loading. All booking functionality is still available."
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          waypoints={waypoints}
          onSelectPickup={onLocationSelect ? handleSetPickup : undefined}
          onSelectDropoff={onLocationSelect ? handleSetDropoff : undefined}
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
          <VehicleLoadingIndicator />
        </div>
      )}
      
      {/* Embedded Google Maps iframe */}
      <div className="relative" style={{ height: '500px' }}>
        <iframe 
          title="Google Maps"
          width="100%" 
          height="100%" 
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={getMapSrc()}
        ></iframe>
      </div>
      
      {/* Controls for setting locations */}
      {editable && (
        <div className="p-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              onClick={handleSetPickup}
            >
              Set Pickup Location
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              onClick={handleSetDropoff}
            >
              Set Dropoff Location
            </Button>
          </div>
          
          <div className="text-xs text-slate-500">
            <p>Click the buttons above to set pickup and dropoff locations</p>
          </div>
        </div>
      )}
    </Card>
  );
};

// Define global interface for window with Google Maps-related properties
declare global {
  interface Window {
    initGoogleMap?: () => void;
    initMap?: () => void;
    google?: any;
  }
}

export default SimpleGoogleMaps;