import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadScriptNext, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

// Abu Dhabi city center coordinates (more precise)
const defaultCenter = {
  lat: 24.466667,  // Abu Dhabi city center latitude
  lng: 54.366667   // Abu Dhabi city center longitude
};

const defaultZoom = 11; // Zoom level to show more of Abu Dhabi city

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places", "geometry"];

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
  tempLocation?: Location | null;
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
  tempLocation,
  onLocationSelect
}: MapViewProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapsInitialized, setMapsInitialized] = useState(false);
  const [popupLocation, setPopupLocation] = useState<PopupLocation | null>(null);

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !onLocationSelect || !mapsInitialized) return;

    try {
      setIsLoading(true);
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat: e.latLng.lat(), lng: e.latLng.lng() } });

      if (result.results[0]) {
        setPopupLocation({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          address: result.results[0].formatted_address
        });
      }
    } catch (error) {
      console.error(`Error geocoding location:`, error);
      setPopupLocation({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
        address: `${e.latLng.lat().toFixed(6)}, ${e.latLng.lng().toFixed(6)}`
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

    // Center on Abu Dhabi and set appropriate zoom level
    map.setCenter(defaultCenter);
    map.setZoom(defaultZoom);
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
          Click or right-click on the map to set locations
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
            center={tempLocation?.coordinates || pickupLocation?.coordinates || dropoffLocation?.coordinates || defaultCenter}
            zoom={defaultZoom}
            onClick={handleMapClick}
            onRightClick={handleMapClick}
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
              ]
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
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {popupLocation.address}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleLocationTypeSelect('pickup')}
                      className={`${!pickupLocation ? 'bg-primary hover:bg-primary/90' : 'bg-muted cursor-not-allowed'}`}
                      disabled={!!pickupLocation}
                    >
                      Set as Pickup
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleLocationTypeSelect('dropoff')}
                      className={`${pickupLocation && !dropoffLocation ? 'bg-primary hover:bg-primary/90' : 'bg-muted cursor-not-allowed'}`}
                      disabled={!pickupLocation || !!dropoffLocation}
                    >
                      Set as Dropoff
                    </Button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </LoadScriptNext>

      {mapError && (
        <Alert variant="destructive">
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