import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// API key is hardcoded for immediate testing purposes
const API_KEY = "AIzaSyBOyL-FXqHOHmqxteTw02lh9TkzdXJ_oaI";

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

// Define libraries to load
const libraries = ["places", "geometry"] as any;

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

  // Load the Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries
  });

  // Handle when the map loads
  const onMapLoad = (map: google.maps.Map) => {
    console.log("Map loaded successfully!");
    setMap(map);
  };

  // If there's a loading error, show an error message
  if (loadError) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading Google Maps: {loadError.message}
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