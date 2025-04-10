import { useState, useRef, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GoogleMap, Marker, InfoWindow, Polyline } from "@react-google-maps/api";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Search, Locate, AlertCircle, CircleCheck, Info as InfoIcon, X, Mic, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { calculateRoute, convertToGoogleMapsRoute, RouteWaypoint } from "@/lib/geoapify-route-service";
import MapFallback from "@/components/map-fallback";
// Import the useMapsApi hook
import { useMapsApi } from "@/hooks/use-maps-api";
// Import the route optimizer for traffic insights
import { routeOptimizer } from "@/services/route-optimizer";

// Import accessibility components
import AccessibilityToggle from "@/components/accessibility/accessibility-toggle";
import AccessibleMarker from "@/components/accessibility/accessible-marker";
import VoiceGuidance from "@/components/accessibility/voice-guidance";

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

// Use environment variable for API key
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";
console.log("Google Maps API Key available:", MAPS_API_KEY ? "Yes (key length: " + MAPS_API_KEY.length + ")" : "No");
console.log("Using environment variable:", import.meta.env.VITE_GOOGLE_MAPS_KEY ? "Yes" : "No");

// Max retries for Google Maps loading
const MAX_RETRIES = 3;

export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
  // UAE-specific location properties
  district?: string;
  city?: string;
  area?: string;
  place_types?: string[];
}

export interface RouteInfo {
  distance: string;
  duration: string;
  trafficConditions?: {
    congestionLevel: number;
    averageSpeed: number;
    trafficDelay?: number;
  };
  trafficAlerts?: string[];
  weatherAlerts?: string[];
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

  // Load the Google Maps API using our custom hook
  const { isLoaded, loadError, maps } = useMapsApi(MAPS_API_KEY);

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
  
  // Memoize map options to prevent re-renders
  const mapOptions = useRef({
    mapTypeControl: true, // Show map type controls (satellite, terrain)
    mapTypeControlOptions: {
      style: 2, // HORIZONTAL_BAR style (mimics google.maps.MapTypeControlStyle.HORIZONTAL_BAR)
      position: 1, // TOP_RIGHT position (mimics google.maps.ControlPosition.TOP_RIGHT)
    },
    streetViewControl: true, // Enable street view for better user experience
    fullscreenControl: true, // Allow fullscreen mode
    zoomControl: true, // Make sure zoom controls are visible
    gestureHandling: "auto", // Allows full control over zooming and panning
    clickableIcons: true, // Enable clickable POIs for better location discovery
    mapTypeId: 'roadmap',
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  });
  
  // Update mapOptions.current.mapTypeId when Google Maps API is loaded
  useEffect(() => {
    if (isLoaded && typeof google !== 'undefined' && google.maps && google.maps.MapTypeId) {
      mapOptions.current = {
        ...mapOptions.current,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_RIGHT,
        }
      };
    }
  }, [isLoaded]);
  
  // Effect to update mapsInitialized state based on isLoaded
  useEffect(() => {
    console.log("Map load state:", { isLoaded, loadError });
    
    if (isLoaded && !loadError) {
      console.log("Google Maps API loaded successfully");
      
      // Verify Google Maps loaded correctly
      if (typeof google === 'undefined') {
        console.error("Google object is undefined despite successful load");
        setMapError("Google Maps API did not initialize properly. Using fallback mapping solution.");
        return;
      }
      
      if (!google.maps) {
        console.error("google.maps is undefined despite successful load");
        setMapError("Google Maps API did not initialize properly. Using fallback mapping solution.");
        return;
      }
      
      if (!google.maps.places) {
        console.error("google.maps.places is undefined - Places library might not be loaded");
        setMapError("Google Maps Places library is not available. Check API key restrictions.");
        return;
      }
      
      // Initialize autocomplete service
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
    } else if (loadError) {
      console.error("Google Maps script failed to load:", loadError);
      setMapError(`Failed to load Google Maps: ${loadError.message}. Using fallback mapping solution.`);
    }
  }, [isLoaded, loadError]);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [popupLocation, setPopupLocation] = useState<PopupLocation | null>(null);
  const [routePolyline, setRoutePolyline] = useState<google.maps.Polyline | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showRouteInfo, setShowRouteInfo] = useState(true);
  
  // Accessibility features
  // Using useRef to prevent unnecessary re-renders when accessibility state changes
  const accessibilityEnabledRef = useRef(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  
  // Update the ref whenever state changes
  useEffect(() => {
    accessibilityEnabledRef.current = accessibilityEnabled;
  }, [accessibilityEnabled]);
  
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
            
            // Get traffic data from the routeOptimizer
            let trafficData;
            try {
              // Try to get traffic conditions for this route
              const optimizationResult = await routeOptimizer.getOptimizedRoute(
                pickupLocation,
                dropoffLocation,
                waypoints,
                {
                  enableTraffic: true,
                  avoidHighways: routePreferences.avoidHighways,
                  avoidTolls: routePreferences.avoidTolls,
                  optimizeWaypoints: routePreferences.optimizeWaypoints
                }
              );
              
              trafficData = {
                trafficConditions: optimizationResult.trafficConditions,
                trafficAlerts: optimizationResult.trafficAlerts,
                weatherAlerts: optimizationResult.weatherAlerts
              };
              
              console.log("Traffic data retrieved:", trafficData);
            } catch (trafficError) {
              console.error("Failed to get traffic data:", trafficError);
              trafficData = {
                trafficConditions: {
                  congestionLevel: 100, // Default to no congestion
                  averageSpeed: 60 // Default average speed in km/h
                },
                trafficAlerts: [],
                weatherAlerts: []
              };
            }
            
            // Update route info with traffic data
            const routeInfoData: RouteInfo = {
              distance: distanceText,
              duration: durationText,
              ...trafficData
            };
            setRouteInfo(routeInfoData);
            setShowRouteInfo(true); // Reset visibility whenever a new route is calculated
            
            // Announce route calculation for accessibility - using ref to prevent re-renders
            if (accessibilityEnabledRef.current) {
              VoiceGuidance.announceRouteCalculation(distanceText, durationText);
            }
            
            // Extract the path coordinates from the overview_path
            if (map && route.overview_path) {
              const path = route.overview_path.map(point => ({
                lat: point.lat(),
                lng: point.lng()
              }));
              
              // Create a polyline for the route with improved styling for better visibility
              const newRoutePolyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: "#0047AB", // Cobalt blue for maximum visibility
                strokeOpacity: 0.9,
                strokeWeight: 7, // Even thicker line for better visibility
                icons: [{ // Add arrow markers to indicate direction
                  icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 3,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 2,
                  },
                  offset: "50%",
                  repeat: "150px"
                }],
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
        
        // Try to get traffic data for Geoapify route as well
        let trafficData;
        try {
          // Try to get traffic conditions for this route if Google Maps is available
          if (typeof google !== 'undefined' && google.maps) {
            const optimizationResult = await routeOptimizer.getOptimizedRoute(
              pickupLocation,
              dropoffLocation,
              waypoints,
              {
                enableTraffic: true,
                avoidHighways: routePreferences.avoidHighways,
                avoidTolls: routePreferences.avoidTolls,
                optimizeWaypoints: routePreferences.optimizeWaypoints
              }
            );
            
            trafficData = {
              trafficConditions: optimizationResult.trafficConditions,
              trafficAlerts: optimizationResult.trafficAlerts,
              weatherAlerts: optimizationResult.weatherAlerts
            };
            
            console.log("Traffic data retrieved for Geoapify route:", trafficData);
          }
        } catch (trafficError) {
          console.error("Failed to get traffic data for Geoapify route:", trafficError);
        }
        
        // Update route info
        const routeInfoData: RouteInfo = {
          distance: distanceText,
          duration: durationText,
          ...(trafficData || {}) // Add traffic data if available
        };
        setRouteInfo(routeInfoData);
        setShowRouteInfo(true); // Reset visibility whenever a new route is calculated
        
        // Announce route calculation for accessibility
        if (accessibilityEnabledRef.current) {
          setTimeout(() => {
            if (accessibilityEnabledRef.current) {
              VoiceGuidance.announceRouteCalculation(distanceText, durationText);
              VoiceGuidance.speak("Trip estimate is now displayed on your screen");
            }
          }, 500);
        }
        
        // Draw the route on the map
        if (map && geoapifyResult.features && geoapifyResult.features.length > 0) {
          const path = geoapifyResult.features[0].geometry.coordinates.map((coord: any) => ({
            lat: coord[1],
            lng: coord[0]
          }));
          
          // Create a polyline for the route with enhanced styling
          const newRoutePolyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: "#0047AB", // Cobalt blue for maximum visibility 
            strokeOpacity: 0.9,
            strokeWeight: 7, // Thicker line for better visibility
            icons: [{ // Add arrow markers to indicate direction
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
              },
              offset: "50%",
              repeat: "150px"
            }],
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
        
        // Try to estimate basic traffic conditions even for straight-line calculation
        let trafficData;
        try {
          // Use the route optimizer if Google Maps is available for a basic traffic estimate
          if (typeof google !== 'undefined' && google.maps) {
            const optimizationResult = await routeOptimizer.getOptimizedRoute(
              pickupLocation,
              dropoffLocation,
              waypoints,
              {
                enableTraffic: true,
                avoidHighways: routePreferences.avoidHighways,
                avoidTolls: routePreferences.avoidTolls,
                optimizeWaypoints: routePreferences.optimizeWaypoints
              }
            );
            
            trafficData = {
              trafficConditions: optimizationResult.trafficConditions,
              trafficAlerts: optimizationResult.trafficAlerts,
              weatherAlerts: optimizationResult.weatherAlerts
            };
            
            console.log("Traffic data retrieved for straight-line route:", trafficData);
          } else {
            // Basic fallback traffic simulation if Google Maps is not available
            // This is a very simplified traffic model that uses time of day to estimate congestion
            const now = new Date();
            const hour = now.getHours();
            
            // Morning rush hour: 7-10 AM, Evening rush hour: 4-7 PM
            const isPeakHour = (hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 19);
            
            // Weekend vs. weekday
            const isWeekend = now.getDay() === 0 || now.getDay() === 6;
            
            // Simplified congestion model
            let congestionLevel = isWeekend ? 80 : 65; // Base level - better on weekends
            if (isPeakHour && !isWeekend) congestionLevel = 40; // Worst during weekday peak hours
            
            // Estimate average speed based on congestion
            const averageSpeed = congestionLevel > 80 ? 60 : 
                               congestionLevel > 50 ? 45 : 30; // km/h
            
            trafficData = {
              trafficConditions: {
                congestionLevel: congestionLevel,
                averageSpeed: averageSpeed,
                trafficDelay: isPeakHour && !isWeekend ? 
                  Math.round(distance * 10) : // Delay in seconds
                  0
              },
              trafficAlerts: isPeakHour && !isWeekend ? 
                ["Using estimated traffic conditions based on time of day"] : 
                [],
              weatherAlerts: []
            };
            
            console.log("Estimated basic traffic data for straight-line route:", trafficData);
          }
        } catch (trafficError) {
          console.error("Could not retrieve traffic data:", trafficError);
        }
        
        // Update route info with our calculation
        const routeInfoData: RouteInfo = {
          distance: distanceText,
          duration: durationText,
          ...(trafficData || {}) // Add traffic data if available
        };
        setRouteInfo(routeInfoData);
        setShowRouteInfo(true); // Reset visibility whenever a new route is calculated
        
        // Announce route calculation for accessibility
        if (accessibilityEnabledRef.current) {
          setTimeout(() => {
            if (accessibilityEnabledRef.current) {
              VoiceGuidance.announceRouteCalculation(distanceText, durationText);
              VoiceGuidance.speak("Trip estimate is now displayed on your screen");
            }
          }, 500);
        }
        
        if (map) {
          // Draw a simple straight line between points
          const straightLineOptions = {
            path: [
              pickupLocation.coordinates,
              ...waypoints.map(wp => wp.coordinates),
              dropoffLocation.coordinates
            ],
            geodesic: true,
            strokeColor: "#0047AB", // Cobalt blue for better visibility
            strokeOpacity: 0.9,
            strokeWeight: 7, // Thicker line
            strokePattern: [ // Dashed line to indicate it's a straight-line estimate
              { offset: '0', repeat: '10px' },
              { offset: '10px', repeat: '10px' }
            ],
            icons: [{ // Add direction indicators
              icon: {
                path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                scale: 3,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
              },
              offset: "50%",
              repeat: "150px"
            }],
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
    // Add more detailed logging
    console.log("📍 MAP CLICK EVENT TRIGGERED");
    console.log("📍 Click coordinates:", e.latLng?.lat(), e.latLng?.lng());
    console.log("📍 Map editable:", editable);
    console.log("📍 Component props:", { 
      hasPickupLocation: !!pickupLocation, 
      hasDropoffLocation: !!dropoffLocation,
      hasOnLocationSelect: !!onLocationSelect,
      hasOnRouteCalculated: !!onRouteCalculated
    });
    
    if (!e.latLng || !mapsInitialized || typeof google === 'undefined') {
      console.error("❌ Cannot handle map click: missing required data");
      return;
    }
    
    // Skip click handling if not in editable mode
    if (!editable) {
      console.log("⚠️ Skipping map click handling - map is not in editable mode");
      return;
    }
    
    console.log("✅ Processing map click - all conditions met");

    try {
      console.log("Processing map click at:", e.latLng.lat(), e.latLng.lng());
      setIsLoading(true);
      setMapError(null);
      
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat: e.latLng.lat(), lng: e.latLng.lng() } });
      console.log("Geocode result:", result);

      if (result.results && result.results.length > 0) {
        const place = result.results[0];
        console.log("Map click geocode result:", place);
        
        const popupData = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          address: place.formatted_address || "Selected location",
          place_id: place.place_id || "",
          name: (place as any).name || place.formatted_address || "Selected location",
          formatted_address: place.formatted_address || "Selected location"
        };
        
        console.log("Setting popup location data:", popupData);
        setPopupLocation(popupData);
        
        // Announce the selected location for accessibility
        if (accessibilityEnabled) {
          const address = popupData.formatted_address || `Location at coordinates ${popupData.lat.toFixed(4)}, ${popupData.lng.toFixed(4)}`;
          VoiceGuidance.speak(`Location selected: ${address}. You can now set this as a pickup or dropoff point.`);
        }
      } else {
        console.warn("No geocode results found for clicked location");
        // Still show popup even without detailed address
        const fallbackPopupData = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          address: "Selected location",
          place_id: "",
          name: "Selected location",
          formatted_address: `Lat: ${e.latLng.lat().toFixed(6)}, Lng: ${e.latLng.lng().toFixed(6)}`
        };
        
        console.log("Setting fallback popup location data:", fallbackPopupData);
        setPopupLocation(fallbackPopupData);
        
        // Announce the selected location for accessibility (fallback case)
        if (accessibilityEnabled) {
          VoiceGuidance.speak(`Location selected at coordinates ${e.latLng.lat().toFixed(4)}, ${e.latLng.lng().toFixed(4)}. You can now set this as a pickup or dropoff point.`);
        }
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
    console.log("🔘 LOCATION TYPE SELECTION:", type);
    console.log("🔘 Has popup location:", !!popupLocation);
    console.log("🔘 Has map reference:", !!map);
    console.log("🔘 Has onLocationSelect callback:", !!onLocationSelect);
    
    // Alert to make sure we know this function is being called
    alert(`DEBUG: handleLocationTypeSelect called for type: ${type}`);
    
    if (!popupLocation) {
      console.error("❌ Cannot set location: missing popupLocation");
      setMapError("Location details not available. Please try clicking on the map again.");
      return;
    }
    
    if (!map) {
      console.error("❌ Cannot set location: missing map instance");
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
        
        // Announce location selection for accessibility
        if (accessibilityEnabled) {
          let typeText = '';
          switch(type) {
            case 'pickup':
              typeText = 'pickup location';
              break;
            case 'dropoff':
              typeText = 'dropoff location';
              break;
            case 'waypoint':
              typeText = 'waypoint';
              break;
          }
          
          const locationName = location.formatted_address || location.address;
          VoiceGuidance.formatLocationForSpeech(typeText, locationName);
        }
        
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
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    console.log("Google Maps map loaded successfully");
    setMap(map);
    
    try {
      // Initialize Places service which requires a map instance
      if (typeof google !== "undefined" && google.maps) {
        console.log("Initializing places service");
        const placesService = new google.maps.places.PlacesService(map);
        setPlacesService(placesService);
        console.log("Places service initialized successfully");
        
        // Make sure the map type is set correctly and doesn't flicker
        if (google.maps.MapTypeId) {
          map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        }
      } else {
        setMapError("Google Maps API did not load properly. Please refresh the page and try again.");
      }
    } catch (error) {
      console.error("Error initializing Places service:", error);
      setMapError("Failed to initialize map services. Please refresh the page.");
    }
  }, []);

  // Handle search predictions is now integrated directly into the debouncedSearch function
  // for better flow control and handling of API responses

  // Search for places as the user types with enhanced error handling
  const debouncedSearch = useCallback(
    (query: string) => {
      console.log("Search function called with query:", query);
      // Update search query immediately to show user feedback
      setSearchQuery(query);
      
      // Then use lodash.debounce for the actual API call
      const performSearch = debounce(() => {
        console.log("Performing search for:", query);
        
        if (!query || query.length < 3) {
          console.log("Query too short, clearing predictions");
          setPredictions([]);
          return;
        }
        
        // Only proceed if we have the autocomplete service available
        if (!autocompleteService) {
          console.error("AutocompleteService not available", { google, maps: google?.maps, places: google?.maps?.places });
          return;
        }
        
        // Only proceed if maps is initialized
        if (!mapsInitialized) {
          console.error("Maps not initialized yet");
          return;
        }
        
        console.log("Calling predictions API for query:", query);
        setPredictions([]);
        setIsSearching(true);
        
        try {
          // Get predictions from the Google Places Autocomplete service
          autocompleteService.getPlacePredictions({
            input: query,
            bounds: UAE_BOUNDS,
            componentRestrictions: { country: "ae" }
          }, (results: any, status: any) => {
            console.log("Prediction results status:", status);
            
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              console.log("Got prediction results:", results.length);
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
              console.warn("No predictions found or error:", status);
              setPredictions([]);
            }
            
            setIsSearching(false);
          });
        } catch (error) {
          console.error("Error during search:", error);
          setIsSearching(false);
          setPredictions([]);
        }
      }, 300);
      
      // Execute the debounced function
      performSearch();
    },
    [autocompleteService, mapsInitialized]
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
          const locationData = {
            lat,
            lng,
            address: result.formatted_address || "Selected location",
            place_id: result.place_id || "",
            name: result.name || result.formatted_address || "Selected location",
            formatted_address: result.formatted_address || "Selected location"
          };
          
          setPopupLocation(locationData);
          
          // Announce the selected location for accessibility
          if (accessibilityEnabled) {
            const locationName = result.name || result.formatted_address || "Selected location";
            VoiceGuidance.speak(`Found location: ${locationName}. You can now set this as a pickup or dropoff point.`);
          }
          
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

  // InfoWindow content for selected locations - styled with distinct colors for better usability
  const infoWindowContent = (
    <div className="info-window-content p-3 min-w-[240px]">
      <h3 className="font-semibold text-primary mb-2">{popupLocation?.name || popupLocation?.formatted_address || "Selected Location"}</h3>
      <p className="text-sm text-muted-foreground mb-4">{popupLocation?.formatted_address || `${popupLocation?.lat.toFixed(6)}, ${popupLocation?.lng.toFixed(6)}`}</p>
      
      <div className="flex flex-col gap-2.5">
        <button 
          type="button"
          onClick={() => handleLocationTypeSelect('pickup')}
          className="py-2 px-3 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white w-full text-left flex items-center"
          data-action="set-pickup"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          Set as Pickup Location
        </button>
        
        <button 
          type="button"
          onClick={() => handleLocationTypeSelect('dropoff')}
          className="py-2 px-3 rounded text-sm font-medium bg-red-600 hover:bg-red-700 text-white w-full text-left flex items-center"
          data-action="set-dropoff"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          Set as Dropoff Location
        </button>
        
        <button 
          type="button"
          onClick={() => handleLocationTypeSelect('waypoint')}
          className="py-2 px-3 rounded text-sm font-medium border border-blue-500 text-blue-600 hover:bg-blue-50 w-full text-left flex items-center"
          data-action="add-waypoint"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          Add as Waypoint
        </button>
      </div>
      
      <style>
        {`
          /* Hide the default Google Maps InfoWindow close button - comprehensive selectors */
          .gm-ui-hover-effect,
          .gm-style-iw button[role="button"],
          .gm-style-iw-c button[role="button"],
          .gm-style button[title="Close"],
          .gm-style div[role="button"][aria-label="Close"],
          button.gm-ui-hover-effect,
          div[role="button"][title="Close"] {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
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
  // Two separate route info components:
  // 1. Floating card on the map
  const routeInfoFloatingCard = routeInfo && showRouteInfo && (
    <div className="absolute top-4 left-4 z-10 bg-white/95 p-4 rounded-lg shadow-lg border border-blue-300 animate-in fade-in duration-300 slide-in-from-left-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="bg-blue-100 p-1.5 rounded-full mr-2">
            <MapPin className="h-4 w-4 text-blue-700" />
          </div>
          <h3 className="font-semibold text-lg text-blue-800">Trip Estimate</h3>
        </div>
        <button 
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors" 
          onClick={() => setShowRouteInfo(false)}
          aria-label="Close trip estimate"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      <div className="pt-2 border-t border-blue-100">
        <div className="flex items-center mb-3 bg-blue-50/60 p-2 rounded-md">
          <MapPin className="mr-2 h-5 w-5 text-blue-600" />
          <div>
            <div className="text-xs text-blue-500 uppercase font-semibold">Distance</div>
            <div className="text-md font-bold text-blue-700">{routeInfo.distance}</div>
          </div>
        </div>
        <div className="flex items-center mb-3 bg-blue-50/60 p-2 rounded-md">
          <Clock className="mr-2 h-5 w-5 text-blue-600" />
          <div>
            <div className="text-xs text-blue-500 uppercase font-semibold">Estimated Time</div>
            <div className="text-md font-bold text-blue-700">{routeInfo.duration}</div>
          </div>
        </div>
        
        {/* Traffic conditions section */}
        {routeInfo.trafficConditions && (
          <div className="flex items-center mb-3 bg-blue-50/60 p-2 rounded-md">
            <div className={`mr-2 h-5 w-5 rounded-full flex items-center justify-center ${
              routeInfo.trafficConditions.congestionLevel > 80 ? 'bg-green-100 text-green-600' :
              routeInfo.trafficConditions.congestionLevel > 50 ? 'bg-yellow-100 text-yellow-600' :
              'bg-red-100 text-red-600'
            }`}>
              {routeInfo.trafficConditions.congestionLevel > 80 ? 
                <CircleCheck className="h-4 w-4" /> : 
                <AlertCircle className="h-4 w-4" />
              }
            </div>
            <div>
              <div className="text-xs text-blue-500 uppercase font-semibold">Traffic</div>
              <div className="text-md font-bold text-blue-700">
                {routeInfo.trafficConditions.congestionLevel > 80 ? 'Light' :
                routeInfo.trafficConditions.congestionLevel > 50 ? 'Moderate' :
                'Heavy'} 
                {routeInfo.trafficConditions.averageSpeed ? 
                  ` (${Math.round(routeInfo.trafficConditions.averageSpeed)} km/h)` : ''}
              </div>
            </div>
          </div>
        )}
        
        {/* Traffic alerts section */}
        {routeInfo.trafficAlerts && routeInfo.trafficAlerts.length > 0 && (
          <div className="mb-3 bg-yellow-50 p-2 rounded-md border border-yellow-200">
            <div className="flex items-center mb-1">
              <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
              <div className="text-xs text-yellow-700 uppercase font-semibold">Traffic Alerts</div>
            </div>
            <ul className="text-xs text-yellow-800 pl-6 list-disc">
              {routeInfo.trafficAlerts.slice(0, 2).map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
              {routeInfo.trafficAlerts.length > 2 && (
                <li className="font-semibold">+{routeInfo.trafficAlerts.length - 2} more alerts</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
  
  // 2. Regular component below the map (for reference)
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
      
      {/* Traffic information in the detailed view */}
      {routeInfo.trafficConditions && (
        <div className="flex items-center mt-1">
          <div className={`mr-2 h-4 w-4 rounded-full flex items-center justify-center ${
            routeInfo.trafficConditions.congestionLevel > 80 ? 'bg-green-100 text-green-600' :
            routeInfo.trafficConditions.congestionLevel > 50 ? 'bg-yellow-100 text-yellow-600' :
            'bg-red-100 text-red-600'
          }`}>
            {routeInfo.trafficConditions.congestionLevel > 80 ? 
              <CircleCheck className="h-3 w-3" /> : 
              <AlertCircle className="h-3 w-3" />
            }
          </div>
          <span className="text-sm font-medium">
            Traffic: 
            {routeInfo.trafficConditions.congestionLevel > 80 ? ' Light' :
            routeInfo.trafficConditions.congestionLevel > 50 ? ' Moderate' :
            ' Heavy'} 
            {routeInfo.trafficConditions.averageSpeed ? 
              ` (${Math.round(routeInfo.trafficConditions.averageSpeed)} km/h)` : ''}
          </span>
        </div>
      )}
      
      {routeInfo.trafficAlerts && routeInfo.trafficAlerts.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-3 w-3 text-yellow-600" />
            <span className="text-xs font-semibold text-yellow-700">Traffic Alerts</span>
          </div>
          <ul className="text-xs text-yellow-800 pl-4 mt-1 list-disc">
            {routeInfo.trafficAlerts.map((alert, index) => (
              <li key={index}>{alert}</li>
            ))}
          </ul>
        </div>
      )}
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

  // IMPORTANT: Set to false to use the interactive Google Maps component
  const forceFallbackMode = false;
  
  // Only use fallback when:
  // 1. Google Maps failed to load (isLoaded is false)
  // 2. There's a load error (loadError is not null)
  // 3. If forcing fallback mode for testing/development
  const shouldUseFallback = (!isLoaded) || !!loadError || forceFallbackMode;
  
  return (
    <Card ref={mapContainerRef} className="overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            {!shouldUseFallback && searchBox}
            {shouldUseFallback && (
              <div className="flex items-center">
                <p className="text-sm text-amber-600 font-medium">
                  Using simplified map view with all booking features available
                </p>
              </div>
            )}
          </div>
          <div className="ml-2">
            <AccessibilityToggle 
              onToggle={(enabled) => {
                // Prevent extra processing if the state isn't changing
                if (enabled === accessibilityEnabled) return;
                
                // Update both the state and the ref
                setAccessibilityEnabled(enabled);
                accessibilityEnabledRef.current = enabled;
                
                // Only process announcements if enabling (not when disabling)
                if (enabled) {
                  // Use a small delay to prevent immediate announcements
                  setTimeout(() => {
                    if (!accessibilityEnabledRef.current) return; // Double-check it's still enabled
                    
                    VoiceGuidance.announceMapGuidance();
                    
                    // Announce current state if we already have locations set
                    // Use staggered timing to prevent voice overlap
                    if (pickupLocation) {
                      setTimeout(() => {
                        if (!accessibilityEnabledRef.current) return;
                        VoiceGuidance.formatLocationForSpeech("pickup location", pickupLocation.address);
                      }, 2500);
                    }
                    
                    if (dropoffLocation) {
                      setTimeout(() => {
                        if (!accessibilityEnabledRef.current) return;
                        VoiceGuidance.formatLocationForSpeech("dropoff location", dropoffLocation.address);
                      }, 4500);
                    }
                  }, 300);
                  
                  if (routeInfo) {
                    setTimeout(() => {
                      VoiceGuidance.announceRouteCalculation(routeInfo.distance, routeInfo.duration);
                    }, 7000);
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
            <VehicleLoadingIndicator />
          </div>
        )}
        
        {shouldUseFallback ? (
          <MapFallback 
            message="Using a simplified map view due to temporary issues with map loading. All booking functionality is still available." 
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            waypoints={waypoints}
            onSelectPickup={onLocationSelect ? () => {
              // Prompt user for pickup location
              const address = prompt("Enter pickup address:");
              if (address) {
                const location: Location = {
                  address,
                  coordinates: {
                    // Default to Abu Dhabi coordinates if no specific coordinates are available
                    lat: 24.466667,
                    lng: 54.366667
                  }
                };
                onLocationSelect(location, 'pickup');
              }
            } : undefined}
            onSelectDropoff={onLocationSelect ? () => {
              // Prompt user for dropoff location
              const address = prompt("Enter dropoff address:");
              if (address) {
                const location: Location = {
                  address,
                  coordinates: {
                    // Default to Dubai coordinates as an example destination
                    lat: 25.276987,
                    lng: 55.296249
                  }
                };
                onLocationSelect(location, 'dropoff');
              }
            } : undefined}
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
            options={mapOptions.current}
            onClick={handleMapClick}
            onLoad={handleMapLoad}
          >
            {/* Pickup location marker */}
            {pickupLocation && (
              accessibilityEnabledRef.current ? (
                <AccessibleMarker
                  position={pickupLocation.coordinates}
                  label="Pickup"
                  type="pickup"
                  address={pickupLocation.address}
                  accessibilityEnabled={accessibilityEnabledRef.current}
                  onClick={() => {
                    setPopupLocation({
                      lat: pickupLocation.coordinates.lat,
                      lng: pickupLocation.coordinates.lng,
                      address: pickupLocation.address,
                      place_id: pickupLocation.place_id || "",
                      name: pickupLocation.name || pickupLocation.formatted_address || pickupLocation.address,
                      formatted_address: pickupLocation.formatted_address || pickupLocation.address
                    });

                    // Announce for accessibility - using ref to prevent re-renders
                    if (accessibilityEnabledRef.current) {
                      VoiceGuidance.speak(`Pickup location selected at ${pickupLocation.address || 'selected coordinates'}`);
                    }
                  }}
                />
              ) : (
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
              )
            )}

            {/* Waypoint markers */}
            {renderWaypoints()}

            {/* Dropoff location marker */}
            {dropoffLocation && (
              accessibilityEnabledRef.current ? (
                <AccessibleMarker
                  position={dropoffLocation.coordinates}
                  label="Dropoff"
                  type="dropoff"
                  address={dropoffLocation.address}
                  accessibilityEnabled={accessibilityEnabledRef.current}
                  onClick={() => {
                    setPopupLocation({
                      lat: dropoffLocation.coordinates.lat,
                      lng: dropoffLocation.coordinates.lng,
                      address: dropoffLocation.address,
                      place_id: dropoffLocation.place_id || "",
                      name: dropoffLocation.name || dropoffLocation.formatted_address || dropoffLocation.address,
                      formatted_address: dropoffLocation.formatted_address || dropoffLocation.address
                    });

                    // Announce for accessibility - using ref to prevent re-renders
                    if (accessibilityEnabledRef.current) {
                      VoiceGuidance.speak(`Dropoff location selected at ${dropoffLocation.address || 'selected coordinates'}`);
                    }
                  }}
                />
              ) : (
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
              )
            )}

            {/* We will use a simple marker to signal the clicked location */}
            {popupLocation && (
              accessibilityEnabledRef.current ? (
                <AccessibleMarker
                  position={{ lat: popupLocation.lat, lng: popupLocation.lng }}
                  type="selected"
                  address={popupLocation.formatted_address}
                  accessibilityEnabled={accessibilityEnabledRef.current}
                />
              ) : (
                <Marker
                  position={{ lat: popupLocation.lat, lng: popupLocation.lng }}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    scaledSize: typeof google !== 'undefined' ? new google.maps.Size(32, 32) : undefined
                  }}
                />
              )
            )}
            
            {/* Floating route info card */}
            {routeInfoFloatingCard}
            
            {/* Side panel with location actions instead of InfoWindow */}
            {popupLocation && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-64 z-10 border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-base">Selected Location</h3>
                  <button 
                    type="button" 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setPopupLocation(null)}
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 break-words">
                  {popupLocation.formatted_address || `${popupLocation.lat.toFixed(6)}, ${popupLocation.lng.toFixed(6)}`}
                </p>
                
                <div className="space-y-2">
                  <button 
                    type="button"
                    className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium flex items-center"
                    onClick={() => {
                      console.log("Set as Pickup clicked");
                      if (popupLocation && onLocationSelect) {
                        const location = {
                          address: popupLocation.formatted_address || "Selected location",
                          coordinates: {
                            lat: popupLocation.lat,
                            lng: popupLocation.lng
                          },
                          name: popupLocation.name || "Selected location",
                          formatted_address: popupLocation.formatted_address || "Selected location",
                          place_id: popupLocation.place_id || ""
                        };
                        
                        // Provide voice feedback if accessibility is enabled - using ref to prevent re-renders
                        if (accessibilityEnabledRef.current) {
                          VoiceGuidance.announceLocationSelection(
                            location,
                            'pickup'
                          );
                        }
                        
                        onLocationSelect(location, 'pickup');
                        setPopupLocation(null); // Close popup after selection
                      }
                    }}
                    aria-label={`Set ${popupLocation?.formatted_address || 'selected location'} as pickup location`}
                  >
                    <span className="mr-2">📍</span> Set as Pickup Location
                  </button>
                  
                  <button 
                    type="button"
                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium flex items-center"
                    onClick={() => {
                      console.log("Set as Dropoff clicked");
                      if (popupLocation && onLocationSelect) {
                        const location = {
                          address: popupLocation.formatted_address || "Selected location",
                          coordinates: {
                            lat: popupLocation.lat,
                            lng: popupLocation.lng
                          },
                          name: popupLocation.name || "Selected location",
                          formatted_address: popupLocation.formatted_address || "Selected location",
                          place_id: popupLocation.place_id || ""
                        };
                        
                        // Provide voice feedback if accessibility is enabled - using ref to prevent re-renders
                        if (accessibilityEnabledRef.current) {
                          VoiceGuidance.announceLocationSelection(
                            location,
                            'dropoff'
                          );
                        }
                        
                        onLocationSelect(location, 'dropoff');
                        setPopupLocation(null); // Close popup after selection
                      }
                    }}
                    aria-label={`Set ${popupLocation?.formatted_address || 'selected location'} as dropoff location`}
                  >
                    <span className="mr-2">📍</span> Set as Dropoff Location
                  </button>
                </div>
              </div>
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