import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface SimpleMapProps {
  apiKey: string;
  className?: string;
}

export const SimpleMap: React.FC<SimpleMapProps> = ({ apiKey, className }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    // Define the callback function for when the API loads
    window.initMap = () => {
      try {
        // Create a new map instance
        new window.google.maps.Map(mapRef.current!, {
          center: { lat: 25.276987, lng: 55.296249 }, // Dubai
          zoom: 10,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true
        });
        
        console.log("Map initialized successfully!");
      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    };

    // Check if the API is already loaded
    if (window.google?.maps) {
      window.initMap();
      return;
    }

    // Load the API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    
    document.head.appendChild(script);

    return () => {
      // Clean up
      if (window.initMap) {
        // @ts-ignore - Clean up global function
        window.initMap = undefined;
      }
      
      // Remove script if it exists
      const scriptElement = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
    };
  }, [apiKey]);

  return (
    <Card className={className}>
      <CardContent className="p-0 rounded-md overflow-hidden">
        <div 
          ref={mapRef} 
          style={{ width: '100%', height: '600px' }}
        />
      </CardContent>
    </Card>
  );
};

// Add a global declaration for the initMap callback
declare global {
  interface Window {
    initMap?: () => void;
    google?: any;
  }
}

export default SimpleMap;