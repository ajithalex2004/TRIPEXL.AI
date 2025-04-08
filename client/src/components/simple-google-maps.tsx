import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { AlertCircle } from "lucide-react";
import MapFallback from "@/components/map-fallback";

// Simple interface for location
interface Location {
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
  pickupLocation?: Location;
  dropoffLocation?: Location;
  waypoints?: Location[];
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff' | 'waypoint') => void;
  editable?: boolean;
}

const SimpleGoogleMaps: React.FC<SimpleGoogleMapsProps> = ({
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onLocationSelect,
  editable = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // UAE default center
  const defaultCenter = { lat: 24.466667, lng: 54.366667 };

  // Load the map API and initialize
  useEffect(() => {
    // Skip if already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      setIsLoading(false);
      initializeMap();
      return;
    }

    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!API_KEY) {
      setError("Google Maps API key is missing");
      setIsLoading(false);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;

    // Create global callback
    window.initGoogleMap = () => {
      setIsLoaded(true);
      setIsLoading(false);
      initializeMap();
    };

    // Handle errors
    script.onerror = () => {
      setError("Failed to load Google Maps API");
      setIsLoading(false);
    };

    // Add to DOM
    document.head.appendChild(script);

    // Cleanup
    return () => {
      // Use type assertion for safer deletion
      if ('initGoogleMap' in window) {
        delete (window as any).initGoogleMap;
      }
      const scriptElement = document.getElementById('google-maps-script');
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, []);

  // Initialize map when loaded
  const initializeMap = () => {
    if (!mapContainerRef.current || !window.google || !window.google.maps) {
      return;
    }

    try {
      const mapDiv = mapContainerRef.current.querySelector('.map-container') as HTMLElement;
      if (!mapDiv) return;

      const mapOptions: google.maps.MapOptions = {
        center: defaultCenter,
        zoom: 10,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      };

      const map = new google.maps.Map(mapDiv, mapOptions);
      googleMapRef.current = map;

      // Add markers if available
      if (pickupLocation) {
        new google.maps.Marker({
          position: pickupLocation.coordinates,
          map,
          title: 'Pickup Location',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
          }
        });
      }

      if (dropoffLocation) {
        new google.maps.Marker({
          position: dropoffLocation.coordinates,
          map,
          title: 'Dropoff Location',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        });
      }

      // Add click listener for selecting locations
      if (editable) {
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: e.latLng }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const location: Location = {
                address: results[0].formatted_address,
                coordinates: {
                  lat: e.latLng!.lat(),
                  lng: e.latLng!.lng()
                },
                place_id: results[0].place_id,
                formatted_address: results[0].formatted_address
              };
              
              // Prompt which location to set
              if (onLocationSelect) {
                const type = window.confirm('Set as pickup location? (Cancel for dropoff)') 
                  ? 'pickup' 
                  : 'dropoff';
                onLocationSelect(location, type);
              }
            }
          });
        });
      }

      // If both points exist, draw a route
      if (pickupLocation && dropoffLocation) {
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true, // We already have markers
          polylineOptions: {
            strokeColor: '#0000FF',
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });

        const waypointsList = waypoints.map(wp => ({
          location: new google.maps.LatLng(wp.coordinates.lat, wp.coordinates.lng),
          stopover: true
        }));

        directionsService.route({
          origin: new google.maps.LatLng(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng),
          destination: new google.maps.LatLng(dropoffLocation.coordinates.lat, dropoffLocation.coordinates.lng),
          waypoints: waypointsList,
          optimizeWaypoints: false,
          travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
          }
        });
      }
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }
  };

  // Show fallback if errors occur
  if (error) {
    return (
      <Card className="overflow-hidden">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Map Error</AlertTitle>
          <AlertDescription>
            {error}. Using fallback view.
          </AlertDescription>
        </Alert>
        <MapFallback
          message="Using a simplified map view due to temporary issues with map loading. All booking functionality is still available."
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          waypoints={waypoints}
          onSelectPickup={onLocationSelect ? () => {
            const address = prompt("Enter pickup address:");
            if (address) {
              const location: Location = {
                address,
                coordinates: { lat: 24.466667, lng: 54.366667 }
              };
              onLocationSelect(location, 'pickup');
            }
          } : undefined}
          onSelectDropoff={onLocationSelect ? () => {
            const address = prompt("Enter dropoff address:");
            if (address) {
              const location: Location = {
                address,
                coordinates: { lat: 25.276987, lng: 55.296249 }
              };
              onLocationSelect(location, 'dropoff');
            }
          } : undefined}
        />
      </Card>
    );
  }

  return (
    <Card ref={mapContainerRef} className="overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
          <VehicleLoadingIndicator />
        </div>
      )}
      <div 
        className="map-container" 
        style={{ 
          width: '100%', 
          height: '500px',
          position: 'relative'
        }}
      >
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p>Loading Google Maps...</p>
          </div>
        )}
      </div>
      {editable && (
        <div className="p-4 text-xs text-slate-500">
          <p>Click on the map to select locations.</p>
        </div>
      )}
    </Card>
  );
};

// Add the global initGoogleMap function to the window object
// Define global interface for window
declare global {
  interface Window {
    initGoogleMap?: () => void;
    google?: any;
  }
}

export default SimpleGoogleMaps;