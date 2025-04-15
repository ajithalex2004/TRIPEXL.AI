import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getGoogleMapsApiKey } from '@/lib/map-config';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Location } from './map-view';
import { UAELocationAutocomplete } from './uae-location-autocomplete';

interface SimpleIframeMapProps {
  pickupCoordinates?: { lat: number; lng: number } | null;
  dropoffCoordinates?: { lat: number; lng: number } | null;
  className?: string;
  height?: number;
  editable?: boolean;
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
}

/**
 * A simplest possible Google Maps component using an iframe
 * This is a fallback when more complex implementations fail
 */
export function SimpleIframeMap({
  pickupCoordinates,
  dropoffCoordinates,
  className = '',
  height = 400,
  editable = false,
  onLocationSelect
}: SimpleIframeMapProps) {
  const apiKey = getGoogleMapsApiKey();
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
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

  const handleClearLocation = () => {
    setSearchValue("");
    setSelectedLocation(null);
  };
  
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setSearchValue(location.address);
  };

  const handleSetPickup = () => {
    if (selectedLocation && onLocationSelect) {
      onLocationSelect(selectedLocation, 'pickup');
      handleClearLocation();
    }
  };

  const handleSetDropoff = () => {
    if (selectedLocation && onLocationSelect) {
      onLocationSelect(selectedLocation, 'dropoff');
      handleClearLocation();
    }
  };
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Location search (only shown if editable) */}
      {editable && (
        <div className="absolute top-2 left-2 right-2 z-20 bg-white/90 p-3 rounded-lg shadow-md">
          <div className="flex flex-col gap-2">
            <UAELocationAutocomplete
              value={searchValue}
              placeholder="Search for a location in UAE..."
              onLocationSelect={handleLocationSelect}
              onClear={handleClearLocation}
              onSearchChange={setSearchValue}
            />
            
            {selectedLocation && (
              <div className="flex flex-row gap-2 mt-2">
                <Button 
                  size="sm" 
                  onClick={handleSetPickup}
                  className="flex-1 flex items-center gap-1"
                >
                  <MapPin className="h-4 w-4" />
                  Set as Pickup
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSetDropoff}
                  className="flex-1 flex items-center gap-1"
                >
                  <Navigation className="h-4 w-4" />
                  Set as Dropoff
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
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
        className={editable ? "mt-[80px]" : ""}
      ></iframe>
    </div>
  );
}