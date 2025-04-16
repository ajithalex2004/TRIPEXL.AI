import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

// Default center for UAE (Dubai)
const DEFAULT_CENTER = { lat: 25.276987, lng: 55.296249 };
const DEFAULT_ZOOM = 10;

interface BasicGoogleMapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string | number;
  className?: string;
  onClick?: (lat: number, lng: number) => void;
}

export const BasicGoogleMap: React.FC<BasicGoogleMapProps> = ({
  apiKey,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '600px',
  className = '',
  onClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Function to initialize the map
  const initializeMap = () => {
    if (!mapRef.current) return;
    
    try {
      const mapOptions = {
        center,
        zoom,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
      };
      
      const newMap = new google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      
      // Add click handler if provided
      if (onClick) {
        newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onClick(e.latLng.lat(), e.latLng.lng());
          }
        });
      }

      console.log("Basic Google Map initialized successfully!");
    } catch (err) {
      console.error("Failed to initialize map:", err);
      setError("Failed to initialize map: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Load the Google Maps API script
  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps API key is missing");
      setLoading(false);
      return;
    }

    // Check if the API is already loaded
    if (window.google?.maps) {
      initializeMap();
      return;
    }

    // Define the callback function for when the API loads
    window.initMap = () => {
      initializeMap();
    };

    // Load the API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setError("Failed to load Google Maps API");
      setLoading(false);
    };

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

  // Render loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-0 flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4" style={{ height }}>
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <h3 className="font-medium">Map Error</h3>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2">
              Please check your Google Maps API key or try refreshing the page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render the map
  return (
    <Card className={className}>
      <CardContent className="p-0 overflow-hidden">
        <div
          ref={mapRef}
          style={{ width: '100%', height }}
          className="relative"
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

export default BasicGoogleMap;