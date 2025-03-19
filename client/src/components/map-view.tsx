import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadScriptNext, GoogleMap, Marker, InfoWindow, DirectionsRenderer } from "@react-google-maps/api";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { Button } from "@/components/ui/button";
import { MapPin, Clock } from "lucide-react";
import { routeOptimizer } from "@/services/route-optimizer";

// Abu Dhabi city center coordinates
const defaultCenter = {
  lat: 24.466667,
  lng: 54.366667
};

const defaultZoom = 11;

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places", "geometry"];

const MAPS_API_KEY = "AIzaSyAtNTq_ILPC8Y5M_bJAiMORDf02sGoK84I";

// ... rest of the imports and interfaces remain the same ...

export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

export interface MapViewProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
}

interface PopupLocation {
  lat: number;
  lng: number;
  address: string;
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

export function MapView({
  pickupLocation,
  dropoffLocation,
  onLocationSelect
}: MapViewProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapsInitialized, setMapsInitialized] = useState(false);
  const [popupLocation, setPopupLocation] = useState<PopupLocation | null>(null);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    alerts: string[];
  } | null>(null);

  // Draw route when both locations are set
  useEffect(() => {
    const drawRoute = async () => {
      if (!pickupLocation || !dropoffLocation || !map) return;

      try {
        setIsLoading(true);
        const optimizedRoute = await routeOptimizer.getOptimizedRoute(pickupLocation, dropoffLocation);

        setDirectionsResult(optimizedRoute.route);
        setRouteInfo({
          distance: optimizedRoute.route.routes[0].legs[0].distance?.text || "",
          duration: `${Math.round(optimizedRoute.estimatedTime / 60)} mins`,
          alerts: [...optimizedRoute.weatherAlerts, ...optimizedRoute.trafficAlerts]
        });
      } catch (error) {
        console.error("Error getting route:", error);
        setMapError("Failed to load route information");
      } finally {
        setIsLoading(false);
      }
    };

    drawRoute();
  }, [pickupLocation, dropoffLocation, map]);

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !onLocationSelect || !mapsInitialized) return;

    try {
      setIsLoading(true);
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat: e.latLng.lat(), lng: e.latLng.lng() } });

      if (result.results[0]) {
        const place = result.results[0];
        setPopupLocation({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          address: place.formatted_address || "",
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address
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
    if (!popupLocation || !map) return;

    const placesService = new google.maps.places.PlacesService(map);

    placesService.findPlaceFromQuery({
      query: popupLocation.address,
      fields: ['place_id', 'name', 'formatted_address', 'geometry']
    }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
        const place = results[0];
        const location: Location = {
          address: place.formatted_address || place.name || popupLocation.address,
          coordinates: {
            lat: popupLocation.lat,
            lng: popupLocation.lng
          },
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address
        };
        onLocationSelect(location, type);
      } else {
        const location: Location = {
          address: popupLocation.address,
          coordinates: {
            lat: popupLocation.lat,
            lng: popupLocation.lng
          }
        };
        onLocationSelect(location, type);
      }
      setPopupLocation(null);
    });
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
          Click on the map or select a point of interest to set locations
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
            center={defaultCenter}
            zoom={defaultZoom}
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
              ]
            }}
          >
            {directionsResult && (
              <DirectionsRenderer
                directions={directionsResult}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: "#4F46E5",
                    strokeWeight: 5,
                    strokeOpacity: 0.8
                  }
                }}
              />
            )}

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
                    {popupLocation.formatted_address || popupLocation.name || popupLocation.address}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleLocationTypeSelect('pickup')}
                      variant="default"
                      disabled={!!pickupLocation}
                    >
                      Set as Pickup
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleLocationTypeSelect('dropoff')}
                      variant={pickupLocation && !dropoffLocation ? "default" : "outline"}
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

      {pickupLocation && dropoffLocation && routeInfo && (
        <div className="mt-4 p-4 border rounded-lg space-y-2">
          <h3 className="font-medium mb-2">Route Information</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated Time: {routeInfo.duration}</span>
            <span>•</span>
            <span>Distance: {routeInfo.distance}</span>
          </div>
          {routeInfo.alerts.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Alerts:</p>
              <ul className="text-sm text-muted-foreground">
                {routeInfo.alerts.map((alert, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span>•</span>
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              Pickup: {pickupLocation.formatted_address || pickupLocation.name || pickupLocation.address}
            </p>
            <p className="text-sm text-muted-foreground">
              Dropoff: {dropoffLocation.formatted_address || dropoffLocation.name || dropoffLocation.address}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}