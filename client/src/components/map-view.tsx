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

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

// Use the provided API key
const MAPS_API_KEY = "AIzaSyAtNTq_ILPC8Y5M_bJAiMORDf02sGoK84I";

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
  onPickupSelect: (location: Location) => void;
  onDropoffSelect: (location: Location) => void;
  activeLocation: "pickup" | "dropoff" | null;
}

export function MapView({ 
  pickupLocation, 
  dropoffLocation, 
  onPickupSelect, 
  onDropoffSelect,
  activeLocation 
}: MapViewProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<string[]>([]);
  const [trafficAlerts, setTrafficAlerts] = useState<string[]>([]);
  const [segmentAnalysis, setSegmentAnalysis] = useState<string[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isRouteOptimizationEnabled, setIsRouteOptimizationEnabled] = useState(true);

  // Update route when both locations are set
  useEffect(() => {
    if (!pickupLocation?.coordinates || !dropoffLocation?.coordinates || !map) {
      setDirections(null);
      setWeatherAlerts([]);
      setTrafficAlerts([]);
      setSegmentAnalysis([]);
      return;
    }

    const updateRoute = async () => {
      try {
        setIsLoading(true);
        const result = await routeOptimizer.getOptimizedRoute(pickupLocation, dropoffLocation);
        setDirections(result.route);
        setWeatherAlerts(result.weatherAlerts);
        setTrafficAlerts(result.trafficAlerts);
        setSegmentAnalysis(result.segmentAnalysis);
        setMapError(null);
      } catch (error: any) {
        console.error("Error optimizing route:", error);
        // If we get an authorization error, fallback to basic mode
        if (error.message?.includes("not authorized")) {
          setIsRouteOptimizationEnabled(false);
          // Try basic directions without optimization
          const directionsService = new google.maps.DirectionsService();
          try {
            const result = await directionsService.route({
              origin: pickupLocation.coordinates,
              destination: dropoffLocation.coordinates,
              travelMode: google.maps.TravelMode.DRIVING
            });
            setDirections(result);
            setMapError(null);
          } catch (dirError) {
            setMapError("Unable to calculate route. Please try again.");
          }
        } else {
          setMapError("Failed to optimize route. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    updateRoute();
  }, [pickupLocation, dropoffLocation, map]);

  // Center map on active location
  useEffect(() => {
    if (!map) return;

    if (activeLocation === "pickup" && pickupLocation) {
      map.panTo(pickupLocation.coordinates);
    } else if (activeLocation === "dropoff" && dropoffLocation) {
      map.panTo(dropoffLocation.coordinates);
    }
  }, [activeLocation, pickupLocation, dropoffLocation, map]);

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !activeLocation) return;

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

        if (activeLocation === "pickup") {
          onPickupSelect(newLocation);
        } else {
          onDropoffSelect(newLocation);
        }
        setMapError(null);
      }
    } catch (error) {
      console.error("Error getting address:", error);
      // Fallback to using coordinates as address if geocoding fails
      const newLocation: Location = {
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        coordinates: { lat, lng }
      };
      if (activeLocation === "pickup") {
        onPickupSelect(newLocation);
      } else {
        onDropoffSelect(newLocation);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeLocation, onPickupSelect, onDropoffSelect]);

  return (
    <Card className="p-4 h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <VehicleLoadingIndicator size="lg" />
        </div>
      )}

      {!isRouteOptimizationEnabled && (
        <Alert variant="warning" className="mb-4">
          <AlertDescription>
            Running in basic mode: Route optimization features are currently limited.
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
      >
        <div className="h-[400px] relative">
          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '100%',
              borderRadius: '8px'
            }}
            center={
              activeLocation === "pickup" && pickupLocation?.coordinates
                ? pickupLocation.coordinates
                : activeLocation === "dropoff" && dropoffLocation?.coordinates
                ? dropoffLocation.coordinates
                : defaultCenter
            }
            zoom={13}
            onClick={handleMapClick}
            onLoad={setMap}
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

      {mapError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{mapError}</AlertDescription>
        </Alert>
      )}
    </Card>
  );
}