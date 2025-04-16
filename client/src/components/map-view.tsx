import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { OptimizedGoogleMap } from '@/components/maps';
import { MapWorker } from '@/components/maps';
import { AntiFreezeWrapper } from '@/components/anti-freeze-wrapper';
import { MapPin, AlertTriangle, MapIcon, Navigation, Map, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getGoogleMapsApiKey } from '@/lib/map-config';
import { StaticMapFallback } from '@/components/static-map-fallback';
import { SimpleIframeMap } from '@/components/simple-iframe-map';
import { WeatherEventOverlay } from '@/components/weather-event-overlay';
import { Button } from '@/components/ui/button';

// Define the common Location interface used throughout the application
export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  // Optional additional location fields used in UAE-specific components
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

export function MapView({
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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<boolean>(false);
  const [useStaticFallback, setUseStaticFallback] = useState<boolean>(false);
  const [useIframeMap, setUseIframeMap] = useState<boolean>(false);
  const [clickedLocation, setClickedLocation] = useState<Location | null>(null);
  const [showLocationButtons, setShowLocationButtons] = useState<boolean>(false);
  
  // Log available key
  useEffect(() => {
    console.log("Google Maps API Key available:", apiKey ? "Yes (key length: " + apiKey.length + ")" : "No");
    console.log("Using environment variable:", apiKey === import.meta.env.VITE_GOOGLE_MAPS_KEY ? "Yes" : "No");
  }, [apiKey]);

  // Initialize directions services when map is loaded
  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    try {
      // Initialize directions services
      const newDirectionsService = new google.maps.DirectionsService();
      const newDirectionsRenderer = new google.maps.DirectionsRenderer({
        map: mapInstance,
        suppressMarkers: true, // We'll use custom markers
        polylineOptions: {
          strokeColor: '#3b82f6', // Blue color
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });
      
      setDirectionsService(newDirectionsService);
      setDirectionsRenderer(newDirectionsRenderer);
    } catch (error) {
      console.error('Error initializing directions services:', error);
      toast({
        title: "Map initialization error",
        description: "There was a problem initializing the map navigation services. Please refresh the page.",
        variant: "destructive"
      });
    }
  }, []);
  
  // Clean up when component unmounts
  const handleMapUnmount = useCallback(() => {
    // Clear markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
    
    // Clear directions
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
    }
    
    setMap(null);
    setDirectionsService(null);
    setDirectionsRenderer(null);
  }, [markers, directionsRenderer]);
  
  // Handle map click events when in editable mode
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!editable || !onLocationSelect || !e.latLng) return;
    
    // Get clicked coordinates
    const clickedPosition = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    
    // Reverse geocode to get the address of the clicked location
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: clickedPosition }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        // Extract district, city, and area from address components
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
        
        // Create location object with the clicked position
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
        
        // Save the clicked location and show the action buttons
        setClickedLocation(location);
        setShowLocationButtons(true);
        
      } else {
        console.error('Geocoder failed:', status);
        // Even if geocoding fails, we can still create a basic location
        const fallbackLocation: Location = {
          address: `Location at ${clickedPosition.lat.toFixed(6)}, ${clickedPosition.lng.toFixed(6)}`,
          coordinates: clickedPosition,
          name: 'Selected Location',
          formatted_address: `Coordinates: ${clickedPosition.lat.toFixed(6)}, ${clickedPosition.lng.toFixed(6)}`
        };
        
        // Save the clicked location and show the action buttons
        setClickedLocation(fallbackLocation);
        setShowLocationButtons(true);
      }
    });
  }, [editable, onLocationSelect]);
  
  // Update markers and directions when locations change
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];
    
    // Reset route error
    setRouteError(null);
    
    // Add pickup marker if available
    if (pickupLocation?.coordinates) {
      try {
        const pickupMarker = new google.maps.Marker({
          position: pickupLocation.coordinates,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#10b981', // Green
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          title: 'Pickup Location'
        });
        newMarkers.push(pickupMarker);
      } catch (error) {
        console.error('Error creating pickup marker:', error);
      }
    }
    
    // Add waypoint markers if available
    waypoints?.forEach((waypoint, index) => {
      if (!waypoint.coordinates) return;
      
      try {
        const waypointMarker = new google.maps.Marker({
          position: waypoint.coordinates,
          map,
          label: {
            text: (index + 1).toString(),
            color: '#ffffff'
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#f59e0b', // Amber
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          title: `Waypoint ${index + 1}`
        });
        newMarkers.push(waypointMarker);
      } catch (error) {
        console.error(`Error creating waypoint marker ${index}:`, error);
      }
    });
    
    // Add dropoff marker if available
    if (dropoffLocation?.coordinates) {
      try {
        const dropoffMarker = new google.maps.Marker({
          position: dropoffLocation.coordinates,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#ef4444', // Red
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          title: 'Dropoff Location'
        });
        newMarkers.push(dropoffMarker);
      } catch (error) {
        console.error('Error creating dropoff marker:', error);
      }
    }
    
    // Update markers state
    setMarkers(newMarkers);
    
    // Calculate route if we have both pickup and dropoff
    if (
      directionsService && 
      directionsRenderer && 
      pickupLocation?.coordinates && 
      dropoffLocation?.coordinates
    ) {
      // Convert waypoints to DirectionsWaypoint[]
      const directionsWaypoints = waypoints.map(waypoint => ({
        location: waypoint.coordinates,
        stopover: true
      }));
      
      // Calculate route
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
              
              console.log(`Route calculated: ${(totalDistance / 1000).toFixed(1)} km, ${Math.floor(totalDuration / 60)} minutes`);
            }
          } else {
            console.error('Error calculating route:', status);
            // Clear directions with a type assertion
            directionsRenderer.setDirections(null as any);
            setRouteError('Could not calculate route between the selected locations.');
          }
        }
      );
    } else if (directionsRenderer) {
      // Clear route if we don't have both locations
      directionsRenderer.setDirections(null as any);
    }
    
    // Set appropriate bounds
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        if (marker.getPosition()) {
          bounds.extend(marker.getPosition()!);
        }
      });
      
      // Only adjust bounds if we have valid markers
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        
        // Zoom out slightly for better context
        const currentZoom = map.getZoom();
        if (currentZoom !== undefined && currentZoom > 16) {
          map.setZoom(16);
        }
      }
    }
  }, [map, directionsService, directionsRenderer, pickupLocation, dropoffLocation, waypoints, markers]);
  
  // Handle map errors
  const handleMapError = useCallback((error: Error) => {
    console.error('Google Maps error:', error);
    setMapError(true);
    setUseStaticFallback(true);
    toast({
      title: "Map error",
      description: "Interactive map couldn't be loaded. Using static map instead.",
      variant: "destructive"
    });
  }, [toast]);

  // Function to retry loading the interactive map
  const handleRetryInteractiveMap = useCallback(() => {
    setUseStaticFallback(false);
    setMapError(false);
  }, []);

  return (
    <Card className={`overflow-hidden border shadow-sm ${className}`}>
      <CardContent className="p-0">
        {useIframeMap ? (
          // Simple iframe Google Map (most compatible)
          <SimpleIframeMap
            pickupCoordinates={pickupLocation?.coordinates}
            dropoffCoordinates={dropoffLocation?.coordinates}
            className={className}
            height={500}
            editable={editable}
            onLocationSelect={onLocationSelect}
          />
        ) : useStaticFallback ? (
          // Static fallback map (image-based)
          <StaticMapFallback
            pickupCoordinates={pickupLocation?.coordinates}
            dropoffCoordinates={dropoffLocation?.coordinates}
            width={800}
            height={500}
            onRetry={handleRetryInteractiveMap}
            className={className}
          />
        ) : (
          // Interactive JavaScript Google Map (advanced features)
          <AntiFreezeWrapper componentName="Map">
            <MapWorker>
              <OptimizedGoogleMap
                apiKey={apiKey}
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
                onError={handleMapError}
                options={{
                  zoomControl: true,
                  mapTypeControl: true,
                  streetViewControl: false,
                  fullscreenControl: true
                }}
                onClick={editable && onLocationSelect ? (e) => handleMapClick(e) : undefined}
                style={{ height: '600px', width: '100%' }} // Increase map height
              />
            </MapWorker>
          </AntiFreezeWrapper>
        )}
        
        {routeError && (
          <div className="bg-amber-50 p-2 text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {routeError}
          </div>
        )}
        
        {/* Removed the instruction message box */}
        
        {/* Weather and events overlay */}
        {(pickupLocation || dropoffLocation) && (
          <div className="absolute bottom-2 left-2 right-2 lg:w-80 lg:left-auto z-10">
            <WeatherEventOverlay 
              coordinates={pickupLocation?.coordinates || dropoffLocation?.coordinates}
            />
          </div>
        )}
        
        {/* Map type controls */}
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-md text-xs z-10">
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant={useIframeMap ? "default" : "outline"}
              onClick={() => setUseIframeMap(true)}
              className="flex items-center gap-1 h-8 px-2 py-1 text-xs"
            >
              <Map className="h-3.5 w-3.5" />
              Iframe Map
            </Button>
            <Button 
              size="sm" 
              variant={!useIframeMap && !useStaticFallback ? "default" : "outline"}
              onClick={() => {
                setUseIframeMap(false);
                setUseStaticFallback(false);
              }}
              className="flex items-center gap-1 h-8 px-2 py-1 text-xs"
            >
              <MapIcon className="h-3.5 w-3.5" />
              JS Map
            </Button>
            <Button 
              size="sm" 
              variant={!useIframeMap && useStaticFallback ? "default" : "outline"}
              onClick={() => {
                setUseIframeMap(false);
                setUseStaticFallback(true);
              }}
              className="flex items-center gap-1 h-8 px-2 py-1 text-xs"
            >
              <Navigation className="h-3.5 w-3.5" />
              Static
            </Button>
          </div>
        </div>

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