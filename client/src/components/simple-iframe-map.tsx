import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getGoogleMapsApiKey } from '@/lib/map-config';
import { Loader2, MapPin, Navigation, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Location } from './map-view';

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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  
  // UAE common locations for quick selection
  const UAE_LOCATIONS = [
    { name: "Dubai Mall", coordinates: { lat: 25.197197, lng: 55.274376 }, address: "Dubai Mall, Downtown Dubai, UAE" },
    { name: "Burj Khalifa", coordinates: { lat: 25.197304, lng: 55.274136 }, address: "Burj Khalifa, Downtown Dubai, UAE" },
    { name: "Abu Dhabi Mall", coordinates: { lat: 24.497345, lng: 54.380612 }, address: "Abu Dhabi Mall, Tourist Club Area, Abu Dhabi, UAE" },
    { name: "Dubai Airport (DXB)", coordinates: { lat: 25.252777, lng: 55.364445 }, address: "Dubai International Airport, Dubai, UAE" },
    { name: "Abu Dhabi Airport", coordinates: { lat: 24.443588, lng: 54.651487 }, address: "Abu Dhabi International Airport, Abu Dhabi, UAE" },
    { name: "Palm Jumeirah", coordinates: { lat: 25.116911, lng: 55.138180 }, address: "Palm Jumeirah, Dubai, UAE" },
    { name: "Sheikh Zayed Grand Mosque", coordinates: { lat: 24.412315, lng: 54.475241 }, address: "Sheikh Zayed Grand Mosque, Abu Dhabi, UAE" },
    { name: "Ferrari World", coordinates: { lat: 24.483667, lng: 54.607161 }, address: "Ferrari World, Yas Island, Abu Dhabi, UAE" },
    { name: "Mall of the Emirates", coordinates: { lat: 25.117591, lng: 55.200055 }, address: "Mall of the Emirates, Al Barsha, Dubai, UAE" },
    { name: "Sharjah City Centre", coordinates: { lat: 25.328608, lng: 55.424537 }, address: "Sharjah City Centre, Sharjah, UAE" },
  ];
  
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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    // Filter locations based on search value
    const query = value.toLowerCase();
    const results = UAE_LOCATIONS.filter(location => 
      location.name.toLowerCase().includes(query) || 
      location.address.toLowerCase().includes(query)
    );
    
    setSearchResults(results);
    setShowResults(true);
  };

  // Handle selection of a location from results
  const handleSelectSearchResult = (location: any) => {
    const selectedLocation: Location = {
      address: location.address,
      coordinates: {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng
      },
      name: location.name
    };
    
    setSelectedLocation(selectedLocation);
    setSearchValue(location.name);
    setShowResults(false);
  };

  const handleClearLocation = () => {
    setSearchValue("");
    setSelectedLocation(null);
    setShowResults(false);
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
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Location search (only shown if editable) */}
      {editable && (
        <div className="absolute top-2 left-2 right-2 z-20 bg-white/90 p-3 rounded-lg shadow-md">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                placeholder="Search for a location in UAE..."
                onChange={handleSearchChange}
                className="pr-10"
              />
              {searchValue ? (
                <X
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 cursor-pointer hover:text-foreground"
                  onClick={handleClearLocation}
                  aria-label="Clear location"
                />
              ) : (
                <Search 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" 
                />
              )}
              
              {/* Search results */}
              {showResults && searchResults.length > 0 && (
                <div 
                  ref={searchResultsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg z-30 max-h-48 overflow-y-auto"
                >
                  {searchResults.map((location, index) => (
                    <div 
                      key={`location-${index}`}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => handleSelectSearchResult(location)}
                    >
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-medium">{location.name}</span>
                        <span className="text-xs text-gray-500">{location.address}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
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