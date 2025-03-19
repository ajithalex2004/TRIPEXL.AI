import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LoadScriptNext, GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { routeOptimizer } from "@/services/route-optimizer";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";

const defaultCenter = {
  lat: 25.2048,
  lng: 55.2708
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places", "geometry"];

const MAPS_API_KEY = "AIzaSyAx8e4WQYlhtpMULTyVwAhaq17oxoU6Q-Y";

export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface MapViewProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
}

export function MapView({
  pickupLocation,
  dropoffLocation,
  onLocationSelect
}: MapViewProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<string[]>([]);
  const [trafficAlerts, setTrafficAlerts] = useState<string[]>([]);
  const [segmentAnalysis, setSegmentAnalysis] = useState<string[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapsInitialized, setMapsInitialized] = useState(false);

  // Clear states when locations change
  useEffect(() => {
    setDirections(null);
    setWeatherAlerts([]);
    setTrafficAlerts([]);
    setSegmentAnalysis([]);
    setMapError(null);
  }, [pickupLocation, dropoffLocation]);

  // Only attempt route optimization when both locations are set
  useEffect(() => {
    if (!pickupLocation?.coordinates || !dropoffLocation?.coordinates || !map || !mapsInitialized) {
      return;
    }

    const updateRoute = async () => {
      try {
        setIsLoading(true);
        setMapError(null);
        const result = await routeOptimizer.getOptimizedRoute(pickupLocation, dropoffLocation);
        setDirections(result.route);
        setWeatherAlerts(result.weatherAlerts);
        setTrafficAlerts(result.trafficAlerts);
        setSegmentAnalysis(result.segmentAnalysis);
      } catch (error: any) {
        console.error("Error optimizing route:", error);
        // Only show error if both locations are set
        if (pickupLocation && dropoffLocation) {
          setMapError("Unable to calculate route. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(updateRoute, 500); // Add debounce
    return () => clearTimeout(timeoutId);
  }, [pickupLocation, dropoffLocation, map, mapsInitialized]);

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !onLocationSelect || !mapsInitialized) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    try {
      setIsLoading(true);
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });

      if (result.results[0]) {
        const newLocation: Location = {
          address: result.results[0].formatted_address,
          coordinates: { lat, lng }
        };

        // Determine which location to update based on which one is missing
        if (!pickupLocation) {
          onLocationSelect(newLocation, 'pickup');
        } else if (!dropoffLocation) {
          onLocationSelect(newLocation, 'dropoff');
        }
      }
    } catch (error) {
      console.error("Error getting address:", error);
      const newLocation: Location = {
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        coordinates: { lat, lng }
      };
      if (!pickupLocation) {
        onLocationSelect(newLocation, 'pickup');
      } else if (!dropoffLocation) {
        onLocationSelect(newLocation, 'dropoff');
      }
    } finally {
      setIsLoading(false);
    }
  }, [pickupLocation, dropoffLocation, onLocationSelect, mapsInitialized]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setMapsInitialized(true);
  }, []);

  return (
    <Card className="p-4 h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <VehicleLoadingIndicator size="lg" />
        </div>
      )}

      {!mapsInitialized && (
        <Alert variant="default" className="mb-4">
          <AlertDescription>
            Loading map...
          </AlertDescription>
        </Alert>
      )}

      <LoadScriptNext
        googleMapsApiKey={MAPS_API_KEY}
        libraries={libraries}
        loadingElement={
          <div className="h-full flex items-center justify-center">
            <VehicleLoadingIndicator size="lg" />
          </div>
        }
        onLoad={handleMapLoad}
        onError={(error) => {
          console.error("Error loading Google Maps:", error);
          setMapError("Failed to load Google Maps. Please refresh the page.");
        }}
      >
        <div className="h-[400px] relative">
          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '100%',
              borderRadius: '8px'
            }}
            center={
              pickupLocation?.coordinates || 
              dropoffLocation?.coordinates || 
              defaultCenter
            }
            zoom={13}
            onClick={handleMapClick}
            onLoad={handleMapLoad}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false
            }}
          >
            {pickupLocation && (
              <Marker
                position={pickupLocation.coordinates}
                label={{
                  text: "P",
                  color: "white",
                  className: "font-bold"
                }}
              />
            )}
            {dropoffLocation && (
              <Marker
                position={dropoffLocation.coordinates}
                label={{
                  text: "D",
                  color: "white",
                  className: "font-bold"
                }}
              />
            )}
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        </div>
      </LoadScriptNext>

      {mapError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{mapError}</AlertDescription>
        </Alert>
      )}

      {(weatherAlerts.length > 0 || trafficAlerts.length > 0 || segmentAnalysis.length > 0) && (
        <div className="mt-4 space-y-2">
          {weatherAlerts.map((alert, index) => (
            <Alert key={`weather-${index}`} variant="destructive">
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
          {trafficAlerts.map((alert, index) => (
            <Alert key={`traffic-${index}`} variant="destructive">
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
          {segmentAnalysis.map((analysis, index) => (
            <Alert key={`segment-${index}`} variant="default">
              <AlertDescription>{analysis}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </Card>
  );
}