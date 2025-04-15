import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { OptimizedGoogleMap } from '@/components/maps';
import { MapWorker } from '@/components/maps';
import { AntiFreezeWrapper } from '@/components/anti-freeze-wrapper';
import { MapPin, AlertTriangle } from 'lucide-react';

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
}

export function MapView({
  apiKey,
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  className = ''
}: MapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);
  
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
  
  return (
    <Card className={`overflow-hidden border shadow-sm ${className}`}>
      <CardContent className="p-0">
        <AntiFreezeWrapper componentName="Map">
          <MapWorker>
            <OptimizedGoogleMap
              apiKey={apiKey}
              onLoad={handleMapLoad}
              onUnmount={handleMapUnmount}
              options={{
                zoomControl: true,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true
              }}
            />
          </MapWorker>
        </AntiFreezeWrapper>
        
        {routeError && (
          <div className="bg-amber-50 p-2 text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {routeError}
          </div>
        )}
        
        {!pickupLocation && !dropoffLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow text-center">
            <MapPin className="h-10 w-10 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Select pickup and dropoff locations to see the route on the map.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}