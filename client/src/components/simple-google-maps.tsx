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
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // UAE default center
  const defaultCenter = { lat: 24.466667, lng: 54.366667 };

  // Log API key availability for debugging
  useEffect(() => {
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    console.log("Google Maps API Key:", API_KEY ? `exists with length ${API_KEY.length}` : "missing");
  }, []);

  // Load the Google Maps script manually
  useEffect(() => {
    // Debug which approach we're taking
    console.log("Initializing map with direct script loading approach");

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded, initializing map");
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Get API key
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!API_KEY) {
      console.error("Google Maps API key missing");
      setError("Google Maps API key is missing");
      setIsLoading(false);
      return;
    }

    // Remove any existing script to prevent duplicates
    const existingScript = document.getElementById('google-maps-api');
    if (existingScript) {
      existingScript.remove();
    }

    // Create global callback function
    window.initMap = () => {
      console.log("Google Maps script loaded via callback");
      setIsLoaded(true);
      setIsLoading(false);
    };

    // Create and load script
    const script = document.createElement('script');
    script.id = 'google-maps-api';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = (e) => {
      console.error("Error loading Google Maps script:", e);
      setError("Failed to load Google Maps API");
      setIsLoading(false);
    };
    
    document.head.appendChild(script);

    return () => {
      // Clean up
      if (window.initMap) {
        window.initMap = undefined;
      }
      if (document.getElementById('google-maps-api')) {
        document.getElementById('google-maps-api')?.remove();
      }
    };
  }, []);

  // Initialize the map when everything is ready
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google?.maps) {
      return;
    }

    try {
      // Log that we're creating the map
      console.log("Creating Google Maps instance");
      
      // Create the map
      const mapOptions: google.maps.MapOptions = {
        center: defaultCenter,
        zoom: 10,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
      };

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      console.log("Google Maps instance created successfully");

    } catch (err) {
      console.error("Error creating map:", err);
      setError(`Failed to initialize map: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, mapRef]);

  // Add markers and routes when map is ready and locations change
  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // Clear existing markers
    map.data?.forEach((feature) => {
      map.data?.remove(feature);
    });

    // Add markers
    if (pickupLocation) {
      new window.google.maps.Marker({
        position: pickupLocation.coordinates,
        map,
        title: 'Pickup',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }
      });
    }

    if (dropoffLocation) {
      new window.google.maps.Marker({
        position: dropoffLocation.coordinates,
        map,
        title: 'Dropoff',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
      });
    }

    // Draw route if both locations are set
    if (pickupLocation && dropoffLocation) {
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#0000FF',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });

      const waypointsList = waypoints.map(wp => ({
        location: new window.google.maps.LatLng(wp.coordinates.lat, wp.coordinates.lng),
        stopover: true
      }));

      directionsService.route({
        origin: new window.google.maps.LatLng(pickupLocation.coordinates.lat, pickupLocation.coordinates.lng),
        destination: new window.google.maps.LatLng(dropoffLocation.coordinates.lat, dropoffLocation.coordinates.lng),
        waypoints: waypointsList,
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
        }
      });
    }
  }, [map, pickupLocation, dropoffLocation, waypoints]);

  // Add click listener for location selection
  useEffect(() => {
    if (!map || !editable || !onLocationSelect) return;

    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: e.latLng.toJSON() }, (results, status) => {
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
          
          const type = window.confirm('Set as pickup location? (Cancel for dropoff)') 
            ? 'pickup' 
            : 'dropoff';
          onLocationSelect(location, type);
        }
      });
    });

    return () => {
      window.google.maps.event.removeListener(clickListener);
    };
  }, [map, editable, onLocationSelect]);

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
    <Card className="overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
          <VehicleLoadingIndicator />
        </div>
      )}
      <div 
        ref={mapRef}
        style={{ 
          width: '100%', 
          height: '500px',
          position: 'relative',
          backgroundColor: '#f1f5f9' 
        }}
      >
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p>Loading Google Maps...</p>
          </div>
        )}
      </div>
      {editable && (
        <div className="p-4 text-xs text-slate-500">
          <p>Click on the map to select pickup and dropoff locations</p>
        </div>
      )}
    </Card>
  );
};

// Define global interface for window with Google Maps-related properties
declare global {
  interface Window {
    initGoogleMap?: () => void;
    initMap?: () => void;
    google?: any;
  }
}

export default SimpleGoogleMaps;