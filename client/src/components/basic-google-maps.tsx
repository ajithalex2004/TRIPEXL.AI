import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Search } from 'lucide-react';

// Import the Location interface from iframe-google-maps
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

interface BasicGoogleMapsProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  waypoints?: Location[];
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff' | 'waypoint') => void;
  editable?: boolean;
  height?: string;
}

const BasicGoogleMaps: React.FC<BasicGoogleMapsProps> = ({
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onLocationSelect,
  editable = true,
  height = '400px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [showSearchPanel, setShowSearchPanel] = useState<boolean>(false);
  
  // Load the Google Maps API
  useEffect(() => {
    // We'll use a direct API key for maximum reliability
    const GOOGLE_MAPS_API_KEY = "AIzaSyBOyL-FXqHOHmqxteTw02lh9TkzdXJ_oaI";
    
    let isMounted = true;
    
    const loadGoogleMaps = () => {
      // Check if the API is already loaded
      if (window.google && window.google.maps) {
        if (isMounted) {
          setIsLoading(false);
          initializeMap();
        }
        return;
      }
      
      // If not loaded, create a script tag
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Setup the callback
      window.initMap = () => {
        if (isMounted) {
          console.log("Google Maps API loaded via callback");
          setIsLoading(false);
          initializeMap();
        }
      };
      
      // Handle errors
      script.onerror = () => {
        if (isMounted) {
          console.error("Failed to load Google Maps API");
          setError("Failed to load Google Maps. Please check your internet connection.");
          setIsLoading(false);
        }
      };
      
      // Append to document
      document.head.appendChild(script);
    };
    
    // Start loading the API
    loadGoogleMaps();
    
    // Clean up
    return () => {
      isMounted = false;
      // Clean up the global callback when component unmounts
      if (window.initMap) {
        // @ts-ignore
        window.initMap = null;
      }
    };
  }, []);
  
  // Initialize the map
  const initializeMap = () => {
    if (!mapContainerRef.current || !window.google) return;
    
    try {
      // Create a new map centered on Dubai
      const mapOptions = {
        center: { lat: 25.276987, lng: 55.296249 },
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        fullscreenControl: false,
      };
      
      const map = new google.maps.Map(mapContainerRef.current, mapOptions);
      
      // Store the map instance on the ref for later use
      // @ts-ignore
      mapContainerRef.current.map = map;
      
      // Add markers for pickup and dropoff locations
      updateMapMarkers();
      
      // Create a Places Autocomplete for search
      if (editable) {
        setupPlacesAutocomplete(map);
      }
      
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Failed to initialize the map. Please refresh the page.");
    }
  };
  
  // Update markers when locations change
  useEffect(() => {
    updateMapMarkers();
  }, [pickupLocation, dropoffLocation, waypoints]);
  
  // Update markers on the map
  const updateMapMarkers = () => {
    if (!mapContainerRef.current) return;
    
    // @ts-ignore
    const map = mapContainerRef.current.map;
    if (!map) return;
    
    // Clear existing markers
    // @ts-ignore
    if (mapContainerRef.current.markers) {
      // @ts-ignore
      mapContainerRef.current.markers.forEach((marker: google.maps.Marker) => {
        marker.setMap(null);
      });
    }
    
    // @ts-ignore
    mapContainerRef.current.markers = [];
    
    // Add pickup marker
    if (pickupLocation) {
      const marker = new google.maps.Marker({
        position: pickupLocation.coordinates,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4CAF50',
          fillOpacity: 1,
          strokeColor: '#388E3C',
          strokeWeight: 2,
          scale: 8
        },
        title: 'Pickup Location'
      });
      
      // @ts-ignore
      mapContainerRef.current.markers.push(marker);
    }
    
    // Add dropoff marker
    if (dropoffLocation) {
      const marker = new google.maps.Marker({
        position: dropoffLocation.coordinates,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#F44336',
          fillOpacity: 1,
          strokeColor: '#D32F2F',
          strokeWeight: 2,
          scale: 8
        },
        title: 'Dropoff Location'
      });
      
      // @ts-ignore
      mapContainerRef.current.markers.push(marker);
    }
    
    // Add waypoint markers
    waypoints.forEach((waypoint, index) => {
      const marker = new google.maps.Marker({
        position: waypoint.coordinates,
        map,
        label: `${index + 1}`,
        title: `Waypoint ${index + 1}`
      });
      
      // @ts-ignore
      mapContainerRef.current.markers.push(marker);
    });
    
    // Draw the route if we have both pickup and dropoff
    if (pickupLocation && dropoffLocation) {
      drawRoute(map, pickupLocation, dropoffLocation, waypoints);
    }
    
    // If we have at least one location, center the map on it
    if (pickupLocation) {
      map.setCenter(pickupLocation.coordinates);
      map.setZoom(14);
    } else if (dropoffLocation) {
      map.setCenter(dropoffLocation.coordinates);
      map.setZoom(14);
    }
  };
  
  // Draw a route between pickup and dropoff
  const drawRoute = (
    map: google.maps.Map,
    pickup: Location,
    dropoff: Location,
    waypoints: Location[]
  ) => {
    // @ts-ignore
    if (mapContainerRef.current.directionsRenderer) {
      // @ts-ignore
      mapContainerRef.current.directionsRenderer.setMap(null);
    }
    
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true, // We'll use our own markers
      polylineOptions: {
        strokeColor: '#1a73e8', // Google Maps blue
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });
    
    directionsRenderer.setMap(map);
    
    // @ts-ignore
    mapContainerRef.current.directionsRenderer = directionsRenderer;
    
    // Convert waypoints to DirectionsWaypoint format
    const formattedWaypoints = waypoints.map(waypoint => ({
      location: new google.maps.LatLng(
        waypoint.coordinates.lat,
        waypoint.coordinates.lng
      ),
      stopover: true
    }));
    
    const request = {
      origin: new google.maps.LatLng(pickup.coordinates.lat, pickup.coordinates.lng),
      destination: new google.maps.LatLng(dropoff.coordinates.lat, dropoff.coordinates.lng),
      waypoints: formattedWaypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true // Optimize the order of waypoints
    };
    
    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
      } else {
        console.error('Directions request failed:', status);
      }
    });
  };
  
  // Set up Places Autocomplete for search functionality
  const setupPlacesAutocomplete = (map: google.maps.Map) => {
    if (!editable) return;
    
    // Create a search box for UAE locations
    const searchBox = document.createElement('input');
    searchBox.placeholder = 'Search for locations in UAE';
    searchBox.className = 'controls';
    searchBox.style.display = 'none'; // Initially hidden
    
    // Store the search box for later use
    // @ts-ignore
    mapContainerRef.current.searchBox = searchBox;
    
    const autocomplete = new google.maps.places.Autocomplete(searchBox, {
      componentRestrictions: { country: 'ae' },
      fields: ['place_id', 'geometry', 'name', 'formatted_address']
    });
    
    autocomplete.bindTo('bounds', map);
    
    // Listen for place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        console.error('No geometry found for place');
        return;
      }
      
      // Create a location object
      const location: Location = {
        address: place.formatted_address || place.name || '',
        coordinates: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        },
        place_id: place.place_id || '',
        name: place.name || '',
        formatted_address: place.formatted_address || ''
      };
      
      // Call the onLocationSelect callback with the location
      if (onLocationSelect) {
        onLocationSelect(location, searchMode);
      }
      
      // Clear the search box
      searchBox.value = '';
    });
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // Use the Places API to search
    // @ts-ignore
    if (mapContainerRef.current?.searchBox) {
      // @ts-ignore
      const searchBox = mapContainerRef.current.searchBox;
      searchBox.value = searchQuery;
      
      // Programmatically trigger a search
      const event = new Event('keydown');
      // @ts-ignore
      event.keyCode = 13; // Enter key
      searchBox.dispatchEvent(event);
    } else {
      // Fallback to geocoding API
      geocodeAddress(searchQuery);
    }
  };
  
  // Geocode an address using the Geocoding API
  const geocodeAddress = async (address: string) => {
    try {
      const apiKey = "AIzaSyBOyL-FXqHOHmqxteTw02lh9TkzdXJ_oaI";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=ae`
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
      
      <div 
        ref={mapContainerRef}
        className="relative w-full" 
        style={{ height }}
      />
      
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
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    // Default to pickup mode if no pickup location is set, otherwise set to dropoff mode
                    setSearchMode(!pickupLocation ? 'pickup' : 'dropoff');
                    setShowSearchPanel(true);
                  }}
                >
                  <Search className="w-4 h-4 mr-1" />
                  Search Location
                </Button>
              
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

export default BasicGoogleMaps;