import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LoadScriptNext, GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { routeOptimizer } from "@/services/route-optimizer";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { Button } from "@/components/ui/button";

const defaultCenter = {
  lat: 25.2048,
  lng: 55.2708
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

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
  const [isLimitedMode, setIsLimitedMode] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Check API key on mount
  useEffect(() => {
    if (!apiKey) {
      setIsLimitedMode(true);
      setIsLoading(false);
    }
  }, [apiKey]);

  // Update route when both locations are set
  useEffect(() => {
    if (!pickupLocation?.coordinates || !dropoffLocation?.coordinates || !map || isLimitedMode) {
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
      } catch (error) {
        console.error("Error optimizing route:", error);
        setMapError("Failed to optimize route. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    updateRoute();
  }, [pickupLocation, dropoffLocation, map, isLimitedMode]);

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

      // In limited mode, just use coordinates without geocoding
      if (isLimitedMode) {
        const newLocation: Location = {
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          coordinates: { lat, lng }
        };

        if (activeLocation === "pickup") {
          onPickupSelect(newLocation);
        } else {
          onDropoffSelect(newLocation);
        }
        return;
      }

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
      setMapError("Failed to get location address. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeLocation, onPickupSelect, onDropoffSelect, isLimitedMode]);

  const mapContent = (
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
        {!isLimitedMode && directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </div>
  );

  return (
    <Card className="p-4 h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <VehicleLoadingIndicator size="lg" />
        </div>
      )}

      {isLimitedMode ? (
        <>
          <Alert variant="warning" className="mb-4">
            <AlertDescription>
              Limited functionality mode: Some features like route optimization and weather alerts are disabled. 
              Click on the map to set pickup and dropoff points.
            </AlertDescription>
          </Alert>
          {mapContent}
        </>
      ) : (
        <LoadScriptNext 
          googleMapsApiKey={apiKey || ""}
          libraries={libraries}
          loadingElement={
            <div className="h-full flex items-center justify-center">
              <VehicleLoadingIndicator size="lg" />
            </div>
          }
        >
          {mapContent}
        </LoadScriptNext>
      )}

      {!isLimitedMode && (weatherAlerts.length > 0 || trafficAlerts.length > 0 || segmentAnalysis.length > 0) && (
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