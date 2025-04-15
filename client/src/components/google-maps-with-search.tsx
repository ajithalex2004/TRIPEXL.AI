import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Search } from 'lucide-react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';

// Location interface
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

interface GoogleMapsWithSearchProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  waypoints?: Location[];
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff' | 'waypoint') => void;
  editable?: boolean;
  height?: string;
}

const GoogleMapsWithSearch: React.FC<GoogleMapsWithSearchProps> = ({
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onLocationSelect,
  editable = true,
  height = '400px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const currentMarker = useRef<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  // Load the Google Maps API using the optimized loader
  useEffect(() => {
    // Use the environment variable for the API key
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API key is missing from environment variables");
      setError("Maps configuration error. Please contact support.");
      setIsLoading(false);
      return;
    }
    
    console.log("Google Maps API Key available:", GOOGLE_MAPS_API_KEY ? "Yes (key length: " + GOOGLE_MAPS_API_KEY.length + ")" : "No");
    console.log("Using environment variable:", GOOGLE_MAPS_API_KEY ? "Yes" : "No");
    
    let isMounted = true;
    
    // Check if the API is already loaded
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded in component - initializing map directly");
      setIsLoading(false);
      initializeMap();
      return;
    }
    
    // Use the optimized loader
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (isMounted) {
          console.log("Google Maps API loaded successfully");
          setIsLoading(false);
          initializeMap();
        }
      })
      .catch(err => {
        console.error("Error loading Google Maps API:", err);
        if (isMounted) {
          setError("Failed to load maps. Please check your internet connection.");
          setIsLoading(false);
        }
      });
    
    // Clean up
    return () => {
      isMounted = false;
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
      
      // Add click listener to the map
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!editable) return;
        
        const clickedLocation = e.latLng;
        if (!clickedLocation) return;
        
        // Don't set selected location here, it will be set in createInfoWindow
        setShowInfoWindow(true);
        
        // Create an info window at the clicked location
        createInfoWindow(map, clickedLocation);
      });
      
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Failed to initialize the map. Please refresh the page.");
    }
  };
  
  // Creates an info window with "Set as Pickup" and "Set as Dropoff" buttons
  const createInfoWindow = (map: google.maps.Map, position: google.maps.LatLng) => {
    // Close existing info window if any
    if (infoWindow.current) {
      infoWindow.current.close();
    }
    
    // Remove existing marker if any
    if (currentMarker.current) {
      currentMarker.current.setMap(null);
    }
    
    // Create a new marker
    currentMarker.current = new google.maps.Marker({
      position: position,
      map,
      animation: google.maps.Animation.DROP,
      title: 'Selected location'
    });
    
    // Create a new InfoWindow
    infoWindow.current = new google.maps.InfoWindow({
      disableAutoPan: false
    });
    
    // Create the location object for the clicked position
    const locationObj: Location = {
      address: "",  // Will be filled by geocoder
      coordinates: {
        lat: position.lat(),
        lng: position.lng()
      }
    };
    
    // Create the content for the InfoWindow with the buttons
    const content = document.createElement('div');
    content.className = 'info-window-content';
    content.innerHTML = `
      <div style="padding: 8px; min-width: 200px;">
        <div style="font-weight: 500; margin-bottom: 8px; text-align: center;">Set Location</div>
        <div style="display: flex; gap: 8px; justify-content: space-between;">
          <button id="set-pickup" style="background-color: #4CAF50; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; flex: 1;">
            Set as Pickup
          </button>
          <button id="set-dropoff" style="background-color: #F44336; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; flex: 1;">
            Set as Dropoff
          </button>
        </div>
      </div>
    `;
    
    // Hide the close button
    const style = document.createElement('style');
    style.textContent = '.gm-ui-hover-effect { display: none !important; }';
    document.head.appendChild(style);
    
    // Set the content to the InfoWindow
    infoWindow.current.setContent(content);
    
    // Open the InfoWindow
    infoWindow.current.open(map, currentMarker.current);
    
    // Get address information using geocoder
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
        const place = results[0];
        
        // Update location object with address details
        locationObj.address = place.formatted_address || "";
        locationObj.place_id = place.place_id || "";
        locationObj.name = place.formatted_address || "";
        locationObj.formatted_address = place.formatted_address || "";
        
        // Update the selectedLocation state
        setSelectedLocation(locationObj);
      }
    });
    
    // Add event listeners to the buttons after the InfoWindow is opened
    google.maps.event.addListener(infoWindow.current, 'domready', () => {
      // Get the buttons
      const setPickupButton = document.getElementById('set-pickup');
      const setDropoffButton = document.getElementById('set-dropoff');
      
      // Add click listeners to the buttons
      if (setPickupButton) {
        setPickupButton.addEventListener('click', () => {
          handleSetLocation(position, 'pickup');
          if (infoWindow.current) infoWindow.current.close();
        });
      }
      
      if (setDropoffButton) {
        setDropoffButton.addEventListener('click', () => {
          handleSetLocation(position, 'dropoff');
          if (infoWindow.current) infoWindow.current.close();
        });
      }
    });
  };
  
  // Handle setting a location from the map click or info window
  const handleSetLocation = async (position: google.maps.LatLng, type: 'pickup' | 'dropoff') => {
    if (!onLocationSelect) return;
    
    try {
      // Reverse geocode the location to get the address
      const geocoder = new google.maps.Geocoder();
      const response = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ location: position }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            resolve(results);
          } else {
            reject(status);
          }
        });
      });
      
      if (response && response.length > 0) {
        const result = response[0];
        
        // Create a location object
        const location: Location = {
          address: result.formatted_address || 'Unknown location',
          coordinates: {
            lat: position.lat(),
            lng: position.lng()
          },
          place_id: result.place_id || '',
          name: result.formatted_address || 'Unknown location',
          formatted_address: result.formatted_address || 'Unknown location'
        };
        
        // Call the onLocationSelect callback with the location
        onLocationSelect(location, type);
        
        // Reset the info window
        setShowInfoWindow(false);
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error("Error geocoding clicked location:", error);
      setError("Could not determine address for this location");
      setTimeout(() => setError(null), 3000);
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
      
      // Center the map on the selected location
      map.setCenter(place.geometry.location);
      map.setZoom(15);
      
      // Show an info window at the location
      createInfoWindow(map, place.geometry.location);
      
      // Clear the search input
      setSearchQuery("");
    });
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // Use direct geocoding which is more reliable
    geocodeAddress(searchQuery);
  };
  
  // Set location directly by mode (for buttons in the UI)
  const handleSetLocationByMode = () => {
    if (!selectedLocation || !onLocationSelect) return;
    // Create a google.maps.LatLng object
    const latLng = new google.maps.LatLng(
      selectedLocation.coordinates.lat,
      selectedLocation.coordinates.lng
    );
    handleSetLocation(latLng, searchMode);
  };
  
  // Geocode an address using the Geocoding API
  const geocodeAddress = async (address: string, autoSelect: boolean = false) => {
    try {
      // Use the GOOGLE_MAPS_API_KEY already defined at the component level
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&region=ae`
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
        
        // @ts-ignore - Get the map instance
        const map = mapContainerRef.current?.map;
        if (map) {
          map.setCenter(location.coordinates);
          map.setZoom(15);
          
          // Create a latLng object for the info window
          const latLng = new google.maps.LatLng(
            location.coordinates.lat,
            location.coordinates.lng
          );
          
          if (autoSelect && onLocationSelect) {
            // Directly set the location without showing the info window
            onLocationSelect(location, searchMode);
            console.log(`Auto-selected ${searchMode} location:`, location);
          } else {
            // Show the info window for manual selection
            createInfoWindow(map, latLng);
          }
        }
        
        // Reset the search
        setSearchQuery("");
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
      
      {/* Permanent search box at the top of the map */}
      <div className="border-b p-3 bg-white">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location in UAE"
              className="w-full"
            />
          </div>
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Search className="w-4 h-4 mr-1" />
            Search
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={`${searchMode === 'pickup' ? 'bg-green-50 border-green-500 text-green-600' : 'border-gray-300'}`}
              onClick={() => setSearchMode('pickup')}
              title="Set as Pickup Location"
            >
              <MapPin className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={`${searchMode === 'dropoff' ? 'bg-red-50 border-red-500 text-red-600' : 'border-gray-300'}`}
              onClick={() => setSearchMode('dropoff')}
              title="Set as Dropoff Location"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
      
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
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
              onClick={() => {
                setSearchQuery('Dubai Mall');
                geocodeAddress('Dubai Mall');
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
                setSearchQuery('Dubai Mall');
                geocodeAddress('Dubai Mall', true);
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
                setSearchQuery('Abu Dhabi');
                geocodeAddress('Abu Dhabi', true);
              }}
            >
              <Navigation className="w-4 h-4 mr-1" />
              Set Dropoff Location
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default GoogleMapsWithSearch;