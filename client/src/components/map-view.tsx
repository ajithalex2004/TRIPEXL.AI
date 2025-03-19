import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LoadScriptNext, GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { routeOptimizer } from "@/services/route-optimizer";

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
  const [trafficAlerts, setTrafficAlerts] = useState<string[]>([]);
  const [mapError, setMapError] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Update route when both locations are set
  useEffect(() => {
    if (!pickupLocation?.coordinates || !dropoffLocation?.coordinates || !map) {
      setDirections(null);
      setTrafficAlerts([]);
      return;
    }

    const updateRoute = async () => {
      try {
        const result = await routeOptimizer.getOptimizedRoute(pickupLocation, dropoffLocation);
        setDirections(result.route);
        setTrafficAlerts(result.trafficAlerts || []);
      } catch (error) {
        console.error("Error optimizing route:", error);
        setMapError(true);
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
      }
    } catch (error) {
      console.error("Error getting address:", error);
      setMapError(true);
    }
  }, [activeLocation, onPickupSelect, onDropoffSelect]);

  return (
    <Card className="p-4 h-full">
      <LoadScriptNext 
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
        libraries={libraries}
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

      {trafficAlerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {trafficAlerts.map((alert, index) => (
            <Alert key={index} variant="warning">
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {mapError && (
        <p className="mt-2 text-xs text-destructive">
          Error loading map. Please check your internet connection and try again.
        </p>
      )}
    </Card>
  );
}