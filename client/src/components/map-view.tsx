import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadScriptNext, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { Button } from "@/components/ui/button";

const defaultCenter = {
  lat: 24.4539,  // Abu Dhabi city center
  lng: 54.3773
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places", "geometry"];

const MAPS_API_KEY = "AIzaSyAtNTq_ILPC8Y5M_bJAiMORDf02sGoK84I";

// Abu Dhabi bounds
const ABU_DHABI_BOUNDS = {
  north: 24.6,  // Northern limit
  south: 24.3,  // Southern limit
  east: 54.5,   // Eastern limit
  west: 54.2    // Western limit
};

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
  tempLocation?: Location | null;  // Add this prop
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
}

interface PopupLocation {
  lat: number;
  lng: number;
  address: string;
}

export function MapView({
  pickupLocation,
  dropoffLocation,
  tempLocation, // Added tempLocation
  onLocationSelect
}: MapViewProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapsInitialized, setMapsInitialized] = useState(false);
  const [popupLocation, setPopupLocation] = useState<PopupLocation | null>(null);

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !onLocationSelect || !mapsInitialized) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    try {
      setIsLoading(true);
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });

      if (result.results[0]) {
        setPopupLocation({
          lat,
          lng,
          address: result.results[0].formatted_address
        });
      }
    } catch (error) {
      console.error("Error getting address:", error);
      setPopupLocation({
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationTypeSelect = (type: 'pickup' | 'dropoff') => {
    if (!popupLocation) return;

    const location: Location = {
      address: popupLocation.address,
      coordinates: {
        lat: popupLocation.lat,
        lng: popupLocation.lng
      }
    };

    onLocationSelect?.(location, type);
    setPopupLocation(null);
  };

  const handleMapLoad = (map: google.maps.Map) => {
    setMap(map);
    setMapsInitialized(true);

    // Enable POI visibility and set initial bounds
    map.setOptions({
      styles: [
        {
          featureType: "poi",
          stylers: [{ visibility: "on" }]
        },
        {
          featureType: "poi.business",
          stylers: [{ visibility: "on" }]
        }
      ]
    });

    // Set bounds to Abu Dhabi area
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(ABU_DHABI_BOUNDS.south, ABU_DHABI_BOUNDS.west),
      new google.maps.LatLng(ABU_DHABI_BOUNDS.north, ABU_DHABI_BOUNDS.east)
    );
    map.fitBounds(bounds);
  };

  return (
    <Card className="p-4 h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <VehicleLoadingIndicator size="lg" />
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {!pickupLocation ? "Click on the map to set pickup location first" : "Set dropoff location"}
        </p>
      </div>

      <LoadScriptNext
        googleMapsApiKey={MAPS_API_KEY}
        libraries={libraries}
        loadingElement={
          <div className="h-full flex items-center justify-center">
            <VehicleLoadingIndicator size="lg" />
          </div>
        }
        onLoad={() => setMapsInitialized(true)}
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
            center={tempLocation?.coordinates || pickupLocation?.coordinates || dropoffLocation?.coordinates || defaultCenter} // Updated center
            zoom={12}
            onClick={handleMapClick}
            onLoad={handleMapLoad}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              clickableIcons: true,
              styles: [
                {
                  featureType: "poi",
                  stylers: [{ visibility: "on" }]
                },
                {
                  featureType: "poi.business",
                  stylers: [{ visibility: "on" }]
                }
              ],
              restriction: {
                latLngBounds: ABU_DHABI_BOUNDS,
                strictBounds: false
              }
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
            {popupLocation && (
              <InfoWindow
                position={{ lat: popupLocation.lat, lng: popupLocation.lng }}
                onCloseClick={() => setPopupLocation(null)}
              >
                <div className="p-2 space-y-2">
                  <p className="text-sm font-medium">{popupLocation.address}</p>
                  <div className="flex gap-2">
                    {!pickupLocation && (
                      <Button
                        size="sm"
                        onClick={() => handleLocationTypeSelect('pickup')}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Set as Pickup
                      </Button>
                    )}
                    {pickupLocation && !dropoffLocation && (
                      <Button
                        size="sm"
                        onClick={() => handleLocationTypeSelect('dropoff')}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Set as Dropoff
                      </Button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </LoadScriptNext>

      {mapError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{mapError}</AlertDescription>
        </Alert>
      )}

      {pickupLocation && dropoffLocation && (
        <div className="mt-4 p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Route Information</h3>
          <p className="text-sm text-muted-foreground">
            Pickup: {pickupLocation?.address}
          </p>
          <p className="text-sm text-muted-foreground">
            Dropoff: {dropoffLocation?.address}
          </p>
        </div>
      )}
    </Card>
  );
}