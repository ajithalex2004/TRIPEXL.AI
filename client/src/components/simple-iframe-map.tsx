import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getGoogleMapsApiKey } from '@/lib/map-config';
import { Loader2 } from 'lucide-react';

interface SimpleIframeMapProps {
  pickupCoordinates?: { lat: number; lng: number } | null;
  dropoffCoordinates?: { lat: number; lng: number } | null;
  className?: string;
  height?: number;
}

/**
 * A simplest possible Google Maps component using an iframe
 * This is a fallback when more complex implementations fail
 */
export function SimpleIframeMap({
  pickupCoordinates,
  dropoffCoordinates,
  className = '',
  height = 400
}: SimpleIframeMapProps) {
  const apiKey = getGoogleMapsApiKey();
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  
  // If we have both pickup and dropoff, create a directions URL
  let mapUrl = '';
  
  if (pickupCoordinates && dropoffCoordinates) {
    // Directions map (shows route)
    mapUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${pickupCoordinates.lat},${pickupCoordinates.lng}&destination=${dropoffCoordinates.lat},${dropoffCoordinates.lng}&mode=driving`;
  } else if (pickupCoordinates) {
    // Just show the pickup location
    mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${pickupCoordinates.lat},${pickupCoordinates.lng}&zoom=14`;
  } else if (dropoffCoordinates) {
    // Just show the dropoff location
    mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${dropoffCoordinates.lat},${dropoffCoordinates.lng}&zoom=14`;
  } else {
    // Default to showing UAE
    mapUrl = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=25.276987,55.296249&zoom=10&maptype=roadmap`;
  }
  
  // Reset loading state when map URL changes
  useEffect(() => {
    setLoading(true);
    setMapError(false);
  }, [mapUrl]);

  const handleMapLoad = () => {
    setLoading(false);
  };

  const handleMapError = () => {
    setLoading(false);
    setMapError(true);
    console.error('Failed to load iframe map');
  };
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
            <div className="text-gray-600">Loading map...</div>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center max-w-xs mx-auto">
            <div className="text-red-500 text-2xl mb-2">⚠️</div>
            <div className="font-medium text-gray-800 mb-1">Map loading failed</div>
            <p className="text-sm text-gray-600">
              There was a problem loading the map. Please check your internet connection or try again later.
            </p>
          </div>
        </div>
      )}
      
      {/* Actual map iframe */}
      <iframe
        title="Google Maps"
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={mapUrl}
        onLoad={handleMapLoad}
        onError={handleMapError}
      ></iframe>
    </div>
  );
}