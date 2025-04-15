import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getGoogleMapsApiKey } from '@/lib/map-config';
import { MapPin, Navigation } from 'lucide-react';

interface StaticMapFallbackProps {
  pickupCoordinates?: { lat: number; lng: number } | null;
  dropoffCoordinates?: { lat: number; lng: number } | null;
  width?: number;
  height?: number;
  zoom?: number;
  onRetry?: () => void;
  className?: string;
}

/**
 * A component that displays a static Google Maps image as a fallback
 * when the dynamic map fails to load or isn't available
 */
export function StaticMapFallback({
  pickupCoordinates,
  dropoffCoordinates,
  width = 600,
  height = 400,
  zoom = 14,
  onRetry,
  className = ''
}: StaticMapFallbackProps) {
  const apiKey = getGoogleMapsApiKey();
  
  // Base URL for the static map
  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
  
  // Create the markers parameter
  let markers = '';
  if (pickupCoordinates) {
    markers += `&markers=color:green|label:P|${pickupCoordinates.lat},${pickupCoordinates.lng}`;
  }
  if (dropoffCoordinates) {
    markers += `&markers=color:red|label:D|${dropoffCoordinates.lat},${dropoffCoordinates.lng}`;
  }
  
  // If we have no coordinates, use Dubai as the center
  const center = pickupCoordinates 
    ? `${pickupCoordinates.lat},${pickupCoordinates.lng}`
    : dropoffCoordinates 
      ? `${dropoffCoordinates.lat},${dropoffCoordinates.lng}`
      : '25.276987,55.296249'; // Dubai default
  
  // Construct the static map URL
  const mapUrl = `${baseUrl}?center=${center}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap${markers}&key=${apiKey}`;
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0 relative">
        <img 
          src={mapUrl}
          alt="Map"
          width={width}
          height={height}
          className="w-full h-auto"
          onError={(e) => {
            // If the image fails to load, show a placeholder
            e.currentTarget.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect fill='%23f0f0f0' width='600' height='400'/%3E%3Cpath fill='%23cccccc' d='M300 200 L320 230 L280 230 Z'/%3E%3Ctext fill='%23999999' font-family='Arial' font-size='14' x='300' y='250' text-anchor='middle'%3EMap Unavailable%3C/text%3E%3C/svg%3E";
          }}
        />
        
        {!pickupCoordinates && !dropoffCoordinates && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/30 backdrop-blur-sm">
            <div className="text-center p-4">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium mb-2">No locations selected</p>
              <p className="text-xs text-gray-600 mb-4">Select pickup and dropoff locations to see them on the map</p>
            </div>
          </div>
        )}
        
        {onRetry && (
          <div className="absolute bottom-2 right-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/80 backdrop-blur-sm shadow-sm"
              onClick={onRetry}
            >
              Try interactive map
            </Button>
          </div>
        )}
        
        {/* Show location markers */}
        <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm p-2 rounded text-xs shadow-sm">
          {pickupCoordinates && (
            <div className="flex items-center gap-1 text-green-700">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Pickup location</span>
            </div>
          )}
          {dropoffCoordinates && (
            <div className="flex items-center gap-1 text-red-700">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Dropoff location</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}