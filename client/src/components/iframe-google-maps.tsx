import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Navigation } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [showSearchPanel, setShowSearchPanel] = useState<boolean>(false);
  
  // Prepare iframe URL with markers for pickup and dropoff
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    console.log("Using Google Maps API key:", apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : "Not available");
    
    if (!apiKey) {
      setError("Google Maps API key is missing. Please check your environment variables.");
      setIsLoading(false);
      return;
    }
    
    // Default center on Dubai
    let center = "25.276987,55.296249";
    let zoom = 10;
    let markers = "";
    
    // For places search or directions API
    let mapMode = "view";
    let origin = "";
    let destination = "";
    let place = "";
    
    // Add markers for pickup and dropoff
    if (pickupLocation) {
      if (mapMode === "view") {
        markers += `&markers=color:green|label:P|${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}`;
      }
      origin = `${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}`;
      
      // If only pickup is set, center on pickup
      if (!dropoffLocation) {
        center = `${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}`;
        zoom = 14;
      }
    }
    
    if (dropoffLocation) {
      if (mapMode === "view") {
        markers += `&markers=color:red|label:D|${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`;
      }
      destination = `${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`;
      
      // If only dropoff is set, center on dropoff
      if (!pickupLocation) {
        center = `${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`;
        zoom = 14;
      }
    }
    
    // If both pickup and dropoff are set, use directions mode
    if (pickupLocation && dropoffLocation) {
      mapMode = "directions";
      
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
    } else if (searchQuery && showSearchPanel) {
      // If in search mode, use places API
      mapMode = "place";
      place = searchQuery;
    }
    
    // Add waypoints if in view mode
    if (mapMode === "view") {
      waypoints.forEach((waypoint, index) => {
        markers += `&markers=color:blue|label:${index + 1}|${waypoint.coordinates.lat},${waypoint.coordinates.lng}`;
      });
    }
    
    // Construct the Google Maps URL based on mode
    let url = "";
    
    if (mapMode === "directions" && origin && destination) {
      // Use directions mode when we have both pickup and dropoff
      url = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}&mode=driving`;
      
      // Add waypoints to directions if we have any
      if (waypoints.length > 0) {
        const waypointsStr = waypoints
          .map(wp => `${wp.coordinates.lat},${wp.coordinates.lng}`)
          .join('|');
        url += `&waypoints=${waypointsStr}`;
      }
    } else if (mapMode === "place" && place) {
      // Use place search mode
      url = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(place)}&region=ae`;
    } else {
      // Default view mode
      url = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center}&zoom=${zoom}${markers}&maptype=roadmap`;
    }
    
    setMapUrl(url);
    console.log("Map URL prepared successfully");
    
  }, [pickupLocation, dropoffLocation, waypoints, searchQuery, showSearchPanel]);
  
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
  
  // Create a geocode request to convert address to coordinates
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      // Perform geocoding using the Geocode API
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}&region=ae`
      );
      
      const data = await response.json();
      
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        const location: Location = {
          address: result.formatted_address,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          place_id: result.place_id,
          name: result.formatted_address,
          formatted_address: result.formatted_address
        };
        
        // Call the onLocationSelect callback with the location
        if (onLocationSelect) {
          onLocationSelect(location, searchMode);
        }
        
        // Reset the search
        setSearchQuery("");
        setShowSearchPanel(false);
      } else {
        console.error("Geocoding failed:", data.status);
        setError(`Location search failed: ${data.status}`);
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error("Error during geocoding:", error);
      setError("Error searching for location");
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
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
      
      {showSearchPanel && (
        <div className="absolute top-2 left-2 right-2 z-20 bg-white rounded-md shadow-lg p-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a location in UAE"
                className="w-full"
              />
            </div>
            <Button type="submit" size="sm">
              <Search className="w-4 h-4 mr-1" />
              Search
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setShowSearchPanel(false)}
            >
              Cancel
            </Button>
          </form>
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
        <div className="p-3 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-500">
              {(pickupLocation || dropoffLocation) ? 
                <span>
                  {pickupLocation && (
                    <span className="font-medium text-green-600 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" /> Pickup: {pickupLocation.address.substring(0, 30)}
                      {pickupLocation.address.length > 30 ? "..." : ""}
                    </span>
                  )}
                  {pickupLocation && dropoffLocation && <span className="mx-2 text-gray-400">→</span>}
                  {dropoffLocation && (
                    <span className="font-medium text-red-600 flex items-center">
                      <Navigation className="w-3 h-3 mr-1" /> Dropoff: {dropoffLocation.address.substring(0, 30)}
                      {dropoffLocation.address.length > 30 ? "..." : ""}
                    </span>
                  )}
                </span>
                : 
                <span>No locations selected</span>
              }
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {!showSearchPanel && (
              <>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    setSearchMode('pickup');
                    setShowSearchPanel(true);
                  }}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Set Pickup Location
                </Button>
                
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setSearchMode('dropoff');
                    setShowSearchPanel(true);
                  }}
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Set Dropoff Location
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default IframeGoogleMaps;