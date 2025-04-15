import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useSafeGoogleMaps } from '@/hooks/use-safe-google-maps';

// Use the Google Maps API key from environment variables
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

// Define the center for UAE (Dubai)
const defaultCenter = {
  lat: 25.276987,
  lng: 55.296249
};

// Define the map container style
const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

interface SimpleGoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

export const SimpleGoogleMap: React.FC<SimpleGoogleMapProps> = ({
  center = defaultCenter,
  zoom = 10
}) => {
  const mapRef = useRef<GoogleMap>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Use our custom hook for safely loading Google Maps
  const { isLoaded, isError, errorMessage } = useSafeGoogleMaps(API_KEY);

  // Handle when the map loads
  const onMapLoad = (map: google.maps.Map) => {
    console.log("SimpleGoogleMap: Map loaded successfully!");
    setMap(map);
  };

  // If there's a loading error, show an error message
  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading Google Maps: {errorMessage || "Unknown error occurred"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If the map is still loading, show a loading state
  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render the map
  return (
    <Card>
      <CardContent className="p-6">
        <GoogleMap
          ref={mapRef}
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          onLoad={onMapLoad}
          options={{
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
        >
          {/* Map content is rendered here */}
        </GoogleMap>
      </CardContent>
    </Card>
  );
};

export default SimpleGoogleMap;