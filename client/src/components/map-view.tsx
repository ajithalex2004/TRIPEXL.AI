import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  useJsApiLoader,
  GoogleMap, 
  Marker, 
  InfoWindow, 
  Polyline
} from "@react-google-maps/api";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Search, Locate, AlertCircle, CircleCheck, Info as InfoIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { calculateRoute, convertToGoogleMapsRoute, RouteWaypoint } from "@/lib/geoapify-route-service";
import MapFallback from "@/components/map-fallback";

const defaultCenter = {
  lat: 24.466667,  // Abu Dhabi coordinates as default
  lng: 54.366667
};

const defaultZoom = 11;

// UAE bounds for restricting autocomplete results
const UAE_BOUNDS = {
  north: 26.5,   // Northern boundary of UAE
  south: 22.0,   // Southern boundary of UAE
  west: 51.0,    // Western boundary of UAE
  east: 56.5     // Eastern boundary of UAE
};

// Hardcoding the API key as a reliable fix
const MAPS_API_KEY = "AIzaSyBOyL-FXqHOHmqxteTw02lh9TkzdXJ_oaI";
console.log("Google Maps API Key available:", MAPS_API_KEY ? "Yes (key length: " + MAPS_API_KEY.length + ")" : "No");

// Define libraries as a static constant outside the component to avoid reloading issues
// Use 'as any' to ensure TypeScript is happy
const GOOGLE_MAPS_LIBRARIES = ["places", "geometry"] as any;

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

export interface RouteInfo {
  distance: string;
  duration: string;
}

export interface RoutePreferences {
  avoidHighways: boolean;
  avoidTolls: boolean;
  optimizeWaypoints: boolean;
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  provideRouteAlternatives: boolean;
}

interface PopupLocation {
  lat: number;
  lng: number;
  address?: string;
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

export interface MapViewProps {
  pickupLocation?: Location;
  dropoffLocation?: Location;
  waypoints?: Location[];
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff' | 'waypoint') => void;
  onClearWaypoints?: () => void;
  onWaypointRemove?: (index: number) => void;
  onRouteCalculated?: (durationSeconds: number, distanceMeters: number, directionsResult: any) => void;
  routePreferences?: Partial<RoutePreferences>;
  editable?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onLocationSelect,
  onClearWaypoints,
  onWaypointRemove,
  onRouteCalculated,
  routePreferences: routePrefs = {},
  editable = true
}) => {
  // Default route preferences
  const routePreferences: RoutePreferences = {
    avoidHighways: routePrefs.avoidHighways || false,
    avoidTolls: routePrefs.avoidTolls || false,
    optimizeWaypoints: routePrefs.optimizeWaypoints || false,
    travelMode: routePrefs.travelMode || 'DRIVING',
    provideRouteAlternatives: routePrefs.provideRouteAlternatives || false
  };

  // Load the Google Maps API using useJsApiLoader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  // Internal state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapsInitialized, setMapsInitialized] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Set map error from loadError if exists
  const [mapError, setMapError] = useState<string | null>(
    loadError ? `Error loading map: ${loadError.message}` : null
  );
  
  // Effect to update mapsInitialized state based on isLoaded
  useEffect(() => {
    if (isLoaded && !loadError) {
      console.log("Google Maps API loaded successfully");
      if (typeof google === 'undefined' || !google.maps) {
        console.error("Google Maps API did not load correctly despite success callback");
        setMapError("Google Maps API did not initialize properly. Using fallback mapping solution.");
      } else {
        // Initialize autocomplete service as soon as Google Maps API is loaded
        try {
          console.log("Initializing autocomplete service");
          const autocompleteService = new google.maps.places.AutocompleteService();
          setAutocompleteService(autocompleteService);
          console.log("Autocomplete service initialized successfully");
          
          // We'll initialize places service when the map is loaded in handleMapLoad
          // as it requires a map instance
          
          // Set mapsInitialized to true to enable the search functionality
          setMapsInitialized(true);
        } catch (error) {
          console.error("Error initializing Google Maps services:", error);
          setMapError("Failed to initialize map services. Please refresh the page.");
        }
      }
    } else if (loadError) {
      console.error("Google Maps script failed to load:", loadError);
      setMapError("Failed to load Google Maps. Using fallback mapping solution.");
    }
  }, [isLoaded, loadError]);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [popupLocation, setPopupLocation] = useState<PopupLocation | null>(null);
  const [routePolyline, setRoutePolyline] = useState<google.maps.Polyline | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  
  // Map references
  const mapRef = useRef<GoogleMap>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // The drawRoute function calculates and displays the route between the pickup and dropoff locations
  const drawRoute = async () => {
    // Reset state
    setIsLoading(true);
    setMapError(null);
    
    if (routePolyline) {
      routePolyline.setMap(null);
      setRoutePolyline(null);
    }

    try {
      // Validate pickup coordinates
      if (!pickupLocation?.coordinates || 
          typeof pickupLocation.coordinates.lat !== 'number' || 
          typeof pickupLocation.coordinates.lng !== 'number' ||
          isNaN(pickupLocation.coordinates.lat) || 
          isNaN(pickupLocation.coordinates.lng)) {
        throw new Error("Invalid pickup location coordinates");
      }

      // Validate dropoff coordinates
      if (!dropoffLocation?.coordinates || 
          typeof dropoffLocation.coordinates.lat !== 'number' || 
          typeof dropoffLocation.coordinates.lng !== 'number' ||
          isNaN(dropoffLocation.coordinates.lat) || 
          isNaN(dropoffLocation.coordinates.lng)) {
        throw new Error("Invalid dropoff location coordinates");
      }
      
      // Try using Google Maps DirectionsService first (preferred method)
      if (typeof google !== 'undefined' && google.maps && google.maps.DirectionsService) {
        try {
          console.log("Using Google Maps Directions API for route optimization");
          
          const directionsService = new google.maps.DirectionsService();
          
          // Format waypoints for Google Maps
          const googleWaypoints = waypoints.map(wp => ({
            location: typeof google !== 'undefined' && google.maps && google.maps.LatLng ? 
              new google.maps.LatLng(wp.coordinates.lat, wp.coordinates.lng) : 
              { lat: wp.coordinates.lat, lng: wp.coordinates.lng },
            stopover: true
          }));
          
          console.log("Using Google Maps with the following parameters:");
          console.log("- Origin:", pickupLocation.coordinates);
          console.log("- Destination:", dropoffLocation.coordinates);
          console.log("- Waypoints:", googleWaypoints);
          
          // Prepare the request
          const request: google.maps.DirectionsRequest = {
            origin: new google.maps.LatLng(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng),
            destination: new google.maps.LatLng(dropoffLocation.coordinates.lat, dropoffLocation.coordinates.lng),
            waypoints: googleWaypoints,
            optimizeWaypoints: routePreferences.optimizeWaypoints,
            avoidHighways: routePreferences.avoidHighways,
            avoidTolls: routePreferences.avoidTolls,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: routePreferences.provideRouteAlternatives
          };
          
          // Request directions
          const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            directionsService.route(request, (directionsResult, status) => {
              if (status === google.maps.DirectionsStatus.OK && directionsResult) {
                resolve(directionsResult);
              } else {
                reject(new Error(`Google Maps direction request failed: ${status}`));
              }
            });
          });
          
          console.log("Google Maps Directions API returned:", result);
          
          if (result.routes && result.routes.length > 0) {
            const route = result.routes[0];
            
            // Extract total distance and duration from all legs
            let totalDistance = 0;
            let totalDuration = 0;
            
            route.legs.forEach(leg => {
              totalDistance += leg.distance?.value || 0;
              totalDuration += leg.duration?.value || 0;
            });
            
            // Format distance and duration
            const distanceInKm = totalDistance / 1000;
            const distanceText = distanceInKm < 1 ? 
              `${Math.round(totalDistance)} m` : 
              `${distanceInKm.toFixed(1)} km`;
            
            const durationInMinutes = Math.ceil(totalDuration / 60);
            const durationText = durationInMinutes < 60 ? 
              `${durationInMinutes} mins` : 
              `${Math.floor(durationInMinutes / 60)} hr ${durationInMinutes % 60} mins`;
            
            // Update route info
            setRouteInfo({
              distance: distanceText,
              duration: durationText
            });
            
            // Extract the path coordinates from the overview_path
            if (map && route.overview_path) {
              const path = route.overview_path.map(point => ({
                lat: point.lat(),
                lng: point.lng()
              }));
              
              // Create a polyline for the route with dark blue color for better visibility
              const newRoutePolyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: "#0033CC", // Dark blue color
                strokeOpacity: 1.0,
                strokeWeight: 6, // Thick line for visibility
                // Add some styling to make the route more visible
                zIndex: 10 // Ensure the route displays above other map elements
              });
              
              // Add the polyline to the map
              newRoutePolyline.setMap(map);
              setRoutePolyline(newRoutePolyline);
              
              // Notify parent component about the calculated route details
              if (onRouteCalculated) {
                onRouteCalculated(
                  totalDuration,
                  totalDistance,
                  result
                );
              }
              
              // Fit map bounds to show the entire route
              const bounds = new google.maps.LatLngBounds();
              path.forEach(point => bounds.extend(point));
              map.fitBounds(bounds);
              
              // Return early since we successfully calculated and displayed the route
              setIsLoading(false);
              return;
            }
          }
        } catch (googleError: any) {
          console.error("Google Maps Directions API error:", googleError);
          console.log("Falling back to Geoapify for routing");
          
          // Continue to fallback method
        }
      }
      
      // Fallback to Geoapify if Google Maps DirectionsService fails or is not available
      console.log("Using Geoapify routing API as fallback");
        
      try {
        // Convert our waypoints to Geoapify format
        const geoapifyWaypoints = waypoints.map((waypoint) => ({
          location: {
            lat: waypoint.coordinates.lat,
            lng: waypoint.coordinates.lng
          },
          name: waypoint.name || waypoint.formatted_address || waypoint.address
        }));
        
        console.log("Using Geoapify with the following parameters:");
        console.log("- Origin:", pickupLocation.coordinates);
        console.log("- Destination:", dropoffLocation.coordinates);
        console.log("- Waypoints:", geoapifyWaypoints);
        
        // Call Geoapify route planning API
        const geoapifyResult = await calculateRoute(
          pickupLocation.coordinates,
          dropoffLocation.coordinates,
          geoapifyWaypoints,
          {
            mode: 'drive',
            traffic: true,
            avoid: routePreferences.avoidTolls ? ['toll'] : [],
            details: ['instruction', 'time', 'distance'],
            optimize: routePreferences.optimizeWaypoints ? 'time' : undefined
          }
        );
        
        console.log("Geoapify route planning API returned:", geoapifyResult);
        
        // Extract route details
        const totalDistance = geoapifyResult.properties.distance; // meters
        const totalTime = geoapifyResult.properties.time; // seconds
        
        // Format distance and duration
        const distanceInKm = totalDistance / 1000;
        const distanceText = distanceInKm < 1 ? 
          `${Math.round(totalDistance)} m` : 
          `${distanceInKm.toFixed(1)} km`;
        
        const durationInMinutes = Math.ceil(totalTime / 60);
        const durationText = durationInMinutes < 60 ? 
          `${durationInMinutes} mins` : 
          `${Math.floor(durationInMinutes / 60)} hr ${durationInMinutes % 60} mins`;
        
        // Update route info
        setRouteInfo({
          distance: distanceText,
          duration: durationText
        });
        
        // Draw the route on the map
        if (map && geoapifyResult.features && geoapifyResult.features.length > 0) {
          const path = geoapifyResult.features[0].geometry.coordinates.map((coord: any) => ({
            lat: coord[1],
            lng: coord[0]
          }));
          
          // Create a polyline for the route with dark blue color for better visibility
          const newRoutePolyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: "#0033CC", // Dark blue color
            strokeOpacity: 1.0,
            strokeWeight: 6, // Thick line for visibility
            // Add some styling to make the route more visible
            zIndex: 10 // Ensure the route displays above other map elements
          });
          
          // Add the polyline to the map
          newRoutePolyline.setMap(map);
          setRoutePolyline(newRoutePolyline);
          
          // Notify parent component about the calculated route details
          if (onRouteCalculated) {
            onRouteCalculated(
              totalTime,
              totalDistance,
              {
                routes: [{ 
                  legs: geoapifyResult.features[0].properties.legs.map((leg: any) => ({
                    distance: { value: leg.distance, text: `${(leg.distance/1000).toFixed(1)} km` },
                    duration: { value: leg.time, text: `${Math.ceil(leg.time/60)} mins` }
                  }))
                }],
                legs: geoapifyResult.features[0].properties.legs.map((leg: any) => ({
                  distance: { value: leg.distance, text: `${(leg.distance/1000).toFixed(1)} km` },
                  duration: { value: leg.time, text: `${Math.ceil(leg.time/60)} mins` }
                })),
                waypoint_order: []
              }
            );
          }
          
          // Fit map bounds to show the entire route
          const bounds = new google.maps.LatLngBounds();
          path.forEach((point: google.maps.LatLngLiteral) => bounds.extend(point));
          map.fitBounds(bounds);
        }
      } catch (geoapifyError: any) {
        console.error("Geoapify route planning error:", geoapifyError);
        
        // Fall back to straight-line calculation if Geoapify also fails
        console.warn("Geoapify failed. Using straight line distance calculation as final fallback");
        
        // Calculate straight-line distance as a fallback
        const R = 6371; // Earth's radius in km
        const dLat = (dropoffLocation.coordinates.lat - pickupLocation.coordinates.lat) * Math.PI / 180;
        const dLon = (dropoffLocation.coordinates.lng - pickupLocation.coordinates.lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(pickupLocation.coordinates.lat * Math.PI / 180) * Math.cos(dropoffLocation.coordinates.lat * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        
        // Estimate duration (assuming average speed of 40 km/h in urban areas)
        const durationInMinutes = Math.ceil((distance / 40) * 60);
        const durationInSeconds = durationInMinutes * 60;
        
        // Format distance and duration
        const distanceText = distance < 1 ? 
          `${Math.round(distance * 1000)} m` : 
          `${distance.toFixed(1)} km`;
        
        const durationText = durationInMinutes < 60 ? 
          `${durationInMinutes} mins` : 
          `${Math.floor(durationInMinutes / 60)} hr ${durationInMinutes % 60} mins`;
        
        // Update route info with our calculation
        setRouteInfo({
          distance: distanceText,
          duration: durationText
        });
        
        if (map) {
          // Draw a simple straight line between points
          const straightLineOptions = {
            path: [
              pickupLocation.coordinates,
              ...waypoints.map(wp => wp.coordinates),
              dropoffLocation.coordinates
            ],
            geodesic: true,
            strokeColor: "#0033CC", // Dark blue color
            strokeOpacity: 0.8,
            strokeWeight: 6, // Thick line for visibility
            zIndex: 10 // Ensure the route displays above other map elements
          };
          
          // Create and add a polyline to show a direct path
          const newPolyline = new google.maps.Polyline(straightLineOptions);
          newPolyline.setMap(map);
          setRoutePolyline(newPolyline);
          
          // Notify parent component about the calculated route details (fallback case)
          if (onRouteCalculated) {
            // Distance in meters (convert from km)
            const distanceInMeters = distance * 1000;
            
            // Provide minimal route details in the fallback case
            onRouteCalculated(
              durationInSeconds,
              distanceInMeters,
              {
                routes: [{ legs: [{ distance: { value: distanceInMeters }, duration: { value: durationInSeconds } }] }],
                legs: [{ distance: { value: distanceInMeters }, duration: { value: durationInSeconds } }],
                waypoint_order: []
              }
            );
          }
          
          // Fit the map bounds to show both markers
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(pickupLocation.coordinates);
          if (waypoints.length > 0) {
            waypoints.forEach(wp => bounds.extend(wp.coordinates));
          }
          bounds.extend(dropoffLocation.coordinates);
          map.fitBounds(bounds);
        }
        
        // Show an informational message about the straight-line calculation
        setMapError("FALLBACK: Using straight-line distance estimate. Routing service failed.");
      }
    } catch (error: any) {
      console.error("Error in drawRoute:", error);
      
      // Set a user-friendly error message
      setMapError(error?.message || "Could not calculate route between locations");
      
      // Clear route info
      setRouteInfo(null);
      
      // Ensure markers are still visible even when route fails
      if (map && pickupLocation && dropoffLocation) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(pickupLocation.coordinates);
        if (waypoints.length > 0) {
          waypoints.forEach(wp => bounds.extend(wp.coordinates));
        }
        bounds.extend(dropoffLocation.coordinates);
        map.fitBounds(bounds);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to draw route when locations or route preferences change
  useEffect(() => {
    // Only attempt to draw the route if we have both locations and the map is initialized
    if (map && pickupLocation?.coordinates && dropoffLocation?.coordinates && mapsInitialized && typeof google !== 'undefined') {
      drawRoute();
    } else if (map && mapsInitialized && typeof google !== 'undefined') {
      // If we don't have both locations but map is ready, just show the map centered at default center
      map.setCenter(defaultCenter);
      map.setZoom(defaultZoom);
      
      // Clear any existing route
      if (routePolyline) {
        routePolyline.setMap(null);
        setRoutePolyline(null);
      }
      setRouteInfo(null);
      
      // If we have at least one location, show it on the map
      const bounds = new google.maps.LatLngBounds();
      let hasAtLeastOneLocation = false;
      
      if (pickupLocation?.coordinates) {
        bounds.extend(pickupLocation.coordinates);
        hasAtLeastOneLocation = true;
      }
      
      if (waypoints.length > 0) {
        waypoints.forEach(wp => {
          bounds.extend(wp.coordinates);
          hasAtLeastOneLocation = true;
        });
      }
      
      if (dropoffLocation?.coordinates) {
        bounds.extend(dropoffLocation.coordinates);
        hasAtLeastOneLocation = true;
      }
      
      if (hasAtLeastOneLocation) {
        map.fitBounds(bounds);
      }
    }
  }, [
    pickupLocation, 
    dropoffLocation, 
    waypoints, 
    map, 
    mapsInitialized, 
    routePreferences.avoidHighways,
    routePreferences.avoidTolls,
    routePreferences.optimizeWaypoints,
    routePreferences.travelMode,
    routePreferences.provideRouteAlternatives
  ]);

  // Handle click on the map
  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !mapsInitialized || typeof google === 'undefined' || !editable) return;

    try {
      setIsLoading(true);
      setMapError(null);
      
      if (typeof google === 'undefined') {
        throw new Error("Google Maps API is not initialized in handleMapClick");
      }
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat: e.latLng.lat(), lng: e.latLng.lng() } });

      if (result.results[0]) {
        const place = result.results[0];
        console.log("Map click geocode result:", place);
        setPopupLocation({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          address: place.formatted_address || "Selected location",
          place_id: place.place_id || "",
          name: (place as any).name || place.formatted_address || "Selected location",
          formatted_address: place.formatted_address || "Selected location"
        });
      } else {
        console.warn("No geocode results found for clicked location");
        // Still show popup even without detailed address
        setPopupLocation({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          address: "Selected location",
          place_id: "",
          name: "Selected location",
          formatted_address: `Lat: ${e.latLng.lat().toFixed(6)}, Lng: ${e.latLng.lng().toFixed(6)}`
        });
      }
    } catch (error: any) {
      console.error("Error geocoding location:", error);
      setMapError(error?.message || "Failed to get location details");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selection of a location type (pickup/dropoff/waypoint)
  const handleLocationTypeSelect = (type: 'pickup' | 'dropoff' | 'waypoint') => {
    if (!popupLocation) {
      console.error("Cannot set location: missing popupLocation");
      setMapError("Location details not available. Please try clicking on the map again.");
      return;
    }
    
    if (!map) {
      console.error("Cannot set location: missing map instance");
      setMapError("Map is not fully loaded. Please refresh the page and try again.");
      return;
    }

    try {
      // Validate coordinates first
      if (
        typeof popupLocation.lat !== 'number' || 
        typeof popupLocation.lng !== 'number' ||
        isNaN(popupLocation.lat) || 
        isNaN(popupLocation.lng)
      ) {
        throw new Error("Invalid coordinates in selected location");
      }
      
      // Create a complete location object with all required fields
      const location: Location = {
        address: popupLocation.address || "Selected location",
        coordinates: {
          lat: popupLocation.lat,
          lng: popupLocation.lng
        },
        // Include all optional properties with default values
        name: popupLocation.name || popupLocation.address || "Selected location",
        formatted_address: popupLocation.formatted_address || popupLocation.address || "Selected location",
        place_id: popupLocation.place_id || ""
      };

      console.log(`Setting ${type} location with data:`, location);
      
      // Check if the callback exists and call it with the location data
      if (onLocationSelect) {
        console.log(`Calling onLocationSelect callback with ${type} location data`);
        
        // Call the parent component's callback with the new location and type
        onLocationSelect(location, type);
        
        // Clear the popup and search field after selecting a location
        setPopupLocation(null);
        setSearchQuery('');
        setPredictions([]);
      } else {
        setMapError("Cannot set location: onLocationSelect callback not provided");
      }
    } catch (error: any) {
      console.error(`Error setting ${type} location:`, error);
      setMapError(error?.message || `Failed to set ${type} location`);
    }
  };

  // Handle map load completion
  const handleMapLoad = (map: google.maps.Map) => {
    console.log("Google Maps map loaded successfully");
    setMap(map);
    
    try {
      // Initialize Places service which requires a map instance
      if (typeof google !== "undefined" && google.maps) {
        console.log("Initializing places service");
        const placesService = new google.maps.places.PlacesService(map);
        setPlacesService(placesService);
        console.log("Places service initialized successfully");
      } else {
        setMapError("Google Maps API did not load properly. Please refresh the page and try again.");
      }
    } catch (error) {
      console.error("Error initializing Places service:", error);
      setMapError("Failed to initialize map services. Please refresh the page.");
    }
  };

  // Handle search predictions
  const handlePredictions = async () => {
    if (!autocompleteService || !mapsInitialized) return;
    
    setPredictions([]);
    setIsSearching(true);
    
    // Get predictions from the Google Places Autocomplete service
    autocompleteService.getPlacePredictions({
      input: searchQuery,
      bounds: UAE_BOUNDS,
      componentRestrictions: { country: "ae" }
    }, (results: any, status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // Format the predictions to include a relevant description
        const formattedPredictions = results.map((prediction: google.maps.places.AutocompletePrediction) => {
          // Extract the most user-friendly description
          const mainText = prediction.structured_formatting?.main_text || prediction.description;
          const secondaryText = prediction.structured_formatting?.secondary_text || "";
          
          // Create a custom description to show in the dropdown
          const description = mainText + (secondaryText ? `, ${secondaryText}` : "");
          
          return {
            ...prediction,
            description
          };
        });
        
        setPredictions(formattedPredictions);
      } else {
        setPredictions([]);
      }
      
      setIsSearching(false);
    });
  };

  // Search for places as the user types
  const debouncedSearch = useCallback(
    async (query: string) => {
      if (!query || query.length < 3) {
        setPredictions([]);
        return;
      }
      
      if (searchQuery !== query) {
        setSearchQuery(query);
      }
      
      if (autocompleteService && mapsInitialized) {
        // Debounce the search to avoid too many API calls
        const timeoutId = setTimeout(() => {
          if (searchQuery && searchQuery.length >= 3) {
            handlePredictions();
          } else {
            setPredictions([]);
          }
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
    },
    [searchQuery, autocompleteService, mapsInitialized]
  );

  // Handle selection of a search result
  const handlePlaceSelect = (placeId: string) => {
    if (!placesService || !map || !mapsInitialized) {
      return;
    }
    
    setIsLoading(true);
    setMapError(null);
    
    // Get detailed information about the selected place
    placesService.getDetails(
      {
        placeId: placeId,
        fields: ["name", "formatted_address", "place_id", "geometry"]
      },
      (result: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result) {
          // Validate that we have geometry information
          if (!result.geometry || !result.geometry.location) {
            console.error("Selected place has no geometry:", result);
            setMapError("Selected place has no valid location coordinates.");
            setIsLoading(false);
            return;
          }
          
          // Extract the coordinates
          const lat = result.geometry.location.lat();
          const lng = result.geometry.location.lng();
          
          // Create a popup for the selected place
          setPopupLocation({
            lat,
            lng,
            address: result.formatted_address || "Selected location",
            place_id: result.place_id || "",
            name: result.name || result.formatted_address || "Selected location",
            formatted_address: result.formatted_address || "Selected location"
          });
          
          // Pan to the selected location
          map.panTo({ lat, lng });
          map.setZoom(15);
          
          // Clear the search field and results
          setSearchQuery('');
          setPredictions([]);
        } else {
          console.error("Error getting place details:", status);
          setMapError("Could not retrieve details for the selected place. Please try another location.");
        }
        
        setIsLoading(false);
      }
    );
  };

  // Search box component
  const searchBox = (
    <div className="relative w-full">
      <div className="flex items-center space-x-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for a location in UAE..."
          className="flex-1 pr-8"
          value={searchQuery}
          onChange={e => debouncedSearch(e.target.value)}
          disabled={!mapsInitialized || isLoading || !editable}
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-5 w-5"
            onClick={() => {
              setSearchQuery('');
              setPredictions([]);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {predictions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {predictions.map((prediction) => (
              <li
                key={prediction.place_id}
                className="px-4 py-2 text-sm hover:bg-slate-100 cursor-pointer"
                onClick={() => handlePlaceSelect(prediction.place_id)}
              >
                {prediction.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // InfoWindow content for selected locations
  const infoWindowContent = (
    <div className="p-2 min-w-[200px]">
      <h3 className="font-medium mb-2">{popupLocation?.name || popupLocation?.formatted_address || "Selected Location"}</h3>
      <p className="text-sm mb-3">{popupLocation?.formatted_address || `${popupLocation?.lat.toFixed(6)}, ${popupLocation?.lng.toFixed(6)}`}</p>
      
      <div className="flex flex-col gap-2">
        <Button 
          size="sm" 
          variant="default" 
          onClick={() => handleLocationTypeSelect('pickup')}
          className="justify-start"
        >
          <MapPin className="mr-2 h-4 w-4" /> Set as Pickup Location
        </Button>
        
        <Button 
          size="sm" 
          variant="default" 
          onClick={() => handleLocationTypeSelect('dropoff')}
          className="justify-start"
        >
          <MapPin className="mr-2 h-4 w-4" /> Set as Dropoff Location
        </Button>
        
        <Button 
          size="sm" 
          variant="default" 
          onClick={() => handleLocationTypeSelect('waypoint')}
          className="justify-start"
        >
          <MapPin className="mr-2 h-4 w-4" /> Add as Waypoint
        </Button>
      </div>
      
      <style>
        {`
          /* Hide the default Google Maps InfoWindow close button */
          .gm-ui-hover-effect {
            display: none !important;
          }
          
          /* Additional styling for InfoWindow */
          .gm-style-iw {
            padding: 12px !important;
          }
          
          /* Remove shadow from InfoWindow */
          .gm-style-iw-d {
            overflow: hidden !important;
          }
        `}
      </style>
    </div>
  );

  // Render waypoint markers
  const renderWaypoints = () => {
    if (!mapsInitialized || typeof google === 'undefined') {
      return null;
    }
    
    return waypoints.map((waypoint, index) => (
      <Marker
        key={`waypoint-${index}`}
        position={waypoint.coordinates}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          scale: 8,
          strokeColor: "#1d4ed8",
          strokeWeight: 2,
        }}
        label={{
          text: (index + 1).toString(),
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "bold"
        }}
        onClick={() => {
          // When the waypoint marker is clicked, show info
          setPopupLocation({
            lat: waypoint.coordinates.lat,
            lng: waypoint.coordinates.lng,
            address: waypoint.address,
            place_id: waypoint.place_id || "",
            name: waypoint.name || waypoint.formatted_address || waypoint.address,
            formatted_address: waypoint.formatted_address || waypoint.address
          });
        }}
      />
    ));
  };

  // Route info component
  const routeInfoComponent = routeInfo && (
    <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200">
      <div className="flex items-center">
        <MapPin className="mr-2 h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">Distance: {routeInfo.distance}</span>
      </div>
      <div className="flex items-center mt-1">
        <Clock className="mr-2 h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">Time: {routeInfo.duration}</span>
      </div>
    </div>
  );

  // Waypoints control component
  const waypointsControl = (
    <div className="mt-2">
      {waypoints.length > 0 && onClearWaypoints && (
        <>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearWaypoints}
            className="text-xs"
          >
            <X className="mr-1 h-3 w-3" /> Clear All Waypoints
          </Button>
          <div className="text-xs text-slate-500 mt-1">
            {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''} set
          </div>
        </>
      )}
      
      {/* For testing purposes - toggle fallback map */}
      {import.meta.env.DEV && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto mt-2 text-xs"
          onClick={() => {
            // Toggle between normal and fallback mode
            if (!mapError) {
              setMapError("This is a test of the fallback map. Google Maps is currently not available.");
            } else {
              setMapError(null);
            }
          }}
        >
          {!mapError ? "Test Fallback" : "Try Google Maps"}
        </Button>
      )}
    </div>
  );

  // Error message component
  const errorMessage = mapError && !mapError.startsWith("FALLBACK:") && (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {mapError}
      </AlertDescription>
    </Alert>
  );

  // Informational message component for fallback routes
  const infoMessage = mapError && mapError.startsWith("FALLBACK:") && (
    <Alert className="mt-4 bg-amber-50 text-amber-800 border-amber-200">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>
        {mapError.replace("FALLBACK:", "")}
      </AlertDescription>
    </Alert>
  );

  return (
    <Card ref={mapContainerRef} className="overflow-hidden">
      <div className="p-4 border-b">
        {searchBox}
      </div>
      
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
            <VehicleLoadingIndicator />
          </div>
        )}
        
        {mapError ? (
          <MapFallback 
            message={mapError} 
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            waypoints={waypoints}
            onSelectPickup={() => {
              // Open a location modal or form to set pickup
              console.log("Set pickup requested in fallback mode");
            }}
            onSelectDropoff={() => {
              // Open a location modal or form to set dropoff
              console.log("Set dropoff requested in fallback mode");
            }}
          />
        ) : !isLoaded ? (
          <div className="p-10 text-center">Loading Google Maps...</div>
        ) : (
          <GoogleMap
            id="trip-map"
            mapContainerStyle={{
              width: "100%",
              height: "500px"
            }}
            zoom={defaultZoom}
            center={defaultCenter}
            options={{
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              gestureHandling: "cooperative",
              clickableIcons: false,
              mapTypeId: typeof google !== 'undefined' && google.maps && google.maps.MapTypeId ? google.maps.MapTypeId.ROADMAP : 'roadmap',
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            }}
            onClick={handleMapClick}
            onLoad={handleMapLoad}
          >
            {/* Pickup location marker */}
            {pickupLocation && (
              <Marker
                position={pickupLocation.coordinates}
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  scaledSize: typeof google !== 'undefined' ? new google.maps.Size(32, 32) : undefined,
                  labelOrigin: typeof google !== 'undefined' ? new google.maps.Point(16, -10) : undefined
                }}
                label={{
                  text: "Pickup",
                  color: "#1e3a8a",
                  fontWeight: "bold",
                  fontSize: "12px"
                }}
                onClick={() => {
                  setPopupLocation({
                    lat: pickupLocation.coordinates.lat,
                    lng: pickupLocation.coordinates.lng,
                    address: pickupLocation.address,
                    place_id: pickupLocation.place_id || "",
                    name: pickupLocation.name || pickupLocation.formatted_address || pickupLocation.address,
                    formatted_address: pickupLocation.formatted_address || pickupLocation.address
                  });
                }}
              />
            )}

            {/* Waypoint markers */}
            {renderWaypoints()}

            {/* Dropoff location marker */}
            {dropoffLocation && (
              <Marker
                position={dropoffLocation.coordinates}
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  scaledSize: typeof google !== 'undefined' ? new google.maps.Size(32, 32) : undefined,
                  labelOrigin: typeof google !== 'undefined' ? new google.maps.Point(16, -10) : undefined
                }}
                label={{
                  text: "Dropoff",
                  color: "#7f1d1d",
                  fontWeight: "bold",
                  fontSize: "12px"
                }}
                onClick={() => {
                  setPopupLocation({
                    lat: dropoffLocation.coordinates.lat,
                    lng: dropoffLocation.coordinates.lng,
                    address: dropoffLocation.address,
                    place_id: dropoffLocation.place_id || "",
                    name: dropoffLocation.name || dropoffLocation.formatted_address || dropoffLocation.address,
                    formatted_address: dropoffLocation.formatted_address || dropoffLocation.address
                  });
                }}
              />
            )}

            {/* InfoWindow for the selected location */}
            {popupLocation && (
              <InfoWindow
                position={{ lat: popupLocation.lat, lng: popupLocation.lng }}
                onCloseClick={() => setPopupLocation(null)}
                options={{
                  pixelOffset: typeof google !== 'undefined' ? new google.maps.Size(0, -30) : undefined
                }}
              >
                <div>
                  {infoWindowContent}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>
      
      <div className="p-4">
        {routeInfoComponent}
        {waypointsControl}
        {errorMessage}
        {infoMessage}
        
        {editable && (
          <div className="mt-4 text-xs text-slate-500">
            <p>Click on the map to select locations or use the search box above.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MapView;