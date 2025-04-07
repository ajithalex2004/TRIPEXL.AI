import React, { useState } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const SimpleGoogleMap = () => {
  const [error, setError] = useState<string | null>(null);
  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";
  
  console.log("Map key being used:", mapKey ? `${mapKey.slice(0, 4)}...${mapKey.slice(-4)}` : "No key");
  
  const containerStyle = {
    width: '100%',
    height: '400px'
  };
  
  const center = {
    lat: 24.466667, // Abu Dhabi
    lng: 54.366667
  };

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <LoadScript
        googleMapsApiKey={mapKey}
        onLoad={() => console.log("Google Maps script loaded")}
        onError={(error) => {
          console.error("Google Maps script error:", error);
          setError("Failed to load Google Maps. Please check your internet connection or API key.");
        }}
        loadingElement={<div className="p-10 text-center">Loading Google Maps...</div>}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
          onLoad={() => console.log("Map loaded")}
        >
          {/* No markers or additional content */}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default SimpleGoogleMap;