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
    // Abu Dhabi Locations
    { name: "Al Wahda Mall", coordinates: { lat: 24.4800, lng: 54.3755 }, address: "Al Wahda Mall, Al Wahda, Abu Dhabi, UAE" },
    { name: "Abu Dhabi Mall", coordinates: { lat: 24.497345, lng: 54.380612 }, address: "Abu Dhabi Mall, Tourist Club Area, Abu Dhabi, UAE" },
    { name: "Yas Mall", coordinates: { lat: 24.4858, lng: 54.6079 }, address: "Yas Mall, Yas Island, Abu Dhabi, UAE" },
    { name: "Abu Dhabi Airport", coordinates: { lat: 24.443588, lng: 54.651487 }, address: "Abu Dhabi International Airport, Abu Dhabi, UAE" },
    { name: "Sheikh Zayed Grand Mosque", coordinates: { lat: 24.412315, lng: 54.475241 }, address: "Sheikh Zayed Grand Mosque, Abu Dhabi, UAE" },
    { name: "Ferrari World", coordinates: { lat: 24.483667, lng: 54.607161 }, address: "Ferrari World, Yas Island, Abu Dhabi, UAE" },
    { name: "Yas Marina Circuit", coordinates: { lat: 24.4699, lng: 54.6038 }, address: "Yas Marina Circuit, Yas Island, Abu Dhabi, UAE" },
    { name: "Emirates Palace", coordinates: { lat: 24.4615, lng: 54.3166 }, address: "Emirates Palace, Corniche Road, Abu Dhabi, UAE" },
    { name: "Marina Mall Abu Dhabi", coordinates: { lat: 24.4736, lng: 54.3221 }, address: "Marina Mall, Breakwater, Abu Dhabi, UAE" },
    { name: "Corniche Beach", coordinates: { lat: 24.4574, lng: 54.3274 }, address: "Corniche Beach, Abu Dhabi, UAE" },
    { name: "Louvre Abu Dhabi", coordinates: { lat: 24.5339, lng: 54.3982 }, address: "Louvre Abu Dhabi, Saadiyat Island, Abu Dhabi, UAE" },
    { name: "Yas Waterworld", coordinates: { lat: 24.4891, lng: 54.6050 }, address: "Yas Waterworld, Yas Island, Abu Dhabi, UAE" },
    { name: "Warner Bros. World", coordinates: { lat: 24.4814, lng: 54.6008 }, address: "Warner Bros. World, Yas Island, Abu Dhabi, UAE" },
    { name: "Al Reem Island", coordinates: { lat: 24.5020, lng: 54.3950 }, address: "Al Reem Island, Abu Dhabi, UAE" },
    
    // Dubai Locations
    { name: "Dubai Mall", coordinates: { lat: 25.197197, lng: 55.274376 }, address: "Dubai Mall, Downtown Dubai, UAE" },
    { name: "Burj Khalifa", coordinates: { lat: 25.197304, lng: 55.274136 }, address: "Burj Khalifa, Downtown Dubai, UAE" },
    { name: "Dubai Airport (DXB)", coordinates: { lat: 25.252777, lng: 55.364445 }, address: "Dubai International Airport, Dubai, UAE" },
    { name: "Palm Jumeirah", coordinates: { lat: 25.116911, lng: 55.138180 }, address: "Palm Jumeirah, Dubai, UAE" },
    { name: "Mall of the Emirates", coordinates: { lat: 25.117591, lng: 55.200055 }, address: "Mall of the Emirates, Al Barsha, Dubai, UAE" },
    { name: "Burj Al Arab", coordinates: { lat: 25.1412, lng: 55.1853 }, address: "Burj Al Arab, Jumeirah, Dubai, UAE" },
    { name: "Dubai Marina", coordinates: { lat: 25.0762, lng: 55.1388 }, address: "Dubai Marina, Dubai, UAE" },
    { name: "Global Village Dubai", coordinates: { lat: 25.0688, lng: 55.3054 }, address: "Global Village, Sheikh Mohammed Bin Zayed Road, Dubai, UAE" },
    { name: "Dubai Creek", coordinates: { lat: 25.2644, lng: 55.3305 }, address: "Dubai Creek, Deira, Dubai, UAE" },
    { name: "Dubai Frame", coordinates: { lat: 25.2374, lng: 55.3001 }, address: "Dubai Frame, Zabeel Park, Dubai, UAE" },
    { name: "Dubai Opera", coordinates: { lat: 25.1926, lng: 55.2736 }, address: "Dubai Opera, Downtown Dubai, UAE" },
    { name: "JBR Beach", coordinates: { lat: 25.0759, lng: 55.1333 }, address: "JBR Beach, Dubai Marina, Dubai, UAE" },
    { name: "Atlantis The Palm", coordinates: { lat: 25.1304, lng: 55.1171 }, address: "Atlantis The Palm, Palm Jumeirah, Dubai, UAE" },
    { name: "Dubai Miracle Garden", coordinates: { lat: 25.0617, lng: 55.2432 }, address: "Dubai Miracle Garden, Al Barsha, Dubai, UAE" },
    { name: "Dubai World Trade Centre", coordinates: { lat: 25.2252, lng: 55.2871 }, address: "Dubai World Trade Centre, Dubai, UAE" },
    { name: "Dubai Festival City", coordinates: { lat: 25.2260, lng: 55.3493 }, address: "Dubai Festival City, Dubai, UAE" },
    { name: "Al Seef", coordinates: { lat: 25.2631, lng: 55.2995 }, address: "Al Seef, Dubai Creek, Dubai, UAE" },
    { name: "Jumeirah Beach", coordinates: { lat: 25.2048, lng: 55.2608 }, address: "Jumeirah Beach, Dubai, UAE" },
    { name: "Dubai Autodrome", coordinates: { lat: 25.0490, lng: 55.2377 }, address: "Dubai Autodrome, Motor City, Dubai, UAE" },
    { name: "Ibn Battuta Mall", coordinates: { lat: 25.0461, lng: 55.1170 }, address: "Ibn Battuta Mall, Jebel Ali, Dubai, UAE" },
    { name: "Ski Dubai", coordinates: { lat: 25.1165, lng: 55.2002 }, address: "Ski Dubai, Mall of the Emirates, Dubai, UAE" },
    { name: "Dubai Hills Mall", coordinates: { lat: 25.1258, lng: 55.2548 }, address: "Dubai Hills Mall, Dubai Hills Estate, Dubai, UAE" },
    
    // Sharjah Locations
    { name: "Sharjah City Centre", coordinates: { lat: 25.328608, lng: 55.424537 }, address: "Sharjah City Centre, Sharjah, UAE" },
    { name: "Sharjah Aquarium", coordinates: { lat: 25.3580, lng: 55.3838 }, address: "Sharjah Aquarium, Al Khan, Sharjah, UAE" },
    { name: "Al Majaz Waterfront", coordinates: { lat: 25.3248, lng: 55.3827 }, address: "Al Majaz Waterfront, Sharjah, UAE" },
    { name: "Sharjah Museum of Islamic Civilization", coordinates: { lat: 25.3593, lng: 55.3856 }, address: "Sharjah Museum of Islamic Civilization, Sharjah, UAE" },
    
    // Al Ain
    { name: "Al Ain Zoo", coordinates: { lat: 24.1758, lng: 55.7361 }, address: "Al Ain Zoo, Al Ain, UAE" },
    { name: "Al Ain Mall", coordinates: { lat: 24.2075, lng: 55.7447 }, address: "Al Ain Mall, Al Ain, UAE" },
    { name: "Jebel Hafeet", coordinates: { lat: 24.0562, lng: 55.7705 }, address: "Jebel Hafeet Mountain, Al Ain, UAE" }
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
  
  // Initialize with all locations shown
  useEffect(() => {
    // Show all locations by default when component mounts
    setSearchResults(UAE_LOCATIONS);
  }, []);

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
    
    // Always show all POIs while typing, just sort them by relevance
    if (!value.trim()) {
      // When no search term, show all locations
      setSearchResults(UAE_LOCATIONS);
    } else {
      // When typing, sort locations by relevance
      const query = value.toLowerCase();
      
      // For Al Wahda Mall specifically - boost its priority when 'al wahd' is typed
      if (query.includes('al wahd')) {
        const alWahdaMall = UAE_LOCATIONS.find(loc => 
          loc.name.toLowerCase() === 'al wahda mall'
        );
        
        if (alWahdaMall) {
          // Show Al Wahda Mall first and then the rest
          const otherResults = UAE_LOCATIONS.filter(loc => 
            loc.name.toLowerCase() !== 'al wahda mall'
          ).sort((a, b) => a.name.localeCompare(b.name));
          
          setSearchResults([alWahdaMall, ...otherResults]);
          return;
        }
      }
      
      // Normal sorting by relevance for all other cases
      const results = [...UAE_LOCATIONS].sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(query);
        const bNameMatch = b.name.toLowerCase().includes(query);
        const aAddressMatch = a.address.toLowerCase().includes(query);
        const bAddressMatch = b.address.toLowerCase().includes(query);
        
        // Special case for Al Wahda Mall
        if (a.name === "Al Wahda Mall" && aNameMatch) return -1;
        if (b.name === "Al Wahda Mall" && bNameMatch) return 1;
        
        // First prioritize exact name matches
        if (a.name.toLowerCase() === query && b.name.toLowerCase() !== query) return -1;
        if (b.name.toLowerCase() === query && a.name.toLowerCase() !== query) return 1;
        
        // Then prioritize any name matches
        if (aNameMatch && !bNameMatch) return -1;
        if (bNameMatch && !aNameMatch) return 1;
        
        // Then prioritize address matches
        if (aAddressMatch && !bAddressMatch) return -1;
        if (bAddressMatch && !aAddressMatch) return 1;
        
        // Default sorting by name
        return a.name.localeCompare(b.name);
      });
      
      setSearchResults(results);
    }
    
    // Always show results when input is focused
    setShowResults(true);
    
    // Auto select Al Wahda Mall if typing matches exactly
    const alWahdaMall = UAE_LOCATIONS.find(loc => 
      loc.name.toLowerCase() === 'al wahda mall'
    );
    
    // If typing exactly matches "al wahda mall", auto-select it
    if (value.toLowerCase() === 'al wahda mall' && alWahdaMall) {
      handleSelectSearchResult(alWahdaMall);
    }
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
                onFocus={() => {
                  // Show all locations immediately when input is focused
                  setSearchResults(UAE_LOCATIONS);
                  setShowResults(true);
                }}
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
                  className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg z-30 max-h-80 overflow-y-auto"
                >
                  {searchResults.map((location, index) => (
                    <div 
                      key={`location-${index}`}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${location.name === 'Al Wahda Mall' && searchValue.toLowerCase().includes('al wahd') ? 'bg-blue-50' : ''}`}
                      onClick={() => handleSelectSearchResult(location)}
                    >
                      <MapPin className={`h-4 w-4 mr-2 flex-shrink-0 ${location.name === 'Al Wahda Mall' ? 'text-blue-600' : 'text-primary'}`} />
                      <div className="flex flex-col">
                        <span className={`font-medium ${location.name === 'Al Wahda Mall' && searchValue.toLowerCase().includes('al wahd') ? 'text-blue-700' : ''}`}>
                          {location.name}
                          {location.name === 'Al Wahda Mall' && searchValue.toLowerCase().includes('al wahd') && 
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                              Best Match
                            </span>
                          }
                        </span>
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