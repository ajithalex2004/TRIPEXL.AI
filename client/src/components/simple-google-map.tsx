import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Libraries } from '@react-google-maps/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define libraries as a static constant to prevent unnecessary reloads
const libraries: Libraries = ["places", "geometry"];

const SimpleGoogleMap = () => {
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";
  
  console.log("Google Maps API Key available:", mapKey ? "Yes (key length: " + mapKey.length + ")" : "No");
  
  useEffect(() => {
    // Cleanup effect to check for map error cases in the DOM
    const timeoutId = setTimeout(() => {
      const mapErrorDiv = document.querySelector('.gm-err-content');
      if (mapErrorDiv && !error) {
        setError("Google Maps failed to load properly. This may be due to API key restrictions or network issues.");
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [error]);
  
  const containerStyle = {
    width: '100%',
    height: '400px'
  };
  
  const center = {
    lat: 24.466667, // Abu Dhabi
    lng: 54.366667
  };

  const handleRefresh = () => {
    // Reset error state and force refresh
    setError(null);
    setMapLoaded(false);
    
    // Small delay before reloading
    setTimeout(() => {
      setMapLoaded(true);
    }, 500);
  };

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <div className="flex-1">
            <AlertTitle>Google Maps Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </Alert>
      )}
      
      {(!mapLoaded || error === null) && (
        <LoadScript
          googleMapsApiKey={mapKey}
          libraries={libraries}
          onLoad={() => {
            console.log("Google Maps script loaded");
            setMapLoaded(true);
            
            // Check if Google Maps object exists in window
            if (!window.google || !window.google.maps) {
              setError("Google Maps API loaded but not initialized correctly.");
            }
          }}
          onError={(error) => {
            console.error("Google Maps script error:", error);
            setError("Failed to load Google Maps. This may be due to API key restrictions or network issues.");
          }}
          loadingElement={<div className="p-10 text-center">Loading Google Maps...</div>}
        >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
            onLoad={() => console.log("Map loaded successfully")}
          >
            {/* No markers or additional content */}
          </GoogleMap>
        </LoadScript>
      )}
    </div>
  );
};

export default SimpleGoogleMap;