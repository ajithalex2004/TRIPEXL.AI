import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

// Make window.google and initMap available
declare global {
  interface Window {
    initMap: () => void;
  }
}

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

interface SimpleGoogleMapsProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  waypoints?: Location[];
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff' | 'waypoint') => void;
  editable?: boolean;
}

// Global map reference for init callback
let globalMapRef: React.RefObject<HTMLDivElement> | null = null;
let globalMapOptions: any = null;
let globalInitCallback: (() => void) | null = null;

// Helper function to load Google Maps script
const loadGoogleMapsScript = (mapRef: React.RefObject<HTMLDivElement>, options: any, callback: () => void) => {
  // Store references globally for the callback
  globalMapRef = mapRef;
  globalMapOptions = options;
  globalInitCallback = callback;
  
  // Check if the script is already loaded
  if (window.google && window.google.maps) {
    initializeMap();
    return;
  }

  // Get API key from environment
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  
  if (!apiKey) {
    console.error("Google Maps API Key not found in environment variables.");
    return;
  }

  console.log("Google Maps API Key available:", apiKey ? "Yes (key length: " + apiKey.length + ")" : "No");
  console.log("Using environment variable:", apiKey === import.meta.env.VITE_GOOGLE_MAPS_KEY ? "Yes" : "No");
  
  // Define the initialization function
  window.initMap = function() {
    console.log("Google Maps initialization callback triggered");
    initializeMap();
  };
  
  // Create script element
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
  script.async = true;
  
  script.onerror = () => {
    console.error("Failed to load Google Maps script.");
  };
  
  document.head.appendChild(script);
};

// Function to initialize the map (called by the callback)
function initializeMap() {
  if (!globalMapRef || !globalMapRef.current || !globalMapOptions) {
    console.error("Cannot initialize map: missing references");
    return;
  }
  
  console.log("Initializing Google Maps...");
  
  try {
    // Create the map
    const map = new window.google.maps.Map(globalMapRef.current, globalMapOptions);
    
    // Store the map instance on the element
    (globalMapRef.current as any)._map = map;
    
    // Call the original callback
    if (globalInitCallback) {
      globalInitCallback();
    }
  } catch (err) {
    console.error("Error initializing Google Maps:", err);
  }
}

const SimpleGoogleMaps: React.FC<SimpleGoogleMapsProps> = ({
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onLocationSelect,
  editable = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const dropoffMarkerRef = useRef<google.maps.Marker | null>(null);
  const waypointMarkersRef = useRef<google.maps.Marker[]>([]);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    setIsLoading(true);
    console.log("Setting up Google Maps component...");
    
    const onMapLoad = () => {
      if (!mapRef.current || !(mapRef.current as any)._map) {
        console.error("Map initialization failed");
        setError("Failed to initialize map. Please try refreshing the page.");
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("Map initialized, setting up components...");
        const map = (mapRef.current as any)._map;
        googleMapRef.current = map;
        
        // Create info window for markers
        infoWindowRef.current = new window.google.maps.InfoWindow();
        
        // Setup search box
        const input = document.createElement("input");
        input.placeholder = "Search for locations";
        input.classList.add("map-search-box");
        input.style.margin = "10px";
        input.style.width = "300px";
        input.style.padding = "8px 12px";
        input.style.borderRadius = "4px";
        input.style.border = "1px solid #ccc";
        input.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
        input.style.fontSize = "14px";
        
        map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(input);
        
        const searchBox = new window.google.maps.places.SearchBox(input);
        searchBoxRef.current = searchBox;
        
        // Add directions renderer
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true, // We'll create our own markers
          polylineOptions: {
            strokeColor: '#3B82F6', // Blue color
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });
        directionsRendererRef.current = directionsRenderer;
        
        // Bias the SearchBox results towards current map's viewport.
        map.addListener("bounds_changed", () => {
          searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
        });
        
        // Listen for the event fired when the user selects a prediction
        if (searchBoxRef.current) {
          searchBoxRef.current.addListener("places_changed", handlePlacesChanged);
        }
        
        // Add click listener to map
        if (editable) {
          map.addListener("click", handleMapClick);
        }
        
        setIsLoaded(true);
        setIsLoading(false);
        console.log("Google Maps setup complete!");
      } catch (err) {
        console.error("Error initializing Google Maps components:", err);
        setError("Failed to initialize map. Please try refreshing the page.");
        setIsLoading(false);
      }
    };
    
    // Configure map options
    const dubai = { lat: 25.276987, lng: 55.296249 };
    const mapOptions = {
      center: dubai,
      zoom: 11,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      mapId: 'DEMO_MAP_ID'
    };
    
    // Load Google Maps with callback
    loadGoogleMapsScript(mapRef, mapOptions, onMapLoad);
    
    return () => {
      // Clean up
      if (pickupMarkerRef.current) pickupMarkerRef.current.setMap(null);
      if (dropoffMarkerRef.current) dropoffMarkerRef.current.setMap(null);
      waypointMarkersRef.current.forEach(marker => marker.setMap(null));
      if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
      console.log("Google Maps component cleanup");
    };
  }, [editable]);
  
  // Update markers when locations change
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current) return;
    
    // Update pickup marker
    if (pickupLocation) {
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = new google.maps.Marker({
          position: pickupLocation.coordinates,
          map: googleMapRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#10B981', // Green
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
          },
          title: "Pickup: " + (pickupLocation.name || pickupLocation.address)
        });
      } else {
        pickupMarkerRef.current.setPosition(pickupLocation.coordinates);
        pickupMarkerRef.current.setTitle("Pickup: " + (pickupLocation.name || pickupLocation.address));
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
      pickupMarkerRef.current = null;
    }
    
    // Update dropoff marker
    if (dropoffLocation) {
      if (!dropoffMarkerRef.current) {
        dropoffMarkerRef.current = new google.maps.Marker({
          position: dropoffLocation.coordinates,
          map: googleMapRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#EF4444', // Red
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
          },
          title: "Dropoff: " + (dropoffLocation.name || dropoffLocation.address)
        });
      } else {
        dropoffMarkerRef.current.setPosition(dropoffLocation.coordinates);
        dropoffMarkerRef.current.setTitle("Dropoff: " + (dropoffLocation.name || dropoffLocation.address));
      }
    } else if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.setMap(null);
      dropoffMarkerRef.current = null;
    }
    
    // Update waypoint markers
    // First, clear existing waypoint markers
    waypointMarkersRef.current.forEach(marker => marker.setMap(null));
    waypointMarkersRef.current = [];
    
    // Add new waypoint markers
    if (waypoints && waypoints.length > 0) {
      waypoints.forEach((waypoint, index) => {
        const marker = new google.maps.Marker({
          position: waypoint.coordinates,
          map: googleMapRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#6366F1', // Indigo
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 7
          },
          title: `Waypoint ${index + 1}: ${waypoint.name || waypoint.address}`
        });
        waypointMarkersRef.current.push(marker);
      });
    }
    
    // Calculate and display route
    calculateAndDisplayRoute();
    
    // Fit bounds to include all markers
    fitBoundsToIncludeAllMarkers();
  }, [pickupLocation, dropoffLocation, waypoints, isLoaded]);
  
  // Handle places_changed event
  const handlePlacesChanged = () => {
    if (!searchBoxRef.current || !googleMapRef.current) return;
    
    const places = searchBoxRef.current.getPlaces();
    if (!places || places.length === 0) return;
    
    const place = places[0];
    if (!place.geometry || !place.geometry.location) {
      console.error("No geometry found for place:", place);
      return;
    }
    
    // Create a new InfoWindow for this place
    if (infoWindowRef.current && googleMapRef.current) {
      const location = {
        address: place.formatted_address || place.name || "Selected location",
        coordinates: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        },
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address
      };
      
      // Create info window content
      const content = document.createElement("div");
      content.className = "map-info-window";
      content.innerHTML = `
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${location.name || "Selected Location"}</h3>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #555;">${location.address}</p>
        <div style="display: flex; gap: 8px;">
          <button id="set-pickup" style="background-color: #10B981; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 14px;">Set as Pickup</button>
          <button id="set-dropoff" style="background-color: #EF4444; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 14px;">Set as Dropoff</button>
        </div>
        <style>
          button:hover {
            opacity: 0.9;
          }
        </style>
      `;
      
      infoWindowRef.current.setContent(content);
      infoWindowRef.current.setPosition(place.geometry.location);
      infoWindowRef.current.open(googleMapRef.current);
      
      // Add event listeners to buttons
      setTimeout(() => {
        const setPickupButton = document.getElementById("set-pickup");
        const setDropoffButton = document.getElementById("set-dropoff");
        
        if (setPickupButton && onLocationSelect) {
          setPickupButton.addEventListener("click", () => {
            onLocationSelect(location, "pickup");
            infoWindowRef.current?.close();
          });
        }
        
        if (setDropoffButton && onLocationSelect) {
          setDropoffButton.addEventListener("click", () => {
            onLocationSelect(location, "dropoff");
            infoWindowRef.current?.close();
          });
        }
      }, 0);
      
      // Pan to the selected place
      googleMapRef.current.panTo(place.geometry.location);
      googleMapRef.current.setZoom(15);
    }
  };
  
  // Handle map click
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!editable || !googleMapRef.current || !e.latLng || !infoWindowRef.current) return;
    
    // Get address for clicked location
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: e.latLng }, (results, status) => {
      if (status !== "OK" || !results || !results[0]) {
        console.error("Geocoder failed:", status);
        return;
      }
      
      const result = results[0];
      const location = {
        address: result.formatted_address,
        coordinates: {
          lat: e.latLng!.lat(),
          lng: e.latLng!.lng()
        },
        place_id: result.place_id,
        name: result.formatted_address.split(',')[0],
        formatted_address: result.formatted_address
      };
      
      // Create info window content
      const content = document.createElement("div");
      content.className = "map-info-window";
      content.innerHTML = `
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${location.name || "Selected Location"}</h3>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #555;">${location.address}</p>
        <div style="display: flex; gap: 8px;">
          <button id="set-pickup" style="background-color: #10B981; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 14px;">Set as Pickup</button>
          <button id="set-dropoff" style="background-color: #EF4444; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 14px;">Set as Dropoff</button>
        </div>
        <style>
          button:hover {
            opacity: 0.9;
          }
        </style>
      `;
      
      infoWindowRef.current?.setContent(content);
      infoWindowRef.current?.setPosition(e.latLng);
      infoWindowRef.current?.open(googleMapRef.current);
      
      // Add event listeners to buttons
      setTimeout(() => {
        const setPickupButton = document.getElementById("set-pickup");
        const setDropoffButton = document.getElementById("set-dropoff");
        
        if (setPickupButton && onLocationSelect) {
          setPickupButton.addEventListener("click", () => {
            onLocationSelect(location, "pickup");
            infoWindowRef.current?.close();
          });
        }
        
        if (setDropoffButton && onLocationSelect) {
          setDropoffButton.addEventListener("click", () => {
            onLocationSelect(location, "dropoff");
            infoWindowRef.current?.close();
          });
        }
      }, 0);
    });
  };
  
  // Calculate and display route
  const calculateAndDisplayRoute = () => {
    if (!isLoaded || !googleMapRef.current || !directionsRendererRef.current) return;
    if (!pickupLocation || !dropoffLocation) {
      directionsRendererRef.current.setDirections({ routes: [] } as any);
      return;
    }
    
    const directionsService = new google.maps.DirectionsService();
    
    const waypointList = waypoints.map(waypoint => ({
      location: new google.maps.LatLng(waypoint.coordinates.lat, waypoint.coordinates.lng),
      stopover: true
    }));
    
    directionsService.route(
      {
        origin: new google.maps.LatLng(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng),
        destination: new google.maps.LatLng(dropoffLocation.coordinates.lat, dropoffLocation.coordinates.lng),
        waypoints: waypointList,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true
      },
      (response, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current!.setDirections(response);
        } else {
          console.error("Directions request failed:", status);
        }
      }
    );
  };
  
  // Fit bounds to include all markers
  const fitBoundsToIncludeAllMarkers = () => {
    if (!isLoaded || !googleMapRef.current) return;
    
    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;
    
    if (pickupLocation) {
      bounds.extend(new google.maps.LatLng(
        pickupLocation.coordinates.lat,
        pickupLocation.coordinates.lng
      ));
      hasMarkers = true;
    }
    
    if (dropoffLocation) {
      bounds.extend(new google.maps.LatLng(
        dropoffLocation.coordinates.lat,
        dropoffLocation.coordinates.lng
      ));
      hasMarkers = true;
    }
    
    waypoints.forEach(waypoint => {
      bounds.extend(new google.maps.LatLng(
        waypoint.coordinates.lat,
        waypoint.coordinates.lng
      ));
      hasMarkers = true;
    });
    
    if (hasMarkers) {
      googleMapRef.current.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = googleMapRef.current.addListener("idle", () => {
        if (googleMapRef.current!.getZoom()! > 16) {
          googleMapRef.current!.setZoom(16);
        }
        google.maps.event.removeListener(listener);
      });
    }
  };
  
  return (
    <Card className="w-full h-full relative overflow-hidden">
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
      
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px]" 
        style={{ borderRadius: 'inherit' }}
      />
      
      <style>
        {`
          .map-info-window {
            padding: 12px;
            min-width: 200px;
          }
          
          /* Hide the default close button in Google Maps InfoWindow */
          .gm-style .gm-style-iw-c button.gm-ui-hover-effect {
            display: none !important;
          }
          
          /* Increase padding to compensate for hiding close button */
          .gm-style .gm-style-iw-c {
            padding-right: 12px !important;
          }
        `}
      </style>
    </Card>
  );
};

export default SimpleGoogleMaps;