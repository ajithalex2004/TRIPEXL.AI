import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  LoadScriptNext, 
  GoogleMap, 
  Marker, 
  InfoWindow, 
  DirectionsRenderer, 
  Libraries,
  DirectionsService,
  Polyline
} from "@react-google-maps/api";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Search, Locate, AlertCircle, CircleCheck, Info as InfoIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { calculateRoute, convertToGoogleMapsRoute, RouteWaypoint } from "@/lib/geoapify-route-service";

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

// Define libraries as a static constant outside the component to avoid reloading issues
// Using a constant array to avoid performance warnings from Google Maps API
const GOOGLE_MAPS_LIBRARIES: Libraries = ["places", "geometry"];

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";
console.log("Google Maps API Key available:", MAPS_API_KEY ? "Yes (key length: " + MAPS_API_KEY.length + ")" : "No");

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

export interface MapViewProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  waypoints?: Location[];
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff' | 'waypoint') => void;
  onRouteCalculated?: (duration: number, distance: number, routeDetails: any) => void;
  routePreferences?: {
    avoidHighways?: boolean;
    avoidTolls?: boolean;
    optimizeWaypoints?: boolean;
    provideRouteAlternatives?: boolean;
    travelMode?: 'DRIVING' | 'BICYCLING' | 'TRANSIT' | 'WALKING';
  };
}

interface PopupLocation {
  lat: number;
  lng: number;
  address: string;
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

export function MapView({
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onLocationSelect,
  onRouteCalculated,
  routePreferences = {
    avoidHighways: false,
    avoidTolls: false,
    optimizeWaypoints: true,
    provideRouteAlternatives: true,
    travelMode: 'DRIVING'
  }
}: MapViewProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapsInitialized, setMapsInitialized] = useState(false);
  const [popupLocation, setPopupLocation] = useState<PopupLocation | null>(null);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  // Autocomplete related states
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [predictions, setPredictions] = useState<Array<{value: string, label: string, description?: string, place_id: string}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // We don't need to memoize libraries since we're using the static constant GOOGLE_MAPS_LIBRARIES

  const drawRoute = async () => {
    // Clear any previous errors first
    setMapError(null);
    
    // Additional logging to debug route drawing issues
    console.log("DrawRoute called - Map initialized:", !!map);
    console.log("Pickup location:", pickupLocation);
    console.log("Dropoff location:", dropoffLocation);
    console.log("Maps API initialized:", mapsInitialized && typeof google !== 'undefined');
    
    // Comprehensive pre-check before attempting to draw route
    if (!map) {
      console.error("Map instance is not available");
      setMapError("Map is not fully loaded yet");
      return;
    }
    
    if (!mapsInitialized || typeof google === 'undefined') {
      console.error("Google Maps API is not initialized yet");
      setMapError("Map service is initializing, please try again");
      return;
    }

    if (!pickupLocation) {
      console.error("Pickup location is missing");
      setMapError("Please select a pickup location");
      return;
    }

    if (!dropoffLocation) {
      console.error("Dropoff location is missing");
      setMapError("Please select a drop-off location");
      return;
    }

    // Start loading state
    setIsLoading(true);

    try {
      // Validate pickup coordinates
      if (!pickupLocation?.coordinates || 
          typeof pickupLocation?.coordinates?.lat !== 'number' || 
          typeof pickupLocation?.coordinates?.lng !== 'number' ||
          isNaN(pickupLocation?.coordinates?.lat) || 
          isNaN(pickupLocation?.coordinates?.lng)) {
        throw new Error("Invalid pickup location coordinates");
      }
      
      // Validate dropoff coordinates
      if (!dropoffLocation?.coordinates || 
          typeof dropoffLocation?.coordinates?.lat !== 'number' || 
          typeof dropoffLocation?.coordinates?.lng !== 'number' ||
          isNaN(dropoffLocation?.coordinates?.lat) || 
          isNaN(dropoffLocation?.coordinates?.lng)) {
        throw new Error("Invalid drop-off location coordinates");
      }

      console.log("Drawing route between:", {
        pickup: `${pickupLocation.coordinates.lat.toFixed(6)}, ${pickupLocation.coordinates.lng.toFixed(6)}`,
        dropoff: `${dropoffLocation.coordinates.lat.toFixed(6)}, ${dropoffLocation.coordinates.lng.toFixed(6)}`
      });

      // Check if coordinates are too close (same location)
      const distanceInDegrees = Math.sqrt(
        Math.pow(pickupLocation.coordinates.lat - dropoffLocation.coordinates.lat, 2) + 
        Math.pow(pickupLocation.coordinates.lng - dropoffLocation.coordinates.lng, 2)
      );
      
      if (distanceInDegrees < 0.0005) { // Approximately 50 meters at the equator
        throw new Error("Pickup and drop-off locations are too close to each other");
      }

      // Create LatLng objects for origin and destination
      const origin = new google.maps.LatLng(
        pickupLocation.coordinates.lat,
        pickupLocation.coordinates.lng
      );
      
      const destination = new google.maps.LatLng(
        dropoffLocation.coordinates.lat, 
        dropoffLocation.coordinates.lng
      );

      // Convert waypoints to DirectionsWaypoints if provided
      const waypointsArray = waypoints.map(waypoint => ({
        location: new google.maps.LatLng(
          waypoint.coordinates.lat,
          waypoint.coordinates.lng
        ),
        stopover: true
      }));
      
      // Map travelMode from string to Google Maps TravelMode enum
      let travelMode: google.maps.TravelMode;
      switch (routePreferences.travelMode) {
        case 'BICYCLING':
          travelMode = google.maps.TravelMode.BICYCLING;
          break;
        case 'TRANSIT':
          travelMode = google.maps.TravelMode.TRANSIT;
          break;
        case 'WALKING':
          travelMode = google.maps.TravelMode.WALKING;
          break;
        case 'DRIVING':
        default:
          travelMode = google.maps.TravelMode.DRIVING;
          break;
      }
      
      // Create the directions request with all route preferences
      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        travelMode,
        optimizeWaypoints: routePreferences.optimizeWaypoints,
        avoidHighways: routePreferences.avoidHighways,
        avoidTolls: routePreferences.avoidTolls,
        provideRouteAlternatives: routePreferences.provideRouteAlternatives,
        drivingOptions: {
          departureTime: new Date(), // Current time
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        },
        unitSystem: google.maps.UnitSystem.METRIC,
      };
      
      // Only add waypoints if there are any to avoid issues with the API
      if (waypointsArray.length > 0) {
        request.waypoints = waypointsArray;
      }
      
      console.log("Sending directions request:", request);
      
      // Create DirectionsService instance
      const directionsService = new google.maps.DirectionsService();
      
      // Make the route request
      try {
        console.log("Sending directions request with travelMode:", google.maps.TravelMode.DRIVING);
        const result = await directionsService.route(request);
        
        console.log("DirectionsService returned result:", result);
        
        if (!result) {
          throw new Error("Directions service returned null result");
        }
        
        if (!result.routes || result.routes.length === 0) {
          throw new Error("No routes found in directions result");
        }
        
        if (!result.routes[0].legs || result.routes[0].legs.length === 0) {
          throw new Error("No route legs found in directions result");
        }
        
        console.log("Route found successfully. Route count:", result.routes.length);
        
        // Set the directions result
        setDirectionsResult(result);
        
        // Extract route details
        const leg = result.routes[0].legs[0];
        
        if (!leg.distance || !leg.duration) {
          throw new Error("Route is missing distance or duration information");
        }
        
        const durationInSeconds = leg.duration.value || 0;
        
        console.log("Route details:", {
          distance: leg.distance.text,
          duration: leg.duration.text,
          durationInSeconds
        });
        
        // Update route info state
        setRouteInfo({
          distance: leg.distance.text || "Unknown",
          duration: leg.duration.text || "Unknown"
        });
        
        // Notify parent component about the calculated route details
        if (onRouteCalculated) {
          // Extract distance in meters
          const distanceInMeters = leg.distance.value || 0;
          
          // Pass duration, distance, and additional route details to the callback
          onRouteCalculated(
            durationInSeconds, 
            distanceInMeters, 
            {
              routes: result.routes,
              legs: result.routes[0].legs,
              waypoint_order: result.routes[0].waypoint_order
            }
          );
        }
        
        // Fit the map bounds to show the entire route
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        
        // Also extend bounds with route waypoints if they exist
        if (result.routes[0].overview_path) {
          for (const point of result.routes[0].overview_path) {
            bounds.extend(point);
          }
        }
        
        map.fitBounds(bounds);
        
      } catch (routeError: any) {
        console.error("Google Maps DirectionsService error:", routeError);
        
        // Use a more specific error message if available
        const errorMessage = routeError?.message || "Could not calculate route between these locations";
        
        // Handle REQUEST_DENIED error from directions service
        if (errorMessage.includes("REQUEST_DENIED") || routeError?.code === "REQUEST_DENIED") {
          console.warn("Direction service access denied. Trying Geoapify route planning API as fallback");
          
          try {
            // Use Geoapify routing API as fallback
            // Convert our waypoints to Geoapify format
            const geoapifyWaypoints = waypoints.map(waypoint => ({
              location: {
                lat: waypoint.coordinates.lat,
                lng: waypoint.coordinates.lng
              },
              name: waypoint.name || waypoint.formatted_address || waypoint.address
            }));
            
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
            
            // Convert to Google Maps-compatible format for our existing code
            const googleMapsCompatibleRoute = convertToGoogleMapsRoute(geoapifyResult);
            setDirectionsResult(googleMapsCompatibleRoute as any);
            
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
            const path = geoapifyResult.features[0].geometry.coordinates.map(coord => ({
              lat: coord[1],
              lng: coord[0]
            }));
            
            // Create a polyline for the route
            const routePolyline = new google.maps.Polyline({
              path,
              geodesic: true,
              strokeColor: "#0033CC",
              strokeOpacity: 1.0,
              strokeWeight: 6
            });
            
            // Add the polyline to the map
            routePolyline.setMap(map);
            
            // Notify parent component about the calculated route details
            if (onRouteCalculated) {
              onRouteCalculated(
                totalTime,
                totalDistance,
                {
                  routes: [{ 
                    legs: geoapifyResult.features[0].properties.legs.map(leg => ({
                      distance: { value: leg.distance, text: `${(leg.distance/1000).toFixed(1)} km` },
                      duration: { value: leg.time, text: `${Math.ceil(leg.time/60)} mins` }
                    }))
                  }],
                  legs: geoapifyResult.features[0].properties.legs.map(leg => ({
                    distance: { value: leg.distance, text: `${(leg.distance/1000).toFixed(1)} km` },
                    duration: { value: leg.time, text: `${Math.ceil(leg.time/60)} mins` }
                  })),
                  waypoint_order: []
                }
              );
            }
            
            // Fit map bounds to show the entire route
            const bounds = new google.maps.LatLngBounds();
            path.forEach(point => bounds.extend(point));
            map.fitBounds(bounds);
            
            // Set a message to indicate we're using Geoapify
            setMapError("FALLBACK:Using Geoapify route planning for directions.");
            
            // Don't throw an error - we've handled it with our fallback
            return;
          } catch (geoapifyError: any) {
            console.error("Geoapify route planning error:", geoapifyError);
            
            // Fall back to straight-line calculation if Geoapify also fails
            console.warn("Geoapify also failed. Using straight line distance calculation as final fallback");
            
            // Check if pickup and dropoff locations are properly defined before calculation
            if (!pickupLocation?.coordinates || !dropoffLocation?.coordinates) {
              throw new Error("Pickup or dropoff location coordinates are missing");
            }
            
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
            
            // Draw a simple straight line between points
            const straightLineOptions = {
              path: [
                pickupLocation.coordinates,
                dropoffLocation.coordinates
              ],
              geodesic: true,
              strokeColor: "#0033CC",
              strokeOpacity: 0.8,
              strokeWeight: 6
            };
            
            // Create and add a polyline to show a direct path
            const polyline = new google.maps.Polyline(straightLineOptions);
            polyline.setMap(map);
            
            // Store the polyline in the DirectionsRenderer's state to clear it if needed
            const simpleDirectionsResult = {
              routes: [{
                overview_path: [
                  new google.maps.LatLng(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng),
                  new google.maps.LatLng(dropoffLocation.coordinates.lat, dropoffLocation.coordinates.lng)
                ],
                legs: [{
                  distance: { text: distanceText, value: distance * 1000 },
                  duration: { text: durationText, value: durationInSeconds }
                }]
              }]
            } as google.maps.DirectionsResult;
            
            setDirectionsResult(simpleDirectionsResult);
            
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
            bounds.extend(dropoffLocation.coordinates);
            map.fitBounds(bounds);
            
            // Show an informational message about the straight-line calculation
            setMapError("FALLBACK:Using straight-line distance estimate. All routing services failed.");
          }
          
          // Don't throw an error - we've handled it with our fallback
          return;
        }
        
        // Handle other specific errors
        if (errorMessage.includes("ZERO_RESULTS")) {
          throw new Error("No driving route found between these locations");
        } else if (errorMessage.includes("NOT_FOUND")) {
          throw new Error("One or both locations could not be geocoded properly");
        } else if (errorMessage.includes("MAX_ROUTE_LENGTH_EXCEEDED")) {
          throw new Error("The route is too long to calculate");
        } else if (errorMessage.includes("OVER_QUERY_LIMIT")) {
          throw new Error("Direction request quota exceeded. Please try again later");
        } else {
          throw new Error(errorMessage);
        }
      }
      
    } catch (error: any) {
      console.error("Error in drawRoute:", error);
      
      // Set a user-friendly error message
      setMapError(error?.message || "Could not calculate route between locations");
      
      // Clear directions and route info
      setDirectionsResult(null);
      setRouteInfo(null);
      
      // Ensure markers are still visible even when route fails
      if (map && pickupLocation && dropoffLocation) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(pickupLocation.coordinates);
        bounds.extend(dropoffLocation.coordinates);
        map.fitBounds(bounds);
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only attempt to draw the route if we have both locations and the map is initialized
    if (map && pickupLocation?.coordinates && dropoffLocation?.coordinates && mapsInitialized && typeof google !== 'undefined') {
      drawRoute();
    } else if (map && mapsInitialized && typeof google !== 'undefined') {
      // If we don't have both locations but map is ready, just show the map centered at default center
      map.setCenter(defaultCenter);
      map.setZoom(defaultZoom);
      
      // Clear any existing route
      setDirectionsResult(null);
      setRouteInfo(null);
      
      // If we have at least one location, show it on the map
      const bounds = new google.maps.LatLngBounds();
      let hasAtLeastOneLocation = false;
      
      if (pickupLocation?.coordinates) {
        bounds.extend(pickupLocation.coordinates);
        hasAtLeastOneLocation = true;
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

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !mapsInitialized || typeof google === 'undefined') return;

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
        
        // Provide feedback about what was selected based on type
        setMapError(null); // Clear any previous errors
        
        // Show different messages based on location type
        let actionMessage;
        if (type === 'pickup') {
          actionMessage = "Pickup location set";
        } else if (type === 'dropoff') {
          actionMessage = "Drop-off location set";
        } else if (type === 'waypoint') {
          actionMessage = "Waypoint added";
        }
        
        console.log(actionMessage, location.address);
        // toast({ title: actionMessage, description: location.address });
      } else {
        console.error("onLocationSelect callback is not defined");
        setMapError("Cannot set location: application error. Please refresh the page.");
      }
      
      // Close the popup after selection
      setPopupLocation(null);
    } catch (error: any) {
      console.error("Error selecting location:", error);
      setMapError(error?.message || "Failed to set location. Please try again.");
    }
  };

  const handleMapLoad = (map: google.maps.Map) => {
    if (typeof google === 'undefined') {
      console.error("Google Maps API not initialized in handleMapLoad");
      return;
    }
    setMap(map);
    setMapsInitialized(true);
    map.setCenter(defaultCenter);
    map.setZoom(defaultZoom);
    
    // Initialize autocomplete and places services
    try {
      const autocompleteService = new google.maps.places.AutocompleteService();
      setAutocompleteService(autocompleteService);
      
      // We need a dummy div for PlacesService, even though we'll only use getDetails
      const dummyElement = document.createElement('div');
      const placesService = new google.maps.places.PlacesService(map);
      setPlacesService(placesService);
      
      console.log("Places services initialized successfully");
    } catch (error) {
      console.error("Error initializing Places services:", error);
      setMapError("Could not initialize location search. Please refresh and try again.");
    }
  };

  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!input.trim() || !autocompleteService || !mapsInitialized || typeof google === 'undefined') {
        setPredictions([]);
        return;
      }
      
      setIsSearching(true);
      try {
        // Set up options with UAE bounds
        const options: google.maps.places.AutocompletionRequest = {
          input,
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(UAE_BOUNDS.south, UAE_BOUNDS.west),
            new google.maps.LatLng(UAE_BOUNDS.north, UAE_BOUNDS.east)
          ),
          componentRestrictions: { country: 'ae' }, // Restrict to UAE
          types: ['geocode', 'establishment', 'address'], // Include businesses, addresses, and places
        };
        
        // Make the request to get predictions
        const response = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
          autocompleteService.getPlacePredictions(options, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results);
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              resolve([]);
            } else {
              reject(new Error(`Autocomplete failed with status: ${status}`));
            }
          });
        });
        
        // Format the results for our combobox
        const formattedResults = response.map(prediction => ({
          value: prediction.place_id,
          label: prediction.structured_formatting?.main_text || prediction.description,
          description: prediction.structured_formatting?.secondary_text,
          place_id: prediction.place_id
        }));
        
        setPredictions(formattedResults);
      } catch (error) {
        console.error("Error fetching location predictions:", error);
        setPredictions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [autocompleteService, mapsInitialized]
  );
  
  // Handle input change with 300ms debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        fetchPredictions(searchQuery);
      } else {
        setPredictions([]);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchPredictions]);
  
  const handlePlaceSelect = async (placeId: string) => {
    if (!placeId || !placesService || !map || !mapsInitialized || typeof google === 'undefined') return;
    
    try {
      setIsLoading(true);
      setMapError(null);
      
      // Get detailed place information from the place_id
      const placeDetails = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        placesService.getDetails({
          placeId: placeId,
          fields: ['name', 'geometry', 'formatted_address', 'place_id']
        }, (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Place details request failed with status: ${status}`));
          }
        });
      });
      
      console.log("Place details:", placeDetails);
      
      if (!placeDetails.geometry?.location) {
        throw new Error("Selected place has no location data");
      }
      
      const location = {
        lat: placeDetails.geometry.location.lat(),
        lng: placeDetails.geometry.location.lng(),
        address: placeDetails.formatted_address || "",
        place_id: placeDetails.place_id || "",
        name: placeDetails.name || placeDetails.formatted_address || "",
        formatted_address: placeDetails.formatted_address || ""
      };
      
      // Center the map on the found location
      map.setCenter(location);
      map.setZoom(15);
      
      // Show the location popup
      setPopupLocation(location);
      
      // Clear search query after successful search
      setSearchQuery("");
      setPredictions([]);
      
    } catch (error: any) {
      console.error("Error getting place details:", error);
      setMapError(error?.message || "Failed to get location details");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery.trim() || !map || !mapsInitialized || typeof google === 'undefined') return;

    try {
      setIsLoading(true);
      setMapError(null);
      
      if (typeof google === 'undefined') {
        throw new Error("Google Maps API is not initialized in handleSearch");
      }
      
      // First try using autocomplete predictions if available
      if (predictions.length > 0) {
        await handlePlaceSelect(predictions[0].place_id);
        return;
      }
      
      // Fallback to geocoder if no predictions are available
      const geocoder = new google.maps.Geocoder();
      console.log("Searching for location:", searchQuery);
      
      // Add UAE bias to geocoding request
      const result = await geocoder.geocode({ 
        address: searchQuery,
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(UAE_BOUNDS.south, UAE_BOUNDS.west),
          new google.maps.LatLng(UAE_BOUNDS.north, UAE_BOUNDS.east)
        ),
        componentRestrictions: { country: 'ae' }
      });
      
      if (result.results.length > 0) {
        const place = result.results[0];
        console.log("Search result:", place);
        
        // Add type casting to handle missing properties in typings
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || searchQuery,
          place_id: place.place_id || "",
          name: (place as any).name || place.formatted_address || searchQuery, // Ensure name always has a value
          formatted_address: place.formatted_address || searchQuery // Ensure formatted_address always has a value
        };
        
        // Center the map on the found location
        map.setCenter(location);
        map.setZoom(15);
        
        // Show the location popup
        setPopupLocation(location);
        console.log("Set popup location to:", location);
        
        // Clear search query after successful search
        setSearchQuery("");
        setPredictions([]);
      } else {
        console.warn("No locations found for search:", searchQuery);
        setMapError("No locations found for your search");
      }
    } catch (error: any) {
      console.error("Error searching for location:", error);
      setMapError(error?.message || "Failed to search for location");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };
  
  const handleGetCurrentLocation = () => {
    if (!map || !mapsInitialized || typeof google === 'undefined') return;
    
    setIsLoading(true);
    setMapError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          try {
            if (typeof google === 'undefined') {
              throw new Error("Google Maps API is not initialized");
            }
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({ location: coords });
            
            if (result.results.length > 0) {
              const place = result.results[0];
              const location = {
                lat: coords.lat,
                lng: coords.lng,
                address: place.formatted_address || "Your location",
                place_id: place.place_id || "",
                name: (place as any).name || place.formatted_address || "Your location",
                formatted_address: place.formatted_address || "Your location"
              };
              
              // Center the map on the found location
              map.setCenter(coords);
              map.setZoom(15);
              
              // Show the location popup
              setPopupLocation(location);
            } else {
              setPopupLocation({
                lat: coords.lat,
                lng: coords.lng,
                address: "Your location",
                place_id: "",
                name: "Your location",
                formatted_address: "Your location"
              });
              map.setCenter(coords);
              map.setZoom(15);
            }
          } catch (error: any) {
            console.error("Error reverse geocoding location:", error);
            setPopupLocation({
              lat: coords.lat,
              lng: coords.lng,
              address: "Your location",
              place_id: "",
              name: "Your location",
              formatted_address: "Your location"
            });
            map.setCenter(coords);
            map.setZoom(15);
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setMapError("Could not access your location. Please check browser permissions.");
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setMapError("Geolocation is not supported by your browser");
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 h-full relative shadow-lg">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <VehicleLoadingIndicator size="lg" />
        </div>
      )}
      
      {mapError && (
        <Alert 
          variant={mapError.startsWith("FALLBACK:") ? "default" : "destructive"} 
          className="mb-4"
        >
          {mapError.startsWith("FALLBACK:") ? (
            <>
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>{mapError.substring(9)}</AlertDescription>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{mapError}</AlertDescription>
            </>
          )}
        </Alert>
      )}
      
      {!MAPS_API_KEY && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Key Missing</AlertTitle>
          <AlertDescription>Google Maps API key is not configured. Please contact support.</AlertDescription>
        </Alert>
      )}

      <div className="mb-4 space-y-2">
        <h3 className="font-medium text-lg">Interactive Map</h3>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-[10px] text-white font-bold">P</div>
            <span className="text-sm">Pickup</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white font-bold">D</div>
            <span className="text-sm">Drop-off</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-amber-600 flex items-center justify-center text-[10px] text-white font-bold">1</div>
            <span className="text-sm">Waypoint</span>
          </div>
        </div>

        <div className="relative mb-2">
          {predictions.length > 0 ? (
            <Combobox
              placeholder="Search for a location in UAE..."
              options={predictions}
              value=""
              onChange={handlePlaceSelect}
              onInputChange={setSearchQuery}
              className="w-full"
              emptyMessage="No locations found"
              clearable={true}
              loading={isSearching}
            />
          ) : (
            <div className="flex">
              <Input
                ref={searchBoxRef}
                placeholder="Search for a location in UAE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pr-10"
              />
              <Button 
                variant="ghost" 
                size="icon"
                type="button"
                onClick={handleSearch}
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGetCurrentLocation}
            className="w-full flex items-center gap-2 mt-2 text-primary"
          >
            <Locate className="h-4 w-4" />
            <span>Use my current location</span>
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Click on the map or search for a location to set pickup, drop-off, or waypoint locations
        </p>
      </div>

      <LoadScriptNext
        googleMapsApiKey={MAPS_API_KEY}
        libraries={GOOGLE_MAPS_LIBRARIES}
        id="google-map-script"
        loadingElement={
          <div className="h-full w-full flex items-center justify-center min-h-[400px]">
            <VehicleLoadingIndicator size="lg" />
          </div>
        }
        onLoad={() => {
          console.log("Google Maps script loaded successfully");
          setMapsInitialized(true);
        }}
        onError={(error) => {
          console.error("Google Maps script failed to load:", error);
          setLoadError(new Error("Failed to load Google Maps"));
        }}
        channel="tripxl_booking_map"
      >
        {loadError ? (
          <div className="h-[500px] flex flex-col items-center justify-center border border-dashed rounded-md p-5 bg-muted/30">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Google Maps Error</h3>
            <p className="text-center text-muted-foreground mb-4">
              {loadError.message || "Failed to load Google Maps. Please check your API key or try again later."}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload
            </Button>
          </div>
        ) : (
          <div className="h-[500px] relative">
            <GoogleMap
              mapContainerStyle={{
                width: '100%',
                height: '100%',
                borderRadius: '8px'
              }}
              center={defaultCenter}
              zoom={defaultZoom}
              onClick={handleMapClick}
              onLoad={handleMapLoad}
              options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
                clickableIcons: true,
                mapTypeId: (typeof google !== 'undefined' && google.maps && google.maps.MapTypeId) ? google.maps.MapTypeId.ROADMAP : 'roadmap',
                styles: [
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "on" }]
                  }
                ]
              }}
            >
              {/* Only render DirectionsRenderer for real directions results (not our fallback) */}
              {directionsResult && directionsResult.routes && directionsResult.routes.length > 0 && directionsResult.routes[0]?.overview_polyline && (
                <DirectionsRenderer
                  directions={directionsResult}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: "#0033CC", /* Dark Blue Color */
                      strokeWeight: 6, /* Increased thickness */
                      strokeOpacity: 1.0, /* Full opacity */
                      zIndex: 10, /* Ensure route is above other map elements */
                      geodesic: true /* Follow Earth's curvature for more accurate roads */
                    },
                    preserveViewport: false, /* Auto-zoom to fit the entire route */
                    draggable: false, /* Route is not draggable */
                  }}
                />
              )}

              {pickupLocation?.coordinates && (
                <Marker
                  position={pickupLocation.coordinates}
                  icon={{
                    path: (typeof google !== 'undefined' && google.maps && google.maps.SymbolPath) ? google.maps.SymbolPath.CIRCLE : 0,
                    fillColor: "#22c55e",
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: "#ffffff",
                    scale: 12,
                  }}
                  label={{
                    text: "P",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}
                />
              )}

              {dropoffLocation?.coordinates && (
                <Marker
                  position={dropoffLocation.coordinates}
                  icon={{
                    path: (typeof google !== 'undefined' && google.maps && google.maps.SymbolPath) ? google.maps.SymbolPath.CIRCLE : 0,
                    fillColor: "#ef4444",
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: "#ffffff",
                    scale: 12,
                  }}
                  label={{
                    text: "D",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}
                />
              )}
              
              {/* Render waypoint markers with numbers */}
              {waypoints && waypoints.map((waypoint, index) => waypoint?.coordinates && (
                <Marker
                  key={`waypoint-${index}`}
                  position={waypoint.coordinates}
                  icon={{
                    path: (typeof google !== 'undefined' && google.maps && google.maps.SymbolPath) ? google.maps.SymbolPath.CIRCLE : 0,
                    fillColor: "#3b82f6", // Blue color for waypoints
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: "#ffffff",
                    scale: 12,
                  }}
                  label={{
                    text: (index + 1).toString(),
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}
                />
              ))}

              {popupLocation && (
                <InfoWindow
                  position={{ lat: popupLocation.lat, lng: popupLocation.lng }}
                  onCloseClick={() => setPopupLocation(null)}
                  options={{
                    maxWidth: 350,
                    pixelOffset: (typeof google !== 'undefined' && google.maps && google.maps.Size) ? new google.maps.Size(0, -5) : undefined
                  }}
                >
                  <div className="p-3 space-y-3 min-w-[280px]">
                    <div className="border-b pb-3">
                      <h4 className="font-medium text-base mb-1">Selected Location</h4>
                      <p className="text-sm flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <span>{popupLocation.formatted_address || popupLocation.name || popupLocation.address}</span>
                      </p>
                    </div>
                    <div className="flex gap-3 flex-col">
                      <Button
                        size="sm"
                        onClick={() => handleLocationTypeSelect('pickup')}
                        variant="default"
                        disabled={false}
                        className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <CircleCheck className="h-4 w-4" />
                        <span>Set as Pickup Location</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleLocationTypeSelect('dropoff')}
                        variant="default"
                        disabled={false}
                        className="w-full bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <CircleCheck className="h-4 w-4" />
                        <span>Set as Dropoff Location</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleLocationTypeSelect('waypoint')}
                        variant="default"
                        disabled={false}
                        className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Add as Waypoint</span>
                      </Button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>
        )}
      </LoadScriptNext>

      {/* Alert for mapError is now handled at the top of the component */}

      {routeInfo && pickupLocation?.coordinates && dropoffLocation?.coordinates && (
        <div className="mt-4 p-4 border rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-lg">Route Information</h3>
            <div className="bg-primary/10 rounded-full px-3 py-1.5 text-sm font-medium text-primary">
              {routeInfo.distance}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Travel Time</p>
              <p className="text-sm text-muted-foreground">{routeInfo.duration}</p>
            </div>
          </div>

          <div className="space-y-3 border-t pt-3">
            <div className="flex gap-3">
              <div className="min-w-[24px] flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-[10px] text-white font-bold">P</div>
                <div className="h-full border-l-2 border-dashed border-muted-foreground/30 my-1"></div>
              </div>
              <div>
                <p className="font-medium">Pickup Location</p>
                <p className="text-sm text-muted-foreground">
                  {pickupLocation?.formatted_address || pickupLocation?.name || pickupLocation?.address || "Select location"}
                </p>
              </div>
            </div>

            {/* Show waypoints if they exist */}
            {waypoints && waypoints.length > 0 && (
              <>
                {waypoints.map((waypoint, index) => (
                  <div className="flex gap-3" key={`waypoint-info-${index}`}>
                    <div className="min-w-[24px] flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="h-full border-l-2 border-dashed border-muted-foreground/30 my-1"></div>
                    </div>
                    <div>
                      <p className="font-medium">Waypoint {index + 1}</p>
                      <p className="text-sm text-muted-foreground">
                        {waypoint?.formatted_address || waypoint?.name || waypoint?.address || `Waypoint ${index + 1}`}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="flex gap-3">
              <div className="min-w-[24px]">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white font-bold">D</div>
              </div>
              <div>
                <p className="font-medium">Drop-off Location</p>
                <p className="text-sm text-muted-foreground">
                  {dropoffLocation?.formatted_address || dropoffLocation?.name || dropoffLocation?.address || "Select location"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}