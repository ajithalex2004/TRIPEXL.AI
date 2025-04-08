import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

// Use the Location interface from booking-form
export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

interface IframeGoogleMapsProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  waypoints?: Location[];
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff' | 'waypoint') => void;
  editable?: boolean;
  height?: string;
}

const IframeGoogleMaps: React.FC<IframeGoogleMapsProps> = ({
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onLocationSelect,
  editable = true,
  height = "400px"
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mapUrl, setMapUrl] = useState<string>("");
  
  // Prepare iframe URL with markers for pickup and dropoff
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    
    if (!apiKey) {
      setError("Google Maps API key is missing. Please check your environment variables.");
      setIsLoading(false);
      return;
    }
    
    // Default center on Dubai
    let center = "25.276987,55.296249";
    let zoom = 11;
    let markers = "";
    
    // Add markers for pickup and dropoff
    if (pickupLocation) {
      markers += `&markers=color:green|label:P|${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}`;
      // If only pickup is set, center on pickup
      if (!dropoffLocation) {
        center = `${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}`;
        zoom = 14;
      }
    }
    
    if (dropoffLocation) {
      markers += `&markers=color:red|label:D|${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`;
      // If only dropoff is set, center on dropoff
      if (!pickupLocation) {
        center = `${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`;
        zoom = 14;
      }
    }
    
    // If both pickup and dropoff are set, adjust center and zoom to fit both
    if (pickupLocation && dropoffLocation) {
      // Simple center calculation (can be enhanced with more complex bounds calculation)
      center = `${(pickupLocation.coordinates.lat + dropoffLocation.coordinates.lat) / 2},${(pickupLocation.coordinates.lng + dropoffLocation.coordinates.lng) / 2}`;
      
      // Add path between pickup and dropoff
      markers += `&path=color:0x0000ff|weight:5|${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}|${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`;
      
      // Adjust zoom based on distance (very basic)
      const distance = calculateDistance(
        pickupLocation.coordinates.lat, 
        pickupLocation.coordinates.lng,
        dropoffLocation.coordinates.lat,
        dropoffLocation.coordinates.lng
      );
      
      // Rough zoom estimation based on distance
      if (distance < 1) zoom = 15;
      else if (distance < 5) zoom = 13;
      else if (distance < 20) zoom = 11;
      else zoom = 9;
    }
    
    // Add waypoints
    waypoints.forEach((waypoint, index) => {
      markers += `&markers=color:blue|label:${index + 1}|${waypoint.coordinates.lat},${waypoint.coordinates.lng}`;
    });
    
    // Construct the Google Maps URL
    const url = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center}&zoom=${zoom}${markers}&maptype=roadmap`;
    setMapUrl(url);
    
    console.log("Map URL prepared with API key length: " + apiKey.length);
    
  }, [pickupLocation, dropoffLocation, waypoints]);
  
  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  
  // Calculate distance between two coordinates in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };
  
  // Open Google Maps for interactive selection if needed
  const handleOpenInteractiveMap = () => {
    let mapUrl = `https://maps.google.com/maps?q=UAE`;
    
    // If we have a pickup or dropoff, center the map there
    if (pickupLocation) {
      mapUrl = `https://maps.google.com/maps?q=${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}`;
    } else if (dropoffLocation) {
      mapUrl = `https://maps.google.com/maps?q=${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`;
    }
    
    window.open(mapUrl, '_blank');
  };
  
  return (
    <Card className="w-full relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
          <LoadingIndicator />
          <span className="ml-2 text-sm font-medium">Loading map...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-sm text-gray-600">Please ensure you have a valid Google Maps API key configured.</p>
        </div>
      )}
      
      {mapUrl && (
        <div className="relative w-full" style={{ height }}>
          <iframe 
            ref={iframeRef}
            className="absolute w-full h-full border-0"
            src={mapUrl}
            allowFullScreen
            loading="lazy"
            onLoad={handleIframeLoad}
          ></iframe>
        </div>
      )}
      
      {editable && (
        <div className="p-3 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {(pickupLocation || dropoffLocation) ? 
              <span>
                {pickupLocation && <span className="font-medium text-green-600">Pickup</span>}
                {pickupLocation && dropoffLocation && <span className="mx-2">→</span>}
                {dropoffLocation && <span className="font-medium text-red-600">Dropoff</span>}
              </span>
              : 
              <span>No locations selected</span>
            }
          </div>
          
          <button
            onClick={handleOpenInteractiveMap}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Open Interactive Map
          </button>
        </div>
      )}
    </Card>
  );
};

export default IframeGoogleMaps;