import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  AlertTriangle, 
  Car, 
  LocateFixed, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Eye,
  RotateCw,
  CornerRightDown,
  Route,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getGoogleMapsApiKey } from '@/lib/map-config';
import { WeatherEventOverlay } from '@/components/weather-event-overlay';
import { Button } from '@/components/ui/button';
import { FallbackLocationSelector } from '@/components/fallback-location-selector';
import { UAELocationSearch } from '@/components/uae-location-search';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the common Location interface
export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
  district?: string;
  city?: string;
  area?: string;
  place_types?: string[];
}

interface MapViewProps {
  apiKey: string;
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  waypoints?: Location[];
  className?: string;
  editable?: boolean;
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
  onRouteCalculated?: (durationSeconds: number, distanceMeters: number) => void;
}

export function MapViewNew({
  apiKey: providedApiKey,
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  className = '',
  editable = false,
  onLocationSelect,
  onRouteCalculated
}: MapViewProps) {
  // Use provided API key or fall back to centralized key
  const apiKey = providedApiKey || getGoogleMapsApiKey();
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<boolean>(false);
  const [clickedLocation, setClickedLocation] = useState<Location | null>(null);
  const [showLocationButtons, setShowLocationButtons] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [estimatedTrafficTime, setEstimatedTrafficTime] = useState<number | null>(null);
  const [estimatedBaseTime, setEstimatedBaseTime] = useState<number | null>(null);
  
  // Log available key
  useEffect(() => {
    console.log("Google Maps API Key available:", apiKey ? "Yes (key length: " + apiKey.length + ")" : "No");
  }, [apiKey]);

  // Initialize the map
  useEffect(() => {
    if (!apiKey || !mapRef.current || map) return;

    const initializeMap = () => {
      try {
        // Create a new map instance
        const newMap = new window.google.maps.Map(mapRef.current!, {
          center: { lat: 25.276987, lng: 55.296249 }, // Dubai
          zoom: 10,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true
        });
        
        setMap(newMap);
        
        // Add click handler if editable
        if (editable && onLocationSelect) {
          newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const clickedPosition = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              };
              
              // Reverse geocode to get the address
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode({ location: clickedPosition }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  // Extract district, city, and area
                  let district = '';
                  let city = '';
                  let area = '';
                  
                  if (results[0].address_components) {
                    for (const component of results[0].address_components) {
                      if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
                        area = component.long_name;
                      } else if (component.types.includes('locality')) {
                        city = component.long_name;
                      } else if (component.types.includes('administrative_area_level_1')) {
                        district = component.long_name;
                      }
                    }
                  }
                  
                  // Create location object
                  const location: Location = {
                    address: results[0].formatted_address || '',
                    coordinates: clickedPosition,
                    place_id: results[0].place_id || '',
                    name: area || city || district || 'Selected Location',
                    formatted_address: results[0].formatted_address || '',
                    district: district || undefined,
                    city: city || undefined,
                    area: area || undefined,
                    place_types: results[0].types || []
                  };
                  
                  setClickedLocation(location);
                  setShowLocationButtons(true);
                } else {
                  // Fallback location
                  const fallbackLocation: Location = {
                    address: `Location at ${clickedPosition.lat.toFixed(6)}, ${clickedPosition.lng.toFixed(6)}`,
                    coordinates: clickedPosition,
                    name: 'Selected Location',
                    formatted_address: `Coordinates: ${clickedPosition.lat.toFixed(6)}, ${clickedPosition.lng.toFixed(6)}`
                  };
                  
                  setClickedLocation(fallbackLocation);
                  setShowLocationButtons(true);
                }
              });
            }
          });
        }
        
        console.log("Map initialized successfully!");
      } catch (error) {
        console.error("Failed to initialize map:", error);
        setMapError(true);
      }
    };

    // Define the callback function for when the API loads
    window.initMap = initializeMap;

    // Check if the API is already loaded
    if (window.google?.maps) {
      initializeMap();
      return;
    }

    // Load the API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error("Failed to load Google Maps API");
      setMapError(true);
    };
    
    document.head.appendChild(script);

    return () => {
      // Clean up
      if (window.initMap) {
        // @ts-ignore - Clean up global function
        window.initMap = undefined;
      }
      
      // Remove script if it exists
      const scriptElement = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
    };
  }, [apiKey, editable, onLocationSelect, map]);

  // Add markers for pickup and dropoff
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers
    map.data.forEach(feature => {
      map.data.remove(feature);
    });
    
    // Add pickup marker
    if (pickupLocation?.coordinates) {
      const pickupFeature = new google.maps.Data.Feature({
        geometry: new google.maps.Data.Point(
          new google.maps.LatLng(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng)
        ),
        properties: { type: 'pickup' }
      });
      map.data.add(pickupFeature);
    }
    
    // Add dropoff marker
    if (dropoffLocation?.coordinates) {
      const dropoffFeature = new google.maps.Data.Feature({
        geometry: new google.maps.Data.Point(
          new google.maps.LatLng(dropoffLocation.coordinates.lat, dropoffLocation.coordinates.lng)
        ),
        properties: { type: 'dropoff' }
      });
      map.data.add(dropoffFeature);
    }
    
    // Style the markers
    map.data.setStyle(feature => {
      const type = feature.getProperty('type');
      return {
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: type === 'pickup' ? '#10b981' : '#ef4444', // Green for pickup, Red for dropoff
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      };
    });
    
    // Set appropriate bounds
    if (pickupLocation?.coordinates || dropoffLocation?.coordinates) {
      const bounds = new google.maps.LatLngBounds();
      
      if (pickupLocation?.coordinates) {
        bounds.extend(new google.maps.LatLng(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng));
      }
      
      if (dropoffLocation?.coordinates) {
        bounds.extend(new google.maps.LatLng(dropoffLocation.coordinates.lat, dropoffLocation.coordinates.lng));
      }
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        
        // Don't zoom in too far
        const currentZoom = map.getZoom();
        if (currentZoom !== undefined && currentZoom > 16) {
          map.setZoom(16);
        }
      }
    }
    
    // Calculate route if we have both pickup and dropoff
    if (pickupLocation?.coordinates && dropoffLocation?.coordinates) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true, // We'll use custom markers
        polylineOptions: {
          strokeColor: '#3b82f6', // Blue color
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });
      
      const directionsWaypoints = waypoints.map(waypoint => ({
        location: waypoint.coordinates,
        stopover: true
      }));
      
      directionsService.route(
        {
          origin: pickupLocation.coordinates,
          destination: dropoffLocation.coordinates,
          waypoints: directionsWaypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
            setRouteError(null);
            
            // Notify parent component of route calculations
            if (onRouteCalculated && result.routes && result.routes.length > 0) {
              const route = result.routes[0];
              let totalDuration = 0;
              let totalDistance = 0;
              
              if (route.legs) {
                for (const leg of route.legs) {
                  if (leg.duration) {
                    totalDuration += leg.duration.value; // seconds
                  }
                  if (leg.distance) {
                    totalDistance += leg.distance.value; // meters
                  }
                }
              }
              
              // Call the callback with route duration and distance
              onRouteCalculated(totalDuration, totalDistance);
            }
          } else {
            console.error('Error calculating route:', status);
            setRouteError('Could not calculate route between the selected locations.');
          }
        }
      );
    }
  }, [map, pickupLocation, dropoffLocation, waypoints, onRouteCalculated]);

  return (
    <Card className={`overflow-hidden border shadow-sm ${className}`}>
      <CardContent className="p-0">
        {mapError ? (
          <FallbackLocationSelector
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            onLocationSelect={onLocationSelect || ((location, type) => {
              console.log('No location select handler provided');
            })}
            className={className}
          />
        ) : (
          <div className="relative">
            {/* UAE Location Search Bar */}
            {editable && onLocationSelect && (
              <div className="absolute top-2 left-2 right-2 z-20 flex gap-2">
                <div className="flex-1 bg-white/95 rounded-md shadow-md overflow-hidden">
                  <div className="p-2 flex gap-2">
                    <div className="flex-1">
                      <UAELocationSearch 
                        onLocationSelect={(location) => {
                          // Show selection buttons to determine if this is pickup or dropoff
                          setClickedLocation(location);
                          setShowLocationButtons(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Map control buttons */}
            <div className="absolute right-2 top-14 z-10 flex flex-col gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 bg-white/80 backdrop-blur-sm shadow-sm"
                      onClick={() => {
                        if (map) {
                          map.setZoom((map.getZoom() || 10) + 1);
                        }
                      }}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Zoom In</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 bg-white/80 backdrop-blur-sm shadow-sm"
                      onClick={() => {
                        if (map) {
                          map.setZoom((map.getZoom() || 10) - 1);
                        }
                      }}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Zoom Out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 bg-white/80 backdrop-blur-sm shadow-sm"
                      onClick={() => {
                        if (navigator.geolocation && map) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const userLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                              };
                              map.setCenter(userLocation);
                              map.setZoom(15);
                              
                              // Optionally create a user marker
                              const userMarker = new google.maps.Marker({
                                position: userLocation,
                                map: map,
                                icon: {
                                  path: google.maps.SymbolPath.CIRCLE,
                                  scale: 7,
                                  fillColor: '#3b82f6',
                                  fillOpacity: 1,
                                  strokeColor: '#ffffff',
                                  strokeWeight: 2
                                },
                                title: 'Your Location'
                              });
                              
                              // Auto-remove after 5 seconds
                              setTimeout(() => userMarker.setMap(null), 5000);
                            },
                            (error) => {
                              console.error('Error getting user location', error);
                              toast({
                                title: 'Location access denied',
                                description: 'Please enable location services to use this feature.',
                                variant: 'destructive'
                              });
                            }
                          );
                        } else {
                          toast({
                            title: 'Geolocation not supported',
                            description: 'Your browser does not support geolocation.',
                            variant: 'destructive'
                          });
                        }
                      }}
                    >
                      <LocateFixed className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>My Location</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 bg-white/80 backdrop-blur-sm shadow-sm"
                      onClick={() => {
                        if (!map) return;
                        
                        map.setMapTypeId(
                          map.getMapTypeId() === 'roadmap' ? 'satellite' : 'roadmap'
                        );
                      }}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Toggle Map Type</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant={showTraffic ? "default" : "outline"}
                      className={`h-8 w-8 ${showTraffic ? "bg-blue-600" : "bg-white/80 backdrop-blur-sm"} shadow-sm`}
                      onClick={() => {
                        if (!map) return;
                        
                        if (!showTraffic) {
                          // Turn on traffic layer
                          const trafficLayer = new google.maps.TrafficLayer();
                          trafficLayer.setMap(map);
                          
                          // Optionally calculate route with traffic
                          if (pickupLocation?.coordinates && dropoffLocation?.coordinates) {
                            const directionsService = new google.maps.DirectionsService();
                            
                            // First, get the route without traffic
                            directionsService.route(
                              {
                                origin: pickupLocation.coordinates,
                                destination: dropoffLocation.coordinates,
                                travelMode: google.maps.TravelMode.DRIVING,
                                drivingOptions: {
                                  departureTime: new Date(),
                                  trafficModel: google.maps.TrafficModel.BEST_GUESS
                                }
                              },
                              (result, status) => {
                                if (status === google.maps.DirectionsStatus.OK && result) {
                                  if (result.routes && result.routes[0] && result.routes[0].legs) {
                                    const route = result.routes[0];
                                    const leg = route.legs[0];
                                    
                                    if (leg.duration_in_traffic && leg.duration) {
                                      setEstimatedTrafficTime(leg.duration_in_traffic.value);
                                      setEstimatedBaseTime(leg.duration.value);
                                    }
                                  }
                                }
                              }
                            );
                          }
                          
                          // Update state
                          setShowTraffic(true);
                        } else {
                          // Turn off traffic layer
                          const trafficLayer = new google.maps.TrafficLayer();
                          trafficLayer.setMap(null);
                          
                          // Reset traffic estimates
                          setEstimatedTrafficTime(null);
                          setEstimatedBaseTime(null);
                          
                          // Update state
                          setShowTraffic(false);
                        }
                      }}
                    >
                      <Car className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Toggle Traffic Layer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {pickupLocation && dropoffLocation && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 bg-white/80 backdrop-blur-sm shadow-sm"
                        onClick={() => {
                          if (!map || !pickupLocation || !dropoffLocation) return;
                          
                          const bounds = new google.maps.LatLngBounds();
                          bounds.extend(new google.maps.LatLng(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng));
                          bounds.extend(new google.maps.LatLng(dropoffLocation.coordinates.lat, dropoffLocation.coordinates.lng));
                          
                          map.fitBounds(bounds);
                        }}
                      >
                        <Route className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Show Full Route</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div 
              ref={mapRef} 
              style={{ width: '100%', height: '600px' }}
            />
          </div>
        )}
        
        {routeError && (
          <div className="bg-amber-50 p-2 text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {routeError}
          </div>
        )}
        
        {/* Traffic info banner when traffic mode is enabled */}
        {showTraffic && estimatedTrafficTime && estimatedBaseTime && (
          <div className="absolute top-14 left-2 z-10 w-64">
            <Card className="bg-white/90 backdrop-blur-sm shadow-md border-blue-100">
              <CardContent className="p-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-900">Real-time Traffic</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">LIVE</span>
                  </div>
                  
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        Normal time:
                      </span>
                      <span className="font-medium">
                        {Math.floor(estimatedBaseTime / 60)} mins
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <Car className="h-3.5 w-3.5 mr-1.5" />
                        With traffic:
                      </span>
                      <span className={`font-medium ${estimatedTrafficTime > estimatedBaseTime ? 'text-red-600' : 'text-green-600'}`}>
                        {Math.floor(estimatedTrafficTime / 60)} mins
                      </span>
                    </div>
                    
                    {estimatedTrafficTime !== estimatedBaseTime && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t">
                        <span className="text-gray-500">
                          {estimatedTrafficTime > estimatedBaseTime ? 'Delay:' : 'Time saved:'}
                        </span>
                        <span className={`font-medium ${estimatedTrafficTime > estimatedBaseTime ? 'text-red-600' : 'text-green-600'}`}>
                          {Math.abs(Math.floor((estimatedTrafficTime - estimatedBaseTime) / 60))} mins
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Weather and events overlay */}
        {(pickupLocation || dropoffLocation) && (
          <div className="absolute bottom-2 left-2 right-2 lg:w-80 lg:left-auto z-10">
            <WeatherEventOverlay 
              coordinates={pickupLocation?.coordinates || dropoffLocation?.coordinates}
            />
          </div>
        )}
        
        {editable && (
          <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
              <span>Pickup {pickupLocation ? "Set" : "Not Set"}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
              <span>Dropoff {dropoffLocation ? "Set" : "Not Set"}</span>
            </div>
          </div>
        )}
        
        {/* Set as Pickup/Dropoff buttons when a location is clicked */}
        {editable && showLocationButtons && clickedLocation && onLocationSelect && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-20">
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-600 font-medium text-center mb-1">
                {clickedLocation.address || "Selected Location"}
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 h-8 px-3 py-1"
                  onClick={() => {
                    if (onLocationSelect && clickedLocation) {
                      onLocationSelect(clickedLocation, 'pickup');
                      setShowLocationButtons(false);
                    }
                  }}
                >
                  <MapPin className="h-3.5 w-3.5 text-green-500" />
                  Set as Pickup
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 h-8 px-3 py-1"
                  onClick={() => {
                    if (onLocationSelect && clickedLocation) {
                      onLocationSelect(clickedLocation, 'dropoff');
                      setShowLocationButtons(false);
                    }
                  }}
                >
                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                  Set as Dropoff
                </Button>
              </div>
              <Button 
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setShowLocationButtons(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Add a global declaration for the initMap callback
declare global {
  interface Window {
    initMap?: () => void;
    google?: any;
  }
}

export default MapViewNew;