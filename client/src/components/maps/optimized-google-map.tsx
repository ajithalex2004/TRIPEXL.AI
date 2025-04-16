import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { useSafeGoogleMaps } from '@/hooks/use-safe-google-maps';
import { MAP_CONFIG } from '@/lib/map-config';

// Performance optimized Google Maps configuration
const OPTIMIZED_MAP_OPTIONS = {
  ...MAP_CONFIG.options,
  clickableIcons: false, // Disable POI clicks to improve performance
  gestureHandling: "cooperative", // Less processing-intensive than "greedy"
  maxZoom: 18, // Limit max zoom to reduce tile load 
  minZoom: 5, // Set minimum zoom to ensure context
  // Disable all unnecessary visualization features
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ]
};

interface OptimizedGoogleMapProps {
  apiKey: string;
  children?: React.ReactNode;
  onLoad?: (map: google.maps.Map) => void;
  onUnmount?: () => void;
  onError?: (error: Error) => void;
  onClick?: (e: google.maps.MapMouseEvent) => void;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  options?: google.maps.MapOptions;
  style?: React.CSSProperties; // Added style property
}

export function OptimizedGoogleMap({
  apiKey,
  children,
  onLoad,
  onUnmount,
  onError,
  onClick,
  center = MAP_CONFIG.defaultCenter,
  zoom = MAP_CONFIG.defaultZoom,
  options = {},
  style = {}
}: OptimizedGoogleMapProps) {
  // We need to track our own loading state
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  
  // Use our custom hook for safely loading Google Maps
  const { isLoaded, isError, errorMessage, apiInstance } = useSafeGoogleMaps(apiKey, onError);
  
  // Additional error tracking
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  
  // Add additional error logging
  useEffect(() => {
    if (isError) {
      console.error("Google Maps loading error:", errorMessage);
    }
    
    // Check if API key is available
    if (!apiKey) {
      console.error("No Google Maps API key provided");
      setRuntimeError("Missing API key");
    }
  }, [isError, errorMessage, apiKey]);

  // Handle map load
  const handleMapLoad = React.useCallback((map: google.maps.Map) => {
    console.log("OptimizedGoogleMap: Map loaded");
    mapRef.current = map;
    
    // Apply performance optimizations
    // This is done with a small delay to avoid blocking the UI thread
    setTimeout(() => {
      try {
        if (map) {
          // Disable 45° imagery which is resource intensive
          map.setTilt(0);
          
          // Apply optimization options
          const mergedOptions = {
            ...OPTIMIZED_MAP_OPTIONS,
            ...options
          };
          map.setOptions(mergedOptions);
          
          // Notify parent component
          if (onLoad) onLoad(map);
          setIsMapReady(true);
        }
      } catch (error) {
        console.error("Error setting map options:", error);
        if (onError && error instanceof Error) onError(error);
      }
    }, 10);
  }, [onLoad, options, onError]);

  // Handle map unload/cleanup
  const handleMapUnmount = React.useCallback(() => {
    console.log("OptimizedGoogleMap: Map unmounted");
    mapRef.current = null;
    setIsMapReady(false);
    if (onUnmount) onUnmount();
  }, [onUnmount]);

  // If there's an error, show error state
  if (isError || runtimeError) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-md">
        <div className="text-center p-6">
          <div className="text-red-500 font-semibold mb-2">
            Failed to load Google Maps
          </div>
          <div className="text-sm text-gray-600">
            {errorMessage || runtimeError || "Unknown error occurred"}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Please ensure you have a valid Google Maps API key
          </div>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while the API is loading
  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-md">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
          <div className="text-gray-600">Loading map...</div>
        </div>
      </div>
    );
  }

  // Render the map once it's loaded
  return (
    <div 
      className="relative rounded-md overflow-hidden" 
      ref={mapDivRef}
      style={style}
    >
      <GoogleMap
        mapContainerStyle={{
          width: '100%',
          height: style && 'height' in style ? undefined : '500px', // Use style height if provided
        }}
        center={center}
        zoom={zoom}
        onLoad={handleMapLoad}
        onUnmount={handleMapUnmount}
        onClick={onClick}
        options={{
          ...OPTIMIZED_MAP_OPTIONS,
          ...options
        }}
        id="optimized-google-map"
      >
        {isMapReady && children}
      </GoogleMap>
    </div>
  );
}